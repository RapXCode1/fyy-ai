'use client'

import * as React from 'react'
import { useSecurityShield } from '@/hooks/use-security-shield'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useSecurityShield()
  const [theme, setThemeState] = React.useState<Theme>('dark')

  useEffect(() => {
    // Sync with localStorage and document class on mount
    const savedTheme = localStorage.getItem('theme') as Theme || 'dark'
    setThemeState(savedTheme)
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Helper hook for initial setup
function useEffect(callback: React.EffectCallback, deps: React.DependencyList) {
  const isMounted = React.useRef(false)
  React.useEffect(() => {
    callback()
    isMounted.current = true
  }, deps)
}
