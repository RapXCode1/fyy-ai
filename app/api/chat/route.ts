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
export const maxDuration = 60

const VISION_MODELS = [
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
]

const TEXT_FALLBACK_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
]

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
    const { messages, model, isLiveMode, isGuest, isOwner, customInstruction } = await req.json()
    if (model) requestedModel = model

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
      livePart,
      guestPart,
      customInstruction ? `[INSTRUKSI KHUSUS DARI USER: ${customInstruction}]` : "",
    ]
      .filter(Boolean)
      .join("\n\n")

    const systemMessage = { role: "system", content: systemContent }

    // Check if the latest user turn or any recent message has image attachments
    const hasImages = messages.some(
      (m: any) => m.attachments && m.attachments.some((a: any) => a.type?.startsWith("image/"))
    )

    // Build model candidate cascade
    let candidates: string[]
    if (hasImages) {
      // Try Vision models first, then fallback to text models with stripped images
      candidates = [...VISION_MODELS, requestedModel, ...TEXT_FALLBACK_MODELS].filter(
        (m, i, arr) => m && arr.indexOf(m) === i
      )
    } else {
      candidates = [requestedModel, ...TEXT_FALLBACK_MODELS].filter(
        (m, i, arr) => m && arr.indexOf(m) === i
      )
    }

    // Keep the last 20 turns for memory retention
    const recent = messages.slice(-20)

    // Helper: format messages specifically for a given model (vision vs text-only)
    const buildMessagesForModel = (isVision: boolean) => {
      const formattedList: any[] = [systemMessage]

      recent.forEach((m: any, idx: number) => {
        const isLatestUser = idx === recent.length - 1 && m.role === "user"
        const textContent = (typeof m.content === "string" ? m.content : "").trim()

        if (isVision && isLatestUser && m.attachments?.some((a: any) => a.type?.startsWith("image/") && a.url)) {
          // Build multimodal content array for Vision model
          const parts: any[] = []
          parts.push({
            type: "text",
            text: textContent || "Tolong periksa, jelaskan, dan baca isi gambar ini secara detail.",
          })

          m.attachments.forEach((att: any) => {
            if (att.type?.startsWith("image/") && att.url) {
              parts.push({
                type: "image_url",
                image_url: {
                  url: att.url,
                },
              })
            }
          })

          formattedList.push({
            role: "user",
            content: parts,
          })
        } else {
          // Text-only turn or historical turn (strip heavy base64 to save context window)
          let turnText = textContent
          if (m.attachments?.length > 0) {
            const fileNotes = m.attachments
              .map((att: any) => `[Lampiran: ${att.name || "Berkas"} (${att.type || "file"})]`)
              .join(" ")
            turnText = turnText ? `${turnText}\n${fileNotes}` : fileNotes
          }

          if (turnText || m.role === "assistant") {
            formattedList.push({
              role: m.role === "assistant" ? "assistant" : "user",
              content: turnText || "...",
            })
          }
        }
      })

      return formattedList
    }

    let response: any = null
    let usedModel = requestedModel
    let isFallback = false
    let lastError: any = null

    for (const tryModel of candidates) {
      const isVisionModel = VISION_MODELS.includes(tryModel)
      const modelMessages = buildMessagesForModel(isVisionModel)

      try {
        response = await groq.chat.completions.create({
          model: tryModel,
          messages: modelMessages,
          stream: true,
          temperature: isVisionModel ? 0.4 : globalSettings.temperature,
          max_tokens: isVisionModel ? 2048 : 4096,
          top_p: globalSettings.topP,
        })
        usedModel = tryModel
        if (tryModel !== requestedModel) isFallback = true
        break
      } catch (err: any) {
        lastError = err
        const status = err?.status || err?.error?.status
        const msg = (err?.message || "").toLowerCase()

        // If vision model 400/404/not found, continue to next model seamlessly
        if (status === 404 || status === 400 || msg.includes("not found") || msg.includes("vision") || msg.includes("unsupported")) {
          continue
        }
        if (status === 429 || msg.includes("rate_limit") || msg.includes("rate limit")) {
          continue
        }
        if (status === 503 || msg.includes("overloaded")) {
          await new Promise((r) => setTimeout(r, 600))
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

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let insideThink = false
        let buf = ""

        try {
          for await (const chunk of response) {
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
  } catch (error: any) {
    const brandedError = formatBrandedError(
      error?.message || "Terjadi kesalahan tak terduga.",
      requestedModel
    )
    return NextResponse.json({ error: brandedError }, { status: error?.status || 500 })
  }
}
