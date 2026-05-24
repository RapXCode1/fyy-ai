"use client"

import { useState, useEffect } from "react"
import { X, Save, RotateCcw, Settings } from "lucide-react"
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
    // Load settings
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
      
      // Dispatch custom event to update theme immediately across all pages
      window.dispatchEvent(new CustomEvent("fyy-theme-change", { detail: themeStyle }))
      onSave(data.settings)
      // Auto-close panel after successful save
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
      {/* Backdrop */}
      <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

      {/* Centered Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[120] p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="theme-card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4 sm:p-6 flex-shrink-0">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Settings
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* System Prompt */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              System Prompt
              <p className="text-xs text-muted-foreground font-normal mt-1">
                Define how FYY-AI behaves and responds. Be creative! (Optional - modes have default prompts)
              </p>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-40 px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors resize-none"
              placeholder="Enter custom system prompt..."
            />
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Temperature: <span className="text-cyan-400">{temperature.toFixed(2)}</span>
              </label>
              <p className="text-xs text-muted-foreground">Creativity (0 = Precise, 2 = Creative)</p>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(Number.parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Max Tokens: <span className="text-cyan-400">{maxTokens}</span>
              </label>
              <p className="text-xs text-muted-foreground">Response length</p>
            </div>
            <input
              type="range"
              min="100"
              max="4000"
              step="100"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number.parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Top P */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Top P: <span className="text-cyan-400">{topP.toFixed(2)}</span>
              </label>
              <p className="text-xs text-muted-foreground">Diversity (0 = Focused, 1 = Diverse)</p>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={topP}
              onChange={(e) => setTopP(Number.parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Font Family */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Font Family
              </label>
              <p className="text-xs text-muted-foreground">Choose your preferred font</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
              {[
                { id: 'Inter', name: 'Inter', desc: 'Modern & Clean', style: 'font-inter' },
                { id: 'Roboto', name: 'Roboto', desc: 'Friendly & Readable', style: 'font-roboto' },
                { id: 'Open Sans', name: 'Open Sans', desc: 'Humanist & Warm', style: 'font-open-sans' },
                { id: 'Lato', name: 'Lato', desc: 'Balanced & Professional', style: 'font-lato' },
                { id: 'Poppins', name: 'Poppins', desc: 'Geometric & Modern', style: 'font-poppins' },
                { id: 'Nunito', name: 'Nunito', desc: 'Rounded & Friendly', style: 'font-nunito' },
                { id: 'Montserrat', name: 'Montserrat', desc: 'Narrow & Elegant', style: 'font-montserrat' },
                { id: 'Ubuntu', name: 'Ubuntu', desc: 'Ubuntu Style', style: 'font-ubuntu' },
                { id: 'Playfair Display', name: 'Playfair', desc: 'Serif & Classic', style: 'font-playfair' },
                { id: 'Merriweather', name: 'Merriweather', desc: 'Book-like & Readable', style: 'font-merriweather' },
              ].map((font) => (
                <button
                  key={font.id}
                  onClick={() => {
                    setFontFamily(font.id)
                    // Apply font immediately when changed
                    const fontMap: Record<string, string> = {
                      'Inter': 'Inter, sans-serif',
                      'Roboto': 'Roboto, sans-serif',
                      'Open Sans': 'Open Sans, sans-serif',
                      'Lato': 'Lato, sans-serif',
                      'Poppins': 'Poppins, sans-serif',
                      'Nunito': 'Nunito, sans-serif',
                      'Montserrat': 'Montserrat, sans-serif',
                      'Ubuntu': 'Ubuntu, sans-serif',
                      'Playfair Display': 'Playfair Display, serif',
                      'Merriweather': 'Merriweather, serif',
                    }
                    document.body.style.fontFamily = fontMap[font.id] || 'Inter, sans-serif'
                    if (onFontChange) {
                      onFontChange(font.id)
                    }
                  }}
                  className={`p-3 rounded-lg border text-left transition-all duration-200 hover:scale-105 ${
                    fontFamily === font.id
                      ? 'bg-primary/20 border-primary text-primary shadow-lg'
                      : 'bg-muted/50 border-border hover:bg-muted hover:border-primary/50'
                  }`}
                >
                  <div className="text-sm font-medium" style={{
                    fontFamily: font.id === 'Inter' ? 'Inter, sans-serif' :
                               font.id === 'Roboto' ? 'Roboto, sans-serif' :
                               font.id === 'Open Sans' ? '"Open Sans", sans-serif' :
                               font.id === 'Lato' ? 'Lato, sans-serif' :
                               font.id === 'Poppins' ? 'Poppins, sans-serif' :
                               font.id === 'Nunito' ? 'Nunito, sans-serif' :
                               font.id === 'Montserrat' ? 'Montserrat, sans-serif' :
                               font.id === 'Ubuntu' ? 'Ubuntu, sans-serif' :
                               font.id === 'Playfair Display' ? '"Playfair Display", serif' :
                               font.id === 'Merriweather' ? 'Merriweather, serif' :
                               'Inter, sans-serif'
                  }}>
                    {font.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {font.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Style */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Design Style
              </label>
              <p className="text-xs text-muted-foreground">Change the overall look & feel</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'basic', name: 'Default/Basic', desc: 'Clean, modern, and professional', icon: '📱' },
                { id: 'glass', name: 'Glassmorphism', desc: 'Translucent and futuristic with blur', icon: '✨' },
                { id: 'neobrutalism', name: 'Neobrutalism', desc: 'Bold borders and hard shadows', icon: '🎨' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setThemeStyle(style.id)}
                  className={`p-3 rounded-lg border text-left transition-all duration-200 flex items-center gap-3 ${
                    themeStyle === style.id
                      ? 'bg-primary/20 border-primary text-primary shadow-lg scale-[1.02]'
                      : 'bg-muted/50 border-border hover:bg-muted hover:border-primary/50'
                  }`}
                >
                  <span className="text-xl">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold">{style.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{style.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              Tip: Each AI Mode has optimized settings for its purpose. These custom settings override mode defaults
              when provided. Changes are saved locally and applied to new conversations.
            </p>
          </div>
        </div>

          {/* Footer */}
          <div className="border-t border-border p-4 sm:p-6 flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 bg-transparent border-border hover:bg-muted font-bold"
            >
              <RotateCcw size={16} className="mr-2" />
              Reset Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            >
              <Save size={16} className="mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
