import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(req: Request) {
  try {
    const rawApiKey = process.env.GROQ_API_KEY || req.headers.get("x-groq-key") || ""
    const apiKey = rawApiKey.trim()

    if (!apiKey) {
      return NextResponse.json({
        status: "error",
        message: "GROQ_API_KEY is not set in environment variables",
      }, { status: 400 })
    }

    const keyPreview = apiKey.substring(0, 7) + "..." + apiKey.substring(apiKey.length - 4)

    // Query Groq API for available models for this specific key
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({
        status: "groq_api_error",
        httpStatus: res.status,
        keyPreview,
        groqResponse: data,
      }, { status: res.status })
    }

    const activeModels = (data.data || [])
      .filter((m: any) => m.active !== false)
      .map((m: any) => ({
        id: m.id,
        owned_by: m.owned_by,
        context_window: m.context_window,
      }))

    return NextResponse.json({
      status: "success",
      keyPreview,
      totalModels: activeModels.length,
      models: activeModels,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: "internal_error",
      error: error?.message || String(error),
    }, { status: 500 })
  }
}
