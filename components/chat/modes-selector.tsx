"use client"

import { AI_MODES, type AIMode } from "@/lib/ai-modes"

interface ModesSelectorProps {
  selectedMode: string
  onModeChange: (id: string) => void
}

export default function ModesSelector({ selectedMode, onModeChange }: ModesSelectorProps) {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {AI_MODES.map((mode: AIMode) => {
            const isSelected = selectedMode === mode.id
            
            return (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${
                  isSelected 
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] border-2 border-primary scale-105" 
                    : "bg-card border border-border hover:border-primary/50 text-foreground hover:bg-muted/50"
                }`}
                title={mode.description}
              >
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
