"use client"

import type React from "react"
import { Send, Paperclip, Zap, X, AlertCircle } from "lucide-react"
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
}

interface UploadedFile {
  file: File
  preview?: string
  id: string
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
  selectedModel,
  onShowQuickPrompts,
  onLiveModeToggle,
  onVoiceEnd,
  onRecordingStateChange,
  liveModeTrigger = 0,
  isLiveMode = false
}: ChatInputProps) {
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
    
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="px-3 max-w-4xl mx-auto space-y-3 pb-safe">
      
      {/* File Upload Dialog */}
      {showFileUpload && (
        <div className="animate-fade-up">
          <FileUpload onFileUpload={handleFileUpload} />
        </div>
      )}

      {/* Analysis Error */}
      {analysisError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5">
          <AlertCircle size={16} className="text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-red-400 font-semibold">File Analysis Error</p>
            <p className="text-[11px] text-red-400/80 mt-0.5">{analysisError}</p>
          </div>
        </div>
      )}

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <span>Attached Files ({uploadedFiles.length})</span>
              {isAnalyzing && (
                <span className="text-blue-400 animate-pulse flex items-center gap-1.5 font-normal">
                  <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                  Analyzing document...
                </span>
              )}
            </div>
            <button
              onClick={() => setUploadedFiles([])}
              className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((uf, index) => (
              <div key={uf.id} className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/5 text-xs text-gray-200">
                <span className="truncate max-w-[120px] font-medium">{uf.file.name}</span>
                <span className="text-[10px] text-gray-500">({(uf.file.size / 1024 / 1024).toFixed(1)}MB)</span>
                <button
                  onClick={() => removeFile(index)}
                  className="p-0.5 hover:bg-red-500/10 rounded-md transition-colors"
                >
                  <X size={10} className="text-gray-500 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main pill bar */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 flex items-end px-3 py-2 bg-[#0E1324] border border-white/5 rounded-2xl focus-within:border-blue-500/50 transition-all duration-300">
          
          {/* Inner Buttons */}
          <div className="flex items-center gap-1 mr-2 flex-shrink-0 mb-0.5">
            <Button
              variant="ghost"
              onClick={() => setShowFileUpload(!showFileUpload)}
              title="Upload files"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              onClick={onShowQuickPrompts}
              title="Quick suggestions"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg hidden sm:flex transition-colors items-center justify-center"
            >
              <Zap className="h-4 w-4 text-amber-500" />
            </Button>
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask FYY-AI anything..."
            className="flex-1 bg-transparent outline-none resize-none text-sm text-white placeholder-gray-500 leading-relaxed min-h-[24px] py-1 selection-enabled"
            rows={1}
            disabled={isLoading}
            maxLength={2000}
          />
        </div>

        {/* Voice button */}
        <VoiceInput 
          onTranscript={handleVoiceTranscript} 
          disabled={isLoading} 
          onLiveModeToggle={onLiveModeToggle} 
          onRecordingEnd={onVoiceEnd}
          onRecordingStateChange={onRecordingStateChange}
          liveModeTrigger={liveModeTrigger}
          isLiveMode={isLiveMode}
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={(!value.trim() && uploadedFiles.length === 0) || isLoading || isAnalyzing}
          className="fyf-btn-primary h-[40px] w-[40px] rounded-xl flex-shrink-0 flex items-center justify-center"
        >
          {isAnalyzing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

    </div>
  )
}
