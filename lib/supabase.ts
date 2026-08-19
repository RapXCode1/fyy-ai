import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project.supabase.co') &&
    !supabaseAnonKey.includes('your_supabase_anon_key')
  )
}

/**
 * Safely retrieves Supabase JWT token from Clerk session.
 * If the JWT template 'supabase' is not configured in Clerk Dashboard,
 * it safely falls back to the default session token without throwing 404 console errors.
 */
export const getClerkSupabaseToken = async (session: any): Promise<string | null> => {
  if (!session) return null
  try {
    const token = await session.getToken({ template: 'supabase' })
    return token || null
  } catch {
    try {
      const fallbackToken = await session.getToken()
      return fallbackToken || null
    } catch {
      return null
    }
  }
}

export const createClerkSupabaseClient = (clerkToken?: string | null): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null
  }

  const headers: Record<string, string> = {}
  if (clerkToken) {
    headers.Authorization = `Bearer ${clerkToken}`
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    },
  })
}
