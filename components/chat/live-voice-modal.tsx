import { PhoneOff, Sparkles } from "lucide-react"

interface LiveVoiceModalProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking'
  onEndCall: () => void
  onInterrupt?: () => void
  userTranscript?: string
  aiTranscript?: string
}

export default function LiveVoiceModal({
  state,
  onEndCall,
  onInterrupt,
  userTranscript,
  aiTranscript
}: LiveVoiceModalProps) {

  const getOrbStateStyles = () => {
    switch (state) {
      case 'listening':
        return {
          background: "linear-gradient(135deg, #2563FF, #1D4ED8)",
          boxShadow: "0 0 40px rgba(37, 99, 255, 0.4)",
          transform: "scale(1.0)"
        }
      case 'thinking':
        return {
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          boxShadow: "0 0 40px rgba(245, 158, 11, 0.4)",
          transform: "scale(1.08)"
        }
      case 'speaking':
        return {
          background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
          boxShadow: "0 0 50px rgba(139, 92, 246, 0.5)",
          transform: "scale(1.15)"
        }
      default:
        return {
          background: "rgba(255, 255, 255, 0.05)",
          boxShadow: "0 0 20px rgba(255, 255, 255, 0.02)",
          transform: "scale(0.9)"
        }
    }
  }

  const getRippleColor = () => {
    switch (state) {
      case 'listening': return "border-blue-500/20"
      case 'thinking': return "border-yellow-500/20"
      case 'speaking': return "border-purple-500/30"
      default: return "border-white/5"
    }
  }

  const getStateText = () => {
    switch (state) {
      case 'listening': return "FYY-AI is listening..."
      case 'thinking': return "FYY-AI is thinking..."
      case 'speaking': return "FYY-AI is speaking..."
      default: return "Connecting live session..."
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between p-8 sm:p-12 animate-fade-in"
      style={{
        background: "rgba(6, 8, 22, 0.98)",
        backdropFilter: "blur(30px)"
      }}
    >
      {/* Header */}
      <div className="w-full text-center mt-6 space-y-2">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-blue-400" />
          FYY-AI Voice Call
        </h2>
        
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider animate-pulse-slow">
          {getStateText()}
        </p>

        <div className="inline-block px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full text-[9px] text-gray-500 font-medium">
          Experimental Native Speech Interface
        </div>
      </div>

      {/* Center visual shockwaves */}
      <div className="relative flex items-center justify-center flex-1 w-full max-w-md">
        
        {state !== 'idle' && (
          <>
            <div
              className={`absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full border-4 ${getRippleColor()} animate-ping-slow`}
              style={{ animationDuration: state === 'speaking' ? '1.2s' : '3s' }}
            />
            <div
              className={`absolute w-44 h-44 sm:w-60 sm:h-60 rounded-full border-2 ${getRippleColor()} animate-ping-slow`}
              style={{ animationDuration: state === 'speaking' ? '1.8s' : '4s', animationDelay: '0.3s' }}
            />
          </>
        )}

        {/* Central visual pulse orb button */}
        <button
          onClick={() => state === 'speaking' && onInterrupt?.()}
          style={getOrbStateStyles()}
          className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full transition-all duration-500 ease-out flex items-center justify-center cursor-pointer select-none"
          title={state === 'speaking' ? "Tap to interrupt speaking" : ""}
        >
          <div className="w-1/2 h-1/2 rounded-full bg-white/10 blur-md pointer-events-none" />
        </button>

      </div>

      {/* Subtitles Transcript display area */}
      <div className="w-full max-w-md h-24 mb-6 flex flex-col items-center justify-end text-center px-4">
        {state === 'listening' && userTranscript && (
          <p className="text-gray-400 text-xs sm:text-sm italic animate-fade-in line-clamp-3">
            "{userTranscript}..."
          </p>
        )}
        
        {state === 'speaking' && aiTranscript && (
          <div className="space-y-1 animate-fade-in">
            <p className="text-white text-sm sm:text-base font-semibold leading-relaxed line-clamp-3">
              {aiTranscript}
            </p>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
              Tap center orb to interrupt
            </p>
          </div>
        )}
      </div>

      {/* Controls: Red End Call button */}
      <div className="w-full flex justify-center mb-6">
        <button
          onClick={onEndCall}
          className="bg-red-600 hover:bg-red-700 text-white p-5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          title="End Voice Session"
        >
          <PhoneOff size={24} />
        </button>
      </div>

    </div>
  )
}
