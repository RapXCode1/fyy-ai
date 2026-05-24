import { NextResponse } from "next/server"

export async function GET() {
  const models = [
    {
      id: "llama-3.3-70b-versatile",
      name: "FYY-Llama 3.3 (Complete)",
      description: "Ultimate performance for text, images, and files.",
      provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)"
    },
    {
      id: "meta-llama/llama-4-scout-17b-16e-instruct",
      name: "FYY-Llama 4 Scout",
      description: "Next-gen reasoning with multimodal support.",
      provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)"
    },
    {
      id: "openai/gpt-oss-120b",
      name: "FYY-GPT-OSS 120B",
      description: "Ultra-high performance open model.",
      provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)"
    },
    {
      id: "qwen/qwen3-32b",
      name: "FYY-Qwen 3 32B",
      description: "Advanced multilingual and reasoning model.",
      provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)"
    },
  ]

  return NextResponse.json(models)
}
