export interface ModelInfo {
  id: string
  name: string
  description: string
  provider: string
  badge?: string
}

// ✅ Model IDs yang 100% aktif dan didukung di Groq API
export const OFFICIAL_MODELS: ModelInfo[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "FYY-Llama 3.3 (PRO)",
    description: "Performa tertinggi untuk pemrosesan teks kompleks, coding, dan analisis mendalam.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "PRO",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "FYY-Llama 3.1 Fast",
    description: "Respons ultra-cepat dengan latensi sangat rendah untuk percakapan harian.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "FAST",
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "FYY-Reasoning 70B",
    description: "Model penalaran mendalam dan pemecahan masalah logika tingkat tinggi.",
    provider: "FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)",
    badge: "ELITE",
  },
]

export const DEFAULT_MODEL_ID = "llama-3.3-70b-versatile"
export const FALLBACK_MODEL_ID = "llama-3.1-8b-instant"

export const MODEL_NAME_MAP: Record<string, string> = {
  "llama-3.3-70b-versatile": "FYY-Llama 3.3 (PRO)",
  "llama-3.1-8b-instant": "FYY-Llama 3.1 Fast",
  "llama-3.2-11b-vision-preview": "FYY-Vision 11B",
  "llama-3.2-90b-vision-preview": "FYY-Vision 90B",
}

export function formatBrandedError(rawError: string, modelId?: string): string {
  let text = rawError || "Terjadi kesalahan pada sistem."

  // Guard: jika sudah berformat, jangan duplikasi
  if (text.startsWith("⚠️") || text.startsWith("⏳") || text.startsWith("🔑") || text.startsWith("🌐")) {
    return text
  }

  // Extract clean message jika raw JSON string
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

  if (
    text.toLowerCase().includes("does not exist") ||
    text.toLowerCase().includes("model_not_found") ||
    text.toLowerCase().includes("model not found") ||
    text.includes("404")
  ) {
    const currentModelName = modelId && MODEL_NAME_MAP[modelId]
      ? `**${MODEL_NAME_MAP[modelId]}**`
      : "Model yang dipilih"
    return `⚠️ ${currentModelName} tidak dapat diakses atau API Key Groq belum valid. Silakan periksa kunci API di menu **Settings (⚙️)** atau Dashboard Vercel.`
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
