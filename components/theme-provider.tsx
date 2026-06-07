"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useSecurityShield } from "@/hooks/use-security-shield"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  useSecurityShield()
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
