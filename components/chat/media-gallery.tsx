"use client"
import { X, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MediaItem {
  id: string
  type: "image" | "file"
  url: string
  name: string
  size: number
  uploadedAt: Date
}

interface MediaGalleryProps {
  media: MediaItem[]
  onDelete?: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export default function MediaGallery({ media, onDelete, isOpen, onClose }: MediaGalleryProps) {
  if (!isOpen) return null

  const handleDownload = (item: MediaItem) => {
    const link = document.createElement("a")
    link.href = item.url
    link.download = item.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-foreground">Media Gallery</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-all duration-200 hover:scale-110">
            <X size={20} />
          </button>
        </div>

        {media.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No media uploaded yet</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="border border-border rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition"
              >
                {item.type === "image" && (
                  <img src={item.url || "/placeholder.svg"} alt={item.name} className="w-full h-48 object-cover" />
                )}
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{(item.size / 1024 / 1024).toFixed(2)} MB</p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleDownload(item)} variant="outline" size="sm" className="flex-1">
                      <Download size={14} className="mr-1" />
                      Download
                    </Button>
                    <Button onClick={() => onDelete?.(item.id)} variant="destructive" size="sm">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
