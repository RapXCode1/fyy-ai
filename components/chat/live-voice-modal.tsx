"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PhoneOff, Sparkles, Mic, MicOff, MessageSquare, RefreshCw, Volume2, X } from "lucide-react"

interface LiveVoiceModalProps {
  onEndCall: () => void
  onSendMessage: (message: string) => Promise<string | void>
}

type CallPhase = "connecting" | "listening" | "thinking" | "speaking" | "error"

export default function LiveVoiceModal({ onEndCall, onSendMessage }: LiveVoiceModalProps) {
  const [phase, setPhase] = useState<CallPhase>("connecting")
  const [activeTranscript, setActiveTranscript] = useState<{ speaker: "user" | "ai" | "none"; text: string }>({
    speaker: "none",
    text: "Menghubungkan mikrofon...",
  })
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

  // ── 2. Play AI Voice Response ─────────────────────────────────────────────
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

      // Max 22 seconds per speech turn
      watchdogTimer.current = setTimeout(
        finish,
        Math.min(22000, Math.max(3500, cleanText.length * 85))
      )
      setPhase("speaking")
      setActiveTranscript({ speaker: "ai", text: cleanText })

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
      uttLangCheck(utterance)
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

  const uttLangCheck = (utt: SpeechSynthesisUtterance) => {
    utt.lang = "id-ID"
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
    setActiveTranscript({ speaker: "none", text: "FYY-AI sedang berpikir..." })

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
        // Hallucination filtered or silent -> resume listening
        isAiBusy.current = false
        setPhase("listening")
        setActiveTranscript({ speaker: "none", text: "Silakan bicara..." })
        startListeningSession()
        return
      }

      // Display user speech
      setActiveTranscript({ speaker: "user", text: recognizedText })

      const aiReply = await onSendMessage(recognizedText)
      if (!isMounted.current) return

      if (aiReply) {
        playAISpeech(aiReply, () => {
          if (isMounted.current) {
            setPhase("listening")
            setActiveTranscript({ speaker: "none", text: "Silakan bicara..." })
            startListeningSession()
          }
        })
      } else {
        isAiBusy.current = false
        setPhase("listening")
        setActiveTranscript({ speaker: "none", text: "Silakan bicara..." })
        startListeningSession()
      }
    } catch {
      if (isMounted.current) {
        isAiBusy.current = false
        setPhase("listening")
        setActiveTranscript({ speaker: "none", text: "Silakan bicara..." })
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

  // ── 6. Audio Setup + Hardware Noise Suppression + Filter Chain ────────────
  const initializeAudioStream = useCallback(async () => {
    setPhase("connecting")
    setErrorMsg("")
    setActiveTranscript({ speaker: "none", text: "Menghubungkan mikrofon..." })

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

      // Biquad High-Pass Filter: Cuts 80Hz rumble
      const highPass = ctx.createBiquadFilter()
      highPass.type = "highpass"
      highPass.frequency.value = 80

      // Biquad Low-Pass Filter: Cuts 8000Hz hiss
      const lowPass = ctx.createBiquadFilter()
      lowPass.type = "lowpass"
      lowPass.frequency.value = 8000

      const an = ctx.createAnalyser()
      an.fftSize = 256
      an.smoothingTimeConstant = 0.35
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
              setActiveTranscript((prev) =>
                prev.speaker === "user" ? prev : { speaker: "user", text: "Mendengarkan ucapanmu..." }
              )
            }
          } else {
            speechFrameCount.current = 0
            if (isUserSpeaking.current && !silenceTimer.current) {
              // 1.2s silence after speaking -> auto-send
              silenceTimer.current = setTimeout(() => {
                silenceTimer.current = null
                if (!isAiBusy.current && isRecording.current && isMounted.current) {
                  stopRecordingSession()
                }
              }, 1200)
            }
          }
        }

        animFrameId.current = requestAnimationFrame(updateAudioLoop)
      }

      animFrameId.current = requestAnimationFrame(updateAudioLoop)

      setTimeout(() => {
        if (isMounted.current) {
          setActiveTranscript({ speaker: "none", text: "Silakan bicara (ID/EN)..." })
          startListeningSession()
        }
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

  // ── 7. Ultra-Smooth Bezier Spline Fluid Orb (ChatGPT / Gemini Live Style) ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const width = (canvas.width = canvas.offsetWidth * dpr)
      const height = (canvas.height = canvas.offsetHeight * dpr)
      ctx.clearRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2
      const baseRadius = Math.min(width, height) * 0.23
      const volume = liveAvgVolume.current || 0

      morphPhaseRef.current += 0.03

      // Colors & Styling depending on Phase
      let colorPrimary = "rgba(244, 63, 94, 0.95)"
      let colorSecondary = "rgba(225, 29, 72, 0.75)"
      let colorGlow = "rgba(244, 63, 94, 0.4)"
      let dynamicScale = 1.0
      const totalPoints = 32

      if (phase === "listening") {
        if (isUserSpeaking.current) {
          colorPrimary = "rgba(251, 113, 133, 0.98)"
          colorSecondary = "rgba(244, 63, 94, 0.85)"
          colorGlow = "rgba(244, 63, 94, 0.55)"
          dynamicScale = 1.0 + Math.min(0.32, volume / 90)
        } else {
          colorPrimary = "rgba(255, 255, 255, 0.95)"
          colorSecondary = "rgba(229, 231, 235, 0.75)"
          colorGlow = "rgba(255, 255, 255, 0.25)"
          dynamicScale = 1.0 + Math.sin(morphPhaseRef.current * 1.5) * 0.035
        }
      } else if (phase === "thinking") {
        colorPrimary = "rgba(245, 158, 11, 0.98)"
        colorSecondary = "rgba(217, 119, 6, 0.8)"
        colorGlow = "rgba(245, 158, 11, 0.5)"
        dynamicScale = 1.06 + Math.sin(morphPhaseRef.current * 3.5) * 0.05
      } else if (phase === "speaking") {
        colorPrimary = "rgba(244, 63, 94, 1.0)"
        colorSecondary = "rgba(236, 72, 153, 0.9)"
        colorGlow = "rgba(244, 63, 94, 0.7)"
        dynamicScale = 1.12 + Math.min(0.28, volume / 110)
      } else if (phase === "error") {
        colorPrimary = "rgba(156, 163, 175, 0.7)"
        colorSecondary = "rgba(107, 114, 128, 0.5)"
        colorGlow = "rgba(107, 114, 128, 0.2)"
        dynamicScale = 0.9
      }

      // Outer Radiant Halo Glow
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.4,
        centerX,
        centerY,
        baseRadius * dynamicScale * 2.2
      )
      glowGrad.addColorStop(0, colorGlow)
      glowGrad.addColorStop(0.6, colorGlow.replace(/[\d.]+\)$/, "0.15)"))
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.fillStyle = glowGrad
      ctx.beginPath()
      ctx.arc(centerX, centerY, baseRadius * dynamicScale * 2.2, 0, Math.PI * 2)
      ctx.fill()

      // Calculate Smooth Spline Points
      const points: { x: number; y: number }[] = []
      const freqData = liveAudioData.current

      for (let i = 0; i < totalPoints; i++) {
        const angle = (i / totalPoints) * Math.PI * 2
        let freqOffset = 0

        if (freqData && freqData.length > 0) {
          const sampleIdx = Math.floor((i / totalPoints) * (freqData.length * 0.6))
          freqOffset = (freqData[sampleIdx] / 255) * (baseRadius * 0.2)
        }

        const harmonic =
          Math.sin(angle * 3 + morphPhaseRef.current * 2) * (baseRadius * 0.05) +
          Math.cos(angle * 4 - morphPhaseRef.current * 1.8) * (baseRadius * 0.035)

        const r = baseRadius * dynamicScale + harmonic + freqOffset
        points.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
        })
      }

      // Draw Smooth Closed Bezier Spline
      ctx.save()
      ctx.beginPath()
      ctx.moveTo((points[0].x + points[totalPoints - 1].x) / 2, (points[0].y + points[totalPoints - 1].y) / 2)

      for (let i = 0; i < totalPoints; i++) {
        const next = points[(i + 1) % totalPoints]
        const xc = (points[i].x + next.x) / 2
        const yc = (points[i].y + next.y) / 2
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
      }
      ctx.closePath()

      // Liquid Radial Fill
      const liquidGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.3,
        centerY - baseRadius * 0.3,
        baseRadius * 0.1,
        centerX,
        centerY,
        baseRadius * dynamicScale
      )
      liquidGrad.addColorStop(0, colorPrimary)
      liquidGrad.addColorStop(0.85, colorSecondary)
      liquidGrad.addColorStop(1, colorSecondary)

      ctx.fillStyle = liquidGrad
      ctx.shadowColor = colorPrimary
      ctx.shadowBlur = 35 * dpr
      ctx.fill()
      ctx.restore()

      // Organic Specular Highlights
      ctx.save()
      ctx.beginPath()
      ctx.ellipse(
        centerX - baseRadius * 0.35,
        centerY - baseRadius * 0.35,
        baseRadius * 0.28,
        baseRadius * 0.14,
        -Math.PI / 4,
        0,
        Math.PI * 2
      )
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)"
      ctx.filter = `blur(${2 * dpr}px)`
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
      setActiveTranscript({ speaker: "none", text: "Silakan bicara..." })
      startListeningSession()
    } else if (phase === "listening" && isUserSpeaking.current) {
      stopRecordingSession()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-between items-center select-none overflow-hidden animate-fade-in"
      style={{
        background: "radial-gradient(circle at 50% 40%, #151522 0%, #08080C 70%, #030305 100%)",
      }}
    >
      {/* ── TOP HEADER BAR (Clean, Centered, Symmetrical) ── */}
      <header className="w-full max-w-xl flex items-center justify-between px-6 pt-6 sm:pt-8 z-20">
        {/* Live Indicator Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-xl shadow-lg">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              phase === "speaking"
                ? "bg-rose-500 animate-ping shadow-[0_0_8px_#f43f5e]"
                : phase === "thinking"
                ? "bg-amber-400 animate-pulse"
                : phase === "error"
                ? "bg-red-500"
                : "bg-emerald-400 shadow-[0_0_6px_#34d399]"
            }`}
          />
          <span className="text-[11px] font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
            <Sparkles size={11} className="text-rose-400" />
            FYY-AI Live
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSubtitles((prev) => !prev)}
            className={`p-2.5 rounded-full border transition-all duration-200 ${
              showSubtitles
                ? "bg-white/15 border-white/25 text-white shadow-md"
                : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-white"
            }`}
            title="Toggle Teks / Subtitle"
          >
            <MessageSquare size={16} />
          </button>

          <button
            type="button"
            onClick={onEndCall}
            className="p-2.5 rounded-full bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            title="Tutup Modal"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* ── CENTER STAGE: SILKY LIQUID ORGANIC ORB ── */}
      <main className="relative flex-1 w-full max-w-lg flex flex-col items-center justify-center z-10 px-4">
        <div className="relative flex items-center justify-center">
          <canvas
            ref={canvasRef}
            onClick={handleOrbClick}
            className="w-64 h-64 sm:w-80 sm:h-80 cursor-pointer active:scale-95 transition-transform duration-150 rounded-full"
            title={
              phase === "speaking"
                ? "Ketuk untuk menyela (Interrupt)"
                : "Ketuk untuk mengirim rekaman segera"
            }
          />
        </div>

        {/* Phase Subtitle Hint */}
        <div className="text-center mt-3 space-y-1">
          <p
            className={`text-xs font-semibold tracking-wide transition-colors ${
              phase === "error"
                ? "text-yellow-400"
                : isMuted
                ? "text-gray-400"
                : phase === "speaking"
                ? "text-rose-400 font-bold"
                : "text-gray-300"
            }`}
          >
            {phase === "connecting"
              ? "Menghubungkan mikrofon..."
              : isMuted
              ? "Mikrofon dibisukan (Muted)"
              : phase === "thinking"
              ? "FYY-AI sedang berpikir..."
              : phase === "speaking"
              ? "FYY-AI sedang berbicara..."
              : "Mendengarkan · Bicara bebas (ID/EN)..."}
          </p>
        </div>
      </main>

      {/* ── DYNAMIC CONVERSATION TRANSCRIPT BUBBLE (Alternates User ↔ AI) ── */}
      {showSubtitles && (
        <section className="w-full max-w-md px-6 mb-3 min-h-[68px] flex flex-col items-center justify-center text-center z-20">
          {phase === "error" ? (
            <div className="flex flex-col items-center gap-2 bg-red-950/40 border border-red-500/20 p-3 rounded-2xl backdrop-blur-md">
              <p className="text-yellow-300 text-xs leading-relaxed">{errorMsg}</p>
              <button
                type="button"
                onClick={initializeAudioStream}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-md shadow-rose-600/30"
              >
                <RefreshCw size={12} /> Hubungkan Ulang
              </button>
            </div>
          ) : activeTranscript.speaker === "user" ? (
            <div className="w-full px-4 py-2.5 rounded-2xl bg-rose-950/30 border border-rose-500/20 backdrop-blur-md animate-fade-in">
              <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black mb-0.5">Kamu</p>
              <p className="text-gray-200 text-xs sm:text-sm font-medium italic leading-relaxed line-clamp-2">
                "{activeTranscript.text}"
              </p>
            </div>
          ) : activeTranscript.speaker === "ai" ? (
            <div className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md animate-fade-in shadow-xl">
              <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black mb-0.5 flex items-center justify-center gap-1">
                <Volume2 size={11} className="animate-pulse" /> FYY-AI
              </p>
              <p className="text-white text-xs sm:text-sm font-semibold leading-relaxed line-clamp-3">
                {activeTranscript.text}
              </p>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1 font-mono">
                Ketuk bola untuk menyela
              </p>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md">
              <p className="text-gray-400 text-xs tracking-wide">
                {isMuted ? "Mikrofon dibisukan." : activeTranscript.text}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── BOTTOM DOCK CONTROLS (ChatGPT / Gemini Live Style) ── */}
      <footer className="w-full max-w-sm flex items-center justify-center gap-6 pb-8 sm:pb-10 z-20">
        {/* Mute Button */}
        <button
          type="button"
          onClick={toggleMute}
          className={`p-4 rounded-full border transition-all duration-200 active:scale-90 ${
            isMuted
              ? "bg-red-500/20 border-red-500/40 text-red-400 shadow-lg shadow-red-500/10"
              : "bg-white/[0.06] border-white/10 text-white hover:bg-white/10"
          }`}
          title={isMuted ? "Nyalakan Mikrofon" : "Bisukan Mikrofon (Mute)"}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* End Call Button */}
        <button
          type="button"
          onClick={onEndCall}
          className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
          title="Akhiri Panggilan"
        >
          <PhoneOff size={26} />
        </button>
      </footer>
    </div>
  )
}
