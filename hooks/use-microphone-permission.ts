"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Hook for requesting and checking microphone permissions in Capacitor
 * Handles both Web and Native Android environments
 */
export function useMicrophonePermission() {
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false)

  // Check if we're in Capacitor environment
  const isCapacitorApp = useCallback(() => {
    if (typeof window === 'undefined') return false
    const win = window as any
    return !!win.Capacitor?.isNativePlatform?.()
  }, [])

  // Request microphone permission on app start
  useEffect(() => {
    const requestPermission = async () => {
      if (hasRequestedPermission) return

      try {
        // Web browser and Capacitor WebView both use browser-level microphone permissions
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          setPermissionStatus(permission.state as 'granted' | 'denied' | 'prompt')
        } catch {
          setPermissionStatus('prompt')
        }
      } catch (error) {
        console.error('Failed to check microphone permission:', error)
        setPermissionStatus('unknown')
      } finally {
        setHasRequestedPermission(true)
      }
    }

    requestPermission()
  }, [isCapacitorApp, hasRequestedPermission])

  // Manual permission request trigger
  const requestPermission = useCallback(async () => {
    try {
      // Web and Capacitor WebView can both prompt via getUserMedia
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermissionStatus('granted')
      return true
    } catch (error: any) {
      console.error('Microphone permission request failed:', error)
      const isDenied = error.name === 'NotAllowedError' || error.message?.includes('denied')
      setPermissionStatus(isDenied ? 'denied' : 'unknown')
      return false
    }
  }, [isCapacitorApp])

  const isGranted = permissionStatus === 'granted'
  const isDenied = permissionStatus === 'denied'
  const needsPrompt = permissionStatus === 'prompt'

  return {
    permissionStatus,
    isGranted,
    isDenied,
    needsPrompt,
    requestPermission,
  }
}
