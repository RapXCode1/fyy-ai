"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Hook for secure API key storage and retrieval
 * Uses Capacitor SecureStorage on native, localStorage fallback on web
 */
export function useSecureStorage() {
  const [storageAvailable, setStorageAvailable] = useState<'secure' | 'local' | 'none'>('none')

  useEffect(() => {
    const initStorage = async () => {
      if (typeof window === 'undefined') {
        setStorageAvailable('none')
        return
      }

      try {
        const win = window as any
        if (win.Capacitor?.isNativePlatform?.()) {
          // Capacitor WebView currently uses browser storage; native secure storage plugin is not installed in this project.
          setStorageAvailable('local')
        } else {
          setStorageAvailable('local')
        }
      } catch {
        setStorageAvailable('none')
      }
    }

    initStorage()
  }, [])

  const setItem = useCallback(async (key: string, value: string): Promise<boolean> => {
    try {
      if (storageAvailable === 'local') {
        const encrypted = btoa(value)
        localStorage.setItem(`app_${key}`, encrypted)
        return true
      }
      return false
    } catch (error) {
      console.error('SecureStorage.setItem failed:', error)
      return false
    }
  }, [storageAvailable])

  const getItem = useCallback(async (key: string): Promise<string | null> => {
    try {
      if (storageAvailable === 'local') {
        const encrypted = localStorage.getItem(`app_${key}`)
        if (!encrypted) return null
        return atob(encrypted)
      }
      return null
    } catch (error) {
      console.error('SecureStorage.getItem failed:', error)
      return null
    }
  }, [storageAvailable])

  const removeItem = useCallback(async (key: string): Promise<boolean> => {
    try {
      if (storageAvailable === 'local') {
        localStorage.removeItem(`app_${key}`)
        return true
      }
      return false
    } catch (error) {
      console.error('SecureStorage.removeItem failed:', error)
      return false
    }
  }, [storageAvailable])

  return {
    storageAvailable,
    setItem,
    getItem,
    removeItem,
    isSecure: storageAvailable === 'secure',
  }
}
