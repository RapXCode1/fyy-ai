export async function openSignIn() {
  if (typeof window === 'undefined') return

  const callback = (process.env.NEXT_PUBLIC_AUTH_CALLBACK as string) || `${window.location.origin}/api/auth/clerk/callback`
  const signInPath = (process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL as string) || '/sign-in'
  const url = `${signInPath}?redirect_uri=${encodeURIComponent(callback)}`

  const win = window as any
  try {
    if (win.Capacitor && typeof win.Capacitor.isNativePlatform === 'function' && win.Capacitor.isNativePlatform()) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
      return
    }
  } catch (e) {
    // ignore and fallback to browser navigation
    console.warn('Capacitor Browser open failed, falling back to window.location', e)
  }

  // Web fallback
  window.location.href = url
}

export default openSignIn
