"use client"

import { useEffect } from "react"

export function useSecurityShield() {
  useEffect(() => {
    // 1. Disable Right-Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }
    document.addEventListener("contextmenu", handleContextMenu)

    // 2. Disable Common Inspection & Saving Hotkeys
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === "F12") {
        e.preventDefault()
        return false
      }

      // Ctrl + Shift + I (Inspect Element)
      // Ctrl + Shift + J (Developer Console)
      // Ctrl + Shift + C (Element Inspector)
      // Ctrl + U (View Source)
      // Ctrl + S (Save Page)
      if (
        e.ctrlKey &&
        (e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c") ||
          e.key === "U" ||
          e.key === "u" ||
          e.key === "S" ||
          e.key === "s")
      ) {
        e.preventDefault()
        return false
      }
    }
    document.addEventListener("keydown", handleKeyDown)

    // 3. Ultimate Anti-Debugger / DevTools Loop
    // This executes an extremely fast debugger loop. If Chrome DevTools or Android Remote Inspector
    // is opened, the execution will pause immediately on "debugger;" and freeze the browser/app.
    const antiDebugInterval = setInterval(() => {
      const startTime = performance.now()
      
      // Trigger debugger
      // eslint-disable-next-line no-debugger
      debugger

      const endTime = performance.now()
      
      // If the execution took more than 50ms, it means the developer tools paused the execution
      if (endTime - startTime > 50) {
        console.warn("Fyy Security Shield: DevTools detected and blocked!")
      }
    }, 150)

    // 4. Prevent text selection/drag on critical elements (optional but good for branding protection)
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === "IMG") {
        e.preventDefault()
      }
    }
    document.addEventListener("dragstart", handleDragStart)

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      clearInterval(antiDebugInterval)
      document.removeEventListener("dragstart", handleDragStart)
    }
  }, [])
}
