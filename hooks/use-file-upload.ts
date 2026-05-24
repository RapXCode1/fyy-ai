import { useState, useRef } from "react"

interface UseFileUploadOptions {
  maxSize?: number
  acceptedTypes?: string[]
  onSuccess?: (file: File, preview?: string) => void
  onError?: (error: string) => void
}

export function useFileUpload({ maxSize = 5 * 1024 * 1024, acceptedTypes = [], onSuccess, onError }: UseFileUploadOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (file: File) => {
    setIsLoading(true)

    // Check size
    if (file.size > maxSize) {
      onError?.(`File size exceeds ${(maxSize / (1024 * 1024)).toFixed(2)}MB limit`)
      setIsLoading(false)
      return
    }

    // Check type if acceptedTypes is provided and not empty
    if (acceptedTypes.length > 0) {
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', ''))
        }
        return file.type === type || file.name.endsWith(type)
      })

      if (!isAccepted) {
        onError?.("File type not accepted")
        setIsLoading(false)
        return
      }
    }

    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        onSuccess?.(file, e.target?.result as string)
        setIsLoading(false)
      }
      reader.onerror = () => {
        onError?.("Failed to read image file")
        setIsLoading(false)
      }
      reader.readAsDataURL(file)
    } else {
      onSuccess?.(file)
      setIsLoading(false)
    }
  }

  return {
    fileInputRef,
    isLoading,
    handleFileChange,
    triggerFileInput,
  }
}
