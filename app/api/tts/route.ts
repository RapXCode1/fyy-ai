import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawText = searchParams.get("text") || ""

    const cleanText = rawText
      .replace(/```[\s\S]*?```/g, " Blok kode. ")
      .replace(/[*_#`~>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/-\s/g, "")
      .trim()
      .substring(0, 250)

    if (!cleanText) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encodeURIComponent(cleanText)}`

    const response = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "TTS upstream failed" }, { status: response.status })
    }

    const audioBuffer = await response.arrayBuffer()

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (error: any) {
    console.error("TTS API Error:", error)
    return NextResponse.json({ error: error?.message || "Failed to generate speech" }, { status: 500 })
  }
}
