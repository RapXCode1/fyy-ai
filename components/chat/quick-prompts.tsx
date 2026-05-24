"use client"

import { Zap, X, MessageSquare, Lightbulb, Code, Sparkles } from "lucide-react"

interface QuickPromptsProps {
  onSelect: (prompt: string) => void
  onClose: () => void
}

const prompts = [
  { icon: <MessageSquare size={14} />, text: "Jelaskan konsep AI dengan bahasa sederhana" },
  { icon: <Code size={14} />, text: "Buatkan boilerplate Next.js dengan Tailwind CSS" },
  { icon: <Lightbulb size={14} />, text: "Berikan ide konten menarik untuk YouTube teknologi" },
  { icon: <Sparkles size={14} />, text: "Buatkan puisi pendek tentang masa depan manusia" },
  { icon: <MessageSquare size={14} />, text: "Tips menjaga kesehatan mental di era digital" },
  { icon: <Code size={14} />, text: "Cara optimasi SEO untuk blog pribadi" },
]

export default function QuickPrompts({ onSelect, onClose }: QuickPromptsProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-amber-400 fill-amber-400" />
          <h3 className="font-bold text-sm uppercase tracking-wider">Quick Prompts</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
          <X size={16} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-2 custom-scrollbar">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onSelect(p.text)}
            className="flex items-start gap-3 p-3 text-left rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="mt-0.5 p-1.5 rounded-lg bg-muted group-hover:bg-primary/20 transition-colors">
              {p.icon}
            </div>
            <span className="text-xs font-medium leading-relaxed">{p.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
