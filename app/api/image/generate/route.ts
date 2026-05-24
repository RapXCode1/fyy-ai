import { NextResponse } from "next/server"
import { HfInference } from "@huggingface/inference"
import Groq from "groq-sdk"

export async function POST(req: Request) {
  try {
    const { prompt, model, width, height } = await req.json()

    const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN
    const GROQ_API_KEY = process.env.GROQ_API_KEY
    
    if (!HF_TOKEN) {
      return NextResponse.json({ error: "HuggingFace API token not found" }, { status: 500 })
    }

    // 1. Enhance and Translate Prompt using Groq
    // This solves the issue of models not understanding Indonesian or simple prompts
    let optimizedPrompt = prompt
    if (GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: GROQ_API_KEY })
        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are an expert at writing image generation prompts. Your task is to translate the user's prompt to English if it's not in English, and enhance it with descriptive details for better AI generation. Return ONLY the final English prompt without any explanation or quotes."
            },
            { 
              role: "user", 
              content: prompt 
            }
          ],
          max_tokens: 100,
        })
        optimizedPrompt = completion.choices[0]?.message?.content?.trim() || prompt
        console.log(`Optimized Prompt: "${prompt}" -> "${optimizedPrompt}"`)
      } catch (e) {
        console.error("Prompt optimization failed:", e)
      }
    }

    const hf = new HfInference(HF_TOKEN)

    // Map models to HF model IDs
    const modelMap: Record<string, string> = {
      "flux": "black-forest-labs/FLUX.1-schnell",
      "flux-realism": "stabilityai/stable-diffusion-xl-base-1.0",
      "flux-pro": "black-forest-labs/FLUX.1-dev",
      "turbo": "black-forest-labs/FLUX.1-schnell", // Fallback to schnell as turbo is currently unavailable
    }

    const hfModelId = modelMap[model] || modelMap["flux"]

    console.log(`Generating image with Fyy-AI (${hfModelId})...`)

    // Use the official library
    const response = await hf.textToImage({
      model: hfModelId,
      inputs: optimizedPrompt,
      // Removed fixed width/height parameters as they often cause issues on free inference API
      // Most models will use their default optimized size (e.g., 1024x1024 for FLUX)
    })

    return new Response(response, {
      headers: {
        "Content-Type": (response as any).type || "image/jpeg",
        "Cache-Control": "no-store",
        "X-Optimized-Prompt": encodeURIComponent(optimizedPrompt),
      },
    })
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate image" 
    }, { status: 500 })
  }
}
