import Link from "next/link"
import { ArrowLeft, ShieldCheck, Lock, Eye, Server, RefreshCw } from "lucide-react"

export default function PrivacyPage() {
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
            <ShieldCheck size={14} /> Kebijakan Privasi Resmi
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Kebijakan Privasi FYY-AI
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-2xl">
            Privasi data dan integritas keamanan pengguna adalah prioritas tertinggi dalam pengembangan platform <strong>FYY-AI</strong> oleh <strong>RapXCode</strong>. Dokumen ini menjelaskan bagaimana data kamu dikelola secara transparan dan aman.
          </p>
          <p className="text-[11px] text-gray-500 font-mono">Terakhir diperbarui: 20 Agustus 2026</p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock size={16} className="text-rose-400" /> 1. Data yang Dikumpulkan
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              FYY-AI hanya mengumpulkan informasi yang esensial untuk pengoperasian platform:
            </p>
            <ul className="list-disc ml-5 space-y-1.5 text-xs text-gray-400 leading-relaxed">
              <li><strong>Informasi Akun:</strong> Alamat email, nama profil, dan avatar yang disediakan melalui autentikasi aman Clerk.</li>
              <li><strong>Riwayat Percakapan:</strong> Teks obrolan dan preferensi model yang disimpan untuk kenyamanan akses kembali di database terenkripsi Supabase.</li>
              <li><strong>Unggahan Media:</strong> Gambar dan berkas yang kamu unggah diproses sementara untuk analisis multimodal dan tidak diperjualbelikan.</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server size={16} className="text-rose-400" /> 2. Penggunaan Data & Keamanan
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Semua data obrolan diproses secara aman melalui protokol HTTPS/TLS modern ke server inferensi Groq LPU dan HuggingFace. Kami menerapkan enkripsi standar industri dan tidak pernah menjual atau membagikan data pribadi kepada pihak ketiga tanpa izin.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye size={16} className="text-rose-400" /> 3. Hak Pengguna & Kontrol Data
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Kamu memiliki kendali penuh atas data kamu:
            </p>
            <ul className="list-disc ml-5 space-y-1.5 text-xs text-gray-400 leading-relaxed">
              <li>Menghapus riwayat percakapan sewaktu-waktu melalui fitur <em>Clear Chats</em> di sidebar.</li>
              <li>Menghapus akun dan seluruh metadata terkait melalui menu pengaturan akun Clerk.</li>
              <li>Menggunakan platform dalam <strong>Guest Mode</strong> tanpa harus mendaftarkan email.</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw size={16} className="text-rose-400" /> 4. Kontak Pengembang
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Jika kamu memiliki pertanyaan seputar kebijakan privasi atau perlindungan data, silakan hubungi pengembang mandiri RapXCode di:
            </p>
            <p className="text-xs text-rose-400 font-mono">
              Email: <a href="mailto:rapxcode1@gmail.com" className="underline hover:text-white">rapxcode1@gmail.com</a>
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
