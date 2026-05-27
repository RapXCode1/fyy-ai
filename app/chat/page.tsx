"use client"

import { useState, useRef, useEffect } from "react"
import { Settings, Menu, X, Sparkles, Download, FileJson, FileText, FileCode2 } from "lucide-react"
import ChatSidebar from "@/components/chat/chat-sidebar"
import MessageList from "@/components/chat/message-list"
import QuickPrompts from "@/components/chat/quick-prompts"
import { AI_MODES } from "@/lib/ai-modes"
import ModelSelector from "@/components/chat/model-selector"
import ChatInput from "@/components/chat/chat-input"
import SettingsPanel from "@/components/chat/settings-panel"
import ImageGenerator from "@/components/chat/image-generator"
import ModesSelector from "@/components/chat/modes-selector"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSpeechOutput } from "@/hooks/use-voice-input"
import { useMicrophonePermission } from "@/hooks/use-microphone-permission"
import LiveVoiceModal from "@/components/chat/live-voice-modal"
import { useUser, useSession, useAuth } from "@clerk/nextjs"
import { createClerkSupabaseClient } from "@/lib/supabase"
import { HeroWelcomeAnimation } from "@/components/animations/welcome-animation"

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
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile")
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

  const models = [
    { id: "llama-3.3-70b-versatile", name: "FYY-Llama 3.3 (PRO)", description: "Ultimate-performance" },
    { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "FYY-Llama 4 Scout", description: "Next-gen reasoning" },
    { id: "openai/gpt-oss-120b", name: "FYY-GPT-OSS 120B", description: "High-performance" },
    { id: "qwen/qwen3-32b", name: "FYY-Qwen 3 32B", description: "Super-reasoning" },
  ]

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

        // Apply font immediately on load
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

    // Apply font immediately
    document.body.style.fontFamily = fontMap[selectedFont] || 'Inter, sans-serif'
  }, [selectedFont])

  // Auto-close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element

      // Check if the click is on a Radix UI portal (like Select dropdown, Dialog, etc.)
      // These elements are rendered outside the main panel hierarchy
      const isPortal = target.closest('[data-radix-portal]') ||
        target.closest('[role="listbox"]') ||
        target.closest('[role="option"]') ||
        target.closest('[data-radix-select-viewport]') ||
        target.closest('[data-state]');

      // Close model selector and modes selector when clicking outside
      if (!target.closest('[data-panel-trigger]') && !target.closest('[data-panel]') && !isPortal) {
        setShowModelSelector(false)
        setShowModesSelector(false)
        setShowSettings(false)
        setShowExportMenu(false)
      }

      // For image generator, only close when clicking outside the image generator panel itself
      // This allows all interactions within the panel (including dropdowns) to keep it open
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
        try {
          const token = await session.getToken({ template: 'supabase' })
          const supabase = createClerkSupabaseClient(token || '')

          const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Failed to load from Supabase:', error)
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

            // Merge remote conversations with local, deduplicating by conversation ID
            setConversations(prev => {
              const combined = [...parsedConversations, ...prev]
              const uniqueMap = new Map()
              combined.forEach(conv => {
                // If collision, prefer remote/newer
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

            // Set current conversation if none was loaded from local storage
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
        } catch (e) {
          console.error("Error fetching auth token:", e)
          setInitialLoadDone(true)
        }
      }
      fetchConversations()
    }
  }, [user, session, initialLoadDone, currentConversationId])

  // Sync current conversation to Supabase
  useEffect(() => {
    if (isClient && initialLoadDone && user && session && currentConversationId) {
      const currentConv = conversations.find(c => c.id === currentConversationId)
      if (currentConv) {
        const syncToSupabase = async () => {
          try {
            const token = await session.getToken({ template: 'supabase' })
            const supabase = createClerkSupabaseClient(token || '')

            await supabase.from('conversations').upsert({
              id: currentConv.id,
              user_id: user.id,
              title: currentConv.title,
              messages: currentConv.messages,
              model: currentConv.model,
              mode: currentConv.mode,
              created_at: currentConv.createdAt.toISOString()
            })
          } catch (e) {
            console.error("Failed to sync to Supabase:", e)
          }
        }
        syncToSupabase()
      }
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

    if (user && session) {
      try {
        const token = await session.getToken({ template: 'supabase' })
        const supabase = createClerkSupabaseClient(token || '')
        await supabase.from('conversations').delete().eq('id', id)
      } catch (e) {
        console.error("Failed to delete conversation:", e)
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

    // Check for owner activation code
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

    // Auto-close all open panels when sending a message (except image generator)
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

    // Create a new conversation if this is the first message
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
      // Update existing conversation
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

    // Update conversation immediately with empty assistant message
    if (currentConversationId) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, assistantMessage] } : conv,
        ),
      )
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(new Error("Timeout")), 90000) // 90 second timeout

      const allMessages = [...messages, userMessage]
      let payloadMessages = allMessages

      // Token optimization for Live Voice Mode: 
      // Only send the last 10 messages (5 conversational turns) to prevent hitting TPM limits rapidly
      if (isLiveModeRef.current && allMessages.length > 10) {
        payloadMessages = allMessages.slice(-10)
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      // Check for fallback notification from headers
      const isFallback = response.headers.get("X-Model-Fallback") === "true"
      const usedModelId = response.headers.get("X-Model-Used")

      if (isFallback && usedModelId) {
        // Show a temporary notification
        const modelName = models.find(m => m.id === usedModelId)?.name || "Llama 3.1 8B"
        const notification = document.createElement('div')
        notification.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-amber-500 text-white px-4 py-2 rounded-full shadow-2xl font-bold animate-in slide-in-from-top-4 duration-300 flex items-center gap-2'
        notification.innerHTML = `<span>⚠️ Model Limit! Switching to ${modelName}...</span>`
        document.body.appendChild(notification)
        setTimeout(() => {
          notification.classList.add('animate-out', 'fade-out', 'slide-out-to-top-4')
          setTimeout(() => notification.remove(), 300)
        }, 4000)
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        let errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`

        // Improve error message for the user
        if (response.status === 429) {
          errorMessage = "Waduh, kuota model ini lagi habis (Rate Limit)! Coba lagi sebentar lagi atau ganti ke model lain ya."
        } else if (response.status === 400) {
          errorMessage = "Ada masalah dengan permintaanmu (Bad Request). Coba refresh halamannya ya."
        } else if (response.status === 500) {
          errorMessage = "Server lagi pusing (Internal Error). Tunggu sebentar lalu coba lagi ya."
        }

        throw new Error(errorMessage)
      }

      // Handle streaming response
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
        buffer = lines.pop() || "" // Keep partial line for next chunk

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

      // Update conversation with the final accumulated content after streaming is done
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

      // Auto-speak in Live Mode, but only if the user hasn't ended the call during the fetch
      if (isLiveModeRef.current) {
        speak(accumulatedContent)
      }

    } catch (error) {
      console.error("Error sending message:", error)

      let errorMessage = "Sorry, something went wrong. Please try again."

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Request timed out. Please check your connection and try again."
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your internet connection."
        } else if (error.message.includes('HTTP')) {
          errorMessage = `Server error: ${error.message}`
        } else {
          errorMessage = `Error: ${error.message}`
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
      // Small timeout to ensure input state has caught up with the final transcript
      setTimeout(() => {
        const textArea = document.querySelector('textarea') as HTMLTextAreaElement
        const finalInput = textArea ? textArea.value : ""

        if (finalInput.trim()) {
          handleSendMessage(finalInput)
        } else {
          // If empty, restart listening
          setLiveModeTrigger(prev => prev + 1)
        }
      }, 500) // 500ms is enough for React to render the final transcript into the textarea
    }
  }

  const handleEditMessage = (messageId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, content: newContent } : msg
      )
    )

    // Update conversation if it exists
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
      // For assistant messages: regenerate the response
      // Find the user message that prompted this assistant response
      const userMessage = messages[messageIndex - 1]
      if (!userMessage || userMessage.role !== "user") return

      // Remove the assistant message and any subsequent messages
      const newMessages = messages.slice(0, messageIndex)
      setMessages(newMessages)

      // Update conversation
      if (currentConversationId) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? { ...conv, messages: newMessages }
              : conv
          )
        )
      }

      // Regenerate the response
      await handleSendMessage(userMessage.content)
    } else if (message.role === "user") {
      // For user messages: resend the same message to get a new response
      // Remove all messages after this user message
      const newMessages = messages.slice(0, messageIndex + 1)
      setMessages(newMessages)

      // Update conversation
      if (currentConversationId) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? { ...conv, messages: newMessages }
              : conv
          )
        )
      }

      // Send the message again
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
    <div className={`fixed inset-0 flex h-[100dvh] w-screen bg-background overflow-hidden relative ${selectedFont === 'Inter' ? 'font-sans' : ''}`} style={{ fontFamily: selectedFont !== 'Inter' ? selectedFont : undefined }}>
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
              // Explicitly trigger the next listening cycle since the last chunk's event might not fire if it was canceled in the queue
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
        onClose={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      {microphonePermissionDenied && (
        <div className="mx-4 mb-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          Microphone permissions ditolak. Untuk menggunakan fitur suara, izinkan akses mikrofon dan coba lagi.
          <button
            type="button"
            onClick={requestMicrophonePermission}
            className="ml-3 font-semibold underline text-red-800"
          >
            Minta izin lagi
          </button>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 max-w-full overflow-x-hidden relative z-10">
        {/* Enhanced Header with Theme Awareness */}
        <div className="chat-header px-3 sm:px-4 pt-1 sm:pt-2 pb-1 sm:pb-2 flex items-center justify-between relative z-20 min-h-[48px] sm:min-h-[56px] transition-all duration-500 bg-background/80 backdrop-blur-md">
          {/* Theme-specific accent background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 opacity-50" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="flex items-center gap-3 relative z-10 flex-shrink-0 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted/80 rounded-lg transition-all duration-200 group relative overflow-hidden flex-shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              {sidebarOpen ?
                <X size={18} className="text-muted-foreground group-hover:text-red-500 transition-all duration-300 relative z-10" /> :
                <Menu size={18} className="text-muted-foreground group-hover:text-cyan-500 transition-all duration-300 relative z-10" />
              }
            </button>
            <div className="animate-fade-in flex items-center gap-2 min-w-0 flex-1 overflow-hidden max-w-[200px] sm:max-w-[250px]">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-cyan-400/30 overflow-hidden flex-shrink-0">
                <img src="/logo.png" alt="FYY-AI Logo" className="w-6 h-6 object-contain" />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-lg sm:text-xl fyy-identity tracking-tighter text-foreground bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-cyan-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-500 cursor-default leading-none truncate pr-2">
                  FYY-AI
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium hover:text-cyan-400 transition-colors duration-300 leading-none truncate mt-0.5">
                  {models.find(m => m.id === selectedModel)?.name || selectedModel.replace(/-/g, " ").toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 relative z-10 flex-shrink-0 min-w-0">
            {/* AI Tools Group with Enhanced Styling */}
            <div className="flex items-center bg-muted/20 rounded-lg sm:rounded-xl p-1 sm:p-1.5 backdrop-blur-md border border-border/20 shadow-lg shadow-black/5" data-panel-trigger>
              <button
                onClick={() => setShowModesSelector(!showModesSelector)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${showModesSelector ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-muted/50 text-foreground"
                  }`}
                title="AI Mode"
                data-panel-trigger
              >
                <span className="text-sm sm:text-base">{AI_MODES.find(m => m.id === selectedMode)?.icon || "🤖"}</span>
                <span className="text-xs font-bold hidden md:inline uppercase tracking-tight">
                  {AI_MODES.find(m => m.id === selectedMode)?.name.split(' ')[0] || "General"}
                </span>
              </button>
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className={`p-2 sm:p-2.5 rounded-lg transition-all duration-200 ${showModelSelector ? "bg-secondary text-secondary-foreground shadow-lg" : "hover:bg-muted/50"
                  }`}
                title="AI Model"
                data-panel-trigger
              >
                <span className="text-sm sm:text-base relative z-10">🧠</span>
              </button>
              <button
                onClick={() => setShowImageGenerator(!showImageGenerator)}
                className={`p-2 sm:p-2.5 rounded-lg transition-all duration-200 ${showImageGenerator ? "bg-accent text-accent-foreground shadow-lg" : "hover:bg-muted/50"
                  }`}
                title="Image Generator"
                data-panel-trigger
              >
                <Sparkles size={16} className="relative z-10" />
              </button>
            </div>

            {/* Settings Group with Enhanced Styling */}
            <div className="flex items-center bg-muted/20 rounded-lg sm:rounded-xl p-1 sm:p-1.5 backdrop-blur-md border border-border/20 shadow-lg shadow-black/5 ml-1 sm:ml-2" data-panel-trigger>
              <ThemeToggle />
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 sm:p-2.5 hover:bg-muted/50 rounded-lg transition-all duration-200"
                  title="Export Chat"
                >
                  <Download size={18} className="relative z-10 text-muted-foreground hover:text-cyan-400 transition-colors" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 theme-card border border-border/50 shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-200 z-[100]">
                    <div className="p-2 space-y-1">
                      <button onClick={handleExportAsJSON} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-muted/80 rounded-lg transition-colors group">
                        <FileJson size={16} className="text-muted-foreground group-hover:text-cyan-400" /> JSON Format
                      </button>
                      <button onClick={handleExportAsMarkdown} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-muted/80 rounded-lg transition-colors group">
                        <FileCode2 size={16} className="text-muted-foreground group-hover:text-purple-400" /> Markdown
                      </button>
                      <button onClick={handleExportAsText} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-muted/80 rounded-lg transition-colors group">
                        <FileText size={16} className="text-muted-foreground group-hover:text-amber-400" /> Plain Text
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 sm:p-2.5 rounded-lg transition-all duration-200 ${showSettings ? "bg-muted text-foreground" : "hover:bg-muted/50"
                  }`}
                title="Settings"
                data-panel-trigger
              >
                <Settings size={16} className="relative z-10" />
              </button>
            </div>
          </div>
        </div>

        {showSyncBanner && (
          <div className="mx-4 mt-3 mb-1 p-3 rounded-xl border border-cyan-500/30 bg-card/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left relative overflow-hidden animate-in slide-in-from-top duration-500 z-30">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/5 to-pink-500/10 opacity-70" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2.5">
              <span className="text-xl">📲</span>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  Sesi Login Kamu Aktif di Web!
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Sinkronkan sesi ini langsung ke Aplikasi FYY-AI di HP kamu agar tidak perlu login ulang.
                </span>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
              <button
                onClick={async () => {
                  try {
                    // Ambil token sesi aktif langsung dari Clerk SDK (Aman dari proteksi HttpOnly cookie!)
                    let sessionToken = null;
                    if (session) {
                      sessionToken = await session.getToken();
                    } else {
                      sessionToken = await getToken();
                    }

                    // Fallback ke pembacaan cookie jika SDK belum sepenuhnya siap
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
                      alert("Gagal menyinkronkan. Sesi login kamu tidak terdeteksi atau sudah kedaluwarsa.");
                    }
                  } catch (err) {
                    console.error("Session sync failed:", err);
                    alert("Terjadi kesalahan saat mengambil token sesi.");
                  }
                }}
                className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold text-xs tracking-wide transition-all duration-300 cursor-pointer flex items-center gap-1 shadow-md shadow-purple-500/10 hover:scale-102"
              >
                Sinkronkan ke App
              </button>
              <button
                onClick={() => setShowSyncBanner(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Unified Modal Backdrop */}
        {(showModesSelector || showModelSelector || showImageGenerator || showQuickPrompts) && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] animate-in fade-in duration-300"
            onClick={() => {
              setShowModesSelector(false);
              setShowModelSelector(false);
              setShowImageGenerator(false);
              setShowQuickPrompts(false);
            }}
          />
        )}

        {showQuickPrompts && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200" data-panel>
            <div className="theme-card p-6 w-full max-w-md shadow-2xl">
              <QuickPrompts
                onSelect={(prompt) => { setInput(prompt); setShowQuickPrompts(false); }}
                onClose={() => setShowQuickPrompts(false)}
              />
            </div>
          </div>
        )}

        {showModesSelector && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200" data-panel>
            <div className="theme-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Pilih Mode AI</h2>
                <button onClick={() => setShowModesSelector(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
              </div>
              <ModesSelector selectedMode={selectedMode} onModeChange={(mode) => { handleModeChange(mode); setShowModesSelector(false); }} />
            </div>
          </div>
        )}

        {showModelSelector && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200" data-panel>
            <div className="theme-card p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Pilih Model</h2>
                <button onClick={() => setShowModelSelector(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
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
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200" data-panel>
            <div className="theme-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Image Studio</h2>
                <button onClick={() => setShowImageGenerator(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
              </div>
              <ImageGenerator
                onClose={() => setShowImageGenerator(false)}
                onGuestLimit={() => setShowGuestLimitPopup({ type: "image", lockedItem: "" })}
              />
            </div>
          </div>
        )}

        {/* Enhanced Messages Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
              <div className="mb-6">
                <div className="w-20 h-20 bg-card border border-border rounded-full flex items-center justify-center mb-4 shadow-lg overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                Welcome to FYY-AI
              </h3>
              <p className="text-gray-300 mb-6 max-w-md text-sm leading-relaxed animate-fade-in" style={{ animationDelay: '0.6s' }}>
                Start a conversation with our AI assistant. Choose your model and mode to get started.
              </p>
              <div className="flex gap-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <button
                  onClick={handleNewChat}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-110 hover:brightness-110 font-medium transform-gpu"
                >
                  🚀 Start New Chat
                </button>
                <button
                  onClick={() => setShowModelSelector(true)}
                  className="px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-all duration-300"
                >
                  ⚙️ Choose Model
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <MessageList
                messages={messages}
                isLoading={isLoading}
                conversationTitle=""
                onEditMessage={handleEditMessage}
                onRegenerateMessage={handleRegenerateMessage}
              />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area with Theme Awareness */}
        <div className="chat-input-area px-2 sm:px-4 pb-2 sm:pb-4 pt-1 relative z-20 transition-all duration-500 mb-[env(safe-area-inset-bottom)]">
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

      {/* Settings Panel */}
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

      {showGuestLimitPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[250] p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md p-6 rounded-2xl border border-cyan-500/30 bg-card/90 shadow-2xl shadow-cyan-500/10 text-center animate-in zoom-in-95 duration-300">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-30 transition duration-1000 -z-10"></div>

            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4 text-cyan-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent pr-1">
              {showGuestLimitPopup.type === "chat" && "Batas Chat Tamu Tercapai!"}
              {showGuestLimitPopup.type === "image" && "Batas Gambar Tercapai!"}
              {showGuestLimitPopup.type === "model" && "Model Premium Terkunci!"}
              {showGuestLimitPopup.type === "mode" && "Mode Premium Terkunci!"}
            </h3>

            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
              {showGuestLimitPopup.type === "chat" && "Waduh bos, batas chat Guest Mode (20 pesan) sudah tercapai! Yuk buat akun gratis sekarang untuk menikmati chat tanpa batas dengan Fyy-AI!"}
              {showGuestLimitPopup.type === "image" && "Batas gambar Guest Mode (10 gambar) sudah tercapai bos! Hubungkan akun gratis untuk menghasilkan gambar tanpa batas dengan Fyy-AI!"}
              {showGuestLimitPopup.type === "model" && "Model pintar ini hanya tersedia untuk pengguna terdaftar. Yuk buat akun gratis dalam 10 detik untuk membuka seluruh model canggih!"}
              {showGuestLimitPopup.type === "mode" && "Mode AI pintar ini membutuhkan akun terdaftar. Yuk buat akun gratis dalam 10 detik untuk membuka seluruh mode super cerdas!"}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => {
                  document.cookie = "fyy_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
                  import('@/lib/openSignIn').then(mod => mod.default()).catch(() => { window.location.href = "/sign-in" })
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold text-sm tracking-wide transition-all duration-300 hover:scale-102 shadow-lg shadow-purple-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                Buat Akun Gratis Sekarang!
              </button>
              <button
                onClick={() => setShowGuestLimitPopup(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground font-semibold text-sm transition-all duration-200 cursor-pointer"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
