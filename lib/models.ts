export interface ModelInfo {
  id: string
  name: string
  description: string
  provider: string
  badge?: string
}

// ✅ Model IDs confirmed working on Groq API (no namespace prefix needed)
export const OFFICIAL_MODELS: ModelInfo[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "FYY-Llama 3.3 (PRO)",
    description: "Performa tinggi untuk pemrosesan teks kompleks, coding, dan analisis mendalam.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "PRO",
  },
  {
    id: "llama-4-scout-17b-16e-instruct",
    name: "FYY-Llama 4 Scout",
    description: "Model penalaran generasi terbaru dengan dukungan pemrosesan multimodal mutakhir.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "NEW",
  },
  {
    id: "qwen-qwen3-32b",
    name: "FYY-Qwen 3 32B",
    description: "Keunggulan multibahasa dan matematika dengan kecepatan inferensi tinggi.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "FAST",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "FYY-Llama 3.1 Fast",
    description: "Respons ultra-cepat untuk percakapan ringan dan pertanyaan singkat.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "LITE",
  },
]

// Default / Fallback model yang pasti tersedia di Groq
export const DEFAULT_MODEL_ID = "llama-3.3-70b-versatile"
export const FALLBACK_MODEL_ID = "llama-3.1-8b-instant"

export const MODEL_NAME_MAP: Record<string, string> = {
  "llama-3.3-70b-versatile": "FYY-Llama 3.3 (PRO)",
  "llama-3.3-70b-specdec": "FYY-Llama 3.3 SpecDec",
  "llama-4-scout-17b-16e-instruct": "FYY-Llama 4 Scout",
  "meta-llama/llama-4-scout-17b-16e-instruct": "FYY-Llama 4 Scout",
  "openai/gpt-oss-120b": "FYY-GPT-OSS 120B",
  "qwen-qwen3-32b": "FYY-Qwen 3 32B",
  "qwen/qwen3-32b": "FYY-Qwen 3 32B",
  "llama-3.1-8b-instant": "FYY-Llama 3.1 Fast",
  "llama-3.2-11b-vision-preview": "FYY-Vision 11B",
  "llama-3.2-90b-vision-preview": "FYY-Vision 90B",
}

export function formatBrandedError(rawError: string, modelId?: string): string {
  let text = rawError || "Terjadi kesalahan pada sistem."

  // Guard: jika sudah di-format (ada prefix ⚠️/⏳/🔑), jangan format ulang
  if (text.startsWith("⚠️") || text.startsWith("⏳") || text.startsWith("🔑") || text.startsWith("🌐")) {
    return text
  }

  // Extract clean message jika raw JSON string dari Groq
  try {
    const jsonMatch = text.match(/\{[\s\S]*"error"[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed?.error?.message) {
        text = parsed.error.message
      }
    }
  } catch {}

  // Ganti nama model teknis dengan nama FYY-AI branded
  for (const [rawId, brandedName] of Object.entries(MODEL_NAME_MAP)) {
    const regex = new RegExp(rawId.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "gi")
    text = text.replace(regex, `**${brandedName}**`)
  }

  // Handle common Groq errors gracefully
  if (
    text.toLowerCase().includes("does not exist") ||
    text.toLowerCase().includes("model_not_found") ||
    text.toLowerCase().includes("model not found") ||
    text.includes("404")
  ) {
    const currentModelName = modelId && MODEL_NAME_MAP[modelId]
      ? `**${MODEL_NAME_MAP[modelId]}**`
      : "Model yang dipilih"
    return `⚠️ ${currentModelName} tidak tersedia saat ini di server **FYY-GROQ SYSTEM INTELLIGENCE**. Silakan pilih model lain (seperti **FYY-Llama 3.1 Fast** atau **FYY-Qwen 3 32B**) dari menu Model.`
  }

  if (text.toLowerCase().includes("rate limit") || text.includes("429")) {
    return `⏳ Batas frekuensi permintaan tercapai. Mohon tunggu beberapa detik atau gunakan model lain.`
  }

  if (text.toLowerCase().includes("invalid_api_key") || text.toLowerCase().includes("api key")) {
    return `🔑 API key **FYY-GROQ SYSTEM INTELLIGENCE** belum terkonfigurasi. Silakan set GROQ_API_KEY di Vercel Environment Variables.`
  }

  if (text.toLowerCase().includes("failed to fetch") || text.toLowerCase().includes("network")) {
    return `🌐 Gagal terhubung ke server **FYY-GROQ SYSTEM INTELLIGENCE**. Periksa koneksi internet kamu.`
  }

  return `⚠️ **FYY-AI**: ${text}`
}
