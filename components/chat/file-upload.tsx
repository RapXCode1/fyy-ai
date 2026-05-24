"use client"

import { Paperclip, File, X, Download } from "lucide-react"
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
      setUploadedFiles([...uploadedFiles, newFile])
      setUploadError("") // Clear any previous errors
      onFileUpload?.(file, preview)
    },
    onError: (error) => {
      setUploadError(error)
      // Auto-clear error after 5 seconds
      setTimeout(() => setUploadError(""), 5000)
    },
  })

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id))
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
    <div className="space-y-3 p-4 bg-card/50 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-foreground">Upload Files</label>
          <p className="text-xs text-muted-foreground">Images, PDFs, Documents (max 25MB)</p>
        </div>
        <Button
          onClick={triggerFileInput}
          disabled={isLoading}
          variant="ghost"
          size="sm"
          className="hover:bg-muted disabled:opacity-50"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          ) : (
            <Paperclip size={16} />
          )}
        </Button>
      </div>

      {/* Error Display */}
      {uploadError && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive font-medium">Upload Error</p>
          <p className="text-xs text-destructive/80 mt-1">{uploadError}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          files.forEach(file => handleFileChange(file))
          // Reset input
          e.target.value = ""
        }}
        className="hidden"
        accept="image/*,.pdf,.txt,.json,.doc,.docx"
      />

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground font-medium">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} uploaded
            </p>
            <button
              onClick={() => setUploadedFiles([])}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              title="Clear all files"
            >
              Clear all
            </button>
          </div>
          {uploadedFiles.map(({ file, preview, id }) => (
            <div key={id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition border border-border/50">
              {preview && file.type.startsWith("image/") ? (
                <img
                  src={preview || "/placeholder.svg"}
                  alt={file.name}
                  className="w-10 h-10 rounded object-cover flex-shrink-0 border border-border/30"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
                  <File size={16} className="text-cyan-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleDownloadFile(file)}
                  className="p-1.5 hover:bg-cyan-500/20 rounded transition"
                  title="Download file"
                >
                  <Download size={12} className="text-cyan-400" />
                </button>
                <button
                  onClick={() => handleRemoveFile(id)}
                  className="p-1.5 hover:bg-destructive/20 rounded transition"
                  title="Remove file"
                >
                  <X size={12} className="text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
