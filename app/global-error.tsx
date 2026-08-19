"use client"

import { RefreshCw, MessageSquare } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#08080A] flex items-center justify-center p-4">
        <div className="relative w-full max-w-md p-6 rounded-2xl border border-white/10 bg-[#121217] text-center shadow-2xl space-y-6">
          
          <div className="w-16 h-16 mx-auto flex items-center justify-center">
            <img src="/brand-logo.png" alt="FYY-AI" className="w-14 h-14 object-contain" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              Koneksi Terganggu
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Terjadi sedikit gangguan saat memuat sistem. Silakan muat ulang halaman.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => reset()}
              className="w-full py-3 px-4 rounded-xl fyf-btn-primary text-white font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              Muat Ulang
            </button>
            
            <a
              href="/chat"
              className="w-full py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare size={14} />
              Lanjut ke Chat
            </a>
          </div>

          <p className="text-[10px] text-gray-600">
            FYY-AI Platform • Built by RapXCode
          </p>
        </div>
      </body>
    </html>
  )
}
