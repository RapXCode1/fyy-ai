import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Known Whisper hallucinations & short echo artifacts on silence / ambient noise
// These appear when Whisper picks up speaker echo or background room noise
const WHISPER_HALLUCINATIONS = new Set([
  // Indonesian
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
  "sampai jumpa.",
  "sampai jumpa",
  "pemrograman",
  "tanya jawab",
  "bantuan ai",
  // English
  "thank you.",
  "thank you",
  "thank you for watching.",
  "thank you for watching",
  "thank you very much.",
  "thank you very much",
  "subtitles by",
  "subtitles by the amara.org community",
  "amara.org",
  "goodbye",
  "goodbye.",
  // Russian hallucinations (speaker echo picked up by mic)
  "продолжение следует",
  "продолжение следует...",
  "привет",
  "привет!",
  "чем могу помочь",
  "чем могу помочь?",
  "привет! чем могу помочь?",
  "спасибо",
  "спасибо.",
  "хорошо",
  "до свидания",
  // Short noise artifacts
  "you",
  "...",
  "bye.",
  "bye",
  "so",
  "so.",
  "ah",
  "eh",
  "hm",
  "hmm",
  "oh",
  "uh",
  "s",
])

// Also block any output that is ENTIRELY non-ASCII (likely hallucinated foreign lang)
function isLikelyHallucination(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, "").trim()

  // Block exact matches
  if (WHISPER_HALLUCINATIONS.has(text.toLowerCase())) return true
  if (WHISPER_HALLUCINATIONS.has(normalized)) return true

  // Block texts that contain known Russian hallucination substrings
  if (normalized.includes("продолжение")) return true
  if (normalized.includes("следует")) return true
  if (normalized.includes("subtitles by")) return true
  if (normalized.includes("terima kasih sudah menonton")) return true
  if (normalized.includes("thank you for watching")) return true

  // Block texts where >60% of characters are Cyrillic (Russian/hallucinated)
  const cyrillicCount = (text.match(/[\u0400-\u04FF]/g) || []).length
  if (cyrillicCount > 0 && cyrillicCount / text.replace(/\s/g, "").length > 0.4) {
    return true
  }

  return false
}

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

    if (!audioFile || audioFile.size < 3000) {
      // Audio is too small to contain meaningful user speech
      return NextResponse.json({ success: true, text: "" })
    }

    // Prepare multipart form data for Groq Whisper
    const groqFormData = new FormData()
    groqFormData.append("file", audioFile, "speech.webm")
    groqFormData.append("model", "whisper-large-v3-turbo")
    groqFormData.append("temperature", "0.0")
    groqFormData.append("response_format", "json")
    // Lock language to Indonesian to prevent hallucinated Russian/Chinese/etc
    groqFormData.append("language", "id")

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

    // Clean common subtitle/noise tags
    text = text.replace(/\[.*?\]|\(.*?\)/g, "").trim()

    // Filter too short
    if (!text || text.length <= 2) {
      return NextResponse.json({ success: true, text: "" })
    }

    // Filter hallucinations (including Cyrillic / Russian echo outputs)
    if (isLikelyHallucination(text)) {
      console.warn("Whisper hallucination filtered:", JSON.stringify(text))
      return NextResponse.json({ success: true, text: "" })
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
