"use client"

import { useState } from "react"
import { ImageIcon, Loader2, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageModel {
  id: string
  modelId: string
  name: string
  description: string
  recommended: boolean
}

interface ImageGeneratorProps {
  onClose?: () => void
  onGuestLimit?: (type: "image") => void
}

const imageModels: ImageModel[] = [
  {
    id: "flux",
    modelId: "flux",
    name: "FYY-FLUX.1 Schnell",
    description: "Generasi gambar artistik ultra-cepat dan beresolusi tinggi",
    recommended: true,
  },
  {
    id: "flux-realism",
    modelId: "flux-realism",
    name: "FYY-Realistic XL",
    description: "Generasi foto hiper-realistis dengan detail tekstur nyata",
    recommended: false,
  },
  {
    id: "flux-pro",
    modelId: "flux-pro",
    name: "FYY-FLUX Pro",
    description: "Generasi visual kualitas studio profesional presisi tinggi",
    recommended: false,
  },
  {
    id: "turbo",
    modelId: "turbo",
    name: "FYY-Turbo Diffusion",
    description: "Generasi visual kilat responsif untuk eksplorasi konsep",
    recommended: false,
  },
]

export default function ImageGenerator({ onClose, onGuestLimit }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState("flux")
  const [width, setWidth] = useState(512)
  const [height, setHeight] = useState(512)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt for Fyy-AI to generate")
      return
    }

    if (prompt.length < 3) {
      setError("Prompt must be at least 3 characters long")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)

    // Add loading message (for future use)

    try {
      console.log(`Generating image with Fyy-AI ${selectedModel} model: ${prompt.substring(0, 50)}...`)

      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          width,
          height,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // Handle specific error types
        if (response.status === 429) {
          throw new Error("Fyy-AI is busy right now. Please try again in a moment.")
        } else if (response.status === 503) {
          throw new Error("Fyy-AI service is temporarily unavailable. Please try again later.")
        } else if (response.status === 400) {
          throw new Error("Invalid prompt. Please try a different description.")
        } else {
          throw new Error(errorData.error || `Fyy-AI generation failed (HTTP ${response.status})`)
        }
      }

      // Check if response has fallback header
      const usedFallback = response.headers.get('X-Fallback-Used') === 'true'

      // Convert response to blob URL
      const blob = await response.blob()

      // Validate blob size (should be reasonable for an image)
      if (blob.size < 1000) {
        throw new Error("Fyy-AI generated an invalid image. Please try a different prompt.")
      }

      const imageUrl = URL.createObjectURL(blob)
      setGeneratedImage(imageUrl)

      // Show success message if fallback was used
      if (usedFallback) {
        console.log("✅ Image generated successfully using fallback model")
      }

    } catch (error) {
      console.error("Fyy-AI Image generation error:", error)

      let errorMessage = "Failed to generate image with Fyy-AI"

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return

    const link = document.createElement("a")
    link.href = generatedImage
    link.download = `fyy-ai-generated-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto h-full max-h-[90vh] flex flex-col" data-panel>
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Fyy-AI Image Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-y-auto min-h-0">
        {/* Model Selection - Compact Select Bar */}
        <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <Label htmlFor="model-select" className="text-xs font-bold uppercase tracking-wider text-[var(--fyf-text-secondary)]">Pilih Model Studio</Label>
          <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value)}>
            <SelectTrigger id="model-select" className="w-full h-11 px-3.5 bg-black/40 border-white/[0.08] rounded-xl text-xs text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto bg-[#121217] border-white/[0.08] text-white">
              {imageModels.map((model) => (
                <SelectItem key={model.id} value={model.id} className="py-2.5 px-3 focus:bg-rose-500/10 focus:text-white cursor-pointer">
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="font-semibold text-xs text-white">{model.name}</span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[180px] sm:max-w-[260px]">({model.description})</span>
                    {model.recommended && (
                      <span className="text-[9px] font-extrabold bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded ml-auto">PRO</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-xs font-bold uppercase tracking-wider text-[var(--fyf-text-secondary)]">Deskripsi Gambar (Prompt)</Label>
          <textarea
            id="prompt"
            placeholder="Contoh: Seekor naga emas terbang di atas pegunungan berkabut, pencahayaan sinematik..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-500 outline-none focus:border-rose-500/50 transition-colors resize-none leading-relaxed"
            disabled={isGenerating}
          />
        </div>

        {/* Size Settings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="width" className="text-xs font-bold uppercase tracking-wider text-[var(--fyf-text-secondary)]">Lebar</Label>
            <Select value={width.toString()} onValueChange={(value) => setWidth(Number(value))}>
              <SelectTrigger className="rounded-xl bg-black/40 border-white/[0.08] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="256">256px</SelectItem>
                <SelectItem value="512">512px</SelectItem>
                <SelectItem value="768">768px</SelectItem>
                <SelectItem value="1024">1024px</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="height" className="text-xs font-bold uppercase tracking-wider text-[var(--fyf-text-secondary)]">Tinggi</Label>
            <Select value={height.toString()} onValueChange={(value) => setHeight(Number(value))}>
              <SelectTrigger className="rounded-xl bg-black/40 border-white/[0.08] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="256">256px</SelectItem>
                <SelectItem value="512">512px</SelectItem>
                <SelectItem value="768">768px</SelectItem>
                <SelectItem value="1024">1024px</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || prompt.trim().length < 3}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating with Fyy-AI...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Generate with Fyy-AI
            </>
          )}
        </Button>

        {/* Generated Image */}
        {generatedImage && (
          <div className="space-y-4 flex-shrink-0">
            <div className="border rounded-lg overflow-hidden bg-muted/20">
              <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <img
                  src={generatedImage}
                  alt="Fyy-AI Generated Image"
                  className="w-full h-auto object-contain block"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleRegenerate} variant="outline" className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {/* Close Button */}
        {onClose && (
          <Button onClick={onClose} variant="ghost" className="w-full">
            Close Fyy-AI Image-Gen
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
