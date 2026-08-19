"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RefreshCw, Home, MessageSquare } from "lucide-react"

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#08080A] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md p-6 rounded-2xl border border-white/10 bg-[#121217] text-center shadow-2xl space-y-6">
        
        {/* Brand Icon */}
        <div className="w-16 h-16 mx-auto flex items-center justify-center">
          <img src="/brand-logo.png" alt="FYY-AI" className="w-14 h-14 object-contain" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">
            Ada Sedikit Kendala
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Halaman mengalami gangguan sesaat. Kamu bisa memuat ulang halaman atau langsung kembali ke Chat.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl fyf-btn-primary text-white font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            Muat Ulang (Refresh)
          </button>
          
          <Link
            href="/chat"
            className="w-full py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare size={14} />
            Buka FYY-AI Chat
          </Link>

          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-300 transition pt-1"
          >
            Kembali ke Beranda
          </Link>
        </div>

        <p className="text-[10px] text-gray-600">
          FYY-AI Platform • Built by RapXCode
        </p>
      </div>
    </div>
  )
}
