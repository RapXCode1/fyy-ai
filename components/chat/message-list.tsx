"use client"

import { useEffect, useState, useRef } from "react"
import { Copy, Download, Edit, RotateCcw, File } from "lucide-react"
import SpeechOutput from "./speech-output"
import TextFormatter from "./text-formatter"
import { Button } from "@/components/ui/button"
import { ZuuupEntry } from "../animations/framer-animations"
import { AnimatePresence, motion } from "framer-motion"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  attachments?: Array<{
    type: string
    url?: string
    name: string
    size: number
  }>
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  conversationTitle: string
  onEditMessage: (messageId: string, newContent: string) => void
  onRegenerateMessage: (messageId: string) => void
}

export default function MessageList({ messages, isLoading, conversationTitle, onEditMessage, onRegenerateMessage }: MessageListProps) {
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(new Set())
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null)

  // Simplified scroll management
  const listRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])


  const handleEdit = (messageId: string, content: string) => {
    setEditingMessage(messageId)
    setEditContent(content)
  }

  const handleSaveEdit = () => {
    if (editingMessage && onEditMessage) {
      onEditMessage(editingMessage, editContent)
      setEditingMessage(null)
      setEditContent("")
    }
  }

  const handleCancelEdit = () => {
    setEditingMessage(null)
    setEditContent("")
  }

  const handleRegenerate = (messageId: string) => {
    if (onRegenerateMessage) {
      onRegenerateMessage(messageId)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Optional: Show success feedback
    } catch (error) {
      console.error('Failed to copy text:', error)
      // Fallback for older browsers or when Clipboard API is blocked
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      textArea.style.top = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError)
        alert('Copy functionality is not available in this browser. Please copy manually.')
      }
      document.body.removeChild(textArea)
    }
  }

  const handleExportAsJSON = () => {
    const data = {
      title: conversationTitle || "Conversation",
      timestamp: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      })),
    }

    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `conversation-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportAsMarkdown = () => {
    let markdown = `# ${conversationTitle || "Conversation"}\n\n`
    markdown += `_Exported on ${new Date().toLocaleString()}_\n\n---\n\n`

    messages.forEach((msg) => {
      markdown += `### ${msg.role === "user" ? "You" : "FYY-AI"}\n\n`
      markdown += `${msg.content}\n\n`
      markdown += `---\n\n`
    })

    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `conversation-${Date.now()}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportAsText = () => {
    let text = `${conversationTitle || "Conversation"}\n`
    text += `Exported on ${new Date().toLocaleString()}\n`
    text += `${"=".repeat(50)}\n\n`

    messages.forEach((msg) => {
      text += `${msg.role === "user" ? "YOU" : "FYY-AI"}:\n`
      text += `${msg.content}\n\n`
    })

    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `conversation-${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Check if message is long (for future use)
  // const isLongMessage = (content: string) => {
  //   return content.length > 200 || content.split('\n').length > 3
  // }


  // Handle long press start
  const handleLongPressStart = (messageId: string) => {
    const timer = setTimeout(() => {
      setSelectedMessage(messageId)
    }, 500) as unknown as number // 500ms for long press
    setLongPressTimer(timer)
  }

  // Handle long press end
  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // Handle double click
  const handleDoubleClick = (messageId: string) => {
    setSelectedMessage(messageId)
  }

  // Handle click outside to close buttons
  const handleClickOutside = (event: React.MouseEvent) => {
    if (!(event.target as Element).closest('.message-actions')) {
      setSelectedMessage(null)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 overflow-x-hidden" onClick={handleClickOutside}>
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          // Skip empty assistant messages (usually during initial loading/streaming)
          if (message.role === "assistant" && !message.content && (!message.attachments || message.attachments.length === 0)) {
            return null
          }
          
          return (
            <ZuuupEntry key={message.id} side={message.role === "user" ? "right" : "left"} className="w-full relative overflow-visible">
              <div
                className={`flex gap-3 sm:gap-4 cursor-pointer select-none ${message.role === "user" ? "justify-end" : "justify-start"}`}
                onTouchStart={() => handleLongPressStart(message.id)}
              onTouchEnd={handleLongPressEnd}
              onDoubleClick={() => handleDoubleClick(message.id)}
              onMouseDown={() => handleLongPressStart(message.id)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
            >
              {message.role === "assistant" && (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 flex-shrink-0 flex items-center justify-center transition-all duration-300 animate-bounce-in ${
                  selectedMessage === message.id ? "scale-110 ring-2 ring-cyan-400/50" : ""
                }`}>
                  <span className="text-xs font-bold text-cyan-400">AI</span>
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] message-bubble px-5 py-4 shadow-sm ${
                  message.role === 'user' 
                    ? 'user bg-primary text-primary-foreground ml-4 rounded-2xl rounded-tr-sm' 
                    : 'assistant bg-card text-foreground mr-4 rounded-2xl rounded-tl-sm'
                }`}
              >
                {editingMessage === message.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 text-sm bg-background border border-border rounded resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-all duration-200"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded transition-all duration-200"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Display attachments/images */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="space-y-2">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="rounded-lg overflow-hidden border border-border/50">
                            {attachment.type.startsWith('image/') && attachment.url ? (
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="w-full h-auto max-h-96 object-contain bg-muted/20"
                                loading="lazy"
                              />
                            ) : (
                              <div className="p-4 bg-muted/20 flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
                                  <File size={16} className="text-cyan-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{attachment.name}</p>
                                  <p className="text-xs text-muted-foreground">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
  
                    {/* Message content */}
                    {message.content && (
                      <div className="text-sm leading-relaxed break-words selection-enabled">
                        <TextFormatter content={message.content} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                  selectedMessage === message.id ? "animate-bounce-in scale-110 ring-2 ring-purple-400/50" : ""
                }`}>
                  <span className="text-xs font-bold text-white">You</span>
                </div>
              )}
            </div>

            {/* Action Buttons - Show below message on long press/double click */}
            {selectedMessage === message.id && (
              <div className="w-full flex justify-center items-center mt-3 px-4 message-actions" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2 p-2 bg-background/95 backdrop-blur-sm rounded-full border border-border/50 shadow-lg transition-all duration-300 animate-fade-in">
                  {message.role === "assistant" ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(message.content)
                          setSelectedMessage(null) // Close after action
                        }}
                        className="p-2 hover:bg-muted rounded-full transition-all duration-200 hover:scale-110 hover:rotate-12"
                        title="Salin chat"
                      >
                        <Copy size={14} className="text-muted-foreground hover:text-cyan-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRegenerate(message.id)
                          setSelectedMessage(null) // Close after action
                        }}
                        className="p-2 hover:bg-muted rounded-full transition-all duration-200 hover:scale-110 hover:rotate-12"
                        title="Ulangi chat"
                      >
                        <RotateCcw size={14} className="text-muted-foreground hover:text-purple-400" />
                      </button>
                      <div onClick={(e) => e.stopPropagation()}>
                        <SpeechOutput text={message.content} />
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(message.content)
                          setSelectedMessage(null) // Close after action
                        }}
                        className="p-2 hover:bg-muted rounded-full transition-all duration-200 hover:scale-110 hover:rotate-12"
                        title="Salin chat"
                      >
                        <Copy size={14} className="text-muted-foreground hover:text-cyan-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(message.id, message.content)
                          setSelectedMessage(null) // Close after action
                        }}
                        className="p-2 hover:bg-muted rounded-full transition-all duration-200 hover:scale-110 hover:rotate-12"
                        title="Edit chat"
                      >
                        <Edit size={14} className="text-muted-foreground hover:text-green-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRegenerate(message.id)
                          setSelectedMessage(null) // Close after action
                        }}
                        className="p-2 hover:bg-muted rounded-full transition-all duration-200 hover:scale-110 hover:rotate-12"
                        title="Ulangi chat"
                      >
                        <RotateCcw size={14} className="text-muted-foreground hover:text-orange-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </ZuuupEntry>
        )
      })}
      </AnimatePresence>

      {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 flex-shrink-0 flex items-center justify-center">
            <motion.span 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs font-bold text-cyan-400"
            >
              AI
            </motion.span>
          </div>
          <div className="max-w-[85vw] sm:max-w-xs md:max-w-md lg:max-w-2xl px-5 py-4 rounded-xl bg-muted/80 border border-border/50 backdrop-blur-sm shadow-lg overflow-hidden relative">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <div className="flex items-center gap-2 relative z-10">
              <div className="flex gap-1">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay }}
                    className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 shadow-sm"
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-medium ml-1">Thinking...</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
