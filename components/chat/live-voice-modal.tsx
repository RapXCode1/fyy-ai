import { PhoneOff, Sparkles } from "lucide-react"

interface LiveVoiceModalProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking'
  onEndCall: () => void
  onInterrupt?: () => void
  userTranscript?: string
  aiTranscript?: string
}

export default function LiveVoiceModal({ state, onEndCall, onInterrupt, userTranscript, aiTranscript }: LiveVoiceModalProps) {

  const getOrbStateClasses = () => {
    switch (state) {
      case 'listening':
        return "bg-cyan-500 shadow-cyan-500/50 scale-100"
      case 'thinking':
        return "bg-amber-500 shadow-amber-500/50 scale-110 animate-spin-slow"
      case 'speaking':
        return "bg-purple-500 shadow-purple-500/50 scale-125 animate-pulse"
      default:
        return "bg-muted shadow-muted/50 scale-90"
    }
  }

  const getRippleClasses = () => {
    switch (state) {
      case 'listening':
        return "border-cyan-500/30 animate-ping-slow"
      case 'thinking':
        return "border-amber-500/30 animate-pulse"
      case 'speaking':
        return "border-purple-500/40 animate-ping"
      default:
        return "hidden"
    }
  }

  const getStateText = () => {
    switch (state) {
      case 'listening': return "Listening..."
      case 'thinking': return "Thinking..."
      case 'speaking': return "Speaking..."
      default: return "Connecting..."
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-between p-8 sm:p-12 animate-in fade-in duration-300">

      {/* Header */}
      <div className="w-full text-center mt-8">
        <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
          <Sparkles className="text-primary" />
          FYY-AI Call
        </h2>
        <div className="text-muted-foreground animate-pulse mb-3">
          {getStateText()}
        </div>
        <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] sm:text-xs text-primary/80 font-medium">
          Note: Fitur ini masih dalam tahap eksperimental
        </div>
      </div>

      {/* Center Orb / Waveform Visual */}
      <div className="relative flex items-center justify-center flex-1 w-full max-w-md">

        {/* Ripples / Shockwaves */}
        <div className={`absolute w-32 h-32 md:w-48 md:h-48 rounded-full border-4 ${getRippleClasses()} opacity-50`} style={{ animationDuration: state === 'speaking' ? '1s' : '3s' }} />
        <div className={`absolute w-40 h-40 md:w-64 md:h-64 rounded-full border-2 ${getRippleClasses()} opacity-30`} style={{ animationDuration: state === 'speaking' ? '1.5s' : '4s', animationDelay: '0.2s' }} />
        <div className={`absolute w-48 h-48 md:w-80 md:h-80 rounded-full border ${getRippleClasses()} opacity-10`} style={{ animationDuration: state === 'speaking' ? '2s' : '5s', animationDelay: '0.4s' }} />

        {/* Core Orb */}
        <button
          className={`relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full shadow-[0_0_40px_rgba(0,0,0,0)] transition-all duration-700 ease-out flex items-center justify-center ${getOrbStateClasses()} ${state === 'speaking' ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}`}
          onClick={() => state === 'speaking' && onInterrupt?.()}
          title={state === 'speaking' ? "Tap to interrupt" : ""}
        >
          <div className="w-1/2 h-1/2 rounded-full bg-white/20 blur-sm mix-blend-overlay animate-pulse pointer-events-none" />
        </button>

      </div>

      {/* Subtitles / Context Area */}
      <div className="w-full max-w-md h-24 mb-4 flex flex-col items-center justify-end text-center px-4">
        {state === 'listening' && userTranscript && (
          <p className="text-muted-foreground text-sm line-clamp-3 animate-in fade-in slide-in-from-bottom-2">
            "{userTranscript}..."
          </p>
        )}
        {state === 'speaking' && (
          <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <p className="text-foreground font-medium text-lg line-clamp-2">
              {aiTranscript}
            </p>
            <p className="text-xs text-muted-foreground/50 uppercase tracking-widest animate-pulse">
              Tap orb to interrupt
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full flex justify-center mb-8">
        <button
          onClick={onEndCall}
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground p-6 rounded-full shadow-2xl hover:shadow-destructive/50 transition-all hover:scale-105 active:scale-95 group"
          title="End Call"
        >
          <PhoneOff size={32} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>

    </div>
  )
}
