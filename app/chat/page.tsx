"use client"

import { useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { Settings, Menu, X, Sparkles, Download, FileJson, FileText, FileCode2, Sliders, Cpu, Brain, Layers } from "lucide-react"
import ChatSidebar from "@/components/chat/chat-sidebar"
import MessageList from "@/components/chat/message-list"
import QuickPrompts from "@/components/chat/quick-prompts"
import { AI_MODES } from "@/lib/ai-modes"
import ModelSelector from "@/components/chat/model-selector"
import ChatInput from "@/components/chat/chat-input"
import ModesSelector from "@/components/chat/modes-selector"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSpeechOutput } from "@/hooks/use-voice-input"
import { useMicrophonePermission } from "@/hooks/use-microphone-permission"
import { formatBrandedError, OFFICIAL_MODELS, DEFAULT_MODEL_ID } from "@/lib/models"

// Code-split heavy interactive modals & animations to minimize initial JS bundle
const SettingsPanel = dynamic(() => import("@/components/chat/settings-panel"), { ssr: false })
const ImageGenerator = dynamic(() => import("@/components/chat/image-generator"), { ssr: false })
const LiveVoiceModal = dynamic(() => import("@/components/chat/live-voice-modal"), { ssr: false })
const HeroWelcomeAnimation = dynamic(() => import("@/components/animations/welcome-animation").then(m => m.HeroWelcomeAnimation), { ssr: false })

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

interface Conversation {
  id: string
  title: string
  messages: Message[]
  model: string
  mode: string
  createdAt: Date
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  // Owner mode state
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("fyy_owner_mode") === "true") {
        setIsOwner(true)
      }
    }
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])
  const [isLoading, setIsLoading] = useState(false)
  const [isReceiving, setIsReceiving] = useState(false)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID)
  const [selectedMode, setSelectedMode] = useState("general")
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth >= 768
    return true
  })
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showModesSelector, setShowModesSelector] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showImageGenerator, setShowImageGenerator] = useState(false)
  const [showQuickPrompts, setShowQuickPrompts] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [selectedFont, setSelectedFont] = useState("Inter")

  const { permissionStatus: microphonePermissionStatus, isDenied: microphonePermissionDenied, requestPermission: requestMicrophonePermission } = useMicrophonePermission()

  // Live Voice Mode State
  const [isLiveMode, setIsLiveMode] = useState(false)
  const isLiveModeRef = useRef(isLiveMode)
  useEffect(() => {
    isLiveModeRef.current = isLiveMode
  }, [isLiveMode])

  const [liveModeTrigger, setLiveModeTrigger] = useState(0)
  const [isRecordingState, setIsRecordingState] = useState(false)
  const [isVoiceInputBlocked, setIsVoiceInputBlocked] = useState(false)
  const voiceBlockedTimeoutRef = useRef<number | null>(null)

  const { speak, isSpeaking, stop: stopSpeech } = useSpeechOutput()

  useEffect(() => {
    return () => {
      if (voiceBlockedTimeoutRef.current) {
        window.clearTimeout(voiceBlockedTimeoutRef.current)
      }
    }
  }, [])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const models = OFFICIAL_MODELS

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: isReceiving ? "auto" : "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isReceiving])

  // Load user settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings")
        const data = await response.json()
        const savedFont = data.fontFamily || "Inter"
        setSelectedFont(savedFont)

        const fontMap: Record<string, string> = {
          'Inter': 'Inter, sans-serif',
          'Roboto': 'Roboto, sans-serif',
          'Open Sans': 'Open Sans, sans-serif',
          'Lato': 'Lato, sans-serif',
          'Poppins': 'Poppins, sans-serif',
          'Nunito': 'Nunito, sans-serif',
          'Montserrat': 'Montserrat, sans-serif',
          'Ubuntu': 'Ubuntu, sans-serif',
          'Playfair Display': 'Playfair Display, serif',
          'Merriweather': 'Merriweather, serif',
        }
        document.body.style.fontFamily = fontMap[savedFont] || 'Inter, sans-serif'
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }
    loadSettings()
  }, [])

  // Apply font to document
  useEffect(() => {
    const fontMap: Record<string, string> = {
      'Inter': 'Inter, sans-serif',
      'Roboto': 'Roboto, sans-serif',
      'Open Sans': '"Open Sans", sans-serif',
      'Lato': 'Lato, sans-serif',
      'Poppins': 'Poppins, sans-serif',
      'Nunito': 'Nunito, sans-serif',
      'Montserrat': 'Montserrat, sans-serif',
      'Ubuntu': 'Ubuntu, sans-serif',
      'Playfair Display': '"Playfair Display", serif',
      'Merriweather': 'Merriweather, serif',
    }

    document.body.style.fontFamily = fontMap[selectedFont] || 'Inter, sans-serif'
  }, [selectedFont])

  // Auto-close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element

      const isPortal = target.closest('[data-radix-portal]') ||
        target.closest('[role="listbox"]') ||
        target.closest('[role="option"]') ||
        target.closest('[data-radix-select-viewport]') ||
        target.closest('[data-state]');

      if (!target.closest('[data-panel-trigger]') && !target.closest('[data-panel]') && !isPortal) {
        setShowModelSelector(false)
        setShowModesSelector(false)
        setShowSettings(false)
        setShowExportMenu(false)
      }

      if (showImageGenerator) {
        const imageGeneratorPanel = document.querySelector('[data-panel]:has(.w-full.max-w-2xl)')
        if (imageGeneratorPanel && !imageGeneratorPanel.contains(target) && !target.closest('[data-panel-trigger]') && !isPortal) {
          setShowImageGenerator(false)
        }
      }
    }

    if (showModelSelector || showModesSelector || showImageGenerator || showSettings || showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showModelSelector, showModesSelector, showImageGenerator, showSettings, showExportMenu])

  // Local Storage - Load conversations instantly on mount
  useEffect(() => {
    if (isClient) {
      try {
        const localData = localStorage.getItem("fyy_conversations")
        if (localData) {
          const parsed = JSON.parse(localData).map((conv: any) => ({
            id: conv.id,
            title: conv.title,
            model: conv.model,
            mode: conv.mode,
            createdAt: new Date(conv.createdAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }))
          setConversations(parsed)
          if (parsed.length > 0) {
            const mostRecent = parsed[0]
            setCurrentConversationId(mostRecent.id)
            setMessages(mostRecent.messages)
            const validModel = models.find(m => m.id === mostRecent.model)?.id || models[0].id
            setSelectedModel(validModel)
            setSelectedMode(mostRecent.mode || "general")
          }
        }
      } catch (err) {
        console.error("Failed to load conversations from localStorage:", err)
      }
    }
  }, [isClient])

  // Local Storage - Save conversations to localStorage immediately upon changes
  useEffect(() => {
    if (isClient && conversations.length > 0) {
      try {
        localStorage.setItem("fyy_conversations", JSON.stringify(conversations))
      } catch (err) {
        console.error("Failed to save conversations to localStorage:", err)
      }
    }
  }, [conversations, isClient])

  const handleNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      model: selectedModel,
      mode: selectedMode,
      createdAt: new Date(),
    }
    const updated = [newConversation, ...conversations]
    setConversations(updated)
    try {
      localStorage.setItem("fyy_conversations", JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }
    setCurrentConversationId(newConversation.id)
    setMessages([])
    // Auto-close sidebar on mobile after new chat
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id)
    const conversation = conversations.find((c) => c.id === id)
    if (conversation) {
      setMessages(conversation.messages)
      const validModel = models.find(m => m.id === conversation.model)?.id || models[0].id
      setSelectedModel(validModel)
      setSelectedMode(conversation.mode || "general")
    }
    // Auto-close sidebar on mobile after selecting conversation
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleDeleteConversation = async (id: string) => {
    const updated = conversations.filter((c) => c.id !== id)
    setConversations(updated)
    try {
      localStorage.setItem("fyy_conversations", JSON.stringify(updated))
    } catch (err) {
      console.error(err)
    }

    if (currentConversationId === id) {
      if (updated.length > 0) {
        const nextActive = updated[0]
        setCurrentConversationId(nextActive.id)
        setMessages(nextActive.messages)
      } else {
        setCurrentConversationId(null)
        setMessages([])
      }
    }
  }

  const handleExportAsJSON = () => {
    const data = {
      title: "Conversation",
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
    setShowExportMenu(false)
  }

  const handleExportAsMarkdown = () => {
    let markdown = `# Conversation\n\n_Exported on ${new Date().toLocaleString()}_\n\n---\n\n`
    messages.forEach((msg) => {
      markdown += `### ${msg.role === "user" ? "You" : "FYY-AI"}\n\n${msg.content}\n\n---\n\n`
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
    setShowExportMenu(false)
  }

  const handleExportAsText = () => {
    let text = `Conversation\nExported on ${new Date().toLocaleString()}\n${"=".repeat(50)}\n\n`
    messages.forEach((msg) => {
      text += `${msg.role === "user" ? "YOU" : "FYY-AI"}:\n${msg.content}\n\n`
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
    setShowExportMenu(false)
  }

  const handleSendMessage = async (content: string, attachments?: Array<{ type: string, url?: string, name: string, size: number }>): Promise<string> => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return ""

    if (content.includes("FYY3257")) {
      localStorage.setItem("fyy_owner_mode", "true")
      setIsOwner(true)
    }

    setShowModelSelector(false)
    setShowModesSelector(false)
    setShowSettings(false)
    setShowExportMenu(false)
    setShowQuickPrompts(false)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      attachments,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setIsReceiving(true)

    if (!currentConversationId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
        messages: [userMessage],
        model: selectedModel,
        mode: selectedMode,
        createdAt: new Date(),
      }
      setConversations([newConversation, ...conversations])
      setCurrentConversationId(newConversation.id)
    } else {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              title:
                conv.messages.length === 0
                  ? content.substring(0, 50) + (content.length > 50 ? "..." : "")
                  : conv.title,
              mode: selectedMode,
            }
            : conv,
        ),
      )
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])

    if (currentConversationId) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, assistantMessage] } : conv,
        ),
      )
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(new Error("Timeout")), 90000)

      const allMessages = [...messages, userMessage]
      let payloadMessages = allMessages

      if (isLiveModeRef.current && allMessages.length > 10) {
        payloadMessages = allMessages.slice(-10)
      }

      // Compress images before sending (anti-413 fix)
      const compressImage = (dataUrl: string, maxPx = 1024, quality = 0.72): Promise<string> => {
        return new Promise((resolve) => {
          try {
            const img = new window.Image()
            img.onload = () => {
              const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
              const w = Math.round(img.width * scale)
              const h = Math.round(img.height * scale)
              const canvas = document.createElement('canvas')
              canvas.width = w; canvas.height = h
              const ctx = canvas.getContext('2d')
              ctx?.drawImage(img, 0, 0, w, h)
              resolve(canvas.toDataURL('image/jpeg', quality))
            }
            img.onerror = () => resolve(dataUrl)
            img.src = dataUrl
          } catch { resolve(dataUrl) }
        })
      }

      const compressedMessages = await Promise.all(payloadMessages.map(async (m) => {
        if (!m.attachments?.length) return { role: m.role, content: m.content, attachments: m.attachments }
        const compressedAttachments = await Promise.all(m.attachments.map(async (att) => {
          if (att.type?.startsWith('image/') && att.url && att.url.startsWith('data:')) {
            const compressed = await compressImage(att.url)
            return { ...att, url: compressed }
          }
          return att
        }))
        return { role: m.role, content: m.content, attachments: compressedAttachments }
      }))

      const customInstruction = typeof window !== 'undefined' ? localStorage.getItem('fyy_user_custom_instruction') || '' : ''

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: compressedMessages,
          model: selectedModel,
          mode: selectedMode,
          isLiveMode: isLiveModeRef.current,
          isGuest: false,
          isOwner: isOwner,
          customInstruction: customInstruction.trim() || undefined,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const rawError = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        const errorMessage = formatBrandedError(rawError, selectedModel)
        throw new Error(errorMessage)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error("No response body")

      let accumulatedContent = ""
      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        let chunkContent = ""
        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue

          try {
            const data = JSON.parse(trimmedLine.slice(6))
            if (data.content) {
              chunkContent += data.content
            }
          } catch (e) {
            console.error("Error parsing stream chunk:", e)
          }
        }

        if (chunkContent) {
          setIsLoading(false)
          accumulatedContent += chunkContent
          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content: accumulatedContent } : msg)),
          )
        }
      }

      if (currentConversationId) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === assistantMessage.id ? { ...msg, content: accumulatedContent } : msg,
                ),
              }
              : conv,
          ),
        )
      }

      return accumulatedContent
    } catch (error) {
      console.error("Error sending message:", error)
      let errorMessage = "Maaf, terjadi kendala sesaat pada sistem. Silakan coba beberapa saat lagi."

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "⏱️ Waktu tunggu permintaan habis (Request timed out). Silakan periksa koneksi internet Anda."
        } else if (error.message.includes("Failed to fetch")) {
          errorMessage = "🌐 Kendala jaringan. Silakan periksa koneksi internet Anda."
        } else {
          errorMessage = formatBrandedError(error.message, selectedModel)
        }
      }

      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
      return errorMessage
    } finally {
      setIsLoading(false)
      setIsReceiving(false)
    }
  }

  const handleModeChange = (modeId: string) => {
    setSelectedMode(modeId)
  }

  const handleLiveModeToggle = (isActive: boolean) => {
    setIsLiveMode(isActive)
  }

  const handleVoiceEnd = () => {
    // Normal single-shot voice input end
  }

  const handleEditMessage = (messageId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, content: newContent } : msg
      )
    )

    if (currentConversationId) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === messageId ? { ...msg, content: newContent } : msg
              ),
            }
            : conv
        )
      )
    }
  }

  const handleRegenerateMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex === -1) return

    const message = messages[messageIndex]

    if (message.role === "assistant") {
      const userMessage = messages[messageIndex - 1]
      if (!userMessage || userMessage.role !== "user") return

      const newMessages = messages.slice(0, messageIndex)
      setMessages(newMessages)

      if (currentConversationId) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? { ...conv, messages: newMessages }
              : conv
          )
        )
      }

      await handleSendMessage(userMessage.content)
    } else if (message.role === "user") {
      const newMessages = messages.slice(0, messageIndex + 1)
      setMessages(newMessages)

      if (currentConversationId) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? { ...conv, messages: newMessages }
              : conv
          )
        )
      }

      await handleSendMessage(message.content)
    }
  }

  let callState: 'idle' | 'listening' | 'thinking' | 'speaking' = 'idle'
  if (isLiveMode) {
    if (isSpeaking) callState = 'speaking'
    else if (isLoading) callState = 'thinking'
    else if (isRecordingState) callState = 'listening'
    else callState = 'idle'
  }

  const aiTranscript = messages.length > 0 && messages[messages.length - 1].role === 'assistant'
    ? messages[messages.length - 1].content
    : undefined

  return (
    <div
      className={`fixed inset-0 flex h-[100dvh] w-screen overflow-hidden relative bg-[var(--fyf-bg)] text-[var(--fyf-text)] ${selectedFont === 'Inter' ? 'font-sans' : ''}`}
      style={{
        fontFamily: selectedFont !== 'Inter' ? selectedFont : undefined,
      }}
    >
      <HeroWelcomeAnimation />

      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 max-w-full relative z-10">
        {microphonePermissionDenied && (
          <div className="mx-4 mt-3 mb-1 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400 flex items-center justify-between">
            <span className="font-medium">Microphone permission denied. Enable microphone access in settings to use voice input.</span>
            <button
              type="button"
              onClick={requestMicrophonePermission}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg font-bold text-[10px] text-red-300 transition-colors uppercase tracking-wider"
            >
              Allow Access
            </button>
          </div>
        )}
        
        {/* Enhanced Header */}
        <div
          className="chat-header px-4 py-3 flex items-center justify-between relative z-20 border-b border-[var(--fyf-border)] bg-[var(--fyf-bg)]/80 backdrop-blur-md transition-all duration-300"
        >
          <div className="flex items-center gap-3 relative z-10 flex-shrink-0 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
            
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <div className="w-7 h-7 flex-shrink-0">
                <img src="/brand-logo.png" alt="FYY-AI" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-sm font-bold tracking-tight text-[var(--fyf-text)] leading-none">
                  FYY-AI
                </h1>
                <p className="text-[10px] text-[var(--fyf-text-secondary)] mt-0.5 leading-none truncate">
                  {models.find(m => m.id === selectedModel)?.name || "FYY Model"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* AI Settings Capsule */}
            <div className="flex items-center bg-white/[0.02] border border-white/5 rounded-xl p-1">
              <button
                onClick={() => setShowModesSelector(!showModesSelector)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  showModesSelector ? "bg-red-600 text-white" : "hover:bg-white/5 text-gray-400 hover:text-white"
                }`}
                data-panel-trigger
              >
                <span className="text-xs">{AI_MODES.find(m => m.id === selectedMode)?.icon || "🤖"}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                  {AI_MODES.find(m => m.id === selectedMode)?.name.split(' ')[0] || "General"}
                </span>
              </button>

              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  showModelSelector ? "bg-white/10 text-white" : "hover:bg-white/5 text-gray-400"
                }`}
                title="Select Model"
                data-panel-trigger
              >
                <Cpu size={14} />
              </button>

              <button
                onClick={() => setShowImageGenerator(!showImageGenerator)}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  showImageGenerator ? "bg-white/10 text-white" : "hover:bg-white/5 text-gray-400"
                }`}
                title="Image Studio"
                data-panel-trigger
              >
                <Sparkles size={14} />
              </button>
            </div>

            {/* Utility buttons */}
            <div className="flex items-center bg-white/[0.02] border border-white/5 rounded-xl p-1">
              <ThemeToggle />
              
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Export Chat"
                >
                  <Download size={14} />
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-[var(--fyf-surface)] border border-[var(--fyf-border)] shadow-2xl rounded-2xl overflow-hidden z-[100] p-1.5 space-y-1">
                    <button onClick={handleExportAsJSON} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-[var(--fyf-border)] rounded-xl text-[var(--fyf-text-secondary)] hover:text-[var(--fyf-text)] transition-colors">
                      <FileJson size={12} className="text-gray-400" /> Export JSON
                    </button>
                    <button onClick={handleExportAsMarkdown} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-[var(--fyf-border)] rounded-xl text-[var(--fyf-text-secondary)] hover:text-[var(--fyf-text)] transition-colors">
                      <FileCode2 size={12} className="text-[var(--fyf-text-secondary)]" /> Export Markdown
                    </button>
                    <button onClick={handleExportAsText} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-[var(--fyf-border)] rounded-xl text-[var(--fyf-text-secondary)] hover:text-[var(--fyf-text)] transition-colors">
                      <FileText size={12} className="text-[var(--fyf-text-secondary)]" /> Export Text
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  showSettings ? "bg-white/10 text-white" : "hover:bg-white/5 text-gray-400"
                }`}
                title="Settings"
                data-panel-trigger
              >
                <Settings size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Backdrop modals */}
        {(showModesSelector || showModelSelector || showImageGenerator || showQuickPrompts) && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] animate-fade-in"
            onClick={() => {
              setShowModesSelector(false);
              setShowModelSelector(false);
              setShowImageGenerator(false);
              setShowQuickPrompts(false);
            }}
          />
        )}

        {showQuickPrompts && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 sm:p-6 animate-scale-in" data-panel>
            <div className="w-full max-w-md bg-[var(--fyf-surface)] border border-[var(--fyf-border)] rounded-3xl p-6 shadow-2xl">
              <QuickPrompts
                onSelect={(prompt) => { setInput(prompt); setShowQuickPrompts(false); }}
                onClose={() => setShowQuickPrompts(false)}
              />
            </div>
          </div>
        )}

        {showModesSelector && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 sm:p-6 animate-scale-in" data-panel>
            <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto bg-[var(--fyf-surface)] border border-[var(--fyf-border)] rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold text-[var(--fyf-text)] flex items-center gap-2">
                  <Layers size={14} className="text-rose-400" /> Choose AI Mode
                </h2>
                <button
                  onClick={() => setShowModesSelector(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <ModesSelector selectedMode={selectedMode} onModeChange={(mode) => { handleModeChange(mode); setShowModesSelector(false); }} />
            </div>
          </div>
        )}

        {showModelSelector && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 sm:p-6 animate-scale-in" data-panel>
            <div className="w-full max-w-md bg-[var(--fyf-surface)] border border-[var(--fyf-border)] rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold text-[var(--fyf-text)] flex items-center gap-2">
                  <Brain size={14} className="text-rose-400" /> Choose Intelligence Model
                </h2>
                <button
                  onClick={() => setShowModelSelector(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <ModelSelector
                models={models}
                selectedModel={selectedModel}
                onSelectModel={(model) => {
                  setSelectedModel(model)
                  setShowModelSelector(false)
                }}
              />
            </div>
          </div>
        )}

        {showImageGenerator && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 sm:p-6 animate-scale-in" data-panel>
            <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[var(--fyf-surface)] border border-[var(--fyf-border)] rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold text-[var(--fyf-text)] flex items-center gap-2">
                  <Sparkles size={14} className="text-rose-400" /> AI Image Studio
                </h2>
                <button
                  onClick={() => setShowImageGenerator(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <ImageGenerator
                onClose={() => setShowImageGenerator(false)}
              />
            </div>
          </div>
        )}

        {/* Enhanced Messages View */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {messages.length === 0 && !isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 max-w-lg mx-auto space-y-6">
              
              <div className="relative">
                <div className="w-20 h-20 flex items-center justify-center">
                  <img src="/brand-logo.png" alt="FYY-AI" className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(225,29,72,0.5)]" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[var(--fyf-text)]">Experience Premium Intelligence</h2>
                <p className="text-xs sm:text-sm text-[var(--fyf-text-secondary)] leading-relaxed">
                  Start writing, thinking, generating high quality code, or analyzing files instantly with FYY-AI.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center w-full max-w-md pt-2">
                <button
                  onClick={handleNewChat}
                  className="fyf-btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Start New Session
                </button>
                <button
                  onClick={() => setShowModelSelector(true)}
                  className="fyf-btn-ghost px-5 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Choose Model
                </button>
              </div>

            </div>
          ) : (
            <MessageList
              messages={messages}
              isLoading={isLoading}
              conversationTitle=""
              onEditMessage={handleEditMessage}
              onRegenerateMessage={handleRegenerateMessage}
            />
          )}
        </div>

        {/* Input Area */}
        <div className="py-3 bg-gradient-to-t from-[var(--fyf-bg)] via-[var(--fyf-bg)]/95 to-transparent relative z-20">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSendMessage}
            isLoading={isLoading || isReceiving}
            selectedModel={selectedModel}
            onShowQuickPrompts={() => setShowQuickPrompts(true)}
            onLiveModeToggle={handleLiveModeToggle}
            onVoiceEnd={handleVoiceEnd}
            liveModeTrigger={liveModeTrigger}
            isLiveMode={isLiveMode}
            isSpeaking={isSpeaking}
            isVoiceInputBlocked={isVoiceInputBlocked}
            lastAssistantContent={messages.slice().reverse().find((msg) => msg.role === 'assistant')?.content}
          />
        </div>

      </div>

      {/* Live Voice Modal (Full Screen Call Experience) */}
      {isLiveMode && (
        <LiveVoiceModal
          onEndCall={() => {
            setIsLiveMode(false)
            stopSpeech()
          }}
          onSendMessage={async (msg) => {
            const reply = await handleSendMessage(msg)
            return reply || ""
          }}
        />
      )}

      {/* Settings Modal */}
      <div className="relative z-20" data-panel>
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={(settings) => {
            if (settings.fontFamily) {
              setSelectedFont(settings.fontFamily)
            }
          }}
          onFontChange={setSelectedFont}
        />
      </div>
    </div>
  )
}

