"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PhoneOff, Sparkles, Mic, Volume2 } from "lucide-react"

interface LiveVoiceModalProps {
  onEndCall: () => void
  onSendMessage: (message: string) => Promise<string | void>
}

export default function LiveVoiceModal({
  onEndCall,
  onSendMessage,
}: LiveVoiceModalProps) {
  const [callState, setCallState] = useState<"connecting" | "listening" | "thinking" | "speaking">("connecting")
  const [userTranscript, setUserTranscript] = useState("")
  const [aiTranscript, setAiTranscript] = useState("")
  const [micActive, setMicActive] = useState(false)

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<any>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isComponentMounted = useRef(true)

  // ── 1. Text-to-Speech (AI Speaking) ───────────────────────────────────────
  const speakAIResponse = useCallback((text: string, onFinish: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onFinish()
      return
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, " Berikut adalah blok kode. ")
      .replace(/[*_#`~>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/-\s/g, "")
      .trim()

    if (!cleanText) {
      onFinish()
      return
    }

    try {
      window.speechSynthesis.cancel()
      window.speechSynthesis.resume()

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = "id-ID"
      utterance.rate = 1.05
      utterance.pitch = 1.0
      utterance.volume = 1.0

      const voices = window.speechSynthesis.getVoices()
      const idVoice =
        voices.find((v) => v.lang.includes("id") || v.lang.includes("ID")) ||
        voices.find((v) => v.name.toLowerCase().includes("indonesia") || v.name.toLowerCase().includes("andika"))

      if (idVoice) utterance.voice = idVoice

      utterance.onstart = () => {
        if (isComponentMounted.current) {
          setCallState("speaking")
        }
      }

      utterance.onend = () => {
        if (isComponentMounted.current) {
          onFinish()
        }
      }

      utterance.onerror = () => {
        if (isComponentMounted.current) {
          onFinish()
        }
      }

      currentUtteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    } catch {
      onFinish()
    }
  }, [])

  // ── 2. Speech Recognition (User Listening) ────────────────────────────────
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    setMicActive(false)
  }, [])

  const startListening = useCallback(() => {
    if (!isComponentMounted.current) return
    stopListening()

    const SpeechRecognitionClass =
      typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null

    if (!SpeechRecognitionClass) {
      setCallState("listening")
      return
    }

    try {
      const recognition = new SpeechRecognitionClass()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "id-ID"

      let localText = ""

      recognition.onstart = () => {
        if (isComponentMounted.current) {
          setCallState("listening")
          setMicActive(true)
        }
      }

      recognition.onresult = (event: any) => {
        let full = ""
        for (let i = 0; i < event.results.length; i++) {
          full += event.results[i][0].transcript
        }

        if (full.trim()) {
          localText = full.trim()
          setUserTranscript(localText)

          // Reset silence timer: when user pauses for 1.4s, send automatically
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = setTimeout(async () => {
            if (!localText.trim() || !isComponentMounted.current) return

            const messageToSend = localText.trim()
            stopListening()
            setUserTranscript("")
            setCallState("thinking")

            try {
              const aiReply = await onSendMessage(messageToSend)
              if (aiReply && isComponentMounted.current) {
                setAiTranscript(aiReply)
                speakAIResponse(aiReply, () => {
                  if (isComponentMounted.current) {
                    startListening()
                  }
                })
              } else if (isComponentMounted.current) {
                startListening()
              }
            } catch {
              if (isComponentMounted.current) {
                startListening()
              }
            }
          }, 1400)
        }
      }

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech") return
        if (event.error === "aborted") return
        console.warn("Live speech recognition error:", event.error)
      }

      recognition.onend = () => {
        setMicActive(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.warn("Failed to start Live SpeechRecognition:", err)
    }
  }, [onSendMessage, speakAIResponse, stopListening])

  // ── 3. Lifecycle Initialization ───────────────────────────────────────────
  useEffect(() => {
    isComponentMounted.current = true

    // Pre-warm Web Audio context
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const unlock = new SpeechSynthesisUtterance("")
        unlock.volume = 0
        window.speechSynthesis.speak(unlock)
      } catch {}
    }

    // Start initial listening turn
    const timer = setTimeout(() => {
      startListening()
    }, 400)

    return () => {
      isComponentMounted.current = false
      clearTimeout(timer)
      stopListening()
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try { window.speechSynthesis.cancel() } catch {}
      }
    }
  }, [startListening, stopListening])

  // ── 4. Orb Tap (Interrupt AI Speech) ──────────────────────────────────────
  const handleOrbTap = () => {
    if (callState === "speaking") {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try { window.speechSynthesis.cancel() } catch {}
      }
      startListening()
    }
  }

  // ── 5. Visual Styling ─────────────────────────────────────────────────────
  const getOrbStyles = () => {
    switch (callState) {
      case "listening":
        return {
          background: "linear-gradient(135deg, #FFFFFF, #E5E7EB)",
          boxShadow: "0 0 50px rgba(255, 255, 255, 0.45)",
          transform: micActive ? "scale(1.08)" : "scale(1.0)",
        }
      case "thinking":
        return {
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          boxShadow: "0 0 50px rgba(245, 158, 11, 0.5)",
          transform: "scale(1.12)",
        }
      case "speaking":
        return {
          background: "linear-gradient(135deg, #FF4D6D, #E11D48)",
          boxShadow: "0 0 60px rgba(225, 29, 72, 0.65)",
          transform: "scale(1.18)",
        }
      default:
        return {
          background: "linear-gradient(135deg, #E11D48, #991B1B)",
          boxShadow: "0 0 40px rgba(225, 29, 72, 0.4)",
          transform: "scale(0.95)",
        }
    }
  }

  const getStateText = () => {
    switch (callState) {
      case "listening":
        return micActive ? "Mendengarkan suara kamu..." : "Membuka mikrofon..."
      case "thinking":
        return "FYY-AI sedang berpikir..."
      case "speaking":
        return "FYY-AI sedang berbicara..."
      default:
        return "Menghubungkan panggilan..."
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between p-6 sm:p-12 animate-fade-in"
      style={{
        background: "rgba(8, 8, 10, 0.98)",
        backdropFilter: "blur(32px)",
      }}
    >
      {/* Header */}
      <div className="w-full text-center mt-6 space-y-2">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-rose-400" />
          FYY-AI Live Voice Call
        </h2>

        <p className="text-xs text-rose-400/90 font-semibold tracking-wider animate-pulse-slow">
          {getStateText()}
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-[10px] text-gray-400 font-medium">
          {callState === "listening" && <Mic size={11} className="text-white animate-bounce" />}
          {callState === "speaking" && <Volume2 size={11} className="text-rose-400 animate-pulse" />}
          <span>Percakapan Suara Real-Time Bebas Pulsa</span>
        </div>
      </div>

      {/* Center Interactive Orb */}
      <div className="relative flex items-center justify-center flex-1 w-full max-w-md">
        {/* Ripple Shockwaves */}
        {callState !== "connecting" && (
          <>
            <div
              className="absolute w-40 h-40 sm:w-56 sm:h-56 rounded-full border-2 border-rose-500/30 animate-ripple"
              style={{ animationDuration: callState === "speaking" ? "1.5s" : "2.8s" }}
            />
            <div
              className="absolute w-52 h-52 sm:w-72 sm:h-72 rounded-full border border-rose-500/20 animate-ripple"
              style={{
                animationDuration: callState === "speaking" ? "2.0s" : "3.6s",
                animationDelay: "0.4s",
              }}
            />
          </>
        )}

        {/* Central Orb */}
        <button
          type="button"
          onClick={handleOrbTap}
          style={getOrbStyles()}
          className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full transition-all duration-500 ease-out flex items-center justify-center cursor-pointer select-none overflow-hidden"
          title={callState === "speaking" ? "Ketuk untuk menyela suara AI" : ""}
        >
          <div
            className={`w-3/4 h-3/4 rounded-full bg-white/20 blur-md pointer-events-none transition-all duration-300 ${
              callState === "speaking" ? "animate-pulse" : ""
            }`}
          />
          <div className="absolute top-2.5 left-5 w-10 h-5 bg-white/40 rounded-full rotate-[-45deg] blur-[2px] opacity-70 pointer-events-none" />
        </button>
      </div>

      {/* Real-time Transcript & Subtitle Area */}
      <div className="w-full max-w-md min-h-[80px] mb-4 flex flex-col items-center justify-center text-center px-4">
        {callState === "listening" && userTranscript && (
          <p className="text-gray-300 text-sm sm:text-base font-medium italic animate-fade-in line-clamp-3">
            "{userTranscript}..."
          </p>
        )}

        {callState === "speaking" && aiTranscript && (
          <div className="space-y-1 animate-fade-in">
            <p className="text-white text-sm sm:text-base font-semibold leading-relaxed line-clamp-3">
              {aiTranscript}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
              Ketuk bola tengah untuk menyela
            </p>
          </div>
        )}
      </div>

      {/* End Call Button */}
      <div className="w-full flex justify-center mb-6">
        <button
          type="button"
          onClick={onEndCall}
          className="bg-red-600 hover:bg-red-700 text-white p-5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          title="Tutup Panggilan"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  )
}
