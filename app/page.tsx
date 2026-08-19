"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import {
  MessageSquare, Mic, ImageIcon, FileText, Zap, Shield,
  ChevronRight, Menu, X, ArrowRight, Sparkles, Brain,
  Globe, Lock, Download, BarChart3, ExternalLink
} from "lucide-react"

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (isLoaded && isSignedIn) router.push("/chat")
  }, [isLoaded, isSignedIn, router])

  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#08080A" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl fyf-gradient-bg animate-pulse" />
          <p className="text-sm font-medium" style={{ color: "#6B7280" }}>Loading your workspace…</p>
        </div>
      </div>
    )
  }

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Models", href: "#models" },
    { label: "Developer", href: "/developer" },
  ]

  const chips = [
    { icon: Brain, label: "Multi-Modal", desc: "Text, voice, images & docs" },
    { icon: Zap, label: "Lightning Fast", desc: "Groq LPU inference" },
    { icon: Shield, label: "Secure & Private", desc: "Clerk auth + encrypted" },
    { icon: Sparkles, label: "Always Free", desc: "No hidden charges" },
  ]

  const stats = [
    { value: "4+", label: "AI Models" },
    { value: "50K+", label: "Users" },
    { value: "1K+", label: "Conversations Today" },
    { value: "∞", label: "Possibilities" },
  ]

  const features = [
    { icon: MessageSquare, title: "Advanced Chat", desc: "Multi-model AI chat with real-time streaming responses and rich markdown rendering.", color: "#E11D48" },
    { icon: Mic, title: "Voice I/O", desc: "Speak naturally. Get intelligent spoken responses powered by native Android TTS.", color: "#F43F5E" },
    { icon: ImageIcon, title: "Image Generation", desc: "Create stunning visuals from text prompts via HuggingFace AI models.", color: "#E11D48" },
    { icon: FileText, title: "File Analysis", desc: "Upload documents, images, and files for intelligent multimodal analysis.", color: "#FB7185" },
  ]

  const models = [
    { name: "FYY-Llama 3.3", sub: "PRO · Ultimate Performance", badge: "Popular", dot: "#E11D48" },
    { name: "FYY-Llama 4 Scout", sub: "Next-gen Reasoning", badge: "New", dot: "#F43F5E" },
    { name: "FYY-GPT-OSS 120B", sub: "High Performance", badge: "", dot: "#FB7185" },
    { name: "FYY-Qwen 3 32B", sub: "Super Reasoning", badge: "", dot: "#E11D48" },
  ]

  // Footer link groups (will be updated from server-side detection)
  const [productLinks, setProductLinks] = useState<[string,string][]>([
    ["Features", "#features"],
    ["Models", "#models"],
    ["Developer", "/developer"],
  ])

  const [resourcesLinks, setResourcesLinks] = useState<[string,string][]>([
    ["GitHub", "https://github.com/RapXcode1"],
  ])

  const [legalLinks, setLegalLinks] = useState<[string,string][]>([
    ["Contact", "mailto:rapxcode1@gmail.com"],
  ])

  useEffect(() => {
    let mounted = true
    fetch('/api/site-links')
      .then(r => r.json())
      .then((data) => {
        if (!mounted) return
        const prod: [string,string][] = [
          ["Features", "#features"],
          ["Models", "#models"],
          ["Developer", "/developer"],
        ]

        const res: [string,string][] = []
        if (data.docs) res.push(["Docs", "/docs"])
        if (data.api) res.push(["API", "/api"])
        res.push(["GitHub", "https://github.com/RapXcode1"])

        const legal: [string,string][] = []
        if (data.privacy) legal.push(["Privacy Policy", "/privacy"])
        if (data.terms) legal.push(["Terms of Service", "/terms"])
        legal.push(["Contact", "mailto:rapxcode1@gmail.com"])

        setProductLinks(prod)
        setResourcesLinks(res)
        setLegalLinks(legal)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#08080A", color: "#F9FAFB" }}>

      {/* ── NAV ── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
        style={{
          background: scrolled
            ? "rgba(8,8,10,0.88)"
            : "rgba(8,8,10,0.45)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid rgba(255,255,255,0.03)",
          boxShadow: scrolled
            ? "0 4px 32px rgba(0,0,0,0.4)"
            : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <img src="/logo-nobg.png" alt="FYY-AI" className="w-full h-full object-contain" />
            </div>
            <span className="text-base font-semibold tracking-tight">FYY-AI</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(l => (
              <a key={l.label} href={l.href}
                className="text-sm transition-colors duration-200"
                style={{ color: "#9CA3AF" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#F9FAFB")}
                onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
              >{l.label}</a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in"
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: "#9CA3AF" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F9FAFB")}
              onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
            >Sign in</Link>
            <Link href="/chat"
              className="fyf-btn-primary text-sm px-4 py-2 inline-flex items-center gap-1.5"
            >
              Launch App <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg transition"
            style={{ color: "#9CA3AF" }}
            onClick={() => setMobileMenuOpen(v => !v)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t animate-fade-in"
            style={{
              background: "rgba(8,8,10,0.97)",
              backdropFilter: "blur(24px)",
              borderColor: "rgba(255,255,255,0.06)"
            }}
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              {navLinks.map(l => (
                <a key={l.label} href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm py-1" style={{ color: "#9CA3AF" }}
                >{l.label}</a>
              ))}
              <div className="pt-2 flex flex-col gap-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <Link href="/sign-in" className="fyf-btn-ghost text-center text-sm py-2.5 rounded-xl">Sign in</Link>
                <Link href="/chat" className="fyf-btn-primary text-center text-sm py-2.5 rounded-xl">Launch App</Link>
              </div>
            </div>
          </div>
        )}

        {/* Subtle gradient fade to page below nav */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 translate-y-full h-8"
          style={{
            background: "linear-gradient(to bottom, rgba(8,8,10,0.15), transparent)",
          }}
        />
      </nav>


      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: text */}
          <div className="space-y-8 animate-fade-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{ background: "rgba(225,29,72,0.08)", borderColor: "rgba(225,29,72,0.25)", color: "#FB7185" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse-slow" />
              AI-Powered Platform
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                AI Power,{" "}
                <span className="fyf-gradient-text">Limitless</span>
                <br />Possibilities.
              </h1>
              <p className="text-base sm:text-lg leading-relaxed max-w-xl" style={{ color: "#9CA3AF" }}>
                Chat, create, analyze, and innovate with advanced AI models built for everyone.
                100% Free to use. Built by RapXCode.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link href="/chat" className="fyf-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl">
                Start Chatting <ChevronRight size={16} />
              </Link>
              <a href="#features" className="fyf-btn-ghost inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl">
                Explore Features
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 pt-2">
              {stats.map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-bold" style={{ color: "#F9FAFB" }}>{s.value}</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: chat preview card */}
          <div className="relative animate-fade-up delay-300 hidden lg:block">
            <div className="absolute -inset-8 rounded-3xl opacity-30"
              style={{ background: "radial-gradient(circle, rgba(225,29,72,0.18) 0%, transparent 70%)" }} />
            <div className="relative fyf-card p-0 overflow-hidden"
              style={{ background: "#121217", borderRadius: "22px" }}>
              {/* Window bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="w-3 h-3 rounded-full" style={{ background: "#EF4444" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#F59E0B" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#22C55E" }} />
                <span className="ml-2 text-xs" style={{ color: "#6B7280" }}>FYY-AI — Chat Workspace</span>
              </div>
              {/* Mock chat */}
              <div className="p-5 space-y-4">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg fyf-gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-bold">F</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium mb-1.5" style={{ color: "#6B7280" }}>FYY-AI</p>
                    <div className="text-sm leading-relaxed rounded-2xl p-3"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E5E7EB" }}>
                      Hi! I'm FYY-AI. I can help you write, code, analyze files, generate images, and much more. What would you like to explore today?
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="text-sm rounded-2xl px-4 py-2.5 max-w-xs" style={{ background: "#1E1E26", color: "#E5E7EB" }}>
                    Explain quantum computing in simple terms.
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg fyf-gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-bold">F</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm leading-relaxed rounded-2xl p-3"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E5E7EB" }}>
                      Quantum computing harnesses quantum mechanics to process information exponentially faster than classical computers for specific tasks…
                      <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse-slow" style={{ background: "#E11D48" }} />
                    </div>
                  </div>
                </div>
                {/* Input mock */}
                <div className="flex items-center gap-2 mt-2 rounded-2xl px-4 py-3 border"
                  style={{ background: "#16171D", borderColor: "rgba(255,255,255,0.06)" }}>
                  <span className="flex-1 text-sm" style={{ color: "#4B5563" }}>Ask FYY-AI anything…</span>
                  <div className="w-8 h-8 rounded-xl fyf-gradient-bg flex items-center justify-center">
                    <ArrowRight size={14} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE CHIPS ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {chips.map((c, i) => {
            const Icon = c.icon
            return (
              <div key={i}
                className="fyf-card p-4 flex items-start gap-3 animate-fade-up"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(225,29,72,0.1)", border: "1px solid rgba(225,29,72,0.2)" }}>
                  <Icon size={16} style={{ color: "#FB7185" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-snug">{c.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{c.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="text-center mb-14 animate-fade-up space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#E11D48" }}>Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need, in one place</h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "#9CA3AF" }}>
            A complete AI platform — from conversational chat to voice, image generation, and document analysis.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i}
                className="fyf-card p-5 space-y-4 animate-fade-up group"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: f.color + "18", border: `1px solid ${f.color}22` }}>
                  <Icon size={18} style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{f.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── MODELS ── */}
      <section id="models" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5 animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#E11D48" }}>AI Models</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Choose your intelligence</h2>
            <p style={{ color: "#9CA3AF" }} className="text-sm leading-relaxed">
              Switch between 4 powerful AI models powered by Groq LPU — all free, all fast. Each model is optimized for different tasks.
            </p>
            <Link href="/chat" className="fyf-btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl">
              Try All Models <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3 animate-fade-up delay-200">
            {models.map((m, i) => (
              <div key={i}
                className="fyf-card flex items-center gap-4 px-4 py-3.5 transition-all duration-200 cursor-pointer"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: m.dot + "18", border: `1px solid ${m.dot}22` }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.dot }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>{m.sub}</p>
                </div>
                {m.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(225,29,72,0.1)", color: "#FB7185", border: "1px solid rgba(225,29,72,0.25)" }}>
                    {m.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="relative rounded-3xl overflow-hidden animate-fade-up"
          style={{ background: "#121217", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(225,29,72,0.35), transparent)" }} />
          <div className="relative px-8 py-14 sm:py-20 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to experience<br /><span className="fyf-gradient-text">FYY-AI</span>?
            </h2>
            <p className="text-base max-w-md mx-auto" style={{ color: "#9CA3AF" }}>
              Join thousands of users exploring the power of advanced AI. Start now — completely free.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/chat" className="fyf-btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm rounded-xl">
                Start Chatting Now <ChevronRight size={16} />
              </Link>
              <Link href="/sign-up" className="fyf-btn-ghost inline-flex items-center gap-2 px-6 py-3 text-sm rounded-xl">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#08080A" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg fyf-gradient-bg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">F</span>
                </div>
                <span className="font-semibold text-sm">FYY-AI</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                AI Workplace for Everyone.<br />Built by RapXCode.
              </p>
            </div>
            {/* Product */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#9CA3AF" }}>Product</p>
              <ul className="space-y-2.5">
                {productLinks.map(([l, h]) => (
                  <li key={l}><a href={h} className="text-xs transition-colors duration-200" style={{ color: "#6B7280" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#F9FAFB")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>{l}</a></li>
                ))}
              </ul>
            </div>
            {/* Resources */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#9CA3AF" }}>Resources</p>
              <ul className="space-y-2.5">
                {resourcesLinks.map(([l, h]) => (
                  <li key={l}><a href={h} className="text-xs transition-colors duration-200" style={{ color: "#6B7280" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#F9FAFB")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>{l}</a></li>
                ))}
              </ul>
            </div>
            {/* Legal */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#9CA3AF" }}>Legal</p>
              <ul className="space-y-2.5">
                {legalLinks.map(([l, h]) => (
                  <li key={l}><a href={h} className="text-xs transition-colors duration-200" style={{ color: "#6B7280" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#F9FAFB")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <p className="text-xs" style={{ color: "#4B5563" }}>
              © 2026 FYY-AI. All rights reserved. Powered by FYY-GROQ SYSTEM INTELLIGENCE.
            </p>
            <div className="flex items-center gap-4">
              {[
                ["GitHub", "https://github.com/RapXcode1"],
                ["Instagram", "https://instagram.com/rhafialghfr_"],
              ].map(([l, h]) => (
                <a key={l} href={h} target="_blank" rel="noopener noreferrer"
                  className="text-xs transition-colors duration-200" style={{ color: "#4B5563" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#9CA3AF")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#4B5563")}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
