"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Sparkles, 
  Cpu, 
  Mic, 
  Image as ImageIcon, 
  ShieldCheck, 
  Smartphone, 
  Layers, 
  Zap, 
  Code, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight,
  Keyboard,
  HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>("overview")

  const navigationItems = [
    { id: "overview", label: "Overview & Visi", icon: Sparkles },
    { id: "models", label: "Model AI & Engine", icon: Cpu },
    { id: "voice", label: "Live Voice Call", icon: Mic },
    { id: "image", label: "AI Image Studio", icon: ImageIcon },
    { id: "modes", label: "Mode Spesialis", icon: Layers },
    { id: "security", label: "Keamanan & Trial", icon: ShieldCheck },
    { id: "mobile", label: "Android & PWA", icon: Smartphone },
    { id: "shortcuts", label: "Shortcuts & Tips", icon: Keyboard },
    { id: "faq", label: "FAQ", icon: HelpCircle },
  ]

  return (
    <div className="min-h-screen text-white selection-enabled bg-[#08080A]">
      {/* Top Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16 border-b border-white/5 flex items-center justify-between px-4 sm:px-8 bg-[#08080A]/85 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={14} />
            Kembali ke Beranda
          </Link>
          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-400">FYY-AI Docs</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/developer" className="text-xs font-medium text-gray-400 hover:text-white transition hidden sm:inline-block">
            Developer Info
          </Link>
          <Link href="/chat">
            <Button className="fyf-btn-primary text-xs px-4 h-9 rounded-xl font-semibold">
              Buka Chat FYY-AI
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm space-y-2">
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Daftar Topik
              </div>
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive 
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" 
                          : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={14} className={isActive ? "text-rose-400" : "text-gray-500"} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight size={12} className="text-rose-400" />}
                    </button>
                  )
                })}
              </div>

              <div className="pt-4 border-t border-white/5 px-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/10 to-red-500/5 border border-rose-500/20 text-center">
                  <p className="text-[11px] font-bold text-white">Butuh Bantuan Khusus?</p>
                  <p className="text-[10px] text-gray-400 mt-1">Hubungi langsung sang kreator RapXCode.</p>
                  <a 
                    href="mailto:rapxcode1@gmail.com"
                    className="inline-block mt-2.5 text-[10px] font-bold text-rose-400 hover:text-white transition"
                  >
                    Kirim Email →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">

            {/* Section: Overview */}
            {activeSection === "overview" && (
              <div className="space-y-6 animate-fade-up">
                <div className="p-8 rounded-3xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/10 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                    <Sparkles size={12} /> FYY-AI Documentation Portal
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Dokumentasi Lengkap Platform FYY-AI
                  </h1>
                  <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">
                    Selamat datang di dokumentasi resmi <strong>FYY-AI</strong> — platform kecerdasan buatan multimodal berkecepatan tinggi yang dirancang oleh <strong>RapXCode</strong> dengan integrasi Groq LPU, analisis visi cerdas, Live Voice Call, dan dukungan native Android.
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <Zap size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-white">Inferensi Kilat</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Respon streaming instan berbasis Groq LPU engine dengan latensi sub-detik.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <Mic size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-white">Live Voice Call</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Panggilan suara interaktif dua arah tanpa lag dengan orb energi bercahaya.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                      <ShieldCheck size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-white">Privasi & Keamanan</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Didukung autentikasi Clerk yang kuat, enkripsi sesi, dan database Supabase.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Models */}
            {activeSection === "models" && (
              <div className="space-y-6 animate-fade-up">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Cpu className="text-rose-400" /> Katalog Model AI & Engine
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    FYY-AI menyediakan model-model cerdas terdepan di industri yang dapat disesuaikan dengan kebutuhan komputasi kamu:
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      name: "FYY-Llama 3.3 (PRO)",
                      id: "llama-3.3-70b-versatile",
                      badge: "Flagship PRO",
                      desc: "Model Flagship untuk penalaran logika kompleks, analisis data mendalam, dan penulisan kode pemrograman profesional.",
                    },
                    {
                      name: "FYY-Llama 4 Scout",
                      id: "meta-llama/llama-4-scout-17b-16e-instruct",
                      badge: "Next-Gen AI",
                      desc: "Model generasi mutakhir berarsitektur penalaran cerdas dengan dukungan pemrosesan multimodal mutakhir.",
                    },
                    {
                      name: "FYY-GPT-OSS 120B",
                      id: "openai/gpt-oss-120b",
                      badge: "Ultra Reasoning",
                      desc: "Model open-intelligence skala elit untuk riset analitis, sintesis data komprehensif, dan penalaran tingkat tinggi.",
                    },
                    {
                      name: "FYY-Qwen 3 32B",
                      id: "qwen/qwen3.6-27b",
                      badge: "Multilingual Pro",
                      desc: "Model logika matematika superior dengan keunggulan penalaran sains dan akurasi multibahasa responsif.",
                    },
                    {
                      name: "FYY-Llama 3.1 Fast",
                      id: "llama-3.1-8b-instant",
                      badge: "Ultra Fast",
                      desc: "Model inferensi kilat berlatensi ultra-rendah untuk percakapan harian dan respon instan.",
                    },
                    {
                      name: "FYY-Vision Multimodal",
                      id: "fyy-vision",
                      badge: "Vision Engine",
                      desc: "Model inspeksi visual untuk pemindaian OCR dokumen, pengenalan teks visual, analisis grafik/bagan, dan interpretasi gambar.",
                    },
                  ].map((m, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-sm font-bold text-white">{m.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-400">
                          {m.badge}
                        </span>
                      </div>
                      <code className="text-[11px] text-gray-500 block font-mono">{m.id}</code>
                      <p className="text-xs text-gray-400 leading-relaxed">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Live Voice Call */}
            {activeSection === "voice" && (
              <div className="space-y-6 animate-fade-up">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Mic className="text-rose-400" /> Live Voice Call & Audio I/O
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Bicara langsung dengan FYY-AI seperti melakukan panggilan telepon real-time tanpa perlu mengetik satu huruf pun.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-white animate-ping" />
                    </div>
                    <h3 className="text-sm font-bold text-white">White Glow (Listening)</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Ketika orb memancarkan cahaya putih terang, AI sedang mendengarkan suaramu secara aktif melalui Web Speech Recognition.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-rose-500 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Crimson Red Glow (Speaking)</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Ketika orb berdenyut merah crimson terang, AI sedang berbicara menjawab pertanyaanmu menggunakan Text-to-Speech synthesis yang jernih.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-rose-500/[0.03] border border-rose-500/20 space-y-2">
                  <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={14} /> Fitur Echo-Cancellation Cerdas
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Sistem audio FYY-AI secara otomatis menghentikan mikrofon saat suara AI sedang diputar untuk menghindari audio loop dan gema (echo feedback).
                  </p>
                </div>
              </div>
            )}

            {/* Section: Image Studio */}
            {activeSection === "image" && (
              <div className="space-y-6 animate-fade-up">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ImageIcon className="text-rose-400" /> AI Image Studio & Prompt Enhancer
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Hasilkan gambar digital artistik berkualitas tinggi langsung dari imajinasimu.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles size={14} className="text-yellow-400" /> Groq Prompt Optimization Engine
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Kamu bisa mengetikkan ide dalam Bahasa Indonesia sehari-hari. FYY-AI akan otomatis menerjemahkan dan mengembangkannya menjadi prompt difusi profesional berstandar industri (misal: penambahan lighting cinematic, 8K render, Unreal Engine 5 aesthetic).
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                    <h3 className="text-sm font-bold text-white">4 Model Generator Difusi (FYY-Diffusion):</h3>
                    <ul className="space-y-2 text-xs text-gray-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <strong>FYY-FLUX.1 Schnell</strong> — Generator visual artistik ultra-cepat dengan estetika sinematik modern.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <strong>FYY-Realistic XL</strong> — Generator foto hiper-realistis dengan detail tekstur kulit nyata dan pencahayaan alami.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <strong>FYY-FLUX Pro</strong> — Generator visual kualitas studio profesional untuk rendering komposisi karya komersial.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <strong>FYY-Turbo Diffusion</strong> — Generator gambar instan responsif untuk visualisasi konsep kilat.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Modes */}
            {activeSection === "modes" && (
              <div className="space-y-6 animate-fade-up">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Layers className="text-rose-400" /> Mode Asisten Spesialis
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Sesuaikan kepribadian dan gaya penalaran FYY-AI dengan tugas yang sedang kamu kerjakan:
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { title: "🤖 General Assistant", desc: "Asisten harian serba bisa untuk menjawab pertanyaan umum, chatting, dan produktivitas." },
                    { title: "✍️ Creative Writer", desc: "Dioptimalkan untuk penulisan artikel, cerita, skrip video, copywriting iklan, dan puisi." },
                    { title: "💻 Code Expert", desc: "Pakar coding untuk menulis fungsi, refactoring, perbaikan bug, dan penjelasan arsitektur." },
                    { title: "🔍 Research Pro", desc: "Analisis data mendalam, pencarian fakta kritis, dan peringkasan dokumen panjang terstruktur." },
                    { title: "🎨 Image Studio", desc: "Akses langsung ke antarmuka kreasi visual dan prompt styling gambar AI." },
                  ].map((mode, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-1.5">
                      <h3 className="text-sm font-bold text-white">{mode.title}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">{mode.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Security */}
            {activeSection === "security" && (
              <div className="space-y-6 animate-fade-up">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="text-rose-400" /> Keamanan, Autentikasi & Guest Mode
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Perlindungan data pengguna dan transparansi batasan penggunaan:
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                    <h3 className="text-sm font-bold text-white">Mode Tamu (Guest Trial)</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Pengguna dapat langsung mencoba FYY-AI tanpa mendaftar. Tersedia kuota <strong>20 pesan chat</strong> dan <strong>10 gambar AI</strong>. Setelah kuota habis, pengguna cukup mendaftar akun gratis via Clerk untuk mendapatkan akses tanpa batas.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                    <h3 className="text-sm font-bold text-white">Proteksi Clerk Security Shield</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Semua sesi login dilindungi oleh enkripsi modern Clerk dengan token JWT aman, verifikasi email, dan opsi SSO Google / GitHub.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Mobile */}
            {activeSection === "mobile" && (
              <div className="space-y-6 animate-fade-up">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Smartphone className="text-rose-400" /> Integrasi Android (Capacitor) & PWA
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Gunakan FYY-AI di smartphone dengan pengalaman aplikasi native:
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                    <h3 className="text-sm font-bold text-white">Aplikasi Android Native (.APK)</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Dibangun dengan <strong>Capacitor 8</strong>, mendukung haptic feedback saat menekan tombol, penyesuaian keyboard otomatis, splash screen halus, dan browser login sistem (`@capacitor/browser`).
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                    <h3 className="text-sm font-bold text-white">Progressive Web App (PWA)</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Bisa diinstall langsung dari browser Chrome / Safari di HP dan Desktop melalui tombol &quot;Install FYY-AI&quot; atau menu &quot;Add to Home Screen&quot;.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Shortcuts */}
            {activeSection === "shortcuts" && (
              <div className="space-y-6 animate-fade-up">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Keyboard className="text-rose-400" /> Pintasan Keyboard & Tips Produktivitas
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Kuasai FYY-AI dengan pintasan keyboard cepat:
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { key: "Enter", desc: "Mengirim pesan teks" },
                    { key: "Shift + Enter", desc: "Menambahkan baris baru pada teks" },
                    { key: "Ctrl / Cmd + K", desc: "Membuka pencarian atau ganti model" },
                    { key: "Esc", desc: "Menutup modal suara atau panel pengaturan" },
                  ].map((s, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{s.desc}</span>
                      <kbd className="px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-mono font-bold text-white border border-white/10">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: FAQ */}
            {activeSection === "faq" && (
              <div className="space-y-6 animate-fade-up">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <HelpCircle className="text-rose-400" /> Pertanyaan yang Sering Diajukan (FAQ)
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Jawaban atas pertanyaan umum seputar FYY-AI:
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      q: "Apakah FYY-AI gratis digunakan?",
                      a: "Ya! FYY-AI menyediakan mode tamu gratis dengan kuota trial, dan kamu bisa mendaftar akun gratis untuk mendapatkan akses penuh."
                    },
                    {
                      q: "Bagaimana cara mengganti model AI?",
                      a: "Buka halaman chat, klik tombol 'Model' di bagian atas input teks, lalu pilih model yang kamu inginkan (misalnya FYY-Llama 3.3 atau FYY-Llama 4 Scout)."
                    },
                    {
                      q: "Siapa developer di balik FYY-AI?",
                      a: "FYY-AI dirancang dan dibangun secara mandiri oleh RapXCode (Rhafi Al Ghifari). Kamu bisa melihat portofolio lengkapnya di halaman Developer."
                    },
                    {
                      q: "Apakah riwayat percakapan saya tersimpan aman?",
                      a: "Ya, riwayat chat kamu disinkronkan secara aman ke browser lokal dan database Supabase yang terenkripsi."
                    }
                  ].map((item, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-1.5">
                      <h3 className="text-sm font-bold text-white">{item.q}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 py-8 px-4 text-center">
        <p className="text-[11px] text-gray-500 font-medium">
          © 2026 FYY-AI · Designed & Engineered by <strong className="text-rose-400">RapXCode</strong>.
        </p>
        <p className="text-[10px] text-gray-600 mt-1">
          FYY-GROQ System Intelligence Platform · Built with Next.js 16, React 19 & Tailwind CSS
        </p>
      </footer>
    </div>
  )
}
