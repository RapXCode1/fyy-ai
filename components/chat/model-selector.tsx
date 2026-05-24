"use client"

import { Check, Info, Lock } from "lucide-react"
import { useUser } from "@clerk/nextjs"

interface Model {
  id: string
  name: string
  description: string
}

interface ModelSelectorProps {
  models: Model[]
  selectedModel: string
  onSelectModel: (id: string) => void
}

export default function ModelSelector({ models, selectedModel, onSelectModel }: ModelSelectorProps) {
  const { isSignedIn, isLoaded } = useUser()
  const isGuest = isLoaded && !isSignedIn

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
        <Info size={12} />
        Pilih Model AI
      </div>
      <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {models.map((model) => {
          const isLocked = isGuest && (model.id === "meta-llama/llama-4-scout-17b-16e-instruct" || model.id === "openai/gpt-oss-120b")
          
          return (
            <button
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={`group relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                selectedModel === model.id
                  ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                  : isLocked
                    ? "bg-card border-border/50 opacity-70 hover:opacity-100 hover:border-amber-500/40"
                    : "bg-card border-border hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold text-base text-foreground transition-colors ${
                    isLocked ? "group-hover:text-amber-500" : "group-hover:text-primary"
                  }`}>
                    {model.name}
                  </span>
                  {isLocked && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded uppercase flex items-center gap-1">
                      <Lock size={8} /> TERKUNCI
                    </span>
                  )}
                  {model.id.includes('pro') && !isLocked && (
                    <span className="px-1.5 py-0.5 text-[10px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded uppercase">
                      PRO
                    </span>
                  )}
                  {model.id.includes('flash') && !isLocked && (
                    <span className="px-1.5 py-0.5 text-[10px] font-black bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded uppercase">
                      FAST
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {model.description}
                </p>
              </div>
              
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                isLocked
                  ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                  : selectedModel === model.id 
                    ? "bg-primary text-primary-foreground scale-110" 
                    : "bg-muted border border-border opacity-0 group-hover:opacity-100"
              }`}>
                {isLocked ? (
                  <Lock size={12} />
                ) : (
                  <Check size={14} className={selectedModel === model.id ? "opacity-100" : "opacity-0"} />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
