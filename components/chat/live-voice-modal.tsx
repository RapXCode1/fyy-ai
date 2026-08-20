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
  const [transcript, setTranscript] = useState("")
  const [aiText, setAiText] = useState("")

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<any>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const isComponentMounted = useRef(true)
  const latestTranscriptRef = useRef("")
  const isProcessingRef = useRef(false)
  const watchdogTimerRef = useRef<any>(null)

  // ── 1. Guaranteed Audio Playback Engine ───────────────────────────────────
  const playSpeech = useCallback((text: string, onFinish: () => void) => {
    if (typeof window === "undefined" || !isComponentMounted.current) {
      onFinish()
      return
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, " Berikut blok kode. ")
      .replace(/[*_#`~>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/-\s/g, "")
      .trim()

    if (!cleanText) {
      onFinish()
      return
    }

    // Stop ongoing audio/speech
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
      } catch {}
      currentAudioRef.current = null
    }
    if ("speechSynthesis" in window) {
      try { window.speechSynthesis.cancel() } catch {}
    }

    let finished = false
    const safeFinish = () => {
      if (finished) return
      finished = true
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current)
      if (isComponentMounted.current) {
        isProcessingRef.current = false
        onFinish()
      }
    }

    // Safety watchdog: guarantees speech turn ends even if mobile audio stalls
    const estimatedDuration = Math.min(12000, Math.max(2500, cleanText.length * 90))
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current)
    watchdogTimerRef.current = setTimeout(safeFinish, estimatedDuration)

    // Method A: Native SpeechSynthesis with Chrome/Safari GC Lock
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel()
        window.speechSynthesis.resume()

        const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 260))
        utterance.lang = "id-ID"
        utterance.rate = 1.05
        utterance.volume = 1.0

        const voices = window.speechSynthesis.getVoices()
        const idVoice =
          voices.find((v) => v.lang.includes("id") || v.lang.includes("ID")) ||
          voices.find((v) => v.name.toLowerCase().includes("indonesia") || v.name.toLowerCase().includes("andika"))

        if (idVoice) utterance.voice = idVoice

        utterance.onstart = () => {
          if (isComponentMounted.current) {
            setCallState("speaking")
            isProcessingRef.current = true
          }
        }

        utterance.onend = safeFinish
        utterance.onerror = () => {
          // If speech synthesis fails, fallback to direct audio player
          playClientAudio(cleanText, safeFinish)
        }

        // Lock to global window to prevent garbage collection on mobile
        ;(window as any).__liveUtterance = utterance
        window.speechSynthesis.speak(utterance)
        return
      } catch {
        playClientAudio(cleanText, safeFinish)
      }
    } else {
      playClientAudio(cleanText, safeFinish)
    }
  }, [])

  const playClientAudio = (text: string, onDone: () => void) => {
    try {
      const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encodeURIComponent(
        text.substring(0, 200)
      )}`
      const audio = new Audio(directUrl)
      currentAudioRef.current = audio

      audio.onplay = () => {
        if (isComponentMounted.current) {
          setCallState("speaking")
          isProcessingRef.current = true
        }
      }

      audio.onended = () => {
        currentAudioRef.current = null
        onDone()
      }

      audio.onerror = onDone

      const p = audio.play()
      if (p !== undefined) {
        p.catch(onDone)
      }
    } catch {
      onDone()
    }
  }

  // ── 2. Speech Recognition (Listening Turn) ────────────────────────────────
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
  }, [])

  const sendSpeech = useCallback(
    async (textToSend: string) => {
      if (!textToSend.trim() || !isComponentMounted.current) return

      stopListening()
      setTranscript("")
      latestTranscriptRef.current = ""
      setCallState("thinking")
      isProcessingRef.current = true

      try {
        const response = await onSendMessage(textToSend.trim())
        if (response && isComponentMounted.current) {
          setAiText(response)
          playSpeech(response, () => {
            if (isComponentMounted.current) {
              setCallState("listening")
              startListeningTurn()
            }
          })
        } else if (isComponentMounted.current) {
          setCallState("listening")
          startListeningTurn()
        }
      } catch {
        if (isComponentMounted.current) {
          setCallState("listening")
          startListeningTurn()
        }
      }
    },
    [onSendMessage, playSpeech, stopListening]
  )

  const startListeningTurn = useCallback(() => {
    if (!isComponentMounted.current || isProcessingRef.current) return
    stopListening()

    const SpeechRecognitionClass =
      typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null

    if (!SpeechRecognitionClass) {
      setCallState("listening")
      return
    }

    try {
      const recognition = new SpeechRecognitionClass()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = "id-ID"

      recognition.onstart = () => {
        if (isComponentMounted.current && !isProcessingRef.current) {
          setCallState("listening")
        }
      }

      recognition.onresult = (event: any) => {
        let full = ""
        for (let i = 0; i < event.results.length; i++) {
          full += event.results[i][0].transcript
        }

        const candidate = full.trim()
        if (candidate) {
          setTranscript(candidate)
          latestTranscriptRef.current = candidate

          // Silence timeout: auto-send after 1.3s of silence
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = setTimeout(() => {
            if (latestTranscriptRef.current && !isProcessingRef.current) {
              sendSpeech(latestTranscriptRef.current)
            }
          }, 1300)
        }
      }

      recognition.onerror = () => {
        if (isComponentMounted.current && !isProcessingRef.current) {
          setTimeout(() => {
            if (isComponentMounted.current && !isProcessingRef.current) {
              startListeningTurn()
            }
          }, 400)
        }
      }

      recognition.onend = () => {
        if (latestTranscriptRef.current && !isProcessingRef.current) {
          sendSpeech(latestTranscriptRef.current)
        } else if (isComponentMounted.current && !isProcessingRef.current) {
          setTimeout(() => {
            if (isComponentMounted.current && !isProcessingRef.current) {
              startListeningTurn()
            }
          }, 300)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setTimeout(() => {
        if (isComponentMounted.current && !isProcessingRef.current) {
          startListeningTurn()
        }
      }, 500)
    }
  }, [sendSpeech, stopListening])

  // ── 3. Lifecycle Initialization ───────────────────────────────────────────
  useEffect(() => {
    isComponentMounted.current = true
    isProcessingRef.current = false

    // Unlock browser speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const unlock = new SpeechSynthesisUtterance("")
        unlock.volume = 0
        window.speechSynthesis.speak(unlock)
      } catch {}
    }

    const timer = setTimeout(() => {
      startListeningTurn()
    }, 300)

    return () => {
      isComponentMounted.current = false
      clearTimeout(timer)
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current)
      stopListening()

      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause()
          currentAudioRef.current.currentTime = 0
        } catch {}
        currentAudioRef.current = null
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try { window.speechSynthesis.cancel() } catch {}
      }
    }
  }, [startListeningTurn, stopListening])

  // ── 4. Orb Tap (Interrupt AI or Send Now) ─────────────────────────────────
  const handleOrbTap = () => {
    if (callState === "speaking") {
      // Interrupt AI speech
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current)
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause()
          currentAudioRef.current.currentTime = 0
        } catch {}
        currentAudioRef.current = null
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try { window.speechSynthesis.cancel() } catch {}
      }
      isProcessingRef.current = false
      setCallState("listening")
      startListeningTurn()
    } else if (callState === "listening" && transcript.trim()) {
      sendSpeech(transcript.trim())
    }
  }

  // ── 5. Visual Styling ─────────────────────────────────────────────────────
  const getOrbStyles = () => {
    switch (callState) {
      case "listening":
        return {
          background: "linear-gradient(135deg, #FFFFFF, #E5E7EB)",
          boxShadow: "0 0 50px rgba(255, 255, 255, 0.45)",
          transform: transcript ? "scale(1.1)" : "scale(1.0)",
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
        return transcript ? "Mendengarkan ucapanmu..." : "Silakan bicara, aku mendengarkan..."
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

        <p className="text-xs text-rose-400 font-semibold tracking-wider animate-pulse-slow">
          {getStateText()}
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-[10px] text-gray-400 font-medium">
          {callState === "listening" && <Mic size={11} className="text-white animate-bounce" />}
          {callState === "speaking" && <Volume2 size={11} className="text-rose-400 animate-pulse" />}
          <span>Panggilan Suara Real-Time Bebas Pulsa</span>
        </div>
      </div>

      {/* Center Interactive Orb with Audio Shockwaves */}
      <div className="relative flex items-center justify-center flex-1 w-full max-w-md">
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

        <button
          type="button"
          onClick={handleOrbTap}
          style={getOrbStyles()}
          className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full transition-all duration-500 ease-out flex items-center justify-center cursor-pointer select-none overflow-hidden active:scale-95"
          title={
            callState === "speaking"
              ? "Ketuk untuk menyela suara AI"
              : callState === "listening" && transcript
              ? "Ketuk untuk langsung kirim"
              : ""
          }
        >
          <div
            className={`w-3/4 h-3/4 rounded-full bg-white/20 blur-md pointer-events-none transition-all duration-300 ${
              callState === "speaking" || transcript ? "animate-pulse" : ""
            }`}
          />
          <div className="absolute top-2.5 left-5 w-10 h-5 bg-white/40 rounded-full rotate-[-45deg] blur-[2px] opacity-70 pointer-events-none" />
        </button>
      </div>

      {/* Real-time Subtitle / Transcript Area */}
      <div className="w-full max-w-md min-h-[80px] mb-4 flex flex-col items-center justify-center text-center px-4">
        {callState === "listening" && transcript && (
          <p className="text-white text-sm sm:text-base font-medium italic animate-fade-in line-clamp-3">
            "{transcript}..."
          </p>
        )}

        {callState === "speaking" && aiText && (
          <div className="space-y-1 animate-fade-in">
            <p className="text-white text-sm sm:text-base font-semibold leading-relaxed line-clamp-3">
              {aiText}
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
