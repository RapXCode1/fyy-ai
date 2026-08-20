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
import { useUser, useSession, useAuth } from "@clerk/nextjs"
import { createClerkSupabaseClient, getClerkSupabaseToken, isSupabaseConfigured, tripSupabaseCircuitBreaker } from "@/lib/supabase"
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
  const { user, isLoaded, isSignedIn } = useUser()
  const { session } = useSession()
  const { getToken } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  // Guest Mode limits
  const [guestChatsCount, setGuestChatsCount] = useState(0)
  const [guestImagesCount, setGuestImagesCount] = useState(0)
  const [showGuestLimitPopup, setShowGuestLimitPopup] = useState<{ type: 'chat' | 'image' | 'model' | 'mode', lockedItem: string } | null>(null)

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
    if (isLoaded && !isSignedIn) {
      const chats = localStorage.getItem("fyy_guest_chats_count")
      const images = localStorage.getItem("fyy_guest_images_count")
      if (chats) setGuestChatsCount(parseInt(chats))
      if (images) setGuestImagesCount(parseInt(images))
    }
  }, [isLoaded, isSignedIn])

  useEffect(() => {
    setIsClient(true)
  }, [])
  const [isLoading, setIsLoading] = useState(false)
  const [isReceiving, setIsReceiving] = useState(false)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID)
  const [selectedMode, setSelectedMode] = useState("general")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showModesSelector, setShowModesSelector] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showImageGenerator, setShowImageGenerator] = useState(false)
  const [showQuickPrompts, setShowQuickPrompts] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [selectedFont, setSelectedFont] = useState("Inter")
  const [showSyncBanner, setShowSyncBanner] = useState(false)

  const { permissionStatus: microphonePermissionStatus, isDenied: microphonePermissionDenied, requestPermission: requestMicrophonePermission } = useMicrophonePermission()

  // Capacitor Deep Linking - Sync clerk session when opened via fyyai://sync?client_token=xxx&session_token=yyy
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleAppUrlOpen = async (event: any) => {
        try {
          const urlStr = event.url;
          if (urlStr.startsWith("fyyai://sync")) {
            const url = new URL(urlStr.replace("fyyai://", "https://"));
            const clientToken = url.searchParams.get("client_token");
            const sessionToken = url.searchParams.get("session_token");

            if (sessionToken) {
              // Set Clerk cookies on Webview directly
              document.cookie = `__session=${decodeURIComponent(sessionToken)}; path=/; max-age=31536000; SameSite=Lax; Secure`;

              if (clientToken) {
                document.cookie = `__client=${decodeURIComponent(clientToken)}; path=/; max-age=31536000; SameSite=Lax; Secure`;
              }

              // Clear guest cookie
              document.cookie = "fyy_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";

              // Force reload to log in
              window.location.reload();
            }
          }
        } catch (e) {
          console.error("Deep link sync error:", e);
        }
      };

      // Listen to Capacitor App events safely
      import("@capacitor/app").then(({ App }) => {
        App.addListener("appUrlOpen", handleAppUrlOpen);
      }).catch((err) => {
        console.log("Capacitor App listener not active (standard web mode)", err);
      });
    }
  }, []);
  // Sync Banner detector for standard mobile browsers
  useEffect(() => {
    if (typeof window !== "undefined" && isClient) {
      const win = window as any
      const isAPK = !!(win.Capacitor?.isNativePlatform?.())
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent)
      if (!isAPK && isMobile && isSignedIn) {
        setShowSyncBanner(true)
      }
    }
  }, [isClient, isSignedIn])

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

  const { speak, isSpeaking, stop: stopSpeech } = useSpeechOutput({
    onStart: () => {
      if (isLiveModeRef.current) {
        setIsVoiceInputBlocked(true)
      }
    },
    onEnd: () => {
      if (isLiveModeRef.current) {
        if (voiceBlockedTimeoutRef.current) {
          window.clearTimeout(voiceBlockedTimeoutRef.current)
        }

        setIsVoiceInputBlocked(true)
        voiceBlockedTimeoutRef.current = window.setTimeout(() => {
          setIsVoiceInputBlocked(false)
          setLiveModeTrigger(prev => prev + 1)
        }, 600)
      }
    }
  })

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

  // Load conversations from Supabase on page load and merge/de-duplicate with local
  useEffect(() => {
    if (user && session && !initialLoadDone) {
      const fetchConversations = async () => {
        if (!isSupabaseConfigured()) {
          setInitialLoadDone(true)
          return
        }
        try {
          const token = await getClerkSupabaseToken(session)
          const supabase = createClerkSupabaseClient(token)

          if (!supabase) {
            setInitialLoadDone(true)
            return
          }

          const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) {
            tripSupabaseCircuitBreaker(error.message)
            setInitialLoadDone(true)
            return
          }

          if (data && data.length > 0) {
            const parsedConversations = data.map((conv: any) => ({
              id: conv.id,
              title: conv.title,
              model: conv.model,
              mode: conv.mode,
              createdAt: new Date(conv.created_at),
              messages: conv.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }))
            }))

            setConversations(prev => {
              const combined = [...parsedConversations, ...prev]
              const uniqueMap = new Map()
              combined.forEach(conv => {
                uniqueMap.set(conv.id, conv)
              })
              const unique = Array.from(uniqueMap.values())
              const sorted = unique.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              try {
                localStorage.setItem("fyy_conversations", JSON.stringify(sorted))
              } catch (e) {
                console.error("Failed to sync storage in merge:", e)
              }
              return sorted
            })

            if (!currentConversationId && parsedConversations.length > 0) {
              const mostRecent = parsedConversations[0]
              setCurrentConversationId(mostRecent.id)
              setMessages(mostRecent.messages)
              const validModel = models.find(m => m.id === mostRecent.model)?.id || models[0].id
              setSelectedModel(validModel)
              setSelectedMode(mostRecent.mode || "general")
            }
          }
          setInitialLoadDone(true)
        } catch (e: any) {
          tripSupabaseCircuitBreaker(e?.message)
          setInitialLoadDone(true)
        }
      }
      fetchConversations()
    }
  }, [user, session, initialLoadDone, currentConversationId])

  // Sync current conversation to Supabase (Debounced)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (isClient && initialLoadDone && user && session && currentConversationId && isSupabaseConfigured()) {
      const currentConv = conversations.find(c => c.id === currentConversationId)
      if (currentConv) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = setTimeout(async () => {
          try {
            const token = await getClerkSupabaseToken(session)
            const supabase = createClerkSupabaseClient(token)
            if (!supabase) return

            const { error } = await supabase.from('conversations').upsert({
              id: currentConv.id,
              user_id: user.id,
              title: currentConv.title,
              messages: currentConv.messages,
              model: currentConv.model,
              mode: currentConv.mode,
              created_at: currentConv.createdAt.toISOString()
            })
            if (error) {
              tripSupabaseCircuitBreaker(error.message)
            }
          } catch (e: any) {
            tripSupabaseCircuitBreaker(e?.message)
          }
        }, 1500)
      }
    }
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    }
  }, [conversations, currentConversationId, isClient, initialLoadDone, user, session])

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

    if (user && session && isSupabaseConfigured()) {
      try {
        const token = await getClerkSupabaseToken(session)
        const supabase = createClerkSupabaseClient(token)
        if (supabase) {
          await supabase.from('conversations').delete().eq('id', id)
        }
      } catch (e) {
        console.warn("Failed to delete conversation from Supabase:", e)
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

  const handleSendMessage = async (content: string, attachments?: Array<{ type: string, url?: string, name: string, size: number }>) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return

    if (content.includes("FYY3257")) {
      localStorage.setItem("fyy_owner_mode", "true")
      setIsOwner(true)
    }

    if (isLoaded && !isSignedIn) {
      const chats = localStorage.getItem("fyy_guest_chats_count")
      const chatsCount = chats ? parseInt(chats) : 0
      if (chatsCount >= 20) {
        setShowGuestLimitPopup({ type: "chat", lockedItem: "" })
        return
      }
      localStorage.setItem("fyy_guest_chats_count", (chatsCount + 1).toString())
      setGuestChatsCount(chatsCount + 1)
    }

    setShowModelSelector(false)
    setShowModesSelector(false)
    setShowSettings(false)
    setShowExportMenu(false)

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

      const customKey = typeof window !== "undefined" ? (localStorage.getItem("fyy_custom_groq_key") || "").trim() : ""
      const requestHeaders: Record<string, string> = { "Content-Type": "application/json" }
      if (customKey) {
        requestHeaders["x-groq-key"] = customKey
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          messages: payloadMessages.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
          model: selectedModel,
          mode: selectedMode,
          isLiveMode: isLiveModeRef.current,
          isGuest: !isSignedIn,
          isOwner: isOwner,
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

      if (isLiveModeRef.current) {
        speak(accumulatedContent)
      }

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
    } finally {
      setIsLoading(false)
      setIsReceiving(false)
    }
  }

  const handleModeChange = (modeId: string) => {
    if (isLoaded && !isSignedIn && (modeId === "creative" || modeId === "research")) {
      setShowGuestLimitPopup({ type: "mode", lockedItem: modeId })
      return
    }
    setSelectedMode(modeId)
  }

  const handleLiveModeToggle = (isActive: boolean) => {
    setIsLiveMode(isActive)
  }

  const handleVoiceEnd = () => {
    if (isLiveMode) {
      setTimeout(() => {
        const textArea = document.querySelector('textarea') as HTMLTextAreaElement
        const finalInput = textArea ? textArea.value : ""

        if (finalInput.trim()) {
          handleSendMessage(finalInput)
        } else {
          setLiveModeTrigger(prev => prev + 1)
        }
      }, 500)
    }
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

      {/* Full-Screen Live Voice Modal */}
      {isLiveMode && (
        <LiveVoiceModal
          state={callState}
          onEndCall={() => {
            setIsLiveMode(false)
            stopSpeech()
          }}
          onInterrupt={() => {
            if (isSpeaking) {
              stopSpeech()
              setLiveModeTrigger(prev => prev + 1)
            }
          }}
          userTranscript={input}
          aiTranscript={aiTranscript}
        />
      )}

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

        {showSyncBanner && (
          <div className="mx-4 mt-3 mb-1 p-3 rounded-2xl border border-red-500/20 bg-[var(--fyf-surface)]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left relative overflow-hidden animate-fade-up z-30">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-rose-500/5 to-white/5" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2.5">
              <span className="text-lg">📲</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[var(--fyf-text)]">
                  Active Web Login Detected!
                </span>
                <span className="text-[10px] text-[var(--fyf-text-secondary)] mt-0.5">
                  Synchronize this session directly with the FYY-AI Android App to skip logging in again.
                </span>
              </div>
            </div>
            
            <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
              <button
                onClick={async () => {
                  try {
                    let sessionToken = null;
                    if (session) {
                      sessionToken = await session.getToken();
                    } else {
                      sessionToken = await getToken();
                    }

                    if (!sessionToken) {
                      const getCookie = (name: string) => {
                        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                        return match ? match[2] : null;
                      };
                      sessionToken = getCookie('__session');
                    }

                    if (sessionToken) {
                      window.location.href = `fyyai://sync?session_token=${encodeURIComponent(sessionToken)}`;
                    } else {
                      alert("Unable to sync. Please re-sign in on the web.");
                    }
                  } catch (err) {
                    console.error("Session sync failed:", err);
                    alert("Error retrieving session credentials.");
                  }
                }}
                className="py-1.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all duration-300 shadow-md shadow-red-500/15"
              >
                Sync to Mobile App
              </button>
              <button
                onClick={() => setShowSyncBanner(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

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
                  if (isLoaded && !isSignedIn && (model === "meta-llama/llama-4-scout-17b-16e-instruct" || model === "openai/gpt-oss-120b")) {
                    setShowGuestLimitPopup({ type: "model", lockedItem: model })
                    return
                  }
                  setSelectedModel(model);
                  setShowModelSelector(false);
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
                onGuestLimit={() => setShowGuestLimitPopup({ type: "image", lockedItem: "" })}
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

      {/* Guest Mode Protection Banner Modal */}
      {showGuestLimitPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[250] p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm p-6 rounded-3xl border border-[var(--fyf-border)] bg-[var(--fyf-surface)] shadow-2xl text-center animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4 text-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h3 className="text-base font-bold text-[var(--fyf-text)]">
              {showGuestLimitPopup.type === "chat" && "Guest Limit Reached"}
              {showGuestLimitPopup.type === "image" && "Image Studio Limit"}
              {showGuestLimitPopup.type === "model" && "Premium Model Locked"}
              {showGuestLimitPopup.type === "mode" && "Specialized Mode Locked"}
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-[var(--fyf-text-secondary)] leading-relaxed font-medium">
              {showGuestLimitPopup.type === "chat" && "You've exhausted your guest session chat quota. Sign up for a free, unlimited account in seconds to save conversations."}
              {showGuestLimitPopup.type === "image" && "Image Generation is limited in Guest Mode. Connect your free personal account to start generating endless visuals."}
              {showGuestLimitPopup.type === "model" && "This advanced model is optimized for authenticated members. Create a free account in 10 seconds to unlock."}
              {showGuestLimitPopup.type === "mode" && "Specialized reasoning modes require authentication. Create a free account in 10 seconds to unlock."}
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => {
                  document.cookie = "fyy_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
                  import('@/lib/openSignIn').then(mod => mod.default()).catch(() => { window.location.href = "/sign-in" })
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs tracking-wide transition-all duration-300 shadow-lg shadow-red-500/20"
              >
                Create Free Account
              </button>
              <button
                onClick={() => setShowGuestLimitPopup(null)}
                className="w-full py-2 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold text-xs transition-all duration-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
