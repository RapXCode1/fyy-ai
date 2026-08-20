// ============================================================
// SECURE PROMPT LOADER
// All sensitive prompt content is loaded from environment
// variables — NOT hardcoded in source code.
// Set these variables in Vercel Dashboard > Settings > Env Vars
// ============================================================

/**
 * Returns the base system prompt from env, or a minimal safe fallback.
 * The actual content lives ONLY in Vercel environment variables.
 */
export function getSystemPrompt(): string {
  return process.env.FYY_SYSTEM_PROMPT || "You are a helpful AI assistant."
}

/**
 * Returns the internal identity knowledge block from env.
 * This contains model lists, branding rules, and creator info.
 * Loaded at runtime from Vercel env — never stored in source.
 */
export function getIdentityKnowledge(): string {
  return process.env.FYY_IDENTITY_KNOWLEDGE || ""
}

/**
 * Returns the internal behavior rules from env.
 */
export function getBehaviorRules(): string {
  return process.env.FYY_BEHAVIOR_RULES || ""
}

/**
 * Returns the owner/dev mode prompt from env.
 */
export function getOwnerPrompt(): string {
  return process.env.FYY_OWNER_PROMPT || ""
}

/**
 * Global mutable settings (non-sensitive runtime config).
 */
export let globalSettings = {
  get systemPrompt() { return getSystemPrompt() },
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.9,
  fontFamily: "Inter",
  themeStyle: "basic",
}

export function updateSettings(newSettings: Partial<Omit<typeof globalSettings, "systemPrompt">>) {
  globalSettings = { ...globalSettings, ...newSettings }
  return globalSettings
}

// Legacy exports — kept for backward compatibility, now env-backed
export const FYY_SYSTEM_PROMPT = getSystemPrompt()
export const FYY_IDENTITY_KNOWLEDGE = getIdentityKnowledge()
