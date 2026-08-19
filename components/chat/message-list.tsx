"use client"

import { useEffect, useState, useRef } from "react"
import { Copy, Edit, RotateCcw, File, Check, Sparkles, User, Bot } from "lucide-react"
import SpeechOutput from "./speech-output"
import TextFormatter from "./text-formatter"
import { motion, AnimatePresence } from "framer-motion"

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

export default function MessageList({
  messages,
  isLoading,
  conversationTitle,
  onEditMessage,
  onRegenerateMessage
}: MessageListProps) {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, isLoading])

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

  const handleCopy = async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error("Failed to copy text:", error)
    }
  }

  return (
    <div
      ref={listRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin selection-enabled"
    >
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          if (message.role === "assistant" && !message.content && (!message.attachments || message.attachments.length === 0)) {
            return null
          }

          const isUser = message.role === "user"

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`flex items-start gap-3.5 group ${isUser ? "justify-end" : "justify-start"}`}
            >
              {/* Assistant Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-[var(--fyf-surface)] border border-[var(--fyf-border)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} className="text-rose-400" />
                </div>
              )}

              {/* Message Bubble Container */}
              <div className="flex flex-col max-w-[85%] sm:max-w-[75%] space-y-1.5 relative">
                
                {/* Editing State */}
                {editingMessage === message.id ? (
                  <div className="bg-[var(--fyf-surface)] border border-[var(--fyf-border)] rounded-2xl p-3 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-[var(--fyf-card)] border border-[var(--fyf-border)] rounded-xl p-2.5 resize-none text-[var(--fyf-text)] outline-none focus:border-red-500"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleCancelEdit}
                        className="px-2.5 py-1 text-[10px] sm:text-xs bg-[var(--fyf-border)] text-[var(--fyf-text-secondary)] hover:text-[var(--fyf-text)] rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-2.5 py-1 text-[10px] sm:text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Chat Bubble */
                  <div
                    onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                    className={`px-4 py-3 text-sm leading-relaxed border transition-all duration-200 select-text ${
                      isUser
                        ? "bg-[var(--fyf-blue)] border-transparent text-white rounded-2xl rounded-tr-sm"
                        : "bg-[var(--fyf-surface)] border-[var(--fyf-border)] text-[var(--fyf-text)] rounded-2xl rounded-tl-sm hover:border-[var(--fyf-border-hover)]"
                    }`}
                  >
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="space-y-2 mb-2 max-w-full">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="rounded-xl overflow-hidden border border-[var(--fyf-border)] bg-[var(--fyf-card)]">
                            {attachment.type.startsWith("image/") && attachment.url ? (
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="w-full h-auto max-h-72 object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <div className="p-3 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                  <File size={15} className="text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-[var(--fyf-text)] truncate">{attachment.name}</p>
                                  <p className="text-[10px] text-[var(--fyf-text-secondary)]">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Markdown rendering */}
                    {message.content && (
                      <div className="text-[13px] sm:text-[14px]">
                        <TextFormatter content={message.content} />
                      </div>
                    )}
                  </div>
                )}

                {/* Subtitle / Timestamp & inline action links */}
                <div className="flex items-center gap-3 px-1 text-[10px] text-gray-500">
                  <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  
                  {/* Actions toolbar */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="hover:text-[var(--fyf-text)] flex items-center gap-0.5"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check size={10} className="text-green-400" />
                          <span className="text-green-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={10} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {isUser ? (
                      <button
                        onClick={() => handleEdit(message.id, message.content)}
                        className="hover:text-[var(--fyf-text)] flex items-center gap-0.5"
                      >
                        <Edit size={10} />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegenerate(message.id)}
                        className="hover:text-[var(--fyf-text)] flex items-center gap-0.5"
                      >
                        <RotateCcw size={10} />
                        <span>Regenerate</span>
                      </button>
                    )}

                    {!isUser && (
                      <div className="hover:text-[var(--fyf-text)]">
                        <SpeechOutput text={message.content} />
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-red-500/20">
                  <User size={14} className="text-white" />
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Typing Indicator / Shimmer */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3.5"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--fyf-surface)] border border-[var(--fyf-border)] flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-rose-400 animate-pulse" />
          </div>
          
          <div className="px-4 py-3 bg-[var(--fyf-surface)] border border-[var(--fyf-border)] rounded-2xl rounded-tl-sm flex flex-col gap-2 min-w-[120px] max-w-[60%] w-full overflow-hidden relative">
            <div className="absolute inset-0 fyf-shimmer opacity-50"></div>
            <div className="h-3 w-3/4 bg-[var(--fyf-border)] rounded-full"></div>
            <div className="h-3 w-1/2 bg-[var(--fyf-border)] rounded-full"></div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
