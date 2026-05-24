"use client"

import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSpeechOutput } from "@/hooks/use-voice-input"

interface SpeechOutputProps {
  text: string
}

export default function SpeechOutput({ text }: SpeechOutputProps) {
  const { isSpeaking, speak, stop } = useSpeechOutput()

  return (
    <Button
      onClick={isSpeaking ? stop : () => speak(text)}
      variant="ghost"
      size="icon"
      title={isSpeaking ? "Stop speaking" : "Read message aloud"}
      className={isSpeaking ? "text-cyan-400" : ""}
    >
      {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </Button>
  )
}
