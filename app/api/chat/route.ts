import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import { getSystemPrompt, getIdentityKnowledge, getBehaviorRules, getOwnerPrompt, globalSettings } from "@/lib/settings"
import { formatBrandedError, DEFAULT_MODEL_ID, FALLBACK_MODEL_ID, MODEL_NAME_MAP } from "@/lib/models"

export const runtime = 'edge'

export async function POST(req: Request) {
  let requestedModel = "llama-3.3-70b-versatile"
  try {
    const rawApiKey = process.env.GROQ_API_KEY || req.headers.get("x-groq-key") || ""
    const apiKey = rawApiKey.trim()

    if (!apiKey || apiKey.startsWith("gsk_placeholder") || apiKey.length < 15) {
      return NextResponse.json(
        { 
          error: "🔑 API Key **FYY-GROQ SYSTEM INTELLIGENCE** belum terpasang di Vercel.\n\nSilakan buka Dashboard Vercel > **Settings** > **Environment Variables** > tambahkan **`GROQ_API_KEY`** dengan API key kamu dari Groq Console, lalu lakukan **Redeploy**." 
        },
        { status: 500 }
      )
    }

    const groq = new Groq({ apiKey })

    const { messages, model, mode, isLiveMode, isGuest, isOwner } = await req.json()
    if (model) requestedModel = model

    // Detect Owner Mode keyword or explicitly passed owner flag
    const isOwnerKeyword = isOwner || messages.some((m: any) => 
      m.role === 'user' && typeof m.content === 'string' && m.content.includes('FYY3257')
    )

    // Load all sensitive prompt data from environment variables at runtime.
    // Source code contains no prompt text — everything lives in Vercel Env Vars.
    const basePrompt = isOwnerKeyword
      ? (getOwnerPrompt() || getSystemPrompt())
      : getSystemPrompt()

    const identityKnowledge = getIdentityKnowledge()
    const behaviorRules = getBehaviorRules()

    const guestInstruction = isGuest
      ? (process.env.FYY_GUEST_INSTRUCTION || "")
      : ""

    const liveVoiceInstruction = isLiveMode
      ? (process.env.FYY_LIVE_INSTRUCTION || "")
      : ""

    const systemMessage = {
      role: "system",
      content: [basePrompt, identityKnowledge, behaviorRules, liveVoiceInstruction, guestInstruction]
        .filter(Boolean)
        .join("\n\n"),
    }

    // Detect if any message has an image to decide if we need a vision model
    const hasImages = messages.some((m: any) => 
      m.attachments && m.attachments.some((a: any) => a.type.startsWith('image/'))
    )

    let finalModel = model || DEFAULT_MODEL_ID

    // Process messages to handle multi-modal content (images)
    const processedMessages = messages.map((m: any) => {
      // Vision models in this environment: llama-3.2-11b-vision-preview (decommissioned), llama-3.2-90b-vision-preview (decommissioned)
      // We will try to use the selected model if it's one of the 'complete' ones, as they might support vision.
      const isVisionCapable = finalModel.includes('vision') || 
                             finalModel.includes('llama-4') || 
                             finalModel.includes('gpt-oss') || 
                             finalModel.includes('qwen3');
      
      const contentParts: any[] = []
      
      // Add text content
      if (m.content) {
        contentParts.push({ type: "text", text: m.content })
      }
      
      // Process attachments
      if (m.attachments && m.attachments.length > 0) {
        m.attachments.forEach((attachment: any) => {
          if (attachment.type.startsWith('image/') && isVisionCapable) {
            contentParts.push({
              type: "image_url",
              image_url: { url: attachment.url }
            })
          } else {
            // For non-images or non-vision models, add file info to text
            const fileInfo = `\n[File Attachment: ${attachment.name} (${(attachment.size / 1024 / 1024).toFixed(2)}MB), Type: ${attachment.type}]`
            if (contentParts.length > 0 && contentParts[0].type === "text") {
              contentParts[0].text += fileInfo
            } else {
              contentParts.push({ type: "text", text: fileInfo })
            }
          }
        })
      }
      
      return {
        role: m.role,
        content: isVisionCapable && contentParts.length > 1 ? contentParts : m.content
      }
    })

    // Multi-model candidate list for automatic resilient cascade
    const candidateModels = [
      finalModel,
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "qwen/qwen3.6-27b",
      "qwen/qwen3-32b",
      "gemma2-9b-it"
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx)

    let response: any = null
    let usedModel = finalModel
    let isFallback = false
    let lastError: any = null

    for (const modelToTry of candidateModels) {
      try {
        response = await groq.chat.completions.create({
          model: modelToTry,
          messages: [
            systemMessage,
            ...processedMessages
          ],
          stream: true,
          temperature: globalSettings.temperature,
          max_tokens: 4096,
          top_p: globalSettings.topP,
        })
        usedModel = modelToTry
        if (modelToTry !== finalModel) {
          isFallback = true
          console.log(`Auto-switched from ${finalModel} to working model: ${modelToTry}`)
        }
        break
      } catch (err: any) {
        lastError = err
        console.warn(`Model ${modelToTry} failed (${err?.status}): ${err?.message}`)
      }
    }

    if (!response) {
      throw lastError || new Error("Semua model Groq gagal diakses. Pastikan API key Groq kamu valid dan aktif.")
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let insideThinkTag = false
        let pendingBuffer = ""

        try {
          for await (const chunk of response) {
            const rawContent = chunk.choices[0]?.delta?.content || ""
            if (!rawContent) continue

            pendingBuffer += rawContent

            // Filter out <think> ... </think> tags
            while (pendingBuffer.length > 0) {
              if (insideThinkTag) {
                const endTagIndex = pendingBuffer.indexOf("</think>")
                if (endTagIndex !== -1) {
                  insideThinkTag = false
                  pendingBuffer = pendingBuffer.substring(endTagIndex + 8).replace(/^\s+/, "")
                } else {
                  pendingBuffer = ""
                  break
                }
              } else {
                const startTagIndex = pendingBuffer.indexOf("<think>")
                if (startTagIndex !== -1) {
                  const beforeText = pendingBuffer.substring(0, startTagIndex)
                  if (beforeText) {
                    const data = JSON.stringify({ content: beforeText })
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                  }
                  insideThinkTag = true
                  pendingBuffer = pendingBuffer.substring(startTagIndex + 7)
                } else {
                  // If buffer might be part of an upcoming <think> tag, wait
                  if (pendingBuffer.endsWith("<") || pendingBuffer.endsWith("<t") || pendingBuffer.endsWith("<th") || pendingBuffer.endsWith("<thi") || pendingBuffer.endsWith("<thin") || pendingBuffer.endsWith("<think")) {
                    break
                  } else {
                    const data = JSON.stringify({ content: pendingBuffer })
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                    pendingBuffer = ""
                  }
                }
              }
            }
          }

          // Emit any remaining non-thinking text
          if (pendingBuffer && !insideThinkTag) {
            const cleanText = pendingBuffer.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<\/?think>/gi, "")
            if (cleanText) {
              const data = JSON.stringify({ content: cleanText })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
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
        "Connection": "keep-alive",
        "X-Model-Fallback": isFallback ? "true" : "false",
        "X-Model-Used": usedModel,
      },
    })
  } catch (error: any) {
    console.error("Chat API error:", error)
    const brandedError = formatBrandedError(error?.message || "Failed to process chat request", requestedModel)
    return NextResponse.json(
      { error: brandedError },
      { status: error?.status || 500 }
    )
  }
}
