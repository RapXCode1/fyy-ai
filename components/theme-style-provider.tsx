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

    const init = async () => {
      const savedTheme = localStorage.getItem("fyy-ai-theme-style") || "basic"
      applyThemeClass(savedTheme)

      try {
        const response = await fetch("/api/settings")
        if (response.ok) {
          const data = await response.json()
          const themeStyle = data.themeStyle || "basic"
          if (themeStyle !== savedTheme) {
            applyThemeClass(themeStyle)
            localStorage.setItem("fyy-ai-theme-style", themeStyle)
          }
        }
      } catch (e) {
        console.error("Theme sync error:", e)
      }
    }

    init()

    const handleThemeChange = (e: any) => {
      applyThemeClass(e.detail)
    }

    window.addEventListener("fyy-theme-change", handleThemeChange)
    return () => window.removeEventListener("fyy-theme-change", handleThemeChange)
  }, [])

  return null
}
