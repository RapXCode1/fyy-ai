import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#060816] text-white px-4 py-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Ini adalah halaman syarat layanan placeholder. Tambahkan syarat dan ketentuan penggunaan di sini.
          </p>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200">
          ← Kembali ke Beranda
        </Link>
      </div>
    </main>
  )
}
