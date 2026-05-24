export let globalSettings = {
  systemPrompt: `Saya adalah Fyy-AI, asisten AI cerdas yang siap membantu Anda dalam berbagai tugas dengan respons yang natural, akurat, dan profesional.`,
  temperature: 0.7,
  maxTokens: 2000,
  topP: 0.9,
  fontFamily: "Inter",
  themeStyle: "basic",
}

export function updateSettings(newSettings: Partial<typeof globalSettings>) {
  globalSettings = { ...globalSettings, ...newSettings }
  return globalSettings
}
