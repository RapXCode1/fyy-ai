import Link from "next/link"
import { ArrowLeft, BookOpen, CheckCircle, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#08080A] text-white px-4 sm:px-8 py-20 selection-enabled">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
        >
          <ArrowLeft size={14} /> Kembali ke Beranda
        </Link>

        {/* Header Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
            <BookOpen size={14} /> Syarat & Ketentuan Penggunaan
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service FYY-AI
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-2xl">
            Dengan mengakses dan menggunakan platform <strong>FYY-AI</strong>, kamu menyetujui seluruh ketentuan dan pedoman operasional yang ditetapkan di bawah ini.
          </p>
          <p className="text-[11px] text-gray-500 font-mono">Terakhir diperbarui: 20 Agustus 2026</p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle size={16} className="text-rose-400" /> 1. Penerimaan Ketentuan
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Layanan FYY-AI disediakan untuk tujuan produktivitas, kreativitas, edukasi, dan riset teknologi. Pengguna diwajibkan mematuhi hukum dan peraturan yang berlaku di yurisdiksi masing-masing.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400" /> 2. Batasan Penggunaan yang Dilarang
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Pengguna dilarang keras menyalahgunakan layanan FYY-AI untuk:
            </p>
            <ul className="list-disc ml-5 space-y-1.5 text-xs text-gray-400 leading-relaxed">
              <li>Membuat atau menyebarkan konten berbahaya, kekerasan, penipuan, atau pelanggaran privasi orang lain.</li>
              <li>Mencoba merusak, melakukan reverse engineering ilegal, atau menyerang infrastruktur server API.</li>
              <li>Menggunakan bot otomatis untuk melakukan scraping data di luar kuota yang wajar.</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-rose-400" /> 3. Batasan Tanggung Jawab & Konten AI
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              FYY-AI beroperasi menggunakan model bahasa besar (LLM). Meskipun model dilatih untuk menghasilkan informasi yang akurat, tanggapan AI bersifat informatif dan tidak boleh dijadikan pengganti nasihat medis, hukum, atau finansial profesional mutlak.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle size={16} className="text-rose-400" /> 4. Perubahan Layanan & Kontak
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Pengembang berhak memperbarui fitur atau syarat ketentuan ini dari waktu ke waktu untuk meningkatkan kualitas sistem. Untuk pertanyaan atau kerja sama, silakan hubungi RapXCode di <a href="mailto:rapxcode1@gmail.com" className="text-rose-400 underline hover:text-white">rapxcode1@gmail.com</a>.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-gray-500">© 2026 FYY-AI · Designed & Engineered by RapXCode.</p>
        </div>

      </div>
    </main>
  )
}
