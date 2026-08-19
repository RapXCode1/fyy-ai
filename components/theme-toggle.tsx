"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <div className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-9 h-9 hover:bg-muted/80 transition-all duration-300 hover:scale-110 hover:rotate-12 group relative overflow-hidden"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <div className="relative z-10 transition-all duration-500 ease-in-out">
        {theme === "light" ? (
          <Moon className="h-4 w-4 transition-all duration-300 group-hover:text-rose-400" />
        ) : (
          <Sun className="h-4 w-4 transition-all duration-300 group-hover:text-amber-400" />
        )}
      </div>

      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />

      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-md bg-gradient-to-r from-red-500/10 to-rose-500/10 scale-0 group-active:scale-100 transition-transform duration-150" />
    </Button>
  )
}
