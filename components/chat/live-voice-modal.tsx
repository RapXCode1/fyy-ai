"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PhoneOff, Sparkles, Mic, Volume2, RefreshCw } from "lucide-react"

interface LiveVoiceModalProps {
  onEndCall: () => void
  onSendMessage: (message: string) => Promise<string | void>
}

export default function LiveVoiceModal({ onEndCall, onSendMessage }: LiveVoiceModalProps) {
  const [callState, setCallState] = useState<"connecting" | "listening" | "thinking" | "speaking" | "error">("connecting")
  const [userTranscript, setUserTranscript] = useState("")
  const [aiTranscript, setAiTranscript] = useState("")
  const [liveVolume, setLiveVolume] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")

  const isMounted = useRef(false)
  const isAiBusy = useRef(false)
  const isRecording = useRef(false)
  const isUserSpeaking = useRef(false)
  const speechFrameCount = useRef(0)

  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animFrame = useRef<number | null>(null)

  const mediaStream = useRef<MediaStream | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null)

  // ── Helper: clear timers ──────────────────────────────────────────────────
  const clearSilenceTimer = () => {
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null }
  }
  const clearWatchdog = () => {
    if (watchdog.current) { clearTimeout(watchdog.current); watchdog.current = null }
  }

  // ── 1. Play AI Speech via AudioContext ────────────────────────────────────
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
    if (currentAudioSource.current) {
      try { currentAudioSource.current.stop(); currentAudioSource.current.disconnect() } catch {}
      currentAudioSource.current = null
    }

    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearWatchdog()
      isAiBusy.current = false
      if (isMounted.current) onDone()
    }

    // Safety watchdog: max 18s per turn
    watchdog.current = setTimeout(finish, Math.min(18000, Math.max(3500, clean.length * 80)))

    setCallState("speaking")

    const ctx = audioCtx.current
    if (!ctx) { finish(); return }

    const doPlay = async () => {
      try {
        if (ctx.state === "suspended") await ctx.resume()
        if (ctx.state === "closed") { finish(); return }

        const res = await fetch(`/api/tts?text=${encodeURIComponent(clean.substring(0, 240))}`)
        if (!res.ok || !isMounted.current) {
          fallbackTTS(clean, finish)
          return
        }

        const arrayBuf = await res.arrayBuffer()
        if (!isMounted.current) { finish(); return }

        const audioBuf = await ctx.decodeAudioData(arrayBuf)
        if (!isMounted.current) { finish(); return }

        const src = ctx.createBufferSource()
        src.buffer = audioBuf
        src.connect(ctx.destination)
        src.onended = finish
        currentAudioSource.current = src
        src.start(0)
      } catch (err) {
        console.warn("AudioContext TTS failed, fallback SpeechSynthesis:", err)
        fallbackTTS(clean, finish)
      }
    }

    doPlay()
  }, [])

  const fallbackTTS = (text: string, onDone: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { onDone(); return }
    try {
      window.speechSynthesis.cancel()
      window.speechSynthesis.resume()
      const utt = new SpeechSynthesisUtterance(text.substring(0, 220))
      utt.lang = "id-ID"
      utt.rate = 1.05
      utt.volume = 1.0
      const voices = window.speechSynthesis.getVoices()
      const idVoice = voices.find((v) => v.lang.includes("id") || v.lang.includes("ID"))
      if (idVoice) utt.voice = idVoice
      utt.onend = onDone
      utt.onerror = onDone
      ;(window as any).__fyyVoiceUtt = utt
      window.speechSynthesis.speak(utt)
    } catch { onDone() }
  }

  // ── 2. Stop current recording session ─────────────────────────────────────
  const stopRecording = useCallback(() => {
    clearSilenceTimer()
    isRecording.current = false

    if (recorder.current && recorder.current.state === "recording") {
      try { recorder.current.stop() } catch {}
    }
  }, [])

  // ── 3. Send audio → Groq Whisper → AI → TTS ──────────────────────────────
  const sendAudioToSTT = useCallback(async () => {
    if (!isMounted.current) return

    const wasSpeaking = isUserSpeaking.current
    isUserSpeaking.current = false
    speechFrameCount.current = 0

    const chunks = audioChunks.current.slice()
    audioChunks.current = []

    const totalSize = chunks.reduce((s, c) => s + c.size, 0)
    // If user didn't speak or data is too tiny (< 3000 bytes ~0.3s audio), ignore
    if (!wasSpeaking || totalSize < 3000) {
      if (isMounted.current && !isAiBusy.current) startListening()
      return
    }

    const mimeType = chunks[0]?.type || "audio/webm"
    const blob = new Blob(chunks, { type: mimeType })

    isAiBusy.current = true
    setCallState("thinking")

    try {
      const fd = new FormData()
      fd.append("file", blob, "speech.webm")

      const res = await fetch("/api/voice/transcribe", { method: "POST", body: fd })
      const data = await res.json()
      const text = (data.text || "").trim()

      if (!isMounted.current) return

      if (!text) {
        // Ignored or hallucination filtered
        isAiBusy.current = false
        setCallState("listening")
        startListening()
        return
      }

      setUserTranscript(text)
      const aiReply = await onSendMessage(text)
      if (!isMounted.current) return

      if (aiReply) {
        setAiTranscript(aiReply)
        playAI(aiReply, () => {
          if (isMounted.current) { setCallState("listening"); startListening() }
        })
      } else {
        isAiBusy.current = false
        setCallState("listening")
        startListening()
      }
    } catch {
      if (isMounted.current) {
        isAiBusy.current = false
        setCallState("listening")
        startListening()
      }
    }
  }, [onSendMessage, playAI])

  // ── 4. Start one guarded listening session ────────────────────────────────
  const startListening = useCallback(() => {
    if (!isMounted.current || isAiBusy.current || isRecording.current) return
    if (!mediaStream.current) return

    isRecording.current = true
    isUserSpeaking.current = false
    speechFrameCount.current = 0
    audioChunks.current = []
    clearSilenceTimer()
    setCallState("listening")

    try {
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm"

      const rec = new MediaRecorder(mediaStream.current, { mimeType })
      recorder.current = rec

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0 && isMounted.current) audioChunks.current.push(e.data)
      }

      rec.onstop = () => {
        isRecording.current = false
        if (isMounted.current && !isAiBusy.current) sendAudioToSTT()
      }

      rec.start(100)
    } catch {
      isRecording.current = false
    }
  }, [sendAudioToSTT])

  // ── 5. Init microphone stream + VAD loop ──────────────────────────────────
  const initStream = useCallback(async () => {
    setCallState("connecting")
    setErrorMsg("")

    try {
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        }),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error("Mic timeout — izin mungkin tertunda")), 6000)
        ),
      ]) as MediaStream

      if (!isMounted.current) { stream.getTracks().forEach((t) => t.stop()); return }

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((t) => t.stop())
      }
      mediaStream.current = stream

      const ctx = audioCtx.current!
      if (ctx.state === "suspended") await ctx.resume()

      const an = ctx.createAnalyser()
      an.fftSize = 256
      analyser.current = an

      const src = ctx.createMediaStreamSource(stream)
      src.connect(an)

      const buf = new Uint8Array(an.frequencyBinCount)

      if (animFrame.current) cancelAnimationFrame(animFrame.current)

      const tick = () => {
        if (!isMounted.current) return
        an.getByteFrequencyData(buf)
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length
        setLiveVolume(avg)

        if (!isAiBusy.current && isRecording.current) {
          // Speech detection: volume > 15 for 2+ consecutive frames
          if (avg > 15) {
            speechFrameCount.current += 1
            if (speechFrameCount.current >= 2) {
              isUserSpeaking.current = true
              clearSilenceTimer()
            }
          } else {
            speechFrameCount.current = 0
            if (isUserSpeaking.current && !silenceTimer.current) {
              // 1.3s of silence after speech -> trigger send
              silenceTimer.current = setTimeout(() => {
                silenceTimer.current = null
                if (!isAiBusy.current && isRecording.current && isMounted.current) {
                  stopRecording()
                }
              }, 1300)
            }
          }
        }

        animFrame.current = requestAnimationFrame(tick)
      }

      animFrame.current = requestAnimationFrame(tick)

      setTimeout(() => {
        if (isMounted.current) startListening()
      }, 300)
    } catch (err: any) {
      console.error("Mic init failed:", err)
      if (isMounted.current) {
        setCallState("error")
        setErrorMsg(
          err?.name === "NotAllowedError"
            ? "Izin mikrofon ditolak. Buka pengaturan browser dan izinkan mikrofon."
            : err?.message || "Gagal mengakses mikrofon."
        )
      }
    }
  }, [startListening, stopRecording])

  // ── 6. Lifecycle ──────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true
    isAiBusy.current = false
    isRecording.current = false

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtx()
    audioCtx.current = ctx

    if ("speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance(""); u.volume = 0
        window.speechSynthesis.speak(u)
        window.speechSynthesis.getVoices()
      } catch {}
    }

    initStream()

    return () => {
      isMounted.current = false
      isAiBusy.current = true
      isRecording.current = false

      if (animFrame.current) cancelAnimationFrame(animFrame.current)
      clearSilenceTimer()
      clearWatchdog()

      if (currentAudioSource.current) {
        try { currentAudioSource.current.stop(); currentAudioSource.current.disconnect() } catch {}
        currentAudioSource.current = null
      }

      if (recorder.current) {
        recorder.current.ondataavailable = null
        recorder.current.onstop = null
        if (recorder.current.state === "recording") {
          try { recorder.current.stop() } catch {}
        }
        recorder.current = null
      }

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((t) => t.stop())
        mediaStream.current = null
      }

      if (ctx.state !== "closed") {
        try { ctx.close() } catch {}
      }
      audioCtx.current = null

      if ("speechSynthesis" in window) {
        try { window.speechSynthesis.cancel() } catch {}
      }
    }
  }, [initStream])

  // ── 7. Orb tap — interrupt or manual send ────────────────────────────────
  const handleOrbTap = () => {
    if (callState === "speaking") {
      clearWatchdog()
      if (currentAudioSource.current) {
        try { currentAudioSource.current.stop(); currentAudioSource.current.disconnect() } catch {}
        currentAudioSource.current = null
      }
      if ("speechSynthesis" in window) { try { window.speechSynthesis.cancel() } catch {} }
      isAiBusy.current = false
      setCallState("listening")
      startListening()
    } else if (callState === "listening") {
      isUserSpeaking.current = true
      stopRecording()
    }
  }

  // ── 8. Dynamic orb styles ─────────────────────────────────────────────────
  const getOrbStyles = () => {
    const vScale = callState === "listening" ? 1.0 + Math.min(0.2, liveVolume / 120) : 1.0
    switch (callState) {
      case "listening":
        return {
          background: "linear-gradient(135deg, #FFFFFF, #E5E7EB)",
          boxShadow: `0 0 ${36 + liveVolume * 0.5}px rgba(255,255,255,${0.4 + liveVolume / 200})`,
          transform: `scale(${vScale})`,
          transition: "transform 0.08s ease, box-shadow 0.08s ease",
        }
      case "thinking":
        return {
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          boxShadow: "0 0 50px rgba(245,158,11,0.5)",
          transform: "scale(1.1)",
          transition: "all 0.3s ease",
        }
      case "speaking":
        return {
          background: "linear-gradient(135deg, #FF4D6D, #E11D48)",
          boxShadow: "0 0 60px rgba(225,29,72,0.65)",
          transform: "scale(1.18)",
          transition: "all 0.3s ease",
        }
      case "error":
        return {
          background: "linear-gradient(135deg, #6B7280, #374151)",
          boxShadow: "0 0 30px rgba(107,114,128,0.3)",
          transform: "scale(0.9)",
          transition: "all 0.3s ease",
        }
      default:
        return {
          background: "linear-gradient(135deg, #E11D48, #991B1B)",
          boxShadow: "0 0 40px rgba(225,29,72,0.4)",
          transform: "scale(0.92)",
          transition: "all 0.3s ease",
        }
    }
  }

  const stateLabel =
    callState === "connecting" ? "Menghubungkan mikrofon..." :
    callState === "listening"  ? (isUserSpeaking.current ? "Mendengarkan ucapanmu..." : "Silakan bicara...") :
    callState === "thinking"   ? "FYY-AI sedang berpikir..." :
    callState === "speaking"   ? "FYY-AI sedang berbicara..." :
    "Gagal mengakses mikrofon"

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between p-6 sm:p-12 animate-fade-in"
      style={{ background: "rgba(8,8,10,0.98)", backdropFilter: "blur(32px)" }}
    >
      {/* Header */}
      <div className="w-full text-center mt-6 space-y-2">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-rose-400" />
          FYY-AI Live Voice Call
        </h2>
        <p className={`text-xs font-semibold tracking-wider ${callState === "error" ? "text-yellow-400" : "text-rose-400 animate-pulse-slow"}`}>
          {stateLabel}
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-[10px] text-gray-400 font-medium">
          {callState === "listening" && <Mic size={11} className="text-white animate-bounce" />}
          {callState === "speaking"  && <Volume2 size={11} className="text-rose-400 animate-pulse" />}
          <span>Real-Time VAD · Groq Whisper · AudioContext TTS</span>
        </div>
      </div>

      {/* Center Orb */}
      <div className="relative flex items-center justify-center flex-1 w-full max-w-md">
        {callState !== "connecting" && callState !== "error" && (
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
          className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center cursor-pointer select-none overflow-hidden active:scale-95"
        >
          <div className={`w-3/4 h-3/4 rounded-full bg-white/20 blur-md pointer-events-none ${callState === "speaking" ? "animate-pulse" : ""}`} />
          <div className="absolute top-2.5 left-5 w-10 h-5 bg-white/40 rounded-full rotate-[-45deg] blur-[2px] opacity-70 pointer-events-none" />
        </button>
      </div>

      {/* Subtitles / Error */}
      <div className="w-full max-w-md min-h-[90px] mb-4 flex flex-col items-center justify-center text-center px-4 gap-3">
        {callState === "error" && (
          <>
            <p className="text-yellow-300 text-xs leading-relaxed">{errorMsg}</p>
            <button
              type="button"
              onClick={initStream}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition-all active:scale-95"
            >
              <RefreshCw size={12} /> Coba Lagi
            </button>
          </>
        )}
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

      {/* End Call */}
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
