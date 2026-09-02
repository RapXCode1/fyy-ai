"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PhoneOff, Sparkles, Mic, MicOff, MessageSquare, RefreshCw, Volume2, X } from "lucide-react"

// Web Speech API type declarations
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
  const [interimText, setInterimText] = useState("") // Real-time live transcript as user speaks
  const [activeTranscript, setActiveTranscript] = useState<{
    speaker: "user" | "ai" | "idle"
    text: string
  }>({ speaker: "idle", text: "Mempersiapkan..." })
  const [isMuted, setIsMuted] = useState(false)
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")
  const [isSpeechAPISupported, setIsSpeechAPISupported] = useState(true)

  // Refs
  const isMounted = useRef(false)
  const isAiBusy = useRef(false)
  const isMutedRef = useRef(false)
  const isUserSpeakingRef = useRef(false)

  const recognition = useRef<any>(null)
  const isRecognitionActive = useRef(false)
  const watchdogTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const thinkingStartTime = useRef<number>(0) // for minimum thinking visual hold
  const animFrameId = useRef<number | null>(null)

  const mediaStream = useRef<MediaStream | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null)
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const liveAudioData = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const liveAvgVolume = useRef(0)
  const morphPhaseRef = useRef(0)
  const currentColor = useRef({ r: 255, g: 255, b: 255, a: 0.9 })
  const currentScale = useRef(1.0)
  const cachedVoices = useRef<SpeechSynthesisVoice[]>([])

  useEffect(() => { isMutedRef.current = isMuted }, [isMuted])

  // ── Helper: clear timers ───────────────────────────────────────────────────
  const clearTimers = () => {
    if (watchdogTimer.current) { clearTimeout(watchdogTimer.current); watchdogTimer.current = null }
    if (restartTimer.current) { clearTimeout(restartTimer.current); restartTimer.current = null }
  }

  // Stops current audio sources WITHOUT resetting isAiBusy (used internally in playAISpeech)
  const stopCurrentAudio = useCallback(() => {
    if (currentAudioSource.current) {
      try { currentAudioSource.current.stop(); currentAudioSource.current.disconnect() } catch {}
      currentAudioSource.current = null
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try { window.speechSynthesis.cancel() } catch {}
    }
  }, [])

  // ── 1. Interrupt AI Speech (barge-in by user — resets isAiBusy) ──────────
  const interruptAI = useCallback(() => {
    clearTimers()
    if (currentAudioSource.current) {
      try { currentAudioSource.current.stop(); currentAudioSource.current.disconnect() } catch {}
      currentAudioSource.current = null
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try { window.speechSynthesis.cancel() } catch {}
    }
    isAiBusy.current = false
  }, [])

  // ── 2. Start Web Speech Recognition ──────────────────────────────────────
  const startRecognition = useCallback(() => {
    if (!isMounted.current || isAiBusy.current || isRecognitionActive.current || !recognition.current) return
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

  // ── 3. Play AI Voice Response ─────────────────────────────────────────────
  const playAISpeech = useCallback((text: string, onDone: () => void) => {
    if (!isMounted.current) { onDone(); return }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, " Blok kode. ")
      .replace(/[*_#`~>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/-\s/g, "")
      .trim()

    if (!cleanText) { isAiBusy.current = false; onDone(); return }

    // Stop current audio WITHOUT resetting isAiBusy (we're still busy speaking)
    stopCurrentAudio()
    // Keep isAiBusy = true — do NOT call interruptAI() here (it resets isAiBusy!)
    isAiBusy.current = true
    isRecognitionActive.current = false
    try { recognition.current?.stop() } catch {}

    let isFinished = false
    const finish = () => {
      if (isFinished) return
      isFinished = true
      clearTimers()
      isAiBusy.current = false
      if (isMounted.current) {
        // 450ms acoustic cooldown before mic reopens
        restartTimer.current = setTimeout(() => { if (isMounted.current) onDone() }, 450)
      }
    }

    watchdogTimer.current = setTimeout(finish, Math.min(22000, Math.max(3500, cleanText.length * 85)))
    setPhase("speaking")
    setActiveTranscript({ speaker: "ai", text: cleanText })

    const ctx = audioCtx.current
    if (!ctx) { fallbackSpeechSynthesis(cleanText, finish); return }

    const runPlayback = async () => {
      try {
        if (ctx.state !== "running") await ctx.resume()
        const controller = new AbortController()
        const tid = setTimeout(() => controller.abort(), 3000)
        const res = await fetch(`/api/tts?text=${encodeURIComponent(cleanText.substring(0, 240))}`, {
          signal: controller.signal,
        }).catch(() => null)
        clearTimeout(tid)
        if (!res || !res.ok || !isMounted.current) { fallbackSpeechSynthesis(cleanText, finish); return }
        const arrayBuffer = await res.arrayBuffer()
        if (!isMounted.current) { finish(); return }
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        if (!isMounted.current) { finish(); return }
        const source = ctx.createBufferSource()
        source.buffer = audioBuffer
        if (analyser.current) source.connect(analyser.current)
        source.connect(ctx.destination)
        source.onended = finish
        currentAudioSource.current = source
        source.start(0)
      } catch {
        fallbackSpeechSynthesis(cleanText, finish)
      }
    }
    runPlayback()
  }, [interruptAI, stopCurrentAudio])

  const fallbackSpeechSynthesis = (text: string, onDone: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { onDone(); return }
    try {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text.substring(0, 220))
      utt.lang = "id-ID"; utt.rate = 1.05; utt.volume = 1.0
      const voices = cachedVoices.current.length > 0 ? cachedVoices.current : window.speechSynthesis.getVoices()
      const idVoice = voices.find((v) => v.lang.includes("id") || v.lang.includes("ID"))
      if (idVoice) utt.voice = idVoice
      utt.onend = onDone; utt.onerror = onDone
      ;(window as any).__fyyUtterance = utt
      window.speechSynthesis.speak(utt)
    } catch { onDone() }
  }

  // ── 4. Handle final transcript from Web Speech API ────────────────────────
  const processFinalTranscript = useCallback(async (transcript: string) => {
    const clean = transcript.trim()
    if (!clean || isAiBusy.current || !isMounted.current) return

    isAiBusy.current = true
    thinkingStartTime.current = Date.now()
    setPhase("thinking")
    setInterimText("")
    setActiveTranscript({ speaker: "user", text: clean })

    try {
      const aiReply = await onSendMessage(clean)
      if (!isMounted.current) return

      // Ensure thinking phase is visible for at least 600ms before switching to speaking
      const elapsed = Date.now() - thinkingStartTime.current
      if (elapsed < 600) await new Promise((r) => setTimeout(r, 600 - elapsed))
      if (!isMounted.current) return

      if (aiReply) {
        playAISpeech(aiReply, () => {
          if (isMounted.current) { setPhase("listening"); startRecognition() }
        })
      } else {
        isAiBusy.current = false; setPhase("listening"); startRecognition()
      }
    } catch {
      if (isMounted.current) { isAiBusy.current = false; setPhase("listening"); startRecognition() }
    }
  }, [onSendMessage, playAISpeech, startRecognition])

  // ── 5. Initialize Web Speech API + Analyser for Orb Viz ──────────────────
  const initializeSpeechRecognition = useCallback(async () => {
    setPhase("connecting")
    setErrorMsg("")
    setActiveTranscript({ speaker: "idle", text: "Menghubungkan..." })

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionClass) {
      setIsSpeechAPISupported(false)
      setPhase("error")
      setErrorMsg("Browser tidak mendukung Web Speech API. Gunakan Chrome atau Edge terbaru.")
      return
    }

    // Mic stream just for orb visualizer (no recording needed!)
    try {
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: { ideal: true }, noiseSuppression: { ideal: true }, autoGainControl: { ideal: true }, channelCount: 1 },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 6000)),
      ]) as MediaStream

      if (!isMounted.current) { stream.getTracks().forEach((t) => t.stop()); return }
      if (mediaStream.current) mediaStream.current.getTracks().forEach((t) => t.stop())
      mediaStream.current = stream

      const ctx = audioCtx.current!
      if (ctx.state !== "running") await ctx.resume()

      const an = ctx.createAnalyser()
      an.fftSize = 256; an.smoothingTimeConstant = 0.4
      analyser.current = an

      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 80
      const src = ctx.createMediaStreamSource(stream)
      src.connect(hp); hp.connect(an)
      // NOT connected to destination — silent monitoring only (no acoustic feedback)

      const dataArray = new Uint8Array(an.frequencyBinCount)
      liveAudioData.current = dataArray

      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
      const loop = () => {
        if (!isMounted.current) return
        an.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length
        liveAvgVolume.current = avg
        isUserSpeakingRef.current = avg > 14 && !isAiBusy.current
        animFrameId.current = requestAnimationFrame(loop)
      }
      animFrameId.current = requestAnimationFrame(loop)
    } catch (err: any) {
      if (isMounted.current) {
        setPhase("error")
        setErrorMsg(err?.name === "NotAllowedError"
          ? "Izin mikrofon ditolak. Izinkan mikrofon di pengaturan browser."
          : "Gagal mengakses mikrofon perangkat.")
        return
      }
    }

    // Build SpeechRecognition instance
    const rec = new SpeechRecognitionClass()
    rec.lang = "id-ID"   // Primary: Indonesian. User can also speak English.
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => { isRecognitionActive.current = true; if (isMounted.current) setPhase("listening") }
    rec.onspeechstart = () => { isUserSpeakingRef.current = true }
    rec.onspeechend = () => { isUserSpeakingRef.current = false }

    rec.onresult = (event: any) => {
      let interim = ""; let finalText = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) finalText += t
        else interim += t
      }
      if (interim && isMounted.current) setInterimText(interim)
      if (finalText && isMounted.current) { setInterimText(""); processFinalTranscript(finalText) }
    }

    rec.onerror = (event: any) => {
      isRecognitionActive.current = false
      if (!isMounted.current) return
      if (event.error === "aborted" || event.error === "no-speech") {
        if (!isAiBusy.current && isMounted.current) restartTimer.current = setTimeout(() => startRecognition(), 200)
        return
      }
      if (event.error === "not-allowed") { setPhase("error"); setErrorMsg("Izin mikrofon ditolak."); return }
      console.warn("SpeechRecognition error:", event.error)
      if (!isAiBusy.current && isMounted.current) restartTimer.current = setTimeout(() => startRecognition(), 500)
    }

    rec.onend = () => {
      isRecognitionActive.current = false
      if (!isAiBusy.current && isMounted.current && !isMutedRef.current) {
        restartTimer.current = setTimeout(() => startRecognition(), 150)
      }
    }

    recognition.current = rec

    setTimeout(() => {
      if (isMounted.current) {
        setActiveTranscript({ speaker: "idle", text: "Silakan mulai berbicara..." })
        startRecognition()
      }
    }, 400)
  }, [processFinalTranscript, startRecognition])

  // ── 6. Canvas Orb with Color Lerping ─────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let animId: number

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const w = (canvas.width = canvas.offsetWidth * dpr)
      const h = (canvas.height = canvas.offsetHeight * dpr)
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2, cy = h / 2, baseR = Math.min(w, h) * 0.23
      const vol = liveAvgVolume.current || 0
      morphPhaseRef.current += 0.03

      let tC = { r: 255, g: 255, b: 255, a: 0.95 }, tS = 1.0
      if (phase === "listening") {
        if (isUserSpeakingRef.current) { tC = { r: 244, g: 63, b: 94, a: 0.98 }; tS = 1.0 + Math.min(0.3, vol / 85) }
        else { tC = { r: 255, g: 255, b: 255, a: 0.92 }; tS = 1.0 + Math.sin(morphPhaseRef.current * 1.5) * 0.035 }
      } else if (phase === "thinking") { tC = { r: 245, g: 158, b: 11, a: 0.98 }; tS = 1.06 + Math.sin(morphPhaseRef.current * 3.5) * 0.045
      } else if (phase === "speaking") { tC = { r: 244, g: 63, b: 94, a: 1.0 }; tS = 1.12 + Math.min(0.28, vol / 100)
      } else if (phase === "error") { tC = { r: 156, g: 163, b: 175, a: 0.7 }; tS = 0.9 }

      const lf = 0.12
      currentColor.current.r += (tC.r - currentColor.current.r) * lf
      currentColor.current.g += (tC.g - currentColor.current.g) * lf
      currentColor.current.b += (tC.b - currentColor.current.b) * lf
      currentColor.current.a += (tC.a - currentColor.current.a) * lf
      currentScale.current += (tS - currentScale.current) * lf

      const { r, g, b, a } = currentColor.current; const sc = currentScale.current
      const cp = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`
      const cg = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a * 0.45})`

      const glowG = ctx.createRadialGradient(cx, cy, baseR * 0.4, cx, cy, baseR * sc * 2.2)
      glowG.addColorStop(0, cg)
      glowG.addColorStop(0.6, `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.12)`)
      glowG.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = glowG
      ctx.beginPath(); ctx.arc(cx, cy, baseR * sc * 2.2, 0, Math.PI * 2); ctx.fill()

      const N = 32, pts: { x: number; y: number }[] = []
      const fd = liveAudioData.current
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2
        let fo = 0
        if (fd) { const si = Math.floor((i / N) * (fd.length * 0.6)); fo = (fd[si] / 255) * (baseR * 0.18) }
        const hm = Math.sin(angle * 3 + morphPhaseRef.current * 2) * (baseR * 0.05) + Math.cos(angle * 4 - morphPhaseRef.current * 1.8) * (baseR * 0.035)
        pts.push({ x: cx + Math.cos(angle) * (baseR * sc + hm + fo), y: cy + Math.sin(angle) * (baseR * sc + hm + fo) })
      }

      ctx.save(); ctx.beginPath()
      ctx.moveTo((pts[0].x + pts[N - 1].x) / 2, (pts[0].y + pts[N - 1].y) / 2)
      for (let i = 0; i < N; i++) {
        const nx = pts[(i + 1) % N]
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + nx.x) / 2, (pts[i].y + nx.y) / 2)
      }
      ctx.closePath()
      const lg = ctx.createRadialGradient(cx - baseR * 0.3, cy - baseR * 0.3, baseR * 0.1, cx, cy, baseR * sc)
      lg.addColorStop(0, cp); lg.addColorStop(1, `rgba(${Math.round(r * 0.85)},${Math.round(g * 0.85)},${Math.round(b * 0.85)},${a})`)
      ctx.fillStyle = lg; ctx.shadowColor = cp; ctx.shadowBlur = 35 * dpr; ctx.fill(); ctx.restore()

      ctx.save(); ctx.beginPath()
      ctx.ellipse(cx - baseR * 0.35, cy - baseR * 0.35, baseR * 0.28, baseR * 0.14, -Math.PI / 4, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.filter = `blur(${2 * dpr}px)`; ctx.fill(); ctx.restore()

      animId = requestAnimationFrame(render)
    }
    render()
    return () => cancelAnimationFrame(animId)
  }, [phase])

  // ── 7. Lifecycle Setup & Cleanup ──────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true; isAiBusy.current = false

    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtxClass()
    audioCtx.current = ctx
    try {
      const buf = ctx.createBuffer(1, 1, 22050); const src = ctx.createBufferSource()
      src.buffer = buf; src.connect(ctx.destination); src.start(0); ctx.resume()
    } catch {}

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance(""); u.volume = 0; window.speechSynthesis.speak(u)
        cachedVoices.current = window.speechSynthesis.getVoices()
        window.speechSynthesis.onvoiceschanged = () => { cachedVoices.current = window.speechSynthesis.getVoices() }
      } catch {}
    }

    initializeSpeechRecognition()

    return () => {
      isMounted.current = false; isAiBusy.current = true
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
      clearTimers()
      try { recognition.current?.stop() } catch {}
      recognition.current = null
      if (currentAudioSource.current) {
        try { currentAudioSource.current.stop(); currentAudioSource.current.disconnect() } catch {}
        currentAudioSource.current = null
      }
      if (mediaStream.current) { mediaStream.current.getTracks().forEach((t) => t.stop()); mediaStream.current = null }
      if (ctx.state !== "closed") { try { ctx.close() } catch {} }
      audioCtx.current = null
      try { window.speechSynthesis?.cancel() } catch {}
    }
  }, [initializeSpeechRecognition])

  // ── 8. Mute toggle ────────────────────────────────────────────────────────
  const toggleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    isMutedRef.current = newMuted
    if (mediaStream.current) {
      mediaStream.current.getAudioTracks().forEach((t) => { t.enabled = !newMuted })
    }
    if (newMuted) {
      isRecognitionActive.current = false; try { recognition.current?.stop() } catch {}
    } else {
      restartTimer.current = setTimeout(() => startRecognition(), 200)
    }
  }

  // ── 9. Orb tap = interrupt AI ─────────────────────────────────────────────
  const handleOrbClick = () => {
    if (phase === "speaking") {
      interruptAI(); setPhase("listening"); startRecognition()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-between items-center select-none overflow-hidden animate-fade-in"
      style={{ background: "radial-gradient(circle at 50% 40%, #151522 0%, #08080C 70%, #030305 100%)" }}
    >
      {/* ── HEADER ── */}
      <header className="w-full max-w-xl flex items-center justify-between px-6 pt-6 sm:pt-8 z-20">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-xl shadow-lg">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            phase === "speaking" ? "bg-rose-500 animate-ping shadow-[0_0_8px_#f43f5e]"
            : phase === "thinking" ? "bg-amber-400 animate-pulse"
            : phase === "error" ? "bg-red-500"
            : "bg-emerald-400 shadow-[0_0_6px_#34d399]"
          }`} />
          <span className="text-[11px] font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
            <Sparkles size={11} className="text-rose-400" />
            FYY-AI Live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowSubtitles((p) => !p)}
            className={`p-2.5 rounded-full border transition-all duration-200 ${showSubtitles ? "bg-white/15 border-white/25 text-white" : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-white"}`}>
            <MessageSquare size={16} />
          </button>
          <button type="button" onClick={onEndCall}
            className="p-2.5 rounded-full bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200">
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
        <div className="text-center mt-3">
          <p className={`text-xs font-semibold tracking-wide transition-colors ${
            phase === "error" ? "text-yellow-400"
            : isMuted ? "text-gray-400"
            : phase === "thinking" ? "text-amber-400 animate-pulse font-bold"
            : phase === "speaking" ? "text-rose-400 font-bold"
            : isUserSpeakingRef.current ? "text-rose-400 font-bold animate-pulse"
            : "text-gray-300"
          }`}>
            {phase === "connecting" ? "Menghubungkan..."
              : isMuted ? "Mikrofon dibisukan (Muted)"
              : phase === "thinking" ? "FYY-AI sedang berpikir..."
              : phase === "speaking" ? "FYY-AI sedang berbicara..."
              : isUserSpeakingRef.current ? "Mendengarkan ucapanmu..."
              : "Mendengarkan · Bicara bebas (ID/EN)..."}
          </p>
        </div>
      </main>

      {/* ── TRANSCRIPT ── */}
      {showSubtitles && (
        <section className="w-full max-w-md px-6 mb-3 min-h-[68px] flex flex-col items-center justify-center text-center z-20">
          {phase === "error" ? (
            <div className="flex flex-col items-center gap-2 bg-red-950/40 border border-red-500/20 p-3 rounded-2xl backdrop-blur-md">
              <p className="text-yellow-300 text-xs leading-relaxed">{errorMsg}</p>
              {isSpeechAPISupported && (
                <button type="button" onClick={initializeSpeechRecognition}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition-all active:scale-95">
                  <RefreshCw size={12} /> Hubungkan Ulang
                </button>
              )}
            </div>
          ) : phase === "thinking" ? (
            <div className="w-full px-4 py-2.5 rounded-2xl bg-amber-950/30 border border-amber-500/20 backdrop-blur-md animate-fade-in">
              <p className="text-[10px] text-amber-400 uppercase tracking-widest font-black mb-0.5">Memproses</p>
              <p className="text-gray-300 text-xs sm:text-sm font-medium italic animate-pulse">FYY-AI sedang merespon...</p>
            </div>
          ) : interimText ? (
            // Real-time live transcript as user speaks (unique to Web Speech API!)
            <div className="w-full px-4 py-2.5 rounded-2xl bg-rose-950/20 border border-rose-500/20 backdrop-blur-md animate-fade-in">
              <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black mb-0.5">Kamu</p>
              <p className="text-gray-300 text-xs sm:text-sm italic leading-relaxed line-clamp-2">"{interimText}..."</p>
            </div>
          ) : activeTranscript.speaker === "user" ? (
            <div className="w-full px-4 py-2.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 backdrop-blur-md animate-fade-in">
              <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black mb-0.5">Kamu</p>
              <p className="text-gray-100 text-xs sm:text-sm font-medium italic leading-relaxed line-clamp-3">"{activeTranscript.text}"</p>
            </div>
          ) : activeTranscript.speaker === "ai" ? (
            <div className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md animate-fade-in shadow-xl">
              <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black mb-0.5 flex items-center justify-center gap-1">
                <Volume2 size={11} className="animate-pulse" /> FYY-AI
              </p>
              <p className="text-white text-xs sm:text-sm font-semibold leading-relaxed line-clamp-3">{activeTranscript.text}</p>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1 font-mono">Ketuk bola untuk menyela</p>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md">
              <p className="text-gray-400 text-xs tracking-wide">{isMuted ? "Mikrofon dibisukan." : activeTranscript.text}</p>
            </div>
          )}
        </section>
      )}

      {/* ── CONTROLS ── */}
      <footer className="w-full max-w-sm flex items-center justify-center gap-6 pb-8 sm:pb-10 z-20">
        <button type="button" onClick={toggleMute}
          className={`p-4 rounded-full border transition-all duration-200 active:scale-90 ${
            isMuted ? "bg-red-500/20 border-red-500/40 text-red-400 shadow-lg shadow-red-500/10"
            : "bg-white/[0.06] border-white/10 text-white hover:bg-white/10"
          }`}>
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button type="button" onClick={onEndCall}
          className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all duration-200">
          <PhoneOff size={26} />
        </button>
      </footer>
    </div>
  )
}
