import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const enableSupabase = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true'

let supabaseCircuitBroken = false
let cachedClient: SupabaseClient | null = null
let cachedToken: string | null = null

/**
 * Supabase cloud sync is disabled by default unless explicitly enabled via NEXT_PUBLIC_ENABLE_SUPABASE=true.
 * This prevents unauthenticated 401 errors & CORS issues when Clerk JWT template is not yet configured.
 * FYY-AI uses ultra-fast local storage for conversation history by default.
 */
export const isSupabaseConfigured = (): boolean => {
  if (!enableSupabase || supabaseCircuitBroken) return false
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project.supabase.co') &&
    !supabaseAnonKey.includes('your_supabase_anon_key')
  )
}

export const tripSupabaseCircuitBreaker = (reason?: string) => {
  if (!supabaseCircuitBroken) {
    supabaseCircuitBroken = true
    console.info(`[FYY Storage] Supabase cloud sync paused (${reason || 'unauthorized'}). Using lightning-fast local storage.`)
  }
}

/**
 * Safely retrieves Supabase JWT token from Clerk session.
 */
export const getClerkSupabaseToken = async (session: any): Promise<string | null> => {
  if (!session || !isSupabaseConfigured()) return null
  try {
    const token = await session.getToken({ template: 'supabase' })
    return token || null
  } catch {
    return null
  }
}

/**
 * Creates or returns a singleton Supabase client without creating multiple GoTrueClient instances.
 */
export const createClerkSupabaseClient = (clerkToken?: string | null): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null
  }

  const tokenKey = clerkToken || 'anon'
  if (cachedClient && cachedToken === tokenKey) {
    return cachedClient
  }

  const headers: Record<string, string> = {}
  if (clerkToken) {
    headers.Authorization = `Bearer ${clerkToken}`
  }

  try {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      },
    })
    cachedToken = tokenKey
    return cachedClient
  } catch (err) {
    tripSupabaseCircuitBreaker('client initialization failed')
    return null
  }
}
