import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Known Whisper hallucinations on silence / ambient noise
const WHISPER_HALLUCINATIONS = new Set([
  "terima kasih.",
  "terima kasih",
  "terima kasih sudah menonton",
  "terima kasih sudah menonton.",
  "terima kasih telah menonton",
  "terima kasih telah menonton.",
  "terima kasih sudah menyaksikan",
  "terima kasih sudah menyaksikan.",
  "terima kasih banyak",
  "terima kasih banyak.",
  "thank you.",
  "thank you",
  "thank you for watching.",
  "thank you for watching",
  "thank you very much.",
  "thank you very much",
  "subtitles by",
  "subtitles by the amara.org community",
  "amara.org",
  "you",
  "...",
  "bye.",
  "bye",
  "sampai jumpa.",
  "sampai jumpa",
])

export async function POST(req: Request) {
  try {
    const rawApiKey = process.env.GROQ_API_KEY || req.headers.get("x-groq-key") || ""
    const apiKey = rawApiKey.trim()

    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const audioFile = formData.get("file") as Blob | null

    if (!audioFile || audioFile.size < 2000) {
      // Audio is too small to contain actual speech
      return NextResponse.json({ success: true, text: "" })
    }

    // Prepare multipart form data for Groq Whisper
    const groqFormData = new FormData()
    groqFormData.append("file", audioFile, "recording.webm")
    groqFormData.append("model", "whisper-large-v3-turbo")
    groqFormData.append("language", "id")
    groqFormData.append("temperature", "0")
    groqFormData.append("response_format", "json")

    const groqResponse = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqFormData,
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error("Groq Whisper STT Error:", errorText)
      return NextResponse.json(
        { error: `Groq Whisper failed: ${groqResponse.status}`, detail: errorText },
        { status: groqResponse.status }
      )
    }

    const data = await groqResponse.json()
    let text = (data.text || "").trim()

    // Filter out Whisper silence hallucinations
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, "").trim()
    if (
      WHISPER_HALLUCINATIONS.has(text.toLowerCase()) ||
      WHISPER_HALLUCINATIONS.has(normalized) ||
      normalized === "terima kasih" ||
      normalized === "thank you" ||
      normalized === "terima kasih banyak" ||
      normalized === "subtitles by amara org" ||
      normalized === "amara org" ||
      text.length <= 1
    ) {
      text = ""
    }

    return NextResponse.json({
      success: true,
      text,
    })
  } catch (error: any) {
    console.error("Transcription API Exception:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server transcription error" },
      { status: 500 }
    )
  }
}
