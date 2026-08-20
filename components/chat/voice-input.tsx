"use client"

import { useState, useEffect } from "react"
import { Mic, Square, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVoiceInput } from "@/hooks/use-voice-input"

interface VoiceInputProps {
  onTranscript: (_text: string) => void
  disabled?: boolean
  onLiveModeToggle?: (isActive: boolean) => void
  onRecordingEnd?: () => void
  onRecordingStateChange?: (isRecording: boolean) => void
  liveModeTrigger?: number
  isLiveMode?: boolean
}

export default function VoiceInput({
  onTranscript,
  disabled,
  onLiveModeToggle,
  onRecordingEnd,
  onRecordingStateChange,
  liveModeTrigger = 0,
  isLiveMode = false,
}: VoiceInputProps) {
  const [error, setError] = useState<string>("")

  const { isRecording, isSupported, permissionState, requestMicrophonePermission, startRecording, stopRecording } =
    useVoiceInput({
      onTranscript: (text) => {
        onTranscript(text)
        setError("")
      },
      onError: (err) => {
        setError(err)
        setTimeout(() => setError(""), 5000)
      },
      onEnd: () => {
        onRecordingEnd?.()
      },
      continuous: isLiveMode,
    })

  // Notify parent of recording state changes
  useEffect(() => {
    onRecordingStateChange?.(isRecording)
  }, [isRecording, onRecordingStateChange])

  // Stop recording immediately if input is disabled or message is being sent
  useEffect(() => {
    if (disabled && isRecording) {
      stopRecording()
    }
  }, [disabled, isRecording, stopRecording])

  // Listen for trigger to restart recording in Live Mode
  useEffect(() => {
    if (isLiveMode && liveModeTrigger > 0 && !isRecording && !disabled) {
      startRecording()
    }
  }, [liveModeTrigger, isLiveMode, isRecording, disabled, startRecording])

  const handleMicClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    // Unlock browser audio context for subsequent TTS
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const unlock = new SpeechSynthesisUtterance("")
        unlock.volume = 0
        window.speechSynthesis.speak(unlock)
      } catch {}
    }

    if (isRecording) {
      stopRecording()
      onRecordingEnd?.()
    } else {
      if (permissionState === "denied") {
        const ok = await requestMicrophonePermission()
        if (!ok) return
      }
      startRecording()
    }
  }

  const handleStartLiveCall = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Unlock audio context on user gesture
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const unlock = new SpeechSynthesisUtterance("")
        unlock.volume = 0
        window.speechSynthesis.speak(unlock)
      } catch {}
    }

    onLiveModeToggle?.(true)
  }

  if (!isSupported) {
    return (
      <Button
        disabled
        variant="ghost"
        title="Speech recognition not supported in this browser"
        className="opacity-40 cursor-not-allowed h-9 w-9 p-0 rounded-xl"
      >
        <Mic className="h-4 w-4" />
      </Button>
    )
  }

  if (isLiveMode) {
    return null
  }

  return (
    <div className="relative flex items-center gap-1">
      {/* Live Call Button (Phone Call Mode) */}
      <Button
        type="button"
        variant="ghost"
        onClick={handleStartLiveCall}
        disabled={disabled}
        title="Mulai Panggilan Suara Langsung (Live Voice Call)"
        className="h-9 w-9 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all flex items-center justify-center micro-btn"
      >
        <PhoneCall className="h-4 w-4" />
      </Button>

      {/* Main Mic Button (Tap to record, tap to stop) */}
      <Button
        type="button"
        variant={isRecording ? "destructive" : "ghost"}
        onClick={handleMicClick}
        disabled={disabled}
        className={`h-9 w-9 p-0 rounded-xl transition-all duration-200 flex items-center justify-center micro-btn ${
          isRecording
            ? "bg-red-600 text-white shadow-lg shadow-red-500/40 animate-pulse ring-2 ring-red-400"
            : "text-[var(--fyf-text-secondary)] hover:text-[var(--fyf-text)] hover:bg-[var(--fyf-border)]"
        }`}
        title={isRecording ? "Ketuk untuk selesai merekam" : "Ketuk untuk bicara (Rekam Suara)"}
      >
        {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
      </Button>

      {/* Recording indicator badge */}
      {isRecording && (
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg flex items-center gap-1 animate-fade-in pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          Mendengarkan...
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div
          onClick={() => setError("")}
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-950 border border-red-500/50 text-red-200 text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-xl cursor-pointer animate-fade-in"
        >
          {error}
        </div>
      )}
    </div>
  )
}
