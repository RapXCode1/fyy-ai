export interface ModelInfo {
  id: string
  name: string
  description: string
  provider: string
  badge?: string
}

export const OFFICIAL_MODELS: ModelInfo[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "FYY-Llama 3.3 (PRO)",
    description: "Performa tinggi untuk pemrosesan teks kompleks, coding, dan analisis mendalam.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "PRO",
  },
  {
    id: "meta-llama/llama-4-scout-17b-16e-instruct",
    name: "FYY-Llama 4 Scout",
    description: "Model penalaran generasi terbaru dengan dukungan pemrosesan multimodal mutakhir.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "NEW",
  },
  {
    id: "openai/gpt-oss-120b",
    name: "FYY-GPT-OSS 120B",
    description: "Kecerdasan terbuka ultra-komprehensif untuk tugas analitis dan sintesis data tingkat tinggi.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "ELITE",
  },
  {
    id: "qwen/qwen3-32b",
    name: "FYY-Qwen 3 32B",
    description: "Keunggulan multibahasa dan matematika dengan kecepatan inferensi tinggi.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "FAST",
  },
]

export const MODEL_NAME_MAP: Record<string, string> = {
  "llama-3.3-70b-versatile": "FYY-Llama 3.3 (PRO)",
  "llama-3.3-70b-specdec": "FYY-Llama 3.3 SpecDec",
  "meta-llama/llama-4-scout-17b-16e-instruct": "FYY-Llama 4 Scout",
  "openai/gpt-oss-120b": "FYY-GPT-OSS 120B",
  "qwen/qwen3-32b": "FYY-Qwen 3 32B",
  "llama-3.1-8b-instant": "FYY-Llama 3.1 Fast",
  "llama-3.2-11b-vision-preview": "FYY-Vision 11B",
  "llama-3.2-90b-vision-preview": "FYY-Vision 90B",
}

export function formatBrandedError(rawError: string, modelId?: string): string {
  let text = rawError || "Terjadi kesalahan pada sistem."

  // Extract clean message if raw JSON string
  try {
    const jsonMatch = text.match(/\{[\s\S]*"error"[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed?.error?.message) {
        text = parsed.error.message
      }
    }
  } catch {}

  // Replace raw technical model identifiers with rebranded FYY-AI names
  for (const [rawId, brandedName] of Object.entries(MODEL_NAME_MAP)) {
    const regex = new RegExp(rawId.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "gi")
    text = text.replace(regex, `**${brandedName}**`)
  }

  // Handle common Groq errors gracefully with FYY-AI branding
  if (
    text.toLowerCase().includes("does not exist") ||
    text.toLowerCase().includes("model_not_found") ||
    text.includes("404")
  ) {
    const currentModelName = modelId && MODEL_NAME_MAP[modelId] ? `**${MODEL_NAME_MAP[modelId]}**` : "Model yang dipilih"
    return `⚠️ ${currentModelName} sedang dalam pemeliharaan atau antrean penuh di server **FYY-GROQ SYSTEM INTELLIGENCE**. Silakan beralih ke model lain (seperti **FYY-Llama 4 Scout** atau **FYY-Qwen 3 32B**) melalui menu Model.`
  }

  if (text.toLowerCase().includes("rate limit") || text.includes("429")) {
    return `⏳ Batas frekuensi permintaan tercapai pada server **FYY-GROQ SYSTEM INTELLIGENCE**. Mohon tunggu beberapa detik atau gunakan model lain.`
  }

  if (text.toLowerCase().includes("invalid_api_key") || text.toLowerCase().includes("api key")) {
    return `🔑 Kunci API **FYY-GROQ SYSTEM INTELLIGENCE** belum terkonfigurasi atau tidak valid. Silakan periksa pengaturan API.`
  }

  return `⚠️ **FYY-AI Sistem**: ${text}`
}
