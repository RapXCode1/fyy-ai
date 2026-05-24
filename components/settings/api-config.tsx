"use client"

import { useState } from "react"
import { Eye, EyeOff, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function APIConfig() {
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_APP_URL || "sk-xxxxxxxxxxxxxxxxxxxxx"

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers that don't support Clipboard API or when blocked
      console.warn('Clipboard API not available, using fallback method')
      const textArea = document.createElement('textarea')
      textArea.value = apiKey
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      textArea.style.top = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackError) {
        console.error('Fallback copy method also failed:', fallbackError)
        alert('Copy functionality is not available in this browser. Please copy manually.')
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">API Configuration</label>
        <p className="text-sm text-muted-foreground mb-4">Configure your AI API key and other settings</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">AI_API_KEY</label>
          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              readOnly
              className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
            />
            <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)} className="hover:bg-muted">
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopyKey} className="hover:bg-muted">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </Button>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-xs text-blue-300">
            Get your free API key from{" "}
            <a
              href="https://ai.google.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-blue-200"
            >
              Google AI Studio
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
