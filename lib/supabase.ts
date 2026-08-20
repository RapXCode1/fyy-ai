import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const enableSupabase = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true'

let circuitBroken = false
let cachedClient: SupabaseClient | null = null
let cachedToken: string | null = null

export const isSupabaseConfigured = (): boolean => {
  if (!enableSupabase || circuitBroken) return false
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project.supabase.co') &&
    !supabaseAnonKey.includes('your_supabase_anon_key')
  )
}

export const tripSupabaseCircuitBreaker = (reason?: string) => {
  if (!circuitBroken) {
    circuitBroken = true
    console.info(`Supabase sync paused (${reason || 'unauthorized'}). Falling back to local storage.`)
  }
}

export const getClerkSupabaseToken = async (session: any): Promise<string | null> => {
  if (!session || !isSupabaseConfigured()) return null
  try {
    const token = await session.getToken({ template: 'supabase' })
    return token || null
  } catch {
    return null
  }
}

export const createClerkSupabaseClient = (clerkToken?: string | null): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null

  const key = clerkToken || 'anon'
  if (cachedClient && cachedToken === key) return cachedClient

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
    cachedToken = key
    return cachedClient
  } catch (err) {
    tripSupabaseCircuitBreaker('client init failed')
    return null
  }
}
