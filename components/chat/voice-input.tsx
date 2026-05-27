"use client"

import { useState, useEffect } from "react"
import { Mic, Square } from "lucide-react"
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

export default function VoiceInput({ onTranscript, disabled, onLiveModeToggle, onRecordingEnd, onRecordingStateChange, liveModeTrigger = 0, isLiveMode = false }: VoiceInputProps) {
  const { isRecording, isSupported, startRecording, stopRecording } = useVoiceInput({
    onTranscript: (text) => {
      onTranscript(text)
      setError("")
      if (errorTimeout) {
        clearTimeout(errorTimeout)
        setErrorTimeout(null)
      }
    },
    onError: (error) => {
      setError(error)
      if (errorTimeout) clearTimeout(errorTimeout)
      const timeout = setTimeout(() => {
        setError("")
        setErrorTimeout(null)
      }, 5000)
      setErrorTimeout(timeout)
    },
    onEnd: () => {
      onRecordingEnd?.()
    }
  })
  const [error, setError] = useState<string>("")
  const [errorTimeout, setErrorTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  
  // Swipe-to-lock logic
  const [startY, setStartY] = useState<number | null>(null)
  const [currentY, setCurrentY] = useState<number | null>(null)
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(false)

  // Notify parent of recording state changes
  useEffect(() => {
    onRecordingStateChange?.(isRecording)
  }, [isRecording, onRecordingStateChange])

  // Swipe indicator display duration (auto fade-out after 2.5s)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (isRecording && startY !== null) {
      setShowSwipeIndicator(true)
      timer = setTimeout(() => {
        setShowSwipeIndicator(false)
      }, 2500)
    } else {
      setShowSwipeIndicator(false)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isRecording, startY])

  // Listen for trigger to restart recording in Live Mode
  useEffect(() => {
    if (isLiveMode && liveModeTrigger > 0 && !isRecording && !disabled) {
      startRecording()
    }
  }, [liveModeTrigger, isLiveMode, isRecording, disabled, startRecording])

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return
    
    // Unlock browser audio engine for TTS (required by Chrome/Safari to allow async speaking later)
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const unlockUtterance = new SpeechSynthesisUtterance("")
      unlockUtterance.volume = 0
      window.speechSynthesis.speak(unlockUtterance)
    }

    setStartY(e.clientY)
    setCurrentY(e.clientY)
    if (!isRecording && !isLiveMode) {
      startRecording()
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (startY === null || isLiveMode) return
    setCurrentY(e.clientY)
    
    // If dragged up by more than 50px
    if (startY - e.clientY > 50) {
      onLiveModeToggle?.(true)
      setStartY(null)
      setCurrentY(null)
    }
  }

  const handlePointerUp = () => {
    if (!isLiveMode && startY !== null) {
      // Normal click or release before locking
      if (isRecording) {
        stopRecording()
      }
    }
    setStartY(null)
    setCurrentY(null)
  }

  useEffect(() => {
    if (!isSupported) {
      setError("Speech recognition not supported in your browser")
      if (errorTimeout) clearTimeout(errorTimeout)
      const timeout = setTimeout(() => {
        setError("")
        setErrorTimeout(null)
      }, 5000)
      setErrorTimeout(timeout)
    }
  }, [isSupported])

  useEffect(() => {
    if (isRecording) {
      setError("")
      if (errorTimeout) {
        clearTimeout(errorTimeout)
        setErrorTimeout(null)
      }
    }
  }, [isRecording])

  useEffect(() => {
    if (disabled && isRecording) {
      stopRecording()
    }
  }, [disabled, isRecording, stopRecording])

  const handleErrorClick = () => {
    setError("")
    if (errorTimeout) {
      clearTimeout(errorTimeout)
      setErrorTimeout(null)
    }
  }

  useEffect(() => {
    return () => {
      if (errorTimeout) clearTimeout(errorTimeout)
    }
  }, [errorTimeout])

  if (!isSupported) {
    return (
      <Button 
        disabled 
        variant="ghost" 
        title="Speech recognition not supported" 
        className="opacity-50 cursor-not-allowed h-[40px] w-[40px] sm:h-[48px] sm:w-[48px] rounded-lg"
      >
        <Mic className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
      </Button>
    )
  }

  const dragDistance = startY !== null && currentY !== null ? Math.max(0, startY - currentY) : 0
  const transformY = isLiveMode ? 0 : -dragDistance

  if (isLiveMode) {
    return (
      <div className="flex items-center gap-2 animate-fade-in">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full animate-pulse">
          <Mic size={14} className="text-red-500" />
          <span className="text-xs font-semibold text-red-500">Live Voice Active</span>
        </div>
        <Button
          onClick={() => {
            onLiveModeToggle?.(false)
            stopRecording()
          }}
          variant="destructive"
          size="sm"
          className="rounded-full px-4 h-8"
        >
          End
        </Button>
      </div>
    )
  }

  return (
    <div className="relative touch-none">
      <Button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        disabled={disabled}
        variant={isRecording ? "destructive" : "ghost"}
        className={`${isRecording ? "ring-2 ring-red-400/50" : ""} h-[40px] w-[40px] sm:h-[48px] sm:w-[48px] rounded-lg transition-colors duration-200 relative z-10 flex items-center justify-center`}
        title={isRecording ? "Swipe up to lock Live Voice Mode" : "Hold or click for voice input"}
        style={{ transform: `translateY(${transformY}px)` }}
      >
        {isRecording ? (
          <Square className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
        ) : (
          <Mic className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
        )}
      </Button>

      {/* Swipe up indicator */}
      {isRecording && !isLiveMode && showSwipeIndicator && dragDistance < 50 && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-fade-in pointer-events-none">
          <div className="text-xs text-muted-foreground whitespace-nowrap mb-1">Swipe Up to Lock</div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce mt-1" style={{ animationDelay: '0.2s' }} />
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce mt-1" style={{ animationDelay: '0.4s' }} />
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && startY === null && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none animate-fade-in">
          🎤 Listening...
        </div>
      )}

      {/* Error tooltip with arrow */}
      {error && (
        <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 z-10">
          <div
            className="bg-destructive text-destructive-foreground text-xs px-3 py-2 rounded shadow-lg max-w-56 text-center leading-tight relative cursor-pointer hover:bg-destructive/80 transition-colors"
            onClick={handleErrorClick}
            title="Click to dismiss"
          >
            {error}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-destructive"></div>
          </div>
        </div>
      )}
    </div>
  )
}
