"use client"

import { useState, useRef, useCallback, useEffect } from "react"

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(_index: number): SpeechRecognitionResult
  [_index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly length: number
  item(_index: number): SpeechRecognitionAlternative
  [_index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

interface UseVoiceInputOptions {
  onTranscript?: (transcript: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

export function useVoiceInput({ onTranscript, onError, onEnd }: UseVoiceInputOptions = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  
  const callbacksRef = useRef({ onTranscript, onError, onEnd })
  
  useEffect(() => {
    callbacksRef.current = { onTranscript, onError, onEnd }
  }, [onTranscript, onError, onEnd])

  useEffect(() => {
    // Check if Speech Recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'id-ID' // Set to Indonesian to improve accuracy

      recognition.onstart = () => {
        setIsRecording(true)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          callbacksRef.current.onTranscript?.(finalTranscript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMsg = "Voice input failed"
        switch (event.error) {
          case 'no-speech':
            errorMsg = "No speech detected. Try speaking louder or closer to microphone."
            break
          case 'audio-capture':
            errorMsg = "Microphone not accessible. Check your audio settings."
            break
          case 'not-allowed':
            errorMsg = "Microphone permission denied. Click the microphone icon and allow access."
            break
          case 'network':
            errorMsg = "Network error. Check your internet connection."
            break
          case 'service-not-allowed':
            errorMsg = "Voice recognition unavailable in your region."
            break
          default:
            errorMsg = "Voice input unavailable. Try typing your message instead."
        }
        callbacksRef.current.onError?.(errorMsg)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
        callbacksRef.current.onEnd?.()
      }

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
    }
  }, []) // Empty dependency array ensures we only set up recognition once

  const startRecording = useCallback(() => {
    if (recognitionRef.current && !isRecording) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        onError?.("Failed to start speech recognition")
      }
    }
  }, [isRecording, onError])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (error) {
        console.error("Failed to abort speech recognition:", error)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore cleanup errors
        }
        recognitionRef.current = null
      }
    }
  }, [])

  return {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
  }
}

export function useSpeechOutput(options?: { onStart?: () => void; onEnd?: () => void }) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Force loading of voices as soon as the hook is used
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
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel() // Stop any ongoing speech

      // Clean Markdown
      let cleanText = text
        .replace(/```[\s\S]*?```/g, " (Berikut adalah blok kode) ") // Summarize code blocks
        .replace(/[*_#`~>]/g, "") // Remove formatting characters
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Extract text from links
        .replace(/-\s/g, "") // Remove list hyphens
        .trim()

      if (!cleanText) {
        setIsSpeaking(false)
        options?.onEnd?.()
        return
      }

      // Attempt to find the most natural male voice
      const voices = window.speechSynthesis.getVoices()
      
      let bestVoice = voices.find(v => v.lang.includes('id') && (v.name.toLowerCase().includes('andika') || v.name.toLowerCase().includes('male')))
      if (!bestVoice) {
        bestVoice = voices.find(v => v.lang.includes('id') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium')))
      }
      if (!bestVoice) {
        bestVoice = voices.find(v => v.lang.includes('id'))
      }

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = "id-ID"
      if (bestVoice) {
        utterance.voice = bestVoice
      }

      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => {
        setIsSpeaking(true)
        options?.onStart?.()
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        options?.onEnd?.()
      }

      utterance.onerror = (e) => {
        console.error("TTS SpeechSynthesis Error:", e)
        setIsSpeaking(false)
        options?.onEnd?.()
      }

      window.speechSynthesis.speak(utterance)
    }
  }, [options])

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return {
    isSpeaking,
    speak,
    stop,
  }
}
