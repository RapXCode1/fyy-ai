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
  const [liveVolume, setLiveVolume] = useState(0)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const isUserSpeakingRef = useRef(false)
  const silenceTimerRef = useRef<any>(null)
  const animFrameRef = useRef<number | null>(null)
  const isComponentMounted = useRef(true)
  const isAiBusyRef = useRef(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const watchdogRef = useRef<any>(null)

  // ── 1. Text-to-Speech Engine (Crystal Clear Response Playback) ────────────
  const playAISpeech = useCallback((text: string, onFinish: () => void) => {
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

    // Stop ongoing audio
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

    let isDone = false
    const finishSpeech = () => {
      if (isDone) return
      isDone = true
      if (watchdogRef.current) clearTimeout(watchdogRef.current)
      if (isComponentMounted.current) {
        isAiBusyRef.current = false
        onFinish()
      }
    }

    // Safety watchdog: max 12s per speech turn
    const maxDuration = Math.min(12000, Math.max(2500, cleanText.length * 85))
    if (watchdogRef.current) clearTimeout(watchdogRef.current)
    watchdogRef.current = setTimeout(finishSpeech, maxDuration)

    // Method A: Direct Client TTS Audio Player
    try {
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encodeURIComponent(
        cleanText.substring(0, 200)
      )}`
      const audio = new Audio(audioUrl)
      currentAudioRef.current = audio

      audio.onplay = () => {
        if (isComponentMounted.current) {
          setCallState("speaking")
          isAiBusyRef.current = true
        }
      }

      audio.onended = () => {
        currentAudioRef.current = null
        finishSpeech()
      }

      audio.onerror = () => {
        fallbackSpeechSynthesis(cleanText, finishSpeech)
      }

      const p = audio.play()
      if (p !== undefined) {
        p.catch(() => {
          fallbackSpeechSynthesis(cleanText, finishSpeech)
        })
      }
    } catch {
      fallbackSpeechSynthesis(cleanText, finishSpeech)
    }
  }, [])

  const fallbackSpeechSynthesis = (text: string, onDone: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onDone()
      return
    }

    try {
      window.speechSynthesis.cancel()
      window.speechSynthesis.resume()

      const utterance = new SpeechSynthesisUtterance(text.substring(0, 250))
      utterance.lang = "id-ID"
      utterance.rate = 1.05
      utterance.volume = 1.0

      const voices = window.speechSynthesis.getVoices()
      const idVoice =
        voices.find((v) => v.lang.includes("id") || v.lang.includes("ID")) ||
        voices.find((v) => v.name.toLowerCase().includes("indonesia"))

      if (idVoice) utterance.voice = idVoice

      utterance.onstart = () => {
        if (isComponentMounted.current) {
          setCallState("speaking")
          isAiBusyRef.current = true
        }
      }

      utterance.onend = onDone
      utterance.onerror = onDone

      ;(window as any).__liveVoiceUtterance = utterance
      window.speechSynthesis.speak(utterance)
    } catch {
      onDone()
    }
  }

  // ── 2. Speech-to-Text Pipeline (Groq Whisper Turbo) ───────────────────────
  const processRecordedAudio = useCallback(async () => {
    if (audioChunksRef.current.length === 0 || !isComponentMounted.current) {
      if (isComponentMounted.current && !isAiBusyRef.current) {
        startListeningSession()
      }
      return
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/mp4")
      ? "audio/mp4"
      : "audio/webm"

    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
    audioChunksRef.current = []

    if (audioBlob.size < 1500) {
      // Audio too short (noise/click) -> continue listening
      if (isComponentMounted.current && !isAiBusyRef.current) {
        startListeningSession()
      }
      return
    }

    setCallState("thinking")
    isAiBusyRef.current = true

    try {
      const formData = new FormData()
      formData.append("file", audioBlob, "user_speech.webm")

      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      const text = (data.text || "").trim()

      if (text && isComponentMounted.current) {
        setUserTranscript(text)
        const aiReply = await onSendMessage(text)

        if (aiReply && isComponentMounted.current) {
          setAiTranscript(aiReply)
          playAISpeech(aiReply, () => {
            if (isComponentMounted.current) {
              setCallState("listening")
              startListeningSession()
            }
          })
        } else if (isComponentMounted.current) {
          setCallState("listening")
          startListeningSession()
        }
      } else if (isComponentMounted.current) {
        // No recognizable speech -> resume listening
        setCallState("listening")
        startListeningSession()
      }
    } catch (error) {
      console.error("STT Error:", error)
      if (isComponentMounted.current) {
        setCallState("listening")
        startListeningSession()
      }
    }
  }, [onSendMessage, playAISpeech])

  // ── 3. Real-Time VAD (Voice Activity Detection) ───────────────────────────
  const startListeningSession = useCallback(() => {
    if (!isComponentMounted.current || isAiBusyRef.current) return

    setCallState("listening")
    isUserSpeakingRef.current = false
    audioChunksRef.current = []

    if (!mediaStreamRef.current) return

    try {
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm"

      const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        processRecordedAudio()
      }

      recorder.start(100) // Collect chunks every 100ms
    } catch (err) {
      console.warn("MediaRecorder start error:", err)
    }
  }, [processRecordedAudio])

  const stopCurrentRecording = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop()
      } catch {}
    }
  }, [])

  // ── 4. Web Audio Context & Volume Monitoring Loop ─────────────────────────
  const initAudioStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      mediaStreamRef.current = stream

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      audioContextRef.current = ctx

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)

      // Start live volume loop
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const checkVolume = () => {
        if (!isComponentMounted.current) return

        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const avg = sum / bufferLength
        setLiveVolume(avg)

        // VAD Threshold: Average volume > 10 means speech is detected
        if (!isAiBusyRef.current) {
          if (avg > 12) {
            isUserSpeakingRef.current = true
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current)
              silenceTimerRef.current = null
            }
          } else if (isUserSpeakingRef.current && avg <= 12) {
            // User was speaking and is now silent: trigger silence timer (1.2s)
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                isUserSpeakingRef.current = false
                stopCurrentRecording()
              }, 1200)
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(checkVolume)
      }

      animFrameRef.current = requestAnimationFrame(checkVolume)
      startListeningSession()
    } catch (err) {
      console.error("Microphone access failed:", err)
      setCallState("listening")
    }
  }, [startListeningSession, stopCurrentRecording])

  // ── 5. Lifecycle Initialization ───────────────────────────────────────────
  useEffect(() => {
    isComponentMounted.current = true
    isAiBusyRef.current = false

    // Prime Web Speech & Audio
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const unlock = new SpeechSynthesisUtterance("")
        unlock.volume = 0
        window.speechSynthesis.speak(unlock)
      } catch {}
    }

    initAudioStream()

    return () => {
      isComponentMounted.current = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      if (watchdogRef.current) clearTimeout(watchdogRef.current)

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        try { mediaRecorderRef.current.stop() } catch {}
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (audioContextRef.current) {
        try { audioContextRef.current.close() } catch {}
      }

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
  }, [initAudioStream])

  // ── 6. Interactive Orb Tap ────────────────────────────────────────────────
  const handleOrbTap = () => {
    if (callState === "speaking") {
      // Interrupt AI speech immediately
      if (watchdogRef.current) clearTimeout(watchdogRef.current)
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
      isAiBusyRef.current = false
      setCallState("listening")
      startListeningSession()
    } else if (callState === "listening" && isUserSpeakingRef.current) {
      // Send speech immediately
      isUserSpeakingRef.current = false
      stopCurrentRecording()
    }
  }

  // ── 7. Dynamic Orb Visuals ────────────────────────────────────────────────
  const getOrbScale = () => {
    if (callState === "speaking") return 1.15
    if (callState === "thinking") return 1.08
    // Live volume scaling during user speech
    const volumeScale = 1.0 + Math.min(0.25, liveVolume / 100)
    return volumeScale
  }

  const getOrbStyles = () => {
    const scale = getOrbScale()
    switch (callState) {
      case "listening":
        return {
          background: "linear-gradient(135deg, #FFFFFF, #E5E7EB)",
          boxShadow: `0 0 ${35 + liveVolume}px rgba(255, 255, 255, ${0.4 + liveVolume / 150})`,
          transform: `scale(${scale})`,
        }
      case "thinking":
        return {
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          boxShadow: "0 0 50px rgba(245, 158, 11, 0.5)",
          transform: `scale(${scale})`,
        }
      case "speaking":
        return {
          background: "linear-gradient(135deg, #FF4D6D, #E11D48)",
          boxShadow: "0 0 60px rgba(225, 29, 72, 0.65)",
          transform: `scale(${scale})`,
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
        return isUserSpeakingRef.current ? "Mendengarkan ucapanmu..." : "Silakan bicara, aku mendengarkan..."
      case "thinking":
        return "FYY-AI sedang memproses..."
      case "speaking":
        return "FYY-AI sedang berbicara..."
      default:
        return "Menghubungkan panggilan audio..."
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
          FYY-AI Real-Time Voice Call
        </h2>

        <p className="text-xs text-rose-400 font-semibold tracking-wider animate-pulse-slow">
          {getStateText()}
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-[10px] text-gray-400 font-medium">
          {callState === "listening" && <Mic size={11} className="text-white animate-bounce" />}
          {callState === "speaking" && <Volume2 size={11} className="text-rose-400 animate-pulse" />}
          <span>ChatGPT/Gemini Style Real-Time VAD Voice Architecture</span>
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
          className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full transition-all duration-200 ease-out flex items-center justify-center cursor-pointer select-none overflow-hidden active:scale-95"
          title={
            callState === "speaking"
              ? "Ketuk untuk menyela suara AI"
              : isUserSpeakingRef.current
              ? "Ketuk untuk langsung kirim"
              : ""
          }
        >
          <div
            className={`w-3/4 h-3/4 rounded-full bg-white/20 blur-md pointer-events-none transition-all duration-300 ${
              callState === "speaking" || isUserSpeakingRef.current ? "animate-pulse" : ""
            }`}
          />
          <div className="absolute top-2.5 left-5 w-10 h-5 bg-white/40 rounded-full rotate-[-45deg] blur-[2px] opacity-70 pointer-events-none" />
        </button>
      </div>

      {/* Real-time Subtitle / Transcript Area */}
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
