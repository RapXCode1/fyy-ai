"use client"

import { Check, Sparkles, Lock, Cpu } from "lucide-react"
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
      <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
        <Cpu size={12} className="text-gray-400" />
        Select Model
      </div>

      <div className="grid grid-cols-1 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
        {models.map((model) => {
          const isSelected = selectedModel === model.id
          const isLocked = isGuest && (model.id === "meta-llama/llama-4-scout-17b-16e-instruct" || model.id === "openai/gpt-oss-120b")
          
          return (
            <button
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className="group relative flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-300"
              style={{
                background: isSelected ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.01)",
                borderColor: isSelected ? "rgba(37, 99, 255, 0.3)" : "rgba(255, 255, 255, 0.05)",
                borderLeft: isSelected ? "3px solid #2563FF" : "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm text-white group-hover:text-blue-400 transition-colors">
                    {model.name}
                  </span>
                  
                  {isLocked && (
                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md uppercase flex items-center gap-1">
                      <Lock size={8} /> LOCKED
                    </span>
                  )}

                  {!isLocked && model.id.includes("pro") && (
                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-md uppercase flex items-center gap-0.5">
                      <Sparkles size={8} /> PRO
                    </span>
                  )}

                  {!isLocked && model.id.includes("flash") && (
                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md uppercase">
                      FAST
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {model.description}
                </p>
              </div>
              
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: isSelected ? "#2563FF" : isLocked ? "rgba(234, 179, 8, 0.1)" : "rgba(255, 255, 255, 0.05)",
                  border: isSelected ? "none" : isLocked ? "1px solid rgba(234, 179, 8, 0.2)" : "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {isLocked ? (
                  <Lock size={9} className="text-yellow-500" />
                ) : isSelected ? (
                  <Check size={12} className="text-white" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-white/30 transition-colors" />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
