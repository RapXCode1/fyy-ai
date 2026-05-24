"use client"

import { useEffect } from "react"
import { ShieldAlert, RefreshCw, User } from "lucide-react"

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Page error detected:", error)
  }, [error])

  const handleEnterGuestMode = () => {
    const date = new Date()
    date.setTime(date.getTime() + 24 * 60 * 60 * 1000) // 1 day
    document.cookie = `fyy_guest=true; path=/; expires=${date.toUTCString()}; SameSite=Strict`
    window.location.href = "/chat"
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="relative w-full max-w-md p-6 rounded-2xl border border-cyan-500/30 bg-neutral-900/90 text-center shadow-2xl">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-30 -z-10" />
        
        <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
          <ShieldAlert size={28} className="text-cyan-400" />
        </div>

        <h2 className="text-2xl font-black italic tracking-tighter text-white mb-2">
          FYY-AI SYSTEM SHIELD
        </h2>
        
        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
          Browser atau ekstensi AdBlocker memblokir beberapa skrip sistem. Kamu bisa matikan AdBlocker/DNS pemblokir untuk halaman ini, atau langsung masuk sebagai Tamu!
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleEnterGuestMode}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
          >
            <User size={16} />
            Masuk via Mode Tamu (Guest Mode)
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Coba Ulangi
          </button>
        </div>

        <p className="text-[10px] text-gray-500 mt-6 font-medium">
          Fyy Security Protocol • Engineered by RapXCode
        </p>
      </div>
    </div>
  )
}
