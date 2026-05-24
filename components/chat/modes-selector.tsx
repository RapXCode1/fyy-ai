"use client"

import { AI_MODES, type AIMode } from "@/lib/ai-modes"
import { Lock } from "lucide-react"
import { useUser } from "@clerk/nextjs"

interface ModesSelectorProps {
  selectedMode: string
  onModeChange: (id: string) => void
}

export default function ModesSelector({ selectedMode, onModeChange }: ModesSelectorProps) {
  const { isSignedIn, isLoaded } = useUser()
  const isGuest = isLoaded && !isSignedIn

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {AI_MODES.map((mode: AIMode) => {
            const isLocked = isGuest && (mode.id === "creative" || mode.id === "research")
            
            return (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${
                  selectedMode === mode.id 
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] border-2 border-primary scale-105" 
                    : isLocked
                      ? "bg-card border border-border/50 opacity-60 hover:opacity-100 hover:border-amber-500/40 text-foreground"
                      : "bg-card border border-border hover:border-primary/50 text-foreground hover:bg-muted/50"
                }`}
                title={mode.description}
              >
                {isLocked && (
                  <div className="absolute top-2 right-2 text-amber-500 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 shadow-sm" title="Fitur Premium Terkunci">
                    <Lock size={10} />
                  </div>
                )}
                <span className="text-2xl sm:text-3xl mb-1">{mode.icon}</span>
                <span className="text-xs font-bold text-center leading-tight uppercase tracking-tighter">{mode.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
