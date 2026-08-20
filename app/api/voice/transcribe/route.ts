import { NextResponse } from "next/server"

export const runtime = "nodejs"

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

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json(
        { error: "No audio file provided or file is empty." },
        { status: 400 }
      )
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
    const text = (data.text || "").trim()

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
