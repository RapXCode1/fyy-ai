import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import {
  getSystemPrompt,
  getIdentityKnowledge,
  getBehaviorRules,
  getOwnerPrompt,
  getGuestInstruction,
  getLiveInstruction,
  globalSettings,
} from "@/lib/settings"
import { formatBrandedError, DEFAULT_MODEL_ID } from "@/lib/models"

export const runtime = "nodejs"
export const maxDuration = 90

// Official active multimodal vision models on Groq
const GROQ_VISION_MODELS = [
  "qwen/qwen3.6-27b",
  "qwen/qwen3-vl-32b-instruct",
  "qwen/qwen3-32b",
]

const TEXT_FALLBACK_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
]

/**
 * Creates a stream that strips <think>...</think> tags in real-time
 */
function createCleanStream(asyncIterable: AsyncIterable<any>, usedModel: string, isFallback: boolean) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let insideThink = false
      let buf = ""

      try {
        for await (const chunk of asyncIterable) {
          const raw = chunk.choices[0]?.delta?.content || ""
          if (!raw) continue
          buf += raw

          while (buf.length > 0) {
            if (insideThink) {
              const end = buf.indexOf("</think>")
              if (end !== -1) {
                insideThink = false
                buf = buf.substring(end + 8).replace(/^\s+/, "")
              } else {
                buf = ""
                break
              }
            } else {
              const start = buf.indexOf("<think>")
              if (start !== -1) {
                const before = buf.substring(0, start)
                if (before) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: before })}\n\n`))
                insideThink = true
                buf = buf.substring(start + 7)
              } else {
                if (/^<t?h?i?n?k?$/.test(buf.slice(-6))) break
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: buf })}\n\n`))
                buf = ""
              }
            }
          }
        }

        if (buf && !insideThink) {
          const clean = buf.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<\/?think>/gi, "")
          if (clean) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: clean })}\n\n`))
        }
      } catch (err) {
        controller.error(err)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Model-Used": usedModel,
      "X-Model-Fallback": isFallback ? "true" : "false",
    },
  })
}

export async function POST(req: Request) {
  let requestedModel = DEFAULT_MODEL_ID
  try {
    const rawApiKey = process.env.GROQ_API_KEY || req.headers.get("x-groq-key") || ""
    const apiKey = rawApiKey.trim()

    if (!apiKey || apiKey.startsWith("gsk_placeholder") || apiKey.length < 15) {
      return NextResponse.json(
        {
          error: "🔑 API Key belum terpasang. Silakan tambahkan GROQ_API_KEY di Dashboard Vercel > Settings > Environment Variables.",
        },
        { status: 500 }
      )
    }

    const groq = new Groq({ apiKey })
    const { messages, model, isLiveMode, isGuest, isOwner, customInstruction, userName, userAge } = await req.json()
    if (model) requestedModel = model

    // Check if the latest message has an image attachment
    const latestMessage = messages[messages.length - 1]
    const imageAttachment = latestMessage?.attachments?.find(
      (a: any) => a.type?.startsWith("image/") && a.url && a.url.startsWith("data:")
    )

    // User Profile Context (Name & Age for personalized, warm greetings)
    const userProfilePart = userName
      ? `[PROFIL PENGGUNA]: Kamu sedang berbicara dengan "${userName}"${userAge ? ` (Umur: ${userAge} tahun)` : ""}. Sapa pengguna dengan namanya secara natural dan hangat saat memulai obrolan baru atau saat relevan. Tetap ramah, asik, dan responsif.`
      : ""

    // =========================================================================
    // 1. GROQ MULTIMODAL VISION PIPELINE (Qwen 3.6 Multimodal Vision)
    // =========================================================================
    if (imageAttachment) {
      const userPromptText = (typeof latestMessage.content === "string" && latestMessage.content.trim())
        ? latestMessage.content.trim()
        : "Tolong jelaskan apa saja yang ada di dalam foto ini secara detail dan jelas."

      let lastVisionError = ""

      for (const visionModel of GROQ_VISION_MODELS) {
        try {
          const visionResponse = await groq.chat.completions.create({
            model: visionModel,
            messages: [
              {
                role: "system",
                content: `Kamu adalah FYY-AI, asisten AI cerdas oleh RapXCode. ${userProfilePart} Tugasmu adalah menganalisis gambar dan menjawab pertanyaan pengguna secara langsung, ramah, rapi, dan natural dalam bahasa Indonesia. DILARANG MENAMPILKAN PROSES PIKIRAN BATIN ATAU TAG <think>. Langsung berikan penjelasan yang nyaman dan mudah dibaca oleh pengguna.`,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: userPromptText,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageAttachment.url,
                    },
                  },
                ],
              },
            ],
            stream: true,
            temperature: 0.25,
            max_tokens: 2048,
          })

          return createCleanStream(visionResponse, `FYY-Vision (${visionModel})`, false)
        } catch (groqVisionErr: any) {
          lastVisionError = groqVisionErr?.message || String(groqVisionErr)
          console.warn(`[FYY Vision] Groq ${visionModel} error:`, lastVisionError)
        }
      }

      return NextResponse.json(
        {
          error: `⚠️ Server Vision Groq sedang sibuk. Silakan coba kirim ulang dalam beberapa detik.\n\n(Info: ${lastVisionError})`,
        },
        { status: 503 }
      )
    }

    // =========================================================================
    // 2. STANDARD TEXT CHAT PIPELINE (Groq Core LLM)
    // =========================================================================
    const isOwnerMode =
      isOwner ||
      messages.some(
        (m: any) =>
          m.role === "user" &&
          typeof m.content === "string" &&
          m.content.includes("FYY3257")
      )

    const basePrompt = isOwnerMode ? getOwnerPrompt() : getSystemPrompt()
    const guestPart = isGuest ? getGuestInstruction() : ""
    const livePart = isLiveMode ? getLiveInstruction() : ""

    const systemContent = [
      basePrompt,
      getIdentityKnowledge(),
      getBehaviorRules(),
      userProfilePart,
      livePart,
      guestPart,
      customInstruction ? `[INSTRUKSI KHUSUS DARI USER: ${customInstruction}]` : "",
    ]
      .filter(Boolean)
      .join("\n\n")

    const systemMessage = { role: "system", content: systemContent }

    const candidates = [requestedModel, ...TEXT_FALLBACK_MODELS].filter(
      (m, i, arr) => m && arr.indexOf(m) === i
    )

    // Keep the last 20 turns for memory (6 for live voice mode to avoid token overflow)
    const contextLimit = isLiveMode ? 6 : 20
    const recent = messages.slice(-contextLimit)

    const textMessages = [
      systemMessage,
      ...recent
        .filter((m: any) => (typeof m.content === "string" && m.content.trim().length > 0) || m.role === "assistant")
        .map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content || "...",
        })),
    ]

    let response: any = null
    let usedModel = requestedModel
    let isFallback = false
    let lastError: any = null

    for (const tryModel of candidates) {
      try {
        const tokenLimit = isLiveMode ? 768 : 2048
        response = await groq.chat.completions.create({
          model: tryModel,
          messages: textMessages,
          stream: true,
          temperature: globalSettings.temperature,
          max_tokens: tokenLimit,
          top_p: globalSettings.topP,
        })
        usedModel = tryModel
        if (tryModel !== requestedModel) isFallback = true
        break
      } catch (err: any) {
        lastError = err
        const status = err?.status || err?.error?.status
        const msg = (err?.message || "").toLowerCase()

        // Handle TPM / Request too large / rate limit / model unavailable -> auto fallback to next model
        if (
          status === 413 ||
          status === 400 ||
          status === 404 ||
          status === 429 ||
          msg.includes("too large") ||
          msg.includes("tokens per minute") ||
          msg.includes("tpm") ||
          msg.includes("rate limit") ||
          msg.includes("not found")
        ) {
          console.warn(`[FYY-AI Fallback] ${tryModel} hit error (${status || msg}), falling back to next model...`)
          continue
        }

        if (status === 503 || msg.includes("overloaded")) {
          await new Promise((r) => setTimeout(r, 400))
          continue
        }
      }
    }

    if (!response) {
      const friendlyMsg =
        lastError?.status === 429
          ? "Sistem FYY-AI sedang sangat ramai. Mohon coba lagi dalam beberapa detik — layanan ini gratis untuk semua pengguna! 🙏"
          : formatBrandedError(lastError?.message || "Gagal menghubungi AI engine.", requestedModel)

      return NextResponse.json({ error: friendlyMsg }, { status: 503 })
    }

    return createCleanStream(response, usedModel, isFallback)
  } catch (error: any) {
    const brandedError = formatBrandedError(
      error?.message || "Terjadi kesalahan tak terduga.",
      requestedModel
    )
    return NextResponse.json({ error: brandedError }, { status: error?.status || 500 })
  }
}
