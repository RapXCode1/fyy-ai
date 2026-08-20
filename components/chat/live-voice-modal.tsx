"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PhoneOff, Sparkles, Mic, MicOff, MessageSquare, RefreshCw, Volume2 } from "lucide-react"

interface LiveVoiceModalProps {
  onEndCall: () => void
  onSendMessage: (message: string) => Promise<string | void>
}

type CallPhase = "connecting" | "listening" | "thinking" | "speaking" | "error"

export default function LiveVoiceModal({ onEndCall, onSendMessage }: LiveVoiceModalProps) {
  const [phase, setPhase] = useState<CallPhase>("connecting")
  const [userTranscript, setUserTranscript] = useState("")
  const [aiTranscript, setAiTranscript] = useState("")
  const [isMuted, setIsMuted] = useState(false)
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")

  // References
  const isMounted = useRef(false)
  const isAiBusy = useRef(false)
  const isRecording = useRef(false)
  const isUserSpeaking = useRef(false)
  const speechFrameCount = useRef(0)
  const ambientFloor = useRef(10)
  const isMutedRef = useRef(isMuted)

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchdogTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animFrameId = useRef<number | null>(null)

  const mediaStream = useRef<MediaStream | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Real-time audio frequency data for dynamic canvas rendering
  const liveAudioData = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const liveAvgVolume = useRef<number>(0)
  const morphPhaseRef = useRef<number>(0)

  // ── Helper: Clear Timers ──────────────────────────────────────────────────
  const clearTimers = () => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current)
      silenceTimer.current = null
    }
    if (watchdogTimer.current) {
      clearTimeout(watchdogTimer.current)
      watchdogTimer.current = null
    }
  }

  // ── 1. Stop AI Audio & Interrupt Immediately (Barge-In) ───────────────────
  const interruptAI = useCallback(() => {
    if (watchdogTimer.current) {
      clearTimeout(watchdogTimer.current)
      watchdogTimer.current = null
    }
    if (currentAudioSource.current) {
      try {
        currentAudioSource.current.stop()
        currentAudioSource.current.disconnect()
      } catch {}
      currentAudioSource.current = null
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel()
      } catch {}
    }
    isAiBusy.current = false
  }, [])

  // ── 2. Play AI Voice Response (AudioContext / Direct Buffer) ──────────────
  const playAISpeech = useCallback(
    (text: string, onDone: () => void) => {
      if (!isMounted.current) {
        onDone()
        return
      }

      const cleanText = text
        .replace(/```[\s\S]*?```/g, " Blok kode. ")
        .replace(/[*_#`~>]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/-\s/g, "")
        .trim()

      if (!cleanText) {
        isAiBusy.current = false
        onDone()
        return
      }

      interruptAI()

      let isFinished = false
      const finish = () => {
        if (isFinished) return
        isFinished = true
        if (watchdogTimer.current) {
          clearTimeout(watchdogTimer.current)
          watchdogTimer.current = null
        }
        isAiBusy.current = false
        if (isMounted.current) onDone()
      }

      // Safety watchdog: max 20 seconds per speech turn
      watchdogTimer.current = setTimeout(
        finish,
        Math.min(22000, Math.max(3500, cleanText.length * 85))
      )
      setPhase("speaking")

      const ctx = audioCtx.current
      if (!ctx) {
        finish()
        return
      }

      const runPlayback = async () => {
        try {
          if (ctx.state === "suspended") await ctx.resume()
          if (ctx.state === "closed") {
            finish()
            return
          }

          const res = await fetch(`/api/tts?text=${encodeURIComponent(cleanText.substring(0, 240))}`)
          if (!res.ok || !isMounted.current) {
            fallbackSpeechSynthesis(cleanText, finish)
            return
          }

          const arrayBuffer = await res.arrayBuffer()
          if (!isMounted.current) {
            finish()
            return
          }

          const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
          if (!isMounted.current) {
            finish()
            return
          }

          const source = ctx.createBufferSource()
          source.buffer = audioBuffer

          // Connect to analyser for live waveform sync during AI speech
          if (analyser.current) {
            source.connect(analyser.current)
          }
          source.connect(ctx.destination)

          source.onended = finish
          currentAudioSource.current = source
          source.start(0)
        } catch (err) {
          console.warn("AudioContext playback fallback to SpeechSynthesis:", err)
          fallbackSpeechSynthesis(cleanText, finish)
        }
      }

      runPlayback()
    },
    [interruptAI]
  )

  const fallbackSpeechSynthesis = (text: string, onDone: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onDone()
      return
    }
    try {
      window.speechSynthesis.cancel()
      window.speechSynthesis.resume()
      const utterance = new SpeechSynthesisUtterance(text.substring(0, 220))
      utterance.lang = "id-ID"
      utterance.rate = 1.05
      utterance.volume = 1.0

      const voices = window.speechSynthesis.getVoices()
      const indonesianVoice =
        voices.find((v) => v.lang.includes("id") || v.lang.includes("ID")) ||
        voices.find((v) => v.name.toLowerCase().includes("indonesia"))
      if (indonesianVoice) utterance.voice = indonesianVoice

      utterance.onend = onDone
      utterance.onerror = onDone
      ;(window as any).__fyyLiveUtterance = utterance
      window.speechSynthesis.speak(utterance)
    } catch {
      onDone()
    }
  }

  // ── 3. Stop Active Recording Session ──────────────────────────────────────
  const stopRecordingSession = useCallback(() => {
    clearTimers()
    isRecording.current = false

    if (recorder.current && recorder.current.state === "recording") {
      try {
        recorder.current.stop()
      } catch {}
    }
  }, [])

  // ── 4. Transcribe Audio (Groq Whisper Turbo) & Chat Completion ───────────
  const processCapturedSpeech = useCallback(async () => {
    if (!isMounted.current) return

    const wasSpeaking = isUserSpeaking.current
    isUserSpeaking.current = false
    speechFrameCount.current = 0

    const chunks = audioChunks.current.slice()
    audioChunks.current = []

    const totalSize = chunks.reduce((acc, chunk) => acc + chunk.size, 0)
    // Ignore near-silent data / noise clicks
    if (!wasSpeaking || totalSize < 2800) {
      if (isMounted.current && !isAiBusy.current) {
        startListeningSession()
      }
      return
    }

    const mimeType = chunks[0]?.type || "audio/webm"
    const audioBlob = new Blob(chunks, { type: mimeType })

    isAiBusy.current = true
    setPhase("thinking")

    try {
      const formData = new FormData()
      formData.append("file", audioBlob, "speech.webm")

      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      const recognizedText = (data.text || "").trim()

      if (!isMounted.current) return

      if (!recognizedText) {
        // Hallucination filtered or unrecognized -> resume listening
        isAiBusy.current = false
        setPhase("listening")
        startListeningSession()
        return
      }

      setUserTranscript(recognizedText)
      const aiReply = await onSendMessage(recognizedText)
      if (!isMounted.current) return

      if (aiReply) {
        setAiTranscript(aiReply)
        playAISpeech(aiReply, () => {
          if (isMounted.current) {
            setPhase("listening")
            startListeningSession()
          }
        })
      } else {
        isAiBusy.current = false
        setPhase("listening")
        startListeningSession()
      }
    } catch {
      if (isMounted.current) {
        isAiBusy.current = false
        setPhase("listening")
        startListeningSession()
      }
    }
  }, [onSendMessage, playAISpeech])

  // ── 5. Start Single Guarded Listening Session ─────────────────────────────
  const startListeningSession = useCallback(() => {
    if (!isMounted.current || isAiBusy.current || isRecording.current) return
    if (!mediaStream.current) return

    isRecording.current = true
    isUserSpeaking.current = false
    speechFrameCount.current = 0
    audioChunks.current = []
    clearTimers()
    setPhase("listening")

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
        if (isMounted.current && !isAiBusy.current) {
          processCapturedSpeech()
        }
      }

      rec.start(100)
    } catch {
      isRecording.current = false
    }
  }, [processCapturedSpeech])

  // ── 6. Setup Audio Pipeline + Hardware Noise Suppression + Filters ────────
  const initializeAudioStream = useCallback(async () => {
    setPhase("connecting")
    setErrorMsg("")

    try {
      const stream = (await Promise.race([
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
            channelCount: 1,
            sampleRate: 48000,
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Batas waktu izin mikrofon habis.")), 6000)
        ),
      ])) as MediaStream

      if (!isMounted.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((track) => track.stop())
      }
      mediaStream.current = stream

      const ctx = audioCtx.current!
      if (ctx.state === "suspended") await ctx.resume()

      // Biquad High-Pass Filter: Cuts 80Hz rumble/hum
      const highPass = ctx.createBiquadFilter()
      highPass.type = "highpass"
      highPass.frequency.value = 80

      // Biquad Low-Pass Filter: Cuts 8000Hz hiss
      const lowPass = ctx.createBiquadFilter()
      lowPass.type = "lowpass"
      lowPass.frequency.value = 8000

      const an = ctx.createAnalyser()
      an.fftSize = 256
      an.smoothingTimeConstant = 0.3
      analyser.current = an

      const sourceNode = ctx.createMediaStreamSource(stream)
      sourceNode.connect(highPass)
      highPass.connect(lowPass)
      lowPass.connect(an)

      const bufferLength = an.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      liveAudioData.current = dataArray

      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)

      let sampleCount = 0
      let sampleSum = 0

      const updateAudioLoop = () => {
        if (!isMounted.current) return

        an.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength
        liveAvgVolume.current = avg

        // Dynamic ambient noise floor calibration
        if (sampleCount < 30) {
          sampleSum += avg
          sampleCount++
          ambientFloor.current = Math.max(8, sampleSum / sampleCount)
        }

        const speechThreshold = Math.max(14, ambientFloor.current + 8)

        // VAD Trigger
        if (!isAiBusy.current && isRecording.current && !isMutedRef.current) {
          if (avg > speechThreshold) {
            speechFrameCount.current += 1
            if (speechFrameCount.current >= 2) {
              isUserSpeaking.current = true
              clearTimers()
            }
          } else {
            speechFrameCount.current = 0
            if (isUserSpeaking.current && !silenceTimer.current) {
              // 1.25s silence after speaking -> auto-send
              silenceTimer.current = setTimeout(() => {
                silenceTimer.current = null
                if (!isAiBusy.current && isRecording.current && isMounted.current) {
                  stopRecordingSession()
                }
              }, 1250)
            }
          }
        }

        animFrameId.current = requestAnimationFrame(updateAudioLoop)
      }

      animFrameId.current = requestAnimationFrame(updateAudioLoop)

      setTimeout(() => {
        if (isMounted.current) startListeningSession()
      }, 350)
    } catch (err: any) {
      console.error("Mic initialization failed:", err)
      if (isMounted.current) {
        setPhase("error")
        setErrorMsg(
          err?.name === "NotAllowedError"
            ? "Izin mikrofon ditolak. Buka pengaturan browser dan izinkan mikrofon."
            : err?.message || "Gagal mengakses mikrofon perangkat."
        )
      }
    }
  }, [startListeningSession, stopRecordingSession])

  // ── 7. Canvas Liquid Fluid Orb Renderer (ChatGPT / Gemini Live Style) ─────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number

    const render = () => {
      const width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio)
      const height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio)
      ctx.clearRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2
      const baseRadius = Math.min(width, height) * 0.24
      const volume = liveAvgVolume.current || 0

      morphPhaseRef.current += 0.035

      // Color Schemes based on Phase
      let colorPrimary = "rgba(244, 63, 94, 0.9)" // Rose
      let colorSecondary = "rgba(225, 29, 72, 0.6)"
      let colorGlow = "rgba(244, 63, 94, 0.45)"
      let points = 12
      let dynamicScale = 1.0

      if (phase === "listening") {
        if (isUserSpeaking.current) {
          colorPrimary = "rgba(251, 113, 133, 0.95)"
          colorSecondary = "rgba(244, 63, 94, 0.7)"
          colorGlow = "rgba(244, 63, 94, 0.55)"
          dynamicScale = 1.0 + Math.min(0.35, volume / 100)
        } else {
          colorPrimary = "rgba(255, 255, 255, 0.9)"
          colorSecondary = "rgba(229, 231, 235, 0.6)"
          colorGlow = "rgba(255, 255, 255, 0.3)"
          dynamicScale = 1.0 + Math.sin(morphPhaseRef.current * 1.5) * 0.04
        }
      } else if (phase === "thinking") {
        colorPrimary = "rgba(245, 158, 11, 0.95)" // Amber
        colorSecondary = "rgba(217, 119, 6, 0.7)"
        colorGlow = "rgba(245, 158, 11, 0.5)"
        dynamicScale = 1.08 + Math.sin(morphPhaseRef.current * 3.5) * 0.06
        points = 8
      } else if (phase === "speaking") {
        colorPrimary = "rgba(244, 63, 94, 1.0)" // Radiant Crimson
        colorSecondary = "rgba(236, 72, 153, 0.85)"
        colorGlow = "rgba(244, 63, 94, 0.75)"
        dynamicScale = 1.15 + Math.min(0.3, volume / 120)
        points = 16
      } else if (phase === "error") {
        colorPrimary = "rgba(156, 163, 175, 0.7)"
        colorSecondary = "rgba(107, 114, 128, 0.5)"
        colorGlow = "rgba(107, 114, 128, 0.2)"
        dynamicScale = 0.92
      }

      // Draw Ambient Radiant Glow Halo
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.5,
        centerX,
        centerY,
        baseRadius * dynamicScale * 2.2
      )
      gradient.addColorStop(0, colorGlow)
      gradient.addColorStop(0.5, colorGlow.replace("0.45", "0.15").replace("0.55", "0.2").replace("0.75", "0.3"))
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, baseRadius * dynamicScale * 2.2, 0, Math.PI * 2)
      ctx.fill()

      // Draw Fluid Organic Orb Geometry
      ctx.save()
      ctx.beginPath()

      const freqData = liveAudioData.current
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2
        let freqOffset = 0
        if (freqData && freqData.length > 0) {
          const sampleIdx = (i * 3) % freqData.length
          freqOffset = (freqData[sampleIdx] / 255) * (baseRadius * 0.22)
        }

        const wave =
          Math.sin(angle * 3 + morphPhaseRef.current * 2) * (baseRadius * 0.06) +
          Math.cos(angle * 2 - morphPhaseRef.current * 1.5) * (baseRadius * 0.04)

        const r = baseRadius * dynamicScale + wave + freqOffset
        const x = centerX + Math.cos(angle) * r
        const y = centerY + Math.sin(angle) * r

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()

      // Liquid Core Gradient
      const coreGradient = ctx.createLinearGradient(
        centerX - baseRadius,
        centerY - baseRadius,
        centerX + baseRadius,
        centerY + baseRadius
      )
      coreGradient.addColorStop(0, colorPrimary)
      coreGradient.addColorStop(1, colorSecondary)

      ctx.fillStyle = coreGradient
      ctx.shadowColor = colorPrimary
      ctx.shadowBlur = 40
      ctx.fill()
      ctx.restore()

      // Specular Light Glare Accent
      ctx.save()
      ctx.beginPath()
      ctx.ellipse(
        centerX - baseRadius * 0.35,
        centerY - baseRadius * 0.35,
        baseRadius * 0.22,
        baseRadius * 0.12,
        -Math.PI / 4,
        0,
        Math.PI * 2
      )
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)"
      ctx.fill()
      ctx.restore()

      animationId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [phase])

  // ── 8. Lifecycle Setup & Cleanup ──────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true
    isAiBusy.current = false
    isRecording.current = false

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioContextClass()
    audioCtx.current = ctx

    if ("speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance("")
        u.volume = 0
        window.speechSynthesis.speak(u)
        window.speechSynthesis.getVoices()
      } catch {}
    }

    initializeAudioStream()

    return () => {
      isMounted.current = false
      isAiBusy.current = true
      isRecording.current = false

      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
      clearTimers()

      if (currentAudioSource.current) {
        try {
          currentAudioSource.current.stop()
          currentAudioSource.current.disconnect()
        } catch {}
        currentAudioSource.current = null
      }

      if (recorder.current) {
        recorder.current.ondataavailable = null
        recorder.current.onstop = null
        if (recorder.current.state === "recording") {
          try {
            recorder.current.stop()
          } catch {}
        }
        recorder.current = null
      }

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((track) => track.stop())
        mediaStream.current = null
      }

      if (ctx.state !== "closed") {
        try {
          ctx.close()
        } catch {}
      }
      audioCtx.current = null

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel()
        } catch {}
      }
    }
  }, [initializeAudioStream])

  // ── 9. Toggle Mic Mute ────────────────────────────────────────────────────
  const toggleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    if (mediaStream.current) {
      mediaStream.current.getAudioTracks().forEach((t) => {
        t.enabled = !newMuted
      })
    }
  }

  // ── 10. Orb Tap Action (Interrupt AI or Force Send) ───────────────────────
  const handleOrbClick = () => {
    if (phase === "speaking") {
      interruptAI()
      setPhase("listening")
      startListeningSession()
    } else if (phase === "listening" && isUserSpeaking.current) {
      stopRecordingSession()
    }
  }

  // ── 11. Status Label ──────────────────────────────────────────────────────
  const statusLabel =
    phase === "connecting"
      ? "Menghubungkan mikrofon..."
      : isMuted
      ? "Mikrofon dibisukan (Muted)"
      : phase === "listening"
      ? isUserSpeaking.current
        ? "Mendengarkan ucapanmu..."
        : "Silakan bicara (ID/EN)..."
      : phase === "thinking"
      ? "FYY-AI sedang memproses..."
      : phase === "speaking"
      ? "FYY-AI sedang berbicara..."
      : "Gagal mengakses mikrofon"

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-between items-center select-none overflow-hidden animate-fade-in"
      style={{
        background: "radial-gradient(circle at center, #111118 0%, #060608 100%)",
      }}
    >
      {/* ── TOP HEADER BAR ── */}
      <div className="w-full max-w-xl flex items-center justify-between px-6 pt-8 sm:pt-10 z-20">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
          <div
            className={`w-2 h-2 rounded-full ${
              phase === "speaking"
                ? "bg-rose-500 animate-ping"
                : phase === "thinking"
                ? "bg-amber-400 animate-pulse"
                : "bg-emerald-400"
            }`}
          />
          <span className="text-[11px] font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
            <Sparkles size={12} className="text-rose-400" />
            FYY-AI Live
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSubtitles((prev) => !prev)}
            className={`p-2.5 rounded-full border transition-all ${
              showSubtitles
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/[0.03] border-white/5 text-gray-500 hover:text-gray-300"
            }`}
            title="Toggle Teks / Subtitle"
          >
            <MessageSquare size={16} />
          </button>
        </div>
      </div>

      {/* ── STATUS TEXT PILL ── */}
      <div className="text-center mt-3 z-20 space-y-1">
        <p
          className={`text-xs font-semibold tracking-wider ${
            phase === "error"
              ? "text-yellow-400"
              : isMuted
              ? "text-gray-400"
              : "text-rose-400 animate-pulse-slow"
          }`}
        >
          {statusLabel}
        </p>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
          Full-Duplex · Noise Filter · Groq Whisper
        </p>
      </div>

      {/* ── CENTER CANVAS FLUID ORB (ChatGPT / Gemini Live Style) ── */}
      <div className="relative flex-1 w-full max-w-lg flex items-center justify-center z-10">
        <canvas
          ref={canvasRef}
          onClick={handleOrbClick}
          className="w-72 h-72 sm:w-96 sm:h-96 cursor-pointer active:scale-95 transition-transform duration-150"
          title={
            phase === "speaking"
              ? "Ketuk untuk menyela (Interrupt)"
              : "Ketuk untuk mengirim rekaman"
          }
        />
      </div>

      {/* ── FLOATING LIVE TRANSCRIPT (Optional Subtitles Drawer) ── */}
      {showSubtitles && (
        <div className="w-full max-w-lg px-6 mb-4 min-h-[72px] flex flex-col items-center justify-center text-center z-20">
          {phase === "error" ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-yellow-300 text-xs leading-relaxed">{errorMsg}</p>
              <button
                type="button"
                onClick={initializeAudioStream}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-lg shadow-rose-600/30"
              >
                <RefreshCw size={12} /> Coba Hubungkan Ulang
              </button>
            </div>
          ) : phase === "listening" && userTranscript ? (
            <p className="text-gray-300 text-sm italic animate-fade-in line-clamp-2 px-4 py-2 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
              "{userTranscript}..."
            </p>
          ) : phase === "speaking" && aiTranscript ? (
            <div className="space-y-1 animate-fade-in px-4 py-2 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
              <p className="text-white text-sm font-medium leading-relaxed line-clamp-3">
                {aiTranscript}
              </p>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black flex items-center justify-center gap-1">
                <Volume2 size={10} className="text-rose-400 animate-pulse" /> Ketuk bola untuk menyela
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-xs tracking-wide">
              {isMuted ? "Mikrofon sedang dibisukan." : "Bicara bebas dalam Bahasa Indonesia atau Inggris..."}
            </p>
          )}
        </div>
      )}

      {/* ── BOTTOM DOCK CONTROLS (ChatGPT / Gemini Live Style) ── */}
      <div className="w-full max-w-sm flex items-center justify-center gap-6 pb-8 sm:pb-12 z-20">
        {/* Mute Button */}
        <button
          type="button"
          onClick={toggleMute}
          className={`p-4 rounded-full border transition-all duration-200 active:scale-90 ${
            isMuted
              ? "bg-red-500/20 border-red-500/40 text-red-400"
              : "bg-white/[0.06] border-white/10 text-white hover:bg-white/10"
          }`}
          title={isMuted ? "Nyalakan Mikrofon" : "Bisukan Mikrofon (Mute)"}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* End Call Button */}
        <button
          type="button"
          onClick={onEndCall}
          className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl shadow-red-600/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
          title="Akhiri Panggilan"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  )
}
