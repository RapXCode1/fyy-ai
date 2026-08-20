"use client"

import { useState, useEffect } from "react"
import { X, Save, RotateCcw, Settings, Sliders, Type, Info, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: { fontFamily?: string; [key: string]: unknown }) => void
  onFontChange?: (_font: string) => void
}

export default function SettingsPanel({ isOpen, onClose, onSave, onFontChange }: SettingsPanelProps) {
  const [customInstruction, setCustomInstruction] = useState("")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2000)
  const [topP, setTopP] = useState(0.9)
  const [fontFamily, setFontFamily] = useState("Inter")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedInstruction = localStorage.getItem("fyy_user_custom_instruction") || ""
        setCustomInstruction(storedInstruction)

        const response = await fetch("/api/settings")
        if (response.ok) {
          const data = await response.json()
          setTemperature(data.temperature ?? 0.7)
          setMaxTokens(data.maxTokens ?? 2000)
          setTopP(data.topP ?? 0.9)
          const loadedFont = data.fontFamily || "Inter"
          setFontFamily(loadedFont)
          if (onFontChange) {
            onFontChange(loadedFont)
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }

    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("fyy_user_custom_instruction", customInstruction.trim())
      }

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature,
          maxTokens,
          topP,
          fontFamily,
        }),
      })

      const data = await response.json()
      onSave(data.settings || {})
      onClose()
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setCustomInstruction("")
    setTemperature(0.7)
    setMaxTokens(2000)
    setTopP(0.9)
    setFontFamily("Inter")
    if (typeof window !== "undefined") {
      localStorage.removeItem("fyy_user_custom_instruction")
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-[120] p-4 sm:p-6 animate-scale-in">
        <div className="w-full max-w-xl max-h-[90vh] flex flex-col fyf-card rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--fyf-border)] p-4 sm:p-5 flex-shrink-0">
            <h2 className="text-sm font-bold text-[var(--fyf-text)] flex items-center gap-2">
              <Settings className="w-4 h-4 text-rose-400" />
              Settings Panel
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--fyf-border-hover)] text-[var(--fyf-text-secondary)] hover:text-[var(--fyf-text)] rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Settings scrollable area */}
          <div className="p-4 sm:p-5 space-y-5 overflow-y-auto scrollbar-thin flex-1">
            
            {/* Section 1: User Custom Instruction */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--fyf-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-rose-400" />
                Instruksi Khusus (Custom Instruction)
              </label>
              <textarea
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                className="w-full h-24 px-3 py-2.5 bg-[var(--fyf-surface)] border border-[var(--fyf-border)] rounded-2xl text-xs text-[var(--fyf-text)] placeholder-[var(--fyf-text-muted)] outline-none focus:border-red-500/50 resize-none transition-colors leading-relaxed"
                placeholder="Berikan instruksi tambahan bagaimana kamu ingin FYY-AI merespons (misal: 'Jawab dengan gaya santai dan ringkas')..."
              />
            </div>

            {/* Section 2: Model parameters */}
            <div className="space-y-4 bg-[var(--fyf-surface)] border border-[var(--fyf-border)] rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--fyf-text-secondary)] uppercase tracking-wider">
                <Sliders size={12} className="text-rose-400" />
                Parameter Respon AI
              </div>

              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--fyf-text-secondary)]">Kreativitas (Temperature)</span>
                  <span className="text-rose-400 font-bold">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number.parseFloat(e.target.value))}
                  className="w-full h-1 bg-[var(--fyf-border)] rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

              {/* Max Tokens */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--fyf-text-secondary)]">Panjang Maksimal Respon</span>
                  <span className="text-rose-400 font-bold">{maxTokens} Tokens</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number.parseInt(e.target.value))}
                  className="w-full h-1 bg-[var(--fyf-border)] rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>
            </div>

            {/* Section 3: Font Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--fyf-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Type size={12} className="text-rose-400" />
                Font Tampilan
              </label>
              
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto scrollbar-thin">
                {[
                  { id: 'Inter', name: 'Inter', desc: 'Modern & Bersih' },
                  { id: 'Roboto', name: 'Roboto', desc: 'Sangat Jelas' },
                  { id: 'Open Sans', name: 'Open Sans', desc: 'Humanis' },
                  { id: 'Poppins', name: 'Poppins', desc: 'Geometris' },
                  { id: 'Nunito', name: 'Nunito', desc: 'Ramah' },
                  { id: 'Montserrat', name: 'Montserrat', desc: 'Elegan' },
                ].map((font) => (
                  <button
                    key={font.id}
                    onClick={() => {
                      setFontFamily(font.id)
                      const fontMap: Record<string, string> = {
                        'Inter': 'Inter, sans-serif',
                        'Roboto': 'Roboto, sans-serif',
                        'Open Sans': 'Open Sans, sans-serif',
                        'Poppins': 'Poppins, sans-serif',
                        'Nunito': 'Nunito, sans-serif',
                        'Montserrat': 'Montserrat, sans-serif',
                      }
                      if (font.id !== 'Inter') {
                        const fontLinkId = `fyy-font-${font.id.toLowerCase().replace(/\s+/g, '-')}`
                        if (!document.getElementById(fontLinkId)) {
                          const link = document.createElement('link')
                          link.id = fontLinkId
                          link.rel = 'stylesheet'
                          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.id)}:wght@400;600;700&display=swap`
                          document.head.appendChild(link)
                        }
                      }
                      document.body.style.fontFamily = fontMap[font.id] || 'Inter, sans-serif'
                      if (onFontChange) {
                        onFontChange(font.id)
                      }
                    }}
                    className="p-2.5 rounded-xl border text-left transition-all duration-200"
                    style={{
                      background: fontFamily === font.id ? "rgba(225, 29, 72, 0.12)" : "transparent",
                      borderColor: fontFamily === font.id ? "rgba(225, 29, 72, 0.4)" : "var(--fyf-border)",
                    }}
                  >
                    <div className="text-xs font-bold text-[var(--fyf-text)]">{font.name}</div>
                    <div className="text-[10px] text-[var(--fyf-text-secondary)] mt-0.5">{font.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advice notice */}
            <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <Info size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-rose-300/90 leading-relaxed">
                Pengaturan ini disimpan secara aman di preferensi lokal browser Anda dan otomatis diterapkan pada setiap percakapan.
              </p>
            </div>

          </div>

          {/* Footer buttons */}
          <div className="border-t border-[var(--fyf-border)] p-4 flex gap-2 flex-shrink-0 bg-[var(--fyf-surface)]">
            <Button
              onClick={handleReset}
              variant="ghost"
              className="flex-1 text-xs border border-[var(--fyf-border)] hover:bg-[var(--fyf-border-hover)] text-[var(--fyf-text-secondary)] hover:text-[var(--fyf-text)] font-bold rounded-xl h-10 transition-colors"
            >
              <RotateCcw size={12} className="mr-1.5" />
              Reset Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="fyf-btn-primary flex-1 text-xs font-bold rounded-xl h-10"
            >
              <Save size={12} className="mr-1.5" />
              {isSaving ? "Saving..." : "Simpan"}
            </Button>
          </div>

        </div>
      </div>
    </>
  )
}
