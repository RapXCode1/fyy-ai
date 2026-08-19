"use client"

import { Paperclip, File, X, Download, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useState } from "react"

interface FileUploadProps {
  onFileUpload?: (file: File, preview?: string) => void
}

interface UploadedFile {
  file: File
  preview?: string
  id: string
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadError, setUploadError] = useState<string>("")
  
  const { fileInputRef, isLoading, handleFileChange, triggerFileInput } = useFileUpload({
    maxSize: 50 * 1024 * 1024,
    acceptedTypes: ["image/*", "application/pdf", "text/*", "application/json"],
    onSuccess: (file, preview) => {
      const newFile = {
        file,
        preview,
        id: Date.now().toString(),
      }
      setUploadedFiles(prev => [...prev, newFile])
      setUploadError("")
      onFileUpload?.(file, preview)
    },
    onError: (error) => {
      setUploadError(error)
      setTimeout(() => setUploadError(""), 5000)
    },
  })

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter((f) => f.id !== id))
  }

  const handleDownloadFile = (file: File) => {
    const url = URL.createObjectURL(file)
    const link = document.createElement("a")
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 bg-[var(--fyf-surface)] rounded-2xl border border-[var(--fyf-border)] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-[var(--fyf-text)] uppercase tracking-wider">Attachment Hub</label>
          <p className="text-[10px] text-gray-500 mt-0.5">Images, PDFs, JSON or TXT documents (Max 50MB)</p>
        </div>
        
        <Button
          onClick={triggerFileInput}
          disabled={isLoading}
          variant="ghost"
          className="h-8 px-3 text-xs bg-[var(--fyf-border)] hover:bg-[var(--fyf-border-hover)] text-[var(--fyf-text)] rounded-xl flex items-center gap-1.5 transition-colors"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-3 w-3 border border-[var(--fyf-text)] border-t-transparent" />
          ) : (
            <>
              <Paperclip size={12} />
              <span>Select File</span>
            </>
          )}
        </Button>
      </div>

      {/* Error Info */}
      {uploadError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
          <AlertCircle size={14} className="text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-red-400 font-semibold">Upload Error</p>
            <p className="text-[10px] text-red-400/80 mt-0.5">{uploadError}</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          files.forEach(file => handleFileChange(file))
          e.target.value = ""
        }}
        className="hidden"
        accept="image/*,.pdf,.txt,.json,.doc,.docx"
      />

      {/* Uploaded items container */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 border-t border-[var(--fyf-border)] pt-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              Uploaded Items ({uploadedFiles.length})
            </p>
            <button
              onClick={() => setUploadedFiles([])}
              className="text-[10px] text-gray-500 hover:text-rose-400 transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {uploadedFiles.map(({ file, preview, id }) => (
              <div
                key={id}
                className="flex items-center gap-3 p-2.5 bg-[var(--fyf-card)] rounded-xl border border-[var(--fyf-border)] hover:border-[var(--fyf-border-hover)] transition-all"
              >
                {preview && file.type.startsWith("image/") ? (
                  <img
                    src={preview}
                    alt={file.name}
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-[var(--fyf-border)]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                    <File size={13} className="text-rose-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--fyf-text)] truncate">{file.name}</p>
                  <p className="text-[9px] text-[var(--fyf-text-secondary)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownloadFile(file)}
                    className="p-1.5 hover:bg-[var(--fyf-border)] text-gray-400 hover:text-rose-400 rounded-lg transition-colors"
                    title="Download item"
                  >
                    <Download size={12} />
                  </button>
                  <button
                    onClick={() => handleRemoveFile(id)}
                    className="p-1.5 hover:bg-[var(--fyf-border)] text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
