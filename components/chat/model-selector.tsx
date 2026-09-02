"use client"

import { Check, Sparkles, Cpu } from "lucide-react"

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
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
        <Cpu size={12} className="text-gray-400" />
        Pilih Model AI
      </div>

      <div className="grid grid-cols-1 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
        {models.map((model) => {
          const isSelected = selectedModel === model.id
          
          return (
            <button
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className="group relative flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-300"
              style={{
                background: isSelected ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.01)",
                borderColor: isSelected ? "rgba(225, 29, 72, 0.4)" : "rgba(255, 255, 255, 0.05)",
                borderLeft: isSelected ? "3px solid #E11D48" : "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm text-white group-hover:text-rose-400 transition-colors">
                    {model.name}
                  </span>

                  {model.id.includes("pro") && (
                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-md uppercase flex items-center gap-0.5">
                      <Sparkles size={8} /> PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {model.description}
                </p>
              </div>

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  isSelected
                    ? "bg-[#E11D48] text-white shadow-lg shadow-red-500/20"
                    : "border border-gray-700 opacity-0 group-hover:opacity-100"
                }`}
              >
                {isSelected && <Check size={12} strokeWidth={3} />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
