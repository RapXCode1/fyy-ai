"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PhoneOff, Sparkles, Mic, Volume2 } from "lucide-react"

interface LiveVoiceModalProps {
  onEndCall: () => void
  onSendMessage: (message: string) => Promise<string | void>
}

export default function LiveVoiceModal({ onEndCall, onSendMessage }: LiveVoiceModalProps) {
  const [callState, setCallState] = useState<"connecting" | "listening" | "thinking" | "speaking">("connecting")
  const [userTranscript, setUserTranscript] = useState("")
  const [aiTranscript, setAiTranscript] = useState("")
  const [liveVolume, setLiveVolume] = useState(0)

  // Refs that survive re-renders without triggering them
  const isMounted = useRef(false)
  const isAiBusy = useRef(false)
  const isRecording = useRef(false) // NEW: single-source-of-truth for recording state
  const isUserSpeaking = useRef(false)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animFrame = useRef<number | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const currentAudio = useRef<HTMLAudioElement | null>(null)
  const callStateRef = useRef<"connecting" | "listening" | "thinking" | "speaking">("connecting")

  // Keep callStateRef in sync
  useEffect(() => {
    callStateRef.current = callState
  }, [callState])

  // ── Utility: Clear timers ──────────────────────────────────────────────────
  const clearSilenceTimer = () => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current)
      silenceTimer.current = null
    }
  }

  const clearWatchdog = () => {
    if (watchdog.current) {
      clearTimeout(watchdog.current)
      watchdog.current = null
    }
  }

  // ── 1. Stop Recording (Safe / Idempotent) ─────────────────────────────────
  const stopRecording = useCallback(() => {
    clearSilenceTimer()
    isUserSpeaking.current = false
    isRecording.current = false

    if (recorder.current && recorder.current.state === "recording") {
      try {
        recorder.current.stop()
      } catch {}
    }
  }, [])

  // ── 2. Start a Single Listening Session (Guarded) ─────────────────────────
  const startListening = useCallback(() => {
    if (!isMounted.current || isAiBusy.current || isRecording.current) return
    if (!mediaStream.current) return

    isRecording.current = true
    isUserSpeaking.current = false
    audioChunks.current = []
    clearSilenceTimer()

    try {
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm"

      const rec = new MediaRecorder(mediaStream.current, { mimeType })
      recorder.current = rec

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0 && isMounted.current) {
          audioChunks.current.push(e.data)
        }
      }

      rec.onstop = () => {
        isRecording.current = false
        // Only process if component is still mounted and NOT already busy
        if (isMounted.current && !isAiBusy.current) {
          sendAudioToSTT()
        }
      }

      rec.start(100)
    } catch (err) {
      console.warn("MediaRecorder error:", err)
      isRecording.current = false
    }
  }, [])

  // ── 3. Send Audio to Groq Whisper STT → Get AI Response ──────────────────
  const sendAudioToSTT = useCallback(async () => {
    if (!isMounted.current) return

    const chunks = audioChunks.current.slice()
    audioChunks.current = []

    // Ignore very short or empty captures (noise/clicks)
    const totalSize = chunks.reduce((s, c) => s + c.size, 0)
    if (totalSize < 1500) {
      if (isMounted.current && !isAiBusy.current) {
        startListening()
      }
      return
    }

    const mimeType = chunks[0]?.type || "audio/webm"
    const audioBlob = new Blob(chunks, { type: mimeType })

    isAiBusy.current = true
    setCallState("thinking")

    try {
      const formData = new FormData()
      formData.append("file", audioBlob, "speech.webm")

      const res = await fetch("/api/voice/transcribe", { method: "POST", body: formData })
      const data = await res.json()
      const text = (data.text || "").trim()

      if (!text || !isMounted.current) {
        isAiBusy.current = false
        if (isMounted.current) startListening()
        return
      }

      setUserTranscript(text)
      const aiReply = await onSendMessage(text)

      if (!isMounted.current) return

      if (aiReply) {
        setAiTranscript(aiReply)
        playAI(aiReply, () => {
          if (isMounted.current) {
            setCallState("listening")
            startListening()
          }
        })
      } else {
        isAiBusy.current = false
        setCallState("listening")
        startListening()
      }
    } catch (err) {
      console.error("STT or AI error:", err)
      isAiBusy.current = false
      if (isMounted.current) {
        setCallState("listening")
        startListening()
      }
    }
  }, [onSendMessage, startListening])

  // ── 4. Play AI Audio Response ─────────────────────────────────────────────
  const playAI = useCallback((text: string, onDone: () => void) => {
    if (!isMounted.current) { onDone(); return }

    const clean = text
      .replace(/```[\s\S]*?```/g, " Blok kode. ")
      .replace(/[*_#`~>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/-\s/g, "")
      .trim()

    if (!clean) { isAiBusy.current = false; onDone(); return }

    // Stop any existing audio
    if (currentAudio.current) {
      try {
        currentAudio.current.pause()
        currentAudio.current.currentTime = 0
      } catch {}
      currentAudio.current = null
    }
    if ("speechSynthesis" in window) {
      try { window.speechSynthesis.cancel() } catch {}
    }

    clearWatchdog()

    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearWatchdog()
      isAiBusy.current = false
      if (isMounted.current) onDone()
    }

    // Watchdog: max 15s per turn
    watchdog.current = setTimeout(finish, Math.min(15000, Math.max(3000, clean.length * 90)))

    setCallState("speaking")

    // Method 1: Web SpeechSynthesis with GC lock
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel()
        window.speechSynthesis.resume()

        const utt = new SpeechSynthesisUtterance(clean.substring(0, 250))
        utt.lang = "id-ID"
        utt.rate = 1.05
        utt.volume = 1.0

        const voices = window.speechSynthesis.getVoices()
        const idVoice =
          voices.find((v) => v.lang.includes("id") || v.lang.includes("ID")) ||
          voices.find((v) => v.name.toLowerCase().includes("indonesia"))
        if (idVoice) utt.voice = idVoice

        utt.onend = finish
        utt.onerror = () => playDirectAudio(clean, finish)
        ;(window as any).__fyyVoiceUtt = utt // prevent GC
        window.speechSynthesis.speak(utt)
        return
      } catch {}
    }

    playDirectAudio(clean, finish)
  }, [])

  const playDirectAudio = (text: string, onDone: () => void) => {
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encodeURIComponent(
        text.substring(0, 200)
      )}`
      const audio = new Audio(url)
      currentAudio.current = audio
      audio.onended = () => { currentAudio.current = null; onDone() }
      audio.onerror = onDone
      const p = audio.play()
      if (p !== undefined) p.catch(onDone)
    } catch {
      onDone()
    }
  }

  // ── 5. Web Audio VAD Loop ─────────────────────────────────────────────────
  const initAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })

      mediaStream.current = stream

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      audioCtx.current = ctx

      const an = ctx.createAnalyser()
      an.fftSize = 256
      analyser.current = an

      const src = ctx.createMediaStreamSource(stream)
      src.connect(an)

      const buf = new Uint8Array(an.frequencyBinCount)

      const tick = () => {
        if (!isMounted.current) return

        an.getByteFrequencyData(buf)
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length
        setLiveVolume(avg)

        // VAD: only react when not AI busy and actively recording
        if (!isAiBusy.current && isRecording.current) {
          if (avg > 12) {
            isUserSpeaking.current = true
            clearSilenceTimer()
          } else if (isUserSpeaking.current) {
            if (!silenceTimer.current) {
              silenceTimer.current = setTimeout(() => {
                silenceTimer.current = null
                if (!isAiBusy.current && isRecording.current && isMounted.current) {
                  stopRecording()
                }
              }, 1200)
            }
          }
        }

        animFrame.current = requestAnimationFrame(tick)
      }

      animFrame.current = requestAnimationFrame(tick)

      // Begin first listening session after small delay
      setTimeout(() => {
        if (isMounted.current) startListening()
      }, 400)
    } catch (err) {
      console.error("Microphone init failed:", err)
      setCallState("listening")
    }
  }, [startListening, stopRecording])

  // ── 6. Lifecycle ──────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true
    isAiBusy.current = false
    isRecording.current = false

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance(""); u.volume = 0
        window.speechSynthesis.speak(u)
      } catch {}
    }

    initAudio()

    return () => {
      isMounted.current = false
      isAiBusy.current = true // stop any pending callbacks from continuing
      isRecording.current = false

      if (animFrame.current) cancelAnimationFrame(animFrame.current)
      clearSilenceTimer()
      clearWatchdog()

      if (recorder.current && recorder.current.state === "recording") {
        // Prevent onstop from triggering STT on teardown
        recorder.current.ondataavailable = null
        recorder.current.onstop = null
        try { recorder.current.stop() } catch {}
        recorder.current = null
      }

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((t) => t.stop())
        mediaStream.current = null
      }

      if (audioCtx.current) {
        try { audioCtx.current.close() } catch {}
        audioCtx.current = null
      }

      if (currentAudio.current) {
        try {
          currentAudio.current.pause()
          currentAudio.current.currentTime = 0
        } catch {}
        currentAudio.current = null
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try { window.speechSynthesis.cancel() } catch {}
      }
    }
  }, [initAudio])

  // ── 7. Orb Tap Interaction ────────────────────────────────────────────────
  const handleOrbTap = () => {
    if (callState === "speaking") {
      clearWatchdog()
      if (currentAudio.current) {
        try { currentAudio.current.pause(); currentAudio.current.currentTime = 0 } catch {}
        currentAudio.current = null
      }
      if ("speechSynthesis" in window) {
        try { window.speechSynthesis.cancel() } catch {}
      }
      isAiBusy.current = false
      setCallState("listening")
      startListening()
    } else if (callState === "listening" && isUserSpeaking.current) {
      // Manually trigger send
      stopRecording()
    }
  }

  // ── 8. Dynamic Visuals ────────────────────────────────────────────────────
  const getOrbStyles = () => {
    const vScale = callState === "listening" ? 1.0 + Math.min(0.2, liveVolume / 120) : 1.0
    switch (callState) {
      case "listening":
        return {
          background: "linear-gradient(135deg, #FFFFFF, #E5E7EB)",
          boxShadow: `0 0 ${36 + liveVolume * 0.5}px rgba(255,255,255,${0.4 + liveVolume / 200})`,
          transform: `scale(${vScale})`,
        }
      case "thinking":
        return {
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          boxShadow: "0 0 50px rgba(245,158,11,0.5)",
          transform: "scale(1.1)",
        }
      case "speaking":
        return {
          background: "linear-gradient(135deg, #FF4D6D, #E11D48)",
          boxShadow: "0 0 60px rgba(225,29,72,0.65)",
          transform: "scale(1.18)",
        }
      default:
        return {
          background: "linear-gradient(135deg, #E11D48, #991B1B)",
          boxShadow: "0 0 40px rgba(225,29,72,0.4)",
          transform: "scale(0.92)",
        }
    }
  }

  const stateLabel = {
    connecting: "Menghubungkan mikrofon...",
    listening: isUserSpeaking.current ? "Mendengarkan suaramu..." : "Silakan bicara...",
    thinking: "FYY-AI sedang memproses...",
    speaking: "FYY-AI sedang berbicara...",
  }[callState]

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between p-6 sm:p-12 animate-fade-in"
      style={{ background: "rgba(8,8,10,0.98)", backdropFilter: "blur(32px)" }}
    >
      <div className="w-full text-center mt-6 space-y-2">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-rose-400" />
          FYY-AI Live Voice Call
        </h2>
        <p className="text-xs text-rose-400 font-semibold tracking-wider animate-pulse-slow">{stateLabel}</p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-[10px] text-gray-400 font-medium">
          {callState === "listening" && <Mic size={11} className="text-white animate-bounce" />}
          {callState === "speaking" && <Volume2 size={11} className="text-rose-400 animate-pulse" />}
          <span>Real-Time VAD · Groq Whisper · Neural TTS</span>
        </div>
      </div>

      <div className="relative flex items-center justify-center flex-1 w-full max-w-md">
        {callState !== "connecting" && (
          <>
            <div
              className="absolute w-40 h-40 sm:w-56 sm:h-56 rounded-full border-2 border-rose-500/30 animate-ripple"
              style={{ animationDuration: callState === "speaking" ? "1.5s" : "2.8s" }}
            />
            <div
              className="absolute w-52 h-52 sm:w-72 sm:h-72 rounded-full border border-rose-500/20 animate-ripple"
              style={{ animationDuration: callState === "speaking" ? "2.0s" : "3.6s", animationDelay: "0.4s" }}
            />
          </>
        )}
        <button
          type="button"
          onClick={handleOrbTap}
          style={getOrbStyles()}
          className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full transition-all duration-200 ease-out flex items-center justify-center cursor-pointer select-none overflow-hidden active:scale-95"
          title={callState === "speaking" ? "Ketuk untuk menyela" : "Ketuk untuk kirim segera"}
        >
          <div
            className={`w-3/4 h-3/4 rounded-full bg-white/20 blur-md pointer-events-none ${
              callState === "speaking" ? "animate-pulse" : ""
            }`}
          />
          <div className="absolute top-2.5 left-5 w-10 h-5 bg-white/40 rounded-full rotate-[-45deg] blur-[2px] opacity-70 pointer-events-none" />
        </button>
      </div>

      <div className="w-full max-w-md min-h-[80px] mb-4 flex flex-col items-center justify-center text-center px-4">
        {callState === "listening" && userTranscript && (
          <p className="text-gray-300 text-sm italic animate-fade-in line-clamp-3">"{userTranscript}..."</p>
        )}
        {callState === "speaking" && aiTranscript && (
          <div className="space-y-1 animate-fade-in">
            <p className="text-white text-sm font-semibold leading-relaxed line-clamp-3">{aiTranscript}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Ketuk bola untuk menyela</p>
          </div>
        )}
      </div>

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
