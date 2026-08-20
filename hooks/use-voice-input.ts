"use client"

import { useState, useRef, useCallback, useEffect } from "react"

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface UseVoiceInputOptions {
  onTranscript?: (transcript: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
  continuous?: boolean
}

export function useVoiceInput({ onTranscript, onError, onEnd, continuous = false }: UseVoiceInputOptions = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [permissionState, setPermissionState] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown")
  const recognitionRef = useRef<any>(null)
  const callbacksRef = useRef({ onTranscript, onError, onEnd })
  const silenceTimerRef = useRef<any>(null)

  useEffect(() => {
    callbacksRef.current = { onTranscript, onError, onEnd }
  }, [onTranscript, onError, onEnd])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
      setIsSupported(supported)
    }
  }, [])

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        return true
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setPermissionState("granted")
      return true
    } catch (err: any) {
      const isDenied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
      setPermissionState(isDenied ? "denied" : "unknown")
      callbacksRef.current.onError?.(
        isDenied
          ? "Izin mikrofon ditolak. Silakan aktifkan izin mikrofon di pengaturan browser/HP."
          : "Gagal meminta izin mikrofon."
      )
      return false
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        try { recognitionRef.current.abort() } catch {}
      }
      recognitionRef.current = null
    }
    setIsRecording(false)
  }, [])

  const startRecording = useCallback(async () => {
    if (isRecording) return

    const granted = await requestMicrophonePermission()
    if (!granted && permissionState === "denied") return

    const SpeechRecognitionClass =
      typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null

    if (!SpeechRecognitionClass) {
      callbacksRef.current.onError?.("Browser ini belum mendukung speech recognition.")
      return
    }

    try {
      stopRecording()

      const recognition = new SpeechRecognitionClass()
      recognition.continuous = continuous
      recognition.interimResults = true
      recognition.lang = "id-ID"

      recognition.onstart = () => {
        setIsRecording(true)
      }

      recognition.onresult = (event: any) => {
        let fullTranscript = ""
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript
        }

        if (fullTranscript.trim()) {
          callbacksRef.current.onTranscript?.(fullTranscript)

          // Reset silence timer (auto-stop after 2 seconds of silence in standard mode)
          if (!continuous) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = setTimeout(() => {
              stopRecording()
              callbacksRef.current.onEnd?.()
            }, 2200)
          }
        }
      }

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech") {
          stopRecording()
          return
        }
        if (event.error === "aborted") {
          setIsRecording(false)
          return
        }

        let errorMsg = "Pengenalan suara terganggu."
        if (event.error === "not-allowed") {
          errorMsg = "Izin mic ditolak. Izinkan akses mikrofon."
          setPermissionState("denied")
        } else if (event.error === "network") {
          errorMsg = "Kendala jaringan pada voice recognition."
        }
        callbacksRef.current.onError?.(errorMsg)
        stopRecording()
      }

      recognition.onend = () => {
        setIsRecording(false)
        callbacksRef.current.onEnd?.()
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setIsRecording(false)
      callbacksRef.current.onError?.("Gagal mengaktifkan perekam suara.")
    }
  }, [isRecording, permissionState, continuous, requestMicrophonePermission, stopRecording])

  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [stopRecording])

  return {
    isRecording,
    isSupported,
    permissionState,
    requestMicrophonePermission,
    startRecording,
    stopRecording,
  }
}

/**
 * Enhanced Text-to-Speech (TTS) hook with mobile audio unlock & Indonesian voice engine
 */
export function useSpeechOutput(options?: { onStart?: () => void; onEnd?: () => void }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices()
      }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      optionsRef.current?.onEnd?.()
      return
    }

    // Clean text for speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, " Berikut adalah blok kode. ")
      .replace(/[*_#`~>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/-\s/g, "")
      .trim()

    if (!cleanText) {
      setIsSpeaking(false)
      optionsRef.current?.onEnd?.()
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
      const indonesianVoice =
        voices.find((v) => v.lang.includes("id") || v.lang.includes("ID")) ||
        voices.find((v) => v.name.toLowerCase().includes("indonesia") || v.name.toLowerCase().includes("andika"))

      if (indonesianVoice) {
        utterance.voice = indonesianVoice
      }

      utterance.onstart = () => {
        setIsSpeaking(true)
        optionsRef.current?.onStart?.()
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        optionsRef.current?.onEnd?.()
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
        optionsRef.current?.onEnd?.()
      }

      window.speechSynthesis.speak(utterance)
    } catch {
      setIsSpeaking(false)
      optionsRef.current?.onEnd?.()
    }
  }, [])

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel()
      } catch {}
      setIsSpeaking(false)
      optionsRef.current?.onEnd?.()
    }
  }, [])

  return {
    isSpeaking,
    speak,
    stop,
  }
}
