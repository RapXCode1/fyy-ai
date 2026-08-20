"use client"

import { useEffect } from "react"

export default function ThemeStyleProvider() {
  useEffect(() => {
    const applyThemeClass = (theme: string) => {
      const classes = ["style-basic", "style-glass", "style-neobrutalism"]
      document.documentElement.classList.remove(...classes)
      document.body.classList.remove(...classes)
      
      const newClass = `style-${theme}`
      document.documentElement.classList.add(newClass)
      document.body.classList.add(newClass)
    }

    // Instant local read without network latency
    const savedTheme = localStorage.getItem("fyy-ai-theme-style") || "basic"
    applyThemeClass(savedTheme)

    const handleThemeChange = (e: any) => {
      applyThemeClass(e.detail)
    }

    window.addEventListener("fyy-theme-change", handleThemeChange)
    return () => window.removeEventListener("fyy-theme-change", handleThemeChange)
  }, [])

  return null
}
