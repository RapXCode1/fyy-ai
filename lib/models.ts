export interface ModelInfo {
  id: string
  name: string
  description: string
  provider: string
  badge?: string
}

// main chat models
export const OFFICIAL_MODELS: ModelInfo[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "FYY-Llama 3.3 (PRO)",
    description: "Model Flagship untuk penalaran kompleks, analisis data mendalam, dan pemrograman.",
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
    description: "Model open-intelligence performa elit untuk tugas analitis dan sintesis data tingkat tinggi.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "ELITE",
  },
  {
    id: "qwen/qwen3.6-27b",
    name: "FYY-Qwen 3 32B",
    description: "Model logika matematika dan keunggulan multibahasa dengan kecepatan inferensi tinggi.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "FAST",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "FYY-Llama 3.1 Fast",
    description: "Model inferensi kilat berlatensi ultra-rendah untuk dialog harian instan.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "LITE",
  },
]

// vision model
export const VISION_MODEL = {
  id: "fyy-vision",
  name: "FYY-Vision Multimodal",
  description: "Pemrosesan gambar cerdas, OCR dokumen, dan analisis visual mendalam.",
}

// image generator models
export const IMAGE_GENERATOR_MODELS = [
  {
    id: "flux",
    modelId: "black-forest-labs/FLUX.1-schnell",
    name: "FYY-FLUX.1 Schnell",
    description: "Generasi gambar artistik ultra-cepat dan beresolusi tinggi.",
  },
  {
    id: "flux-realism",
    modelId: "stabilityai/stable-diffusion-xl-base-1.0",
    name: "FYY-Realistic XL",
    description: "Generasi foto hiper-realistis dengan detail tekstur dan pencahayaan nyata.",
  },
  {
    id: "flux-pro",
    modelId: "black-forest-labs/FLUX.1-dev",
    name: "FYY-FLUX Pro",
    description: "Generasi visual kualitas studio profesional dengan komposisi presisi tinggi.",
  },
  {
    id: "turbo",
    modelId: "black-forest-labs/FLUX.1-schnell",
    name: "FYY-Turbo Diffusion",
    description: "Generasi visual kilat responsif untuk eksplorasi konsep instan.",
  },
]

export const DEFAULT_MODEL_ID = "llama-3.3-70b-versatile"
export const FALLBACK_MODEL_ID = "openai/gpt-oss-120b"

export const MODEL_NAME_MAP: Record<string, string> = {
  "llama-3.3-70b-versatile": "FYY-Llama 3.3 (PRO)",
  "meta-llama/llama-4-scout-17b-16e-instruct": "FYY-Llama 4 Scout",
  "llama-4-scout-17b-16e-instruct": "FYY-Llama 4 Scout",
  "openai/gpt-oss-120b": "FYY-GPT-OSS 120B",
  "openai/gpt-oss-20b": "FYY-GPT-OSS 20B (Fast)",
  "qwen/qwen3.6-27b": "FYY-Qwen 3 32B",
  "qwen/qwen3-32b": "FYY-Qwen 3 32B",
  "qwen-qwen3-32b": "FYY-Qwen 3 32B",
  "llama-3.1-8b-instant": "FYY-Llama 3.1 Fast",
  "gemma2-9b-it": "FYY-Gemma 9B",
}

export function formatBrandedError(rawError: string, modelId?: string): string {
  let text = rawError || "Terjadi kesalahan pada sistem."

  // skip if already formatted
  if (text.startsWith("⚠️") || text.startsWith("⏳") || text.startsWith("🔑") || text.startsWith("🌐")) {
    return text
  }

  // parse JSON error if raw
  try {
    const jsonMatch = text.match(/\{[\s\S]*"error"[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed?.error?.message) {
        text = parsed.error.message
      }
    }
  } catch {}

  // replace raw model ids with branded names
  for (const [rawId, brandedName] of Object.entries(MODEL_NAME_MAP)) {
    const regex = new RegExp(rawId.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "gi")
    text = text.replace(regex, `**${brandedName}**`)
  }

  if (
    text.toLowerCase().includes("does not exist") ||
    text.toLowerCase().includes("model_not_found") ||
    text.toLowerCase().includes("model not found") ||
    text.includes("404")
  ) {
    const currentModelName = modelId && MODEL_NAME_MAP[modelId]
      ? `**${MODEL_NAME_MAP[modelId]}**`
      : "Model yang dipilih"
    return `⚠️ ${currentModelName} sedang dalam pemeliharaan server **FYY-GROQ SYSTEM INTELLIGENCE**. Silakan beralih ke model lain di menu Model.`
  }

  if (
    text.toLowerCase().includes("tokens per minute") ||
    text.toLowerCase().includes("too large") ||
    text.toLowerCase().includes("tpm") ||
    text.includes("413")
  ) {
    return `⏳ Server **FYY-GROQ SYSTEM INTELLIGENCE** sedang mengalami antrean token tinggi. Silakan kirim ulang pesanmu dalam beberapa detik, atau pilih model **FYY-Llama 3.1 Fast** untuk inferensi instan.`
  }

  if (text.toLowerCase().includes("rate limit") || text.includes("429")) {
    return `⏳ Batas frekuensi permintaan (rate limit) tercapai di server **FYY-GROQ SYSTEM INTELLIGENCE**. Mohon tunggu beberapa detik.`
  }

  if (text.toLowerCase().includes("invalid_api_key") || text.toLowerCase().includes("api key") || text.includes("401")) {
    return `🔑 Kunci API **FYY-GROQ SYSTEM INTELLIGENCE** belum valid atau belum diset. Silakan masukkan API key Groq kamu di menu **Settings (⚙️)**.`
  }

  if (text.toLowerCase().includes("failed to fetch") || text.toLowerCase().includes("network")) {
    return `🌐 Gagal terhubung ke server **FYY-GROQ SYSTEM INTELLIGENCE**. Periksa koneksi internet kamu.`
  }

  return `⚠️ **FYY-AI**: ${text}`
}
