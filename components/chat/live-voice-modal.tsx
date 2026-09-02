"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PhoneOff, Sparkles, Mic, MicOff, MessageSquare, RefreshCw, Volume2, X } from "lucide-react"

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface LiveVoiceModalProps {
  onEndCall: () => void
  onSendMessage: (message: string) => Promise<string | void>
}

type CallPhase = "connecting" | "listening" | "thinking" | "speaking" | "error"

export default function LiveVoiceModal({ onEndCall, onSendMessage }: LiveVoiceModalProps) {
  const [phase, setPhase] = useState<CallPhase>("connecting")
  const [interimText, setInterimText] = useState("")
  const [activeTranscript, setActiveTranscript] = useState<{ speaker: "user" | "ai" | "idle"; text: string }>({
    speaker: "idle",
    text: "Mempersiapkan...",
  })
  const [isMuted, setIsMuted] = useState(false)
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")
  const [isSpeechAPISupported, setIsSpeechAPISupported] = useState(true)

  // ── Core state refs (no re-renders) ──────────────────────────────────────
  const isMounted = useRef(false)
  const isAiBusy = useRef(false)           // AI is thinking or speaking → mic LOCKED
  const micLocked = useRef(false)          // Extra lock: mic physically disabled during AI speech
  const isMutedRef = useRef(false)
  const isUserSpeakingRef = useRef(false)
  const phaseRef = useRef<CallPhase>("connecting")

  const recognition = useRef<any>(null)
  const isRecognitionActive = useRef(false)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchdogTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const thinkingStartTime = useRef<number>(0)
  const orbAnimId = useRef<number | null>(null)

  const mediaStream = useRef<MediaStream | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null)
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const liveAudioData = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const liveAvgVolume = useRef(0)

  // Smooth orb animation state (never resets on phase change)
  const orbColor = useRef({ r: 255, g: 255, b: 255, a: 0.9 })
  const orbScale = useRef(1.0)
  const morphPhase = useRef(0)
  const cachedVoices = useRef<SpeechSynthesisVoice[]>([])

  useEffect(() => { isMutedRef.current = isMuted }, [isMuted])

  // ── Update phaseRef whenever phase changes ────────────────────────────────
  useEffect(() => { phaseRef.current = phase }, [phase])

  // ── Helper: Clear timers ──────────────────────────────────────────────────
  const clearAllTimers = useCallback(() => {
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null }
    if (watchdogTimer.current) { clearTimeout(watchdogTimer.current); watchdogTimer.current = null }
    if (restartTimer.current) { clearTimeout(restartTimer.current); restartTimer.current = null }
  }, [])

  // ── Stop any playing audio (without touching isAiBusy) ───────────────────
  const stopPlayingAudio = useCallback(() => {
    if (currentAudioSource.current) {
      try { currentAudioSource.current.stop(); currentAudioSource.current.disconnect() } catch {}
      currentAudioSource.current = null
    }
    try { window.speechSynthesis?.cancel() } catch {}
  }, [])

  // ── Hard lock mic: recognition is stopped + mic track disabled ───────────
  const lockMic = useCallback(() => {
    micLocked.current = true
    isRecognitionActive.current = false
    if (mediaStream.current) {
      mediaStream.current.getAudioTracks().forEach((t) => { t.enabled = false })
    }
    try { recognition.current?.stop() } catch {}
  }, [])

  // ── Unlock mic (called after AI finishes speaking + cooldown) ────────────
  const unlockMic = useCallback(() => {
    micLocked.current = false
    if (!isMutedRef.current && mediaStream.current) {
      mediaStream.current.getAudioTracks().forEach((t) => { t.enabled = true })
    }
  }, [])

  // ── Barge-in: user taps orb to interrupt AI ───────────────────────────────
  const interruptAI = useCallback(() => {
    clearAllTimers()
    stopPlayingAudio()
    unlockMic()
    isAiBusy.current = false
  }, [clearAllTimers, stopPlayingAudio, unlockMic])

  // ── Start Web Speech Recognition ─────────────────────────────────────────
  const startRecognition = useCallback(() => {
    if (!isMounted.current) return
    if (isAiBusy.current || micLocked.current) return
    if (isRecognitionActive.current) return
    if (!recognition.current) return
    if (isMutedRef.current) return

    try {
      isRecognitionActive.current = true
      isUserSpeakingRef.current = false
      setInterimText("")
      recognition.current.start()
    } catch (e) {
      isRecognitionActive.current = false
      console.warn("SpeechRecognition start error:", e)
    }
  }, [])

  // ── fallbackSpeechSynthesis ───────────────────────────────────────────────
  const fallbackSpeechSynthesis = useCallback((text: string, onDone: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { onDone(); return }
    try {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text.substring(0, 240))
      utt.lang = "id-ID"; utt.rate = 1.05; utt.volume = 1.0
      const voices = cachedVoices.current.length > 0 ? cachedVoices.current : window.speechSynthesis.getVoices()
      const idVoice = voices.find((v) => v.lang.includes("id") || v.lang.includes("ID"))
      if (idVoice) utt.voice = idVoice
      utt.onend = onDone; utt.onerror = onDone
      window.speechSynthesis.speak(utt)
    } catch { onDone() }
  }, [])

  // ── Play AI Voice ─────────────────────────────────────────────────────────
  const playAISpeech = useCallback((text: string, onDone: () => void) => {
    if (!isMounted.current) { onDone(); return }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, "Blok kode.")
      .replace(/[*_#`~>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^\s*[-•]\s*/gm, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim()

    if (!cleanText) { isAiBusy.current = false; unlockMic(); onDone(); return }

    // STEP 1: Lock mic HARD before making any sound
    lockMic()
    isAiBusy.current = true
    stopPlayingAudio()

    setPhase("speaking")
    setActiveTranscript({ speaker: "ai", text: cleanText })

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      if (watchdogTimer.current) { clearTimeout(watchdogTimer.current); watchdogTimer.current = null }
      isAiBusy.current = false

      // Acoustic cooldown: 600ms silence before re-opening mic
      restartTimer.current = setTimeout(() => {
        if (!isMounted.current) return
        unlockMic()
        onDone()
      }, 600)
    }

    // Safety watchdog: prevent infinite lock if audio fails silently
    watchdogTimer.current = setTimeout(finish, Math.min(25000, Math.max(4000, cleanText.length * 90)))

    const ctx = audioCtx.current
    if (!ctx) { fallbackSpeechSynthesis(cleanText, finish); return }

    const runPlayback = async () => {
      try {
        if (ctx.state !== "running") await ctx.resume()

        const controller = new AbortController()
        const tid = setTimeout(() => controller.abort(), 4000)
        const res = await fetch(`/api/tts?text=${encodeURIComponent(cleanText.substring(0, 280))}`, {
          signal: controller.signal,
        }).catch(() => null)
        clearTimeout(tid)

        if (!res || !res.ok || !isMounted.current) {
          fallbackSpeechSynthesis(cleanText, finish)
          return
        }

        const arrayBuffer = await res.arrayBuffer()
        if (!isMounted.current) { finish(); return }

        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        if (!isMounted.current) { finish(); return }

        const source = ctx.createBufferSource()
        source.buffer = audioBuffer
        // Connect TTS output through analyser → destination (for orb reactivity)
        if (analyser.current) source.connect(analyser.current)
        source.connect(ctx.destination)
        source.onended = finish
        currentAudioSource.current = source
        source.start(0)
      } catch {
        if (isMounted.current) fallbackSpeechSynthesis(cleanText, finish)
        else finish()
      }
    }

    runPlayback()
  }, [lockMic, unlockMic, stopPlayingAudio, fallbackSpeechSynthesis])

  // ── Process final transcript ──────────────────────────────────────────────
  const processFinalTranscript = useCallback(async (transcript: string) => {
    const clean = transcript.trim()
    if (!clean || isAiBusy.current || !isMounted.current) return
    if (clean.length < 2) return

    isAiBusy.current = true
    thinkingStartTime.current = Date.now()
    setPhase("thinking")
    setInterimText("")
    setActiveTranscript({ speaker: "user", text: clean })

    try {
      const aiReply = await onSendMessage(clean)
      if (!isMounted.current) return

      // Minimum 650ms thinking so amber orb is clearly visible
      const elapsed = Date.now() - thinkingStartTime.current
      if (elapsed < 650) await new Promise((r) => setTimeout(r, 650 - elapsed))
      if (!isMounted.current) return

      if (aiReply && aiReply.trim()) {
        playAISpeech(aiReply, () => {
          if (isMounted.current) {
            setPhase("listening")
            startRecognition()
          }
        })
      } else {
        // Empty reply or error — return to listening
        isAiBusy.current = false
        unlockMic()
        setPhase("listening")
        if (isMounted.current) startRecognition()
      }
    } catch {
      if (!isMounted.current) return
      isAiBusy.current = false
      unlockMic()
      setPhase("listening")
      startRecognition()
    }
  }, [onSendMessage, playAISpeech, startRecognition, unlockMic])

  // ── Setup Web Speech Recognition instance ─────────────────────────────────
  const buildRecognition = useCallback(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionClass) {
      setIsSpeechAPISupported(false)
      setPhase("error")
      setErrorMsg("Browser tidak mendukung Web Speech API. Gunakan Chrome atau Edge terbaru.")
      return false
    }

    const rec = new SpeechRecognitionClass()
    rec.lang = "id-ID"
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => {
      isRecognitionActive.current = true
      if (isMounted.current && !isAiBusy.current) setPhase("listening")
    }

    rec.onspeechstart = () => {
      isUserSpeakingRef.current = true
      // Clear any pending auto-send timer when user speaks again
      if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null }
    }

    rec.onspeechend = () => {
      isUserSpeakingRef.current = false
      // Start 3-second silence timer → auto-send transcript
      if (silenceTimer.current) clearTimeout(silenceTimer.current)
      silenceTimer.current = setTimeout(() => {
        silenceTimer.current = null
        // Recognition will naturally end after silence; onstop → restart or process
      }, 3000)
    }

    rec.onresult = (event: any) => {
      if (isAiBusy.current || micLocked.current) return

      let interim = ""; let finalText = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) finalText += t
        else interim += t
      }
      if (interim && isMounted.current) setInterimText(interim)
      if (finalText && isMounted.current) {
        setInterimText("")
        processFinalTranscript(finalText)
      }
    }

    rec.onerror = (event: any) => {
      isRecognitionActive.current = false
      if (!isMounted.current || isAiBusy.current || micLocked.current) return

      if (event.error === "aborted" || event.error === "no-speech") {
        // Natural end — auto-restart
        restartTimer.current = setTimeout(() => {
          if (!isAiBusy.current && !micLocked.current) startRecognition()
        }, 200)
        return
      }
      if (event.error === "not-allowed") {
        setPhase("error"); setErrorMsg("Izin mikrofon ditolak."); return
      }
      console.warn("SpeechRecognition error:", event.error)
      restartTimer.current = setTimeout(() => {
        if (!isAiBusy.current && !micLocked.current) startRecognition()
      }, 500)
    }

    rec.onend = () => {
      isRecognitionActive.current = false
      if (!isMounted.current || isAiBusy.current || micLocked.current || isMutedRef.current) return

      // Auto-restart with brief debounce
      restartTimer.current = setTimeout(() => {
        if (!isAiBusy.current && !micLocked.current && !isMutedRef.current) startRecognition()
      }, 150)
    }

    recognition.current = rec
    return true
  }, [processFinalTranscript, startRecognition])

  // ── Initialize Mic + Analyser for Orb Visualization ──────────────────────
  const initializeAudioStream = useCallback(async () => {
    setPhase("connecting")
    setErrorMsg("")
    setActiveTranscript({ speaker: "idle", text: "Menghubungkan mikrofon..." })

    try {
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
            channelCount: 1,
          },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 7000)),
      ]) as MediaStream

      if (!isMounted.current) { stream.getTracks().forEach((t) => t.stop()); return }
      if (mediaStream.current) mediaStream.current.getTracks().forEach((t) => t.stop())
      mediaStream.current = stream

      const ctx = audioCtx.current!
      if (ctx.state !== "running") await ctx.resume()

      // Analyser for orb reactivity only (mic not connected to destination)
      const an = ctx.createAnalyser()
      an.fftSize = 256; an.smoothingTimeConstant = 0.4
      analyser.current = an

      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 80
      const src = ctx.createMediaStreamSource(stream)
      src.connect(hp); hp.connect(an)
      // No connection to ctx.destination → silent mic monitoring

      const dataArr = new Uint8Array(an.frequencyBinCount)
      liveAudioData.current = dataArr

      const vizLoop = () => {
        if (!isMounted.current) return
        an.getByteFrequencyData(dataArr)
        const avg = dataArr.reduce((s, v) => s + v, 0) / dataArr.length
        // Only update volume when not mic-locked (AI is silent)
        liveAvgVolume.current = micLocked.current ? 0 : avg
        isUserSpeakingRef.current = !micLocked.current && avg > 14 && phaseRef.current === "listening"
        requestAnimationFrame(vizLoop)
      }
      requestAnimationFrame(vizLoop)

      return true
    } catch (err: any) {
      if (!isMounted.current) return
      setPhase("error")
      setErrorMsg(err?.name === "NotAllowedError"
        ? "Izin mikrofon ditolak. Izinkan mikrofon di pengaturan browser."
        : "Gagal mengakses mikrofon perangkat.")
      return false
    }
  }, [])

  // ── SINGLE persistent canvas animation loop (no phase dependency!) ────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext("2d")
    if (!ctx2d) return

    let animId: number

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const w = (canvas.width = canvas.offsetWidth * dpr)
      const h = (canvas.height = canvas.offsetHeight * dpr)
      ctx2d.clearRect(0, 0, w, h)

      const cx = w / 2, cy = h / 2
      const baseR = Math.min(w, h) * 0.23
      const vol = liveAvgVolume.current || 0
      const currentPhase = phaseRef.current

      morphPhase.current += 0.025

      // Target color + scale per phase (smooth lerp prevents glitching)
      let tR = 255, tG = 255, tB = 255, tA = 0.92, tS = 1.0
      if (currentPhase === "listening") {
        if (isUserSpeakingRef.current) {
          tR = 244; tG = 63; tB = 94; tA = 0.98
          tS = 1.0 + Math.min(0.28, vol / 80)
        } else {
          // Idle breathing — pure white
          tS = 1.0 + Math.sin(morphPhase.current * 1.2) * 0.03
        }
      } else if (currentPhase === "thinking") {
        tR = 245; tG = 158; tB = 11; tA = 0.98  // Amber
        tS = 1.05 + Math.sin(morphPhase.current * 4) * 0.04
      } else if (currentPhase === "speaking") {
        tR = 244; tG = 63; tB = 94; tA = 1.0   // Rose red
        tS = 1.1 + Math.sin(morphPhase.current * 3) * 0.05 + Math.min(0.2, vol / 120)
      } else if (currentPhase === "connecting") {
        tS = 1.0 + Math.sin(morphPhase.current * 2) * 0.025
      } else if (currentPhase === "error") {
        tR = 120; tG = 120; tB = 120; tA = 0.6; tS = 0.88
      }

      // Lerp factor: slower when changing phases (more fluid), faster when reacting to voice
      const lf = currentPhase === "speaking" && vol > 20 ? 0.18 : 0.09
      const oc = orbColor.current
      oc.r += (tR - oc.r) * lf; oc.g += (tG - oc.g) * lf
      oc.b += (tB - oc.b) * lf; oc.a += (tA - oc.a) * lf
      orbScale.current += (tS - orbScale.current) * lf

      const { r, g, b, a } = oc; const sc = orbScale.current
      const rc = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`
      const gc = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a * 0.4})`

      // Outer glow halo
      const glowG = ctx2d.createRadialGradient(cx, cy, baseR * 0.4, cx, cy, baseR * sc * 2.3)
      glowG.addColorStop(0, gc)
      glowG.addColorStop(0.5, `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.1)`)
      glowG.addColorStop(1, "rgba(0,0,0,0)")
      ctx2d.fillStyle = glowG
      ctx2d.beginPath(); ctx2d.arc(cx, cy, baseR * sc * 2.3, 0, Math.PI * 2); ctx2d.fill()

      // Fluid spline blob (32 points)
      const N = 32
      const pts: { x: number; y: number }[] = []
      const fd = liveAudioData.current
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2
        let fo = 0
        if (fd) { const si = Math.floor((i / N) * fd.length * 0.55); fo = (fd[si] / 255) * baseR * 0.17 }
        const hm = Math.sin(angle * 3 + morphPhase.current * 2.0) * baseR * 0.045
                 + Math.cos(angle * 5 - morphPhase.current * 1.6) * baseR * 0.025
        pts.push({
          x: cx + Math.cos(angle) * (baseR * sc + hm + fo),
          y: cy + Math.sin(angle) * (baseR * sc + hm + fo),
        })
      }

      ctx2d.save(); ctx2d.beginPath()
      ctx2d.moveTo((pts[0].x + pts[N - 1].x) / 2, (pts[0].y + pts[N - 1].y) / 2)
      for (let i = 0; i < N; i++) {
        const nx = pts[(i + 1) % N]
        ctx2d.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + nx.x) / 2, (pts[i].y + nx.y) / 2)
      }
      ctx2d.closePath()

      const lg = ctx2d.createRadialGradient(cx - baseR * 0.28, cy - baseR * 0.28, baseR * 0.08, cx, cy, baseR * sc)
      lg.addColorStop(0, rc)
      lg.addColorStop(1, `rgba(${Math.round(r * 0.8)},${Math.round(g * 0.8)},${Math.round(b * 0.8)},${a})`)
      ctx2d.fillStyle = lg
      ctx2d.shadowColor = rc; ctx2d.shadowBlur = 30 * dpr
      ctx2d.fill(); ctx2d.restore()

      // Specular highlight
      ctx2d.save(); ctx2d.beginPath()
      ctx2d.ellipse(cx - baseR * 0.33, cy - baseR * 0.33, baseR * 0.25, baseR * 0.12, -Math.PI / 4, 0, Math.PI * 2)
      ctx2d.fillStyle = "rgba(255,255,255,0.42)"; ctx2d.filter = `blur(${2 * dpr}px)`; ctx2d.fill(); ctx2d.restore()

      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, []) // ← Empty deps! Canvas loop runs once, reads phaseRef (never re-mounts)

  // ── Main lifecycle (mount / unmount) ──────────────────────────────────────
  useEffect(() => {
    isMounted.current = true
    isAiBusy.current = false
    micLocked.current = false

    // Create AudioContext (must be inside user-gesture scope via modal open click)
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtxClass()
    audioCtx.current = ctx

    // Unlock AudioContext with a 1-sample silent buffer
    try {
      const buf = ctx.createBuffer(1, 1, 22050)
      const src = ctx.createBufferSource(); src.buffer = buf
      src.connect(ctx.destination); src.start(0); ctx.resume()
    } catch {}

    // Pre-cache SpeechSynthesis voices
    if ("speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance(""); u.volume = 0
        window.speechSynthesis.speak(u)
        cachedVoices.current = window.speechSynthesis.getVoices()
        window.speechSynthesis.onvoiceschanged = () => {
          cachedVoices.current = window.speechSynthesis.getVoices()
        }
      } catch {}
    }

    // Sequential init
    const init = async () => {
      const ok = await initializeAudioStream()
      if (!ok || !isMounted.current) return
      const recOk = buildRecognition()
      if (!recOk || !isMounted.current) return
      setActiveTranscript({ speaker: "idle", text: "Silakan mulai berbicara..." })
      startRecognition()
    }
    init()

    return () => {
      isMounted.current = false
      isAiBusy.current = true
      micLocked.current = true

      clearAllTimers()
      stopPlayingAudio()
      if (orbAnimId.current) cancelAnimationFrame(orbAnimId.current)

      try { recognition.current?.stop() } catch {}
      recognition.current = null

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((t) => t.stop())
        mediaStream.current = null
      }

      if (ctx.state !== "closed") { try { ctx.close() } catch {} }
      audioCtx.current = null

      try { window.speechSynthesis?.cancel() } catch {}
    }
  }, [initializeAudioStream, buildRecognition, startRecognition, clearAllTimers, stopPlayingAudio])

  // ── Mute toggle ───────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    isMutedRef.current = newMuted

    if (newMuted) {
      if (mediaStream.current) mediaStream.current.getAudioTracks().forEach((t) => { t.enabled = false })
      isRecognitionActive.current = false; try { recognition.current?.stop() } catch {}
    } else {
      if (!micLocked.current && mediaStream.current) {
        mediaStream.current.getAudioTracks().forEach((t) => { t.enabled = true })
      }
      if (!isAiBusy.current && !micLocked.current) {
        restartTimer.current = setTimeout(() => startRecognition(), 300)
      }
    }
  }, [isMuted, startRecognition])

  // ── Orb click: barge-in or manual send ───────────────────────────────────
  const handleOrbClick = useCallback(() => {
    if (phaseRef.current === "speaking") {
      interruptAI()
      setPhase("listening")
      restartTimer.current = setTimeout(() => startRecognition(), 200)
    }
  }, [interruptAI, startRecognition])

  const statusLabel = isMuted
    ? "Mikrofon dibisukan (Muted)"
    : phase === "connecting" ? "Menghubungkan mikrofon..."
    : phase === "thinking" ? "FYY-AI sedang berpikir..."
    : phase === "speaking" ? "FYY-AI sedang berbicara..."
    : isUserSpeakingRef.current ? "Mendengarkan ucapanmu..."
    : "Mendengarkan · Bicara bebas (ID/EN)..."

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-between items-center select-none overflow-hidden animate-fade-in"
      style={{ background: "radial-gradient(circle at 50% 38%, #14141f 0%, #080810 65%, #030306 100%)" }}
    >
      {/* ── HEADER ── */}
      <header className="w-full max-w-xl flex items-center justify-between px-6 pt-6 sm:pt-8 z-20">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl shadow-lg">
          <span className={`w-2 h-2 rounded-full ${
            phase === "speaking" ? "bg-rose-500 animate-ping"
            : phase === "thinking" ? "bg-amber-400 animate-pulse"
            : phase === "error" ? "bg-red-500"
            : "bg-emerald-400"
          }`} />
          <span className="text-[11px] font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
            <Sparkles size={11} className="text-rose-400" />
            FYY-AI Live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowSubtitles((p) => !p)}
            className={`p-2.5 rounded-full border transition-all duration-200 ${showSubtitles
              ? "bg-white/15 border-white/25 text-white"
              : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-white"}`}>
            <MessageSquare size={16} />
          </button>
          <button type="button" onClick={onEndCall}
            className="p-2.5 rounded-full bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white transition-all duration-200">
            <X size={16} />
          </button>
        </div>
      </header>

      {/* ── ORB ── */}
      <main className="relative flex-1 w-full max-w-lg flex flex-col items-center justify-center z-10 px-4">
        <canvas
          ref={canvasRef}
          onClick={handleOrbClick}
          className="w-64 h-64 sm:w-80 sm:h-80 cursor-pointer active:scale-95 transition-transform duration-150 rounded-full"
          title={phase === "speaking" ? "Ketuk untuk menyela" : "FYY-AI Live"}
        />
        <p className={`mt-4 text-xs font-semibold tracking-wide transition-all duration-500 ${
          phase === "error" ? "text-yellow-400"
          : isMuted ? "text-gray-500"
          : phase === "thinking" ? "text-amber-400 animate-pulse"
          : phase === "speaking" ? "text-rose-400"
          : isUserSpeakingRef.current ? "text-rose-300 animate-pulse"
          : "text-gray-400"
        }`}>
          {statusLabel}
        </p>
      </main>

      {/* ── TRANSCRIPT ── */}
      {showSubtitles && (
        <section className="w-full max-w-md px-6 mb-4 min-h-[72px] flex flex-col items-center justify-center text-center z-20">
          {phase === "error" ? (
            <div className="flex flex-col items-center gap-2 bg-red-950/40 border border-red-500/20 p-3.5 rounded-2xl backdrop-blur-md w-full">
              <p className="text-yellow-300 text-xs leading-relaxed">{errorMsg}</p>
              {isSpeechAPISupported && (
                <button type="button" onClick={() => { buildRecognition(); startRecognition() }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition-all active:scale-95">
                  <RefreshCw size={12} /> Hubungkan Ulang
                </button>
              )}
            </div>
          ) : phase === "thinking" ? (
            <div className="w-full px-4 py-3 rounded-2xl bg-amber-950/30 border border-amber-500/20 backdrop-blur-md">
              <p className="text-[10px] text-amber-400 uppercase tracking-widest font-black mb-1">Memproses</p>
              <p className="text-gray-300 text-sm italic animate-pulse">FYY-AI sedang merespon...</p>
            </div>
          ) : interimText ? (
            <div className="w-full px-4 py-2.5 rounded-2xl bg-rose-950/20 border border-rose-500/15 backdrop-blur-md">
              <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black mb-0.5">Kamu</p>
              <p className="text-gray-300 text-sm italic line-clamp-2">"{interimText}..."</p>
            </div>
          ) : activeTranscript.speaker === "user" ? (
            <div className="w-full px-4 py-2.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 backdrop-blur-md">
              <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black mb-0.5">Kamu</p>
              <p className="text-gray-100 text-sm italic leading-relaxed line-clamp-3">"{activeTranscript.text}"</p>
            </div>
          ) : activeTranscript.speaker === "ai" ? (
            <div className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md shadow-xl">
              <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black mb-0.5 flex items-center justify-center gap-1">
                <Volume2 size={11} className="animate-pulse" /> FYY-AI
              </p>
              <p className="text-white text-sm font-semibold leading-relaxed line-clamp-3">{activeTranscript.text}</p>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">Ketuk bola untuk menyela</p>
            </div>
          ) : (
            <div className="px-5 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <p className="text-gray-500 text-xs">{activeTranscript.text}</p>
            </div>
          )}
        </section>
      )}

      {/* ── CONTROLS ── */}
      <footer className="w-full max-w-sm flex items-center justify-center gap-8 pb-10 sm:pb-12 z-20">
        <button type="button" onClick={toggleMute}
          className={`p-4 rounded-full border transition-all duration-200 active:scale-90 shadow-lg ${
            isMuted
              ? "bg-red-500/20 border-red-500/40 text-red-400 shadow-red-500/10"
              : "bg-white/[0.06] border-white/10 text-white hover:bg-white/10"
          }`}>
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button type="button" onClick={onEndCall}
          className="p-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-2xl shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all duration-200">
          <PhoneOff size={26} />
        </button>
      </footer>
    </div>
  )
}
