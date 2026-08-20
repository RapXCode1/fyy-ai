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
import { formatBrandedError, DEFAULT_MODEL_ID, MODEL_NAME_MAP } from "@/lib/models"

// ── Use nodejs runtime (no edge timeout, supports full Node.js APIs) ──────────
export const runtime = "nodejs"
export const maxDuration = 60 // seconds (Vercel Pro/Hobby max)

// ── Model cascade — ordered by reliability & availability ─────────────────────
const RELIABLE_CASCADE: string[] = [
  "llama-3.3-70b-versatile",   // Most stable, great quality & memory
  "llama-3.1-8b-instant",      // Ultra-fast, high availability
  "gemma2-9b-it",              // Reliable small model
  "openai/gpt-oss-20b",        // Medium weight fallback
  "openai/gpt-oss-120b",       // Heavy, reasoning
  "qwen/qwen3.6-27b",          // Alternative
]

const VISION_CASCADE: string[] = [
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
]

export async function POST(req: Request) {
  let requestedModel = "llama-3.3-70b-versatile"
  try {
    const rawApiKey = process.env.GROQ_API_KEY || req.headers.get("x-groq-key") || ""
    const apiKey = rawApiKey.trim()

    if (!apiKey || apiKey.startsWith("gsk_placeholder") || apiKey.length < 15) {
      return NextResponse.json(
        {
          error:
            "🔑 API Key **FYY-GROQ SYSTEM INTELLIGENCE** belum terpasang di Vercel.\n\nSilakan buka Dashboard Vercel > **Settings** > **Environment Variables** > tambahkan **`GROQ_API_KEY`** lalu lakukan **Redeploy**.",
        },
        { status: 500 }
      )
    }

    const groq = new Groq({ apiKey })
    const { messages, model, mode, isLiveMode, isGuest, isOwner, customInstruction } = await req.json()
    if (model) requestedModel = model

    // ── Owner mode detection ────────────────────────────────────────────────
    const isOwnerMode =
      isOwner ||
      messages.some(
        (m: any) =>
          m.role === "user" &&
          typeof m.content === "string" &&
          m.content.includes("FYY3257")
      )

    // ── Assemble system prompt from secure decoded blobs ────────────────────
    const basePrompt = isOwnerMode ? getOwnerPrompt() : getSystemPrompt()
    const guestInstruction = isGuest ? getGuestInstruction() : ""
    const liveInstruction = isLiveMode ? getLiveInstruction() : ""

    const systemContent = [
      basePrompt,
      getIdentityKnowledge(),
      getBehaviorRules(),
      liveInstruction,
      guestInstruction,
      customInstruction ? `[INSTRUKSI KHUSUS DARI USER: ${customInstruction}]` : "",
    ]
      .filter(Boolean)
      .join("\n\n")

    const systemMessage = { role: "system", content: systemContent }

    // ── Check if any message contains image attachments ───────────────────
    const hasImages = messages.some(
      (m: any) => m.attachments && m.attachments.some((a: any) => a.type?.startsWith("image/"))
    )

    // ── Build model candidate list ──────────────────────────────────────────
    const finalModel = model || DEFAULT_MODEL_ID
    const baseList = hasImages ? [...VISION_CASCADE, finalModel] : [finalModel, ...RELIABLE_CASCADE]
    const candidateModels = baseList.filter((m, idx, arr) => m && arr.indexOf(m) === idx)

    // ── Clean & preserve conversation memory (keep last 25 turns) ───────────
    const recentMessages = messages.slice(-25)

    const processedMessages = recentMessages
      .filter((m: any) => {
        const hasText = typeof m.content === "string" && m.content.trim().length > 0
        const hasAtts = Array.isArray(m.attachments) && m.attachments.length > 0
        return hasText || hasAtts
      })
      .map((m: any) => {
        const contentParts: any[] = []
        if (m.content) contentParts.push({ type: "text", text: m.content })

        if (m.attachments?.length > 0) {
          m.attachments.forEach((att: any) => {
            if (att.type?.startsWith("image/") && att.url) {
              contentParts.push({ type: "image_url", image_url: { url: att.url } })
            } else {
              const info = `\n[File Attachment: ${att.name} (${(att.size / 1024 / 1024).toFixed(2)}MB), Type: ${att.type}]`
              if (contentParts[0]?.type === "text") contentParts[0].text += info
              else contentParts.push({ type: "text", text: info })
            }
          })
        }

        return {
          role: m.role === "assistant" ? "assistant" : "user",
          content: contentParts.length > 1 || (contentParts[0]?.type === "image_url") ? contentParts : (m.content || ""),
        }
      })

    // ── Smart cascade with error-type awareness ─────────────────────────────
    let response: any = null
    let usedModel = finalModel
    let isFallback = false
    let lastError: any = null

    for (const modelToTry of candidateModels) {
      try {
        response = await groq.chat.completions.create({
          model: modelToTry,
          messages: [systemMessage, ...processedMessages],
          stream: true,
          temperature: globalSettings.temperature,
          max_tokens: 4096,
          top_p: globalSettings.topP,
        })
        usedModel = modelToTry
        if (modelToTry !== finalModel) {
          isFallback = true
          console.log(`[FYY-CASCADE] ${finalModel} → ${modelToTry}`)
        }
        break
      } catch (err: any) {
        lastError = err
        const status = err?.status || err?.error?.status
        const msg = err?.message || ""

        // 404 / 400 (vision unsupported or model missing) → try next immediately
        if (status === 404 || status === 400 || msg.includes("model_not_found") || msg.includes("vision")) {
          console.warn(`[FYY-CASCADE] ${modelToTry} unsupported (${status}), trying next...`)
          continue
        }

        // 429 = rate limited → try next immediately
        if (status === 429 || msg.includes("rate_limit")) {
          console.warn(`[FYY-CASCADE] ${modelToTry} rate limited, trying next...`)
          continue
        }

        // 503/overload → brief pause then try next
        if (status === 503 || msg.includes("overloaded")) {
          console.warn(`[FYY-CASCADE] ${modelToTry} overloaded, pausing 800ms...`)
          await new Promise((r) => setTimeout(r, 800))
          continue
        }

        console.warn(`[FYY-CASCADE] ${modelToTry} failed (${status}): ${msg}`)
      }
    }

    if (!response) {
      const friendlyMsg =
        lastError?.status === 429
          ? "Sistem FYY-AI sedang sangat ramai. Mohon coba lagi dalam beberapa detik — layanan ini gratis dan tanpa batas untuk semua pengguna! 🙏"
          : formatBrandedError(lastError?.message || "Gagal menghubungi AI engine.", requestedModel)

      return NextResponse.json({ error: friendlyMsg }, { status: 503 })
    }

    // ── Stream response with <think> tag filtering ──────────────────────────
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

          // Flush remaining
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
    console.error("[FYY-CHAT] Unhandled error:", error)
    const brandedError = formatBrandedError(
      error?.message || "Terjadi kesalahan tak terduga.",
      requestedModel
    )
    return NextResponse.json({ error: brandedError }, { status: error?.status || 500 })
  }
}
