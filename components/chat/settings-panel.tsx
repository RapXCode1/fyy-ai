"use client"

import { useState, useEffect } from "react"
import { X, Save, RotateCcw, Settings, Sliders, Type, Palette, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: { fontFamily?: string; [key: string]: unknown }) => void
  onFontChange?: (_font: string) => void
}

export default function SettingsPanel({ isOpen, onClose, onSave, onFontChange }: SettingsPanelProps) {
  const [systemPrompt, setSystemPrompt] = useState("")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2000)
  const [topP, setTopP] = useState(0.9)
  const [fontFamily, setFontFamily] = useState("Inter")
  const [themeStyle, setThemeStyle] = useState("basic")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings")
        const data = await response.json()
        setSystemPrompt(data.systemPrompt)
        setTemperature(data.temperature)
        setMaxTokens(data.maxTokens)
        setTopP(data.topP)
        const loadedFont = data.fontFamily || "Inter"
        setFontFamily(loadedFont)
        const loadedTheme = data.themeStyle || "basic"
        setThemeStyle(loadedTheme)
        if (onFontChange) {
          onFontChange(loadedFont)
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
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          temperature,
          maxTokens,
          topP,
          fontFamily,
          themeStyle,
        }),
      })

      const data = await response.json()
      
      window.dispatchEvent(new CustomEvent("fyy-theme-change", { detail: themeStyle }))
      onSave(data.settings)
      onClose()
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSystemPrompt(
      `Saya adalah FYY-AI, asisten digital premium yang dikembangkan secara personal oleh RapXCode. 
Saya dirancang untuk memberikan solusi cerdas, kreatif, dan sangat adaptif dengan respons yang natural dan profesional.`
    )
    setTemperature(0.7)
    setMaxTokens(2000)
    setTopP(0.9)
    setFontFamily("Inter")
    setThemeStyle("basic")
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
              <Settings className="w-4 h-4 text-blue-400" />
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
          <div className="p-4 sm:p-5 space-y-6 overflow-y-auto scrollbar-thin flex-1">
            
            {/* Section 1: System prompt */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--fyf-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={12} className="text-blue-400" />
                System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full h-24 px-3 py-2 bg-[var(--fyf-surface)] border border-[var(--fyf-border)] rounded-xl text-xs sm:text-sm text-[var(--fyf-text)] placeholder-[var(--fyf-text-muted)] outline-none focus:border-blue-500/50 resize-none transition-colors"
                placeholder="Instruct FYY-AI on how to act..."
              />
            </div>

            {/* Section 2: Model parameters */}
            <div className="space-y-4 bg-[var(--fyf-surface)] border border-[var(--fyf-border)] rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--fyf-text-secondary)] uppercase tracking-wider">
                <Sliders size={12} className="text-blue-400" />
                Model Tuning
              </div>

              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--fyf-text-secondary)]">Temperature</span>
                  <span className="text-blue-400 font-bold">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number.parseFloat(e.target.value))}
                  className="w-full h-1 bg-[var(--fyf-border)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Max Tokens */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--fyf-text-secondary)]">Response Length (Max Tokens)</span>
                  <span className="text-blue-400 font-bold">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number.parseInt(e.target.value))}
                  className="w-full h-1 bg-[var(--fyf-border)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Section 3: Font Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--fyf-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Type size={12} className="text-blue-400" />
                Font Family
              </label>
              
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto scrollbar-thin">
                {[
                  { id: 'Inter', name: 'Inter', desc: 'Modern & Clean' },
                  { id: 'Roboto', name: 'Roboto', desc: 'Highly Readable' },
                  { id: 'Open Sans', name: 'Open Sans', desc: 'Humanist' },
                  { id: 'Poppins', name: 'Poppins', desc: 'Geometric' },
                  { id: 'Nunito', name: 'Nunito', desc: 'Friendly' },
                  { id: 'Montserrat', name: 'Montserrat', desc: 'Elegant' },
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
                      document.body.style.fontFamily = fontMap[font.id] || 'Inter, sans-serif'
                      if (onFontChange) {
                        onFontChange(font.id)
                      }
                    }}
                    className="p-2.5 rounded-xl border text-left transition-all duration-200"
                    style={{
                      background: fontFamily === font.id ? "rgba(37, 99, 255, 0.08)" : "transparent",
                      borderColor: fontFamily === font.id ? "rgba(37, 99, 255, 0.3)" : "var(--fyf-border)",
                    }}
                  >
                    <div className="text-xs font-bold text-[var(--fyf-text)]">{font.name}</div>
                    <div className="text-[10px] text-[var(--fyf-text-secondary)] mt-0.5">{font.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 4: Design Style Theme selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--fyf-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Palette size={12} className="text-blue-400" />
                Design Theme Style
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'basic', name: 'Premium Dark', desc: 'Sleek & minimal' },
                  { id: 'glass', name: 'Glassmorphism', desc: 'Frosted blur' },
                  { id: 'neobrutalism', name: 'Brutalist', desc: 'Hard borders' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setThemeStyle(style.id)}
                    className="p-2.5 rounded-xl border text-left transition-all duration-200"
                    style={{
                      background: themeStyle === style.id ? "rgba(37, 99, 255, 0.08)" : "transparent",
                      borderColor: themeStyle === style.id ? "rgba(37, 99, 255, 0.3)" : "var(--fyf-border)",
                    }}
                  >
                    <div className="text-xs font-bold text-[var(--fyf-text)]">{style.name}</div>
                    <div className="text-[9px] text-[var(--fyf-text-secondary)] mt-0.5 leading-snug">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advice notice */}
            <div className="flex items-start gap-2.5 p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-blue-400/90 leading-relaxed">
                Tip: Each AI Mode has optimized parameters by default. Saving these custom adjustments overrides defaults and saves them to your local preference database.
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
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

        </div>
      </div>
    </>
  )
}
