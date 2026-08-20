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

const FALLBACK_MODELS: string[] = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
]

const VISION_MODELS: string[] = [
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
          error: "🔑 API Key belum terpasang. Silakan buka Dashboard Vercel > Settings > Environment Variables lalu tambahkan GROQ_API_KEY dan lakukan Redeploy.",
        },
        { status: 500 }
      )
    }

    const groq = new Groq({ apiKey })
    const { messages, model, mode, isLiveMode, isGuest, isOwner, customInstruction } = await req.json()
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

    const hasImages = messages.some(
      (m: any) => m.attachments && m.attachments.some((a: any) => a.type?.startsWith("image/"))
    )

    const finalModel = model || DEFAULT_MODEL_ID
    const modelList = hasImages ? [...VISION_MODELS, finalModel] : [finalModel, ...FALLBACK_MODELS]
    const candidates = modelList.filter((m, i, arr) => m && arr.indexOf(m) === i)

    const recent = messages.slice(-25)

    const formatted = recent
      .filter((m: any) => {
        const hasText = typeof m.content === "string" && m.content.trim().length > 0
        const hasAtts = Array.isArray(m.attachments) && m.attachments.length > 0
        return hasText || hasAtts
      })
      .map((m: any) => {
        const parts: any[] = []
        if (m.content) parts.push({ type: "text", text: m.content })

        if (m.attachments?.length > 0) {
          m.attachments.forEach((att: any) => {
            if (att.type?.startsWith("image/") && att.url) {
              parts.push({ type: "image_url", image_url: { url: att.url } })
            } else {
              const note = `\n[File: ${att.name} (${(att.size / 1024 / 1024).toFixed(2)}MB), Type: ${att.type}]`
              if (parts[0]?.type === "text") parts[0].text += note
              else parts.push({ type: "text", text: note })
            }
          })
        }

        return {
          role: m.role === "assistant" ? "assistant" : "user",
          content: parts.length > 1 || parts[0]?.type === "image_url" ? parts : (m.content || ""),
        }
      })

    let response: any = null
    let usedModel = finalModel
    let isFallback = false
    let lastError: any = null

    for (const tryModel of candidates) {
      try {
        response = await groq.chat.completions.create({
          model: tryModel,
          messages: [systemMessage, ...formatted],
          stream: true,
          temperature: globalSettings.temperature,
          max_tokens: 4096,
          top_p: globalSettings.topP,
        })
        usedModel = tryModel
        if (tryModel !== finalModel) isFallback = true
        break
      } catch (err: any) {
        lastError = err
        const status = err?.status || err?.error?.status
        const msg = err?.message || ""

        if (status === 404 || status === 400 || msg.includes("model_not_found") || msg.includes("vision")) {
          continue
        }
        if (status === 429 || msg.includes("rate_limit")) {
          continue
        }
        if (status === 503 || msg.includes("overloaded")) {
          await new Promise((r) => setTimeout(r, 800))
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
