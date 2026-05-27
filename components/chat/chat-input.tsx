"use client"

import type React from "react"
import { Send, Paperclip, Zap, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import VoiceInput from "./voice-input"
import FileUpload from "./file-upload"
import { useState, useRef, useEffect } from "react"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string, attachments?: Array<{type: string, url?: string, name: string, size: number}>) => void
  isLoading: boolean
  selectedModel: string
  onShowQuickPrompts?: () => void
  onLiveModeToggle?: (isActive: boolean) => void
  onVoiceEnd?: () => void
  onRecordingStateChange?: (isRecording: boolean) => void
  liveModeTrigger?: number
  isLiveMode?: boolean
  isSpeaking?: boolean
}

interface UploadedFile {
  file: File
  preview?: string
  id: string
}

export default function ChatInput({ value, onChange, onSend, isLoading, selectedModel, onShowQuickPrompts, onLiveModeToggle, onVoiceEnd, onRecordingStateChange, liveModeTrigger = 0, isLiveMode = false, isSpeaking = false }: ChatInputProps) {
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string>("")
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Dynamic textarea height calculation (max 3 lines)
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const singleLineHeight = 24
      const maxLines = 3
      const maxHeight = singleLineHeight * maxLines

      if (textarea.scrollHeight <= maxHeight + 6) {
        textarea.style.height = `${textarea.scrollHeight}px`
        textarea.style.overflowY = "hidden"
      } else {
        textarea.style.height = `${maxHeight}px`
        textarea.style.overflowY = "auto"
      }
    }
  }, [value])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceTranscript = (text: string) => {
    onChange(value + (value ? " " : "") + text)
  }

  const handleFileUpload = async (file: File, preview?: string) => {
    const uploadedFile: UploadedFile = {
      file,
      preview,
      id: Date.now().toString(),
    }
    setUploadedFiles(prev => [...prev, uploadedFile])
    setIsAnalyzing(true)
    setAnalysisError("")

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/analyze/document', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log(`File analyzed: ${file.name} - ${data.analysis.summary}`)
      } else {
        console.log(`File uploaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      }
    } catch (error) {
      console.error('File analysis error:', error)
      const errorMsg = error instanceof Error ? error.message : "File analysis failed"
      setAnalysisError(errorMsg)

      setTimeout(() => setAnalysisError(""), 5000)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSend = () => {
    if (!value.trim() && uploadedFiles.length === 0) return

    const attachments = uploadedFiles.map(uploadedFile => ({
      type: uploadedFile.file.type,
      url: uploadedFile.preview,
      name: uploadedFile.file.name,
      size: uploadedFile.file.size
    }))

    onSend(value, attachments.length > 0 ? attachments : undefined)

    if (uploadedFiles.length > 0) {
      setUploadedFiles([])
      setShowFileUpload(false)
      setAnalysisError("")
    }
    
    // Auto-focus back on textarea after sending
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="px-1 sm:px-2 max-w-6xl mx-auto space-y-2">
      {showFileUpload && (
        <div className="pt-2">
          <FileUpload onFileUpload={handleFileUpload} />
        </div>
      )}

      {/* Analysis Error */}
      {analysisError && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive font-medium">File Analysis Error</p>
          <p className="text-xs text-destructive/80 mt-1">{analysisError}</p>
        </div>
      )}

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>📎 Files attached ({uploadedFiles.length})</span>
              {isAnalyzing && (
                <span className="text-cyan-400 animate-pulse flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                  Analyzing...
                </span>
              )}
            </div>
            <button
              onClick={() => setUploadedFiles([])}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              title="Clear all files"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={uploadedFile.id} className="flex items-center gap-2 px-3 py-1 bg-background rounded-lg border border-border/50 text-sm">
                <span className="truncate max-w-32">{uploadedFile.file.name}</span>
                <span className="text-xs text-muted-foreground">({(uploadedFile.file.size / 1024 / 1024).toFixed(1)}MB)</span>
                <button
                  onClick={() => removeFile(index)}
                  className="p-0.5 hover:bg-destructive/20 rounded transition-colors"
                  title="Remove file"
                >
                  <X size={12} className="text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 items-end justify-center">
        {/* Slightly larger, more premium container with items-end alignment */}
        <div className="flex-1 flex items-end theme-input px-3 sm:px-4 py-2 sm:py-3 focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-cyan-400/20 transition-all duration-500 ease-out hover:shadow-lg hover:shadow-cyan-500/5">
          {/* Input buttons inside the text area - perfectly proportioned */}
          <div className="flex items-center gap-1.5 sm:gap-2 mr-2 sm:mr-3 flex-shrink-0 mb-[1px] sm:mb-[3px]">
            <Button
              variant="ghost"
              onClick={() => setShowFileUpload(!showFileUpload)}
              title="Upload files"
              className="h-[32px] w-[32px] sm:h-[38px] sm:w-[38px] p-0 hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-center"
            >
              <Paperclip className="h-[16px] w-[16px] sm:h-[18px] sm:w-[18px]" />
            </Button>
            <Button
              variant="ghost"
              onClick={onShowQuickPrompts}
              title="Quick prompt suggestion"
              className="h-[32px] w-[32px] sm:h-[38px] sm:w-[38px] p-0 hover:bg-muted/80 rounded-lg hidden sm:flex transition-colors items-center justify-center"
            >
              <Zap className="h-[16px] w-[16px] sm:h-[18px] sm:w-[18px] text-amber-500" />
            </Button>
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask FYY-AI anything..."
            className="flex-1 bg-transparent outline-none resize-none text-foreground placeholder-muted-foreground transition-all duration-200 ease-out focus:placeholder-cyan-400/80 leading-relaxed min-h-[24px] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent py-1 sm:py-1.5"
            rows={1}
            disabled={isLoading}
            maxLength={2000}
          />
        </div>
        <VoiceInput 
          onTranscript={handleVoiceTranscript} 
          disabled={isLoading || isSpeaking} 
          onLiveModeToggle={onLiveModeToggle} 
          onRecordingEnd={onVoiceEnd}
          onRecordingStateChange={onRecordingStateChange}
          liveModeTrigger={liveModeTrigger}
          isLiveMode={isLiveMode}
        />
        <Button
          onClick={handleSend}
          disabled={(!value.trim() && uploadedFiles.length === 0) || isLoading || isAnalyzing}
          className="bg-primary text-primary-foreground h-[40px] w-[40px] sm:h-[48px] sm:w-[48px] rounded-lg transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed group flex-shrink-0 flex items-center justify-center"
        >
          {isAnalyzing ? (
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
          )}
        </Button>
      </div>
    </div>
  )
}
