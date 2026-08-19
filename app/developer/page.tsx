"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, Globe, ArrowLeft, Code, Zap, Award, Sparkles, Camera, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState("about")

  const skills = [
    {
      category: "Frontend Stack",
      items: [
        { name: "React / Next.js", percentage: 95 },
        { name: "TypeScript", percentage: 90 },
        { name: "Tailwind CSS", percentage: 95 },
        { name: "Vue.js", percentage: 80 }
      ]
    },
    {
      category: "Backend & Systems",
      items: [
        { name: "Node.js (Express/Nest)", percentage: 90 },
        { name: "Python / FastAPI", percentage: 85 },
        { name: "PostgreSQL & Supabase", percentage: 88 },
        { name: "Docker & AWS", percentage: 80 }
      ]
    },
    {
      category: "AI Integration",
      items: [
        { name: "Groq LPU / Llama Models", percentage: 95 },
        { name: "LLMs / Vision API", percentage: 92 },
        { name: "Image Diffusion Models", percentage: 88 },
        { name: "Prompt Engineering", percentage: 95 }
      ]
    }
  ]

  const projects = [
    {
      name: "FYY-AI Platform",
      description: "Advanced multi-modal AI workspace with Clerk Auth, Supabase sync, native TTS, HuggingFace image diffusion, and voice synthesis.",
      tech: ["Next.js", "Groq API", "Clerk", "Supabase", "TypeScript"],
      link: "/chat",
      stats: "Production Ready · Active",
    },
    {
      name: "RealTime WebSocket Hub",
      description: "Fast messaging server framework with secure encryption layer and low latency performance scaling.",
      tech: ["React", "WebSocket", "MongoDB", "Node.js"],
      link: "https://github.com/RapXcode1",
      stats: "10K+ Concurrent Connections",
    },
    {
      name: "AI Automated Publisher",
      description: "Autonomous writing system that publishes analyzed summaries of scientific articles automatically.",
      tech: ["Python", "FastAPI", "PostgreSQL", "OpenAI"],
      link: "https://github.com/RapXcode1",
      stats: "500K+ Articles Indexed",
    }
  ]

  const achievements = [
    {
      icon: Code,
      title: "Senior Full Stack Dev",
      description: "5+ years crafting sleek web systems, high performance dashboards, and PWA structures.",
    },
    {
      icon: Zap,
      title: "AI Integrations Expert",
      description: "Proficient in LPU acceleration, local token handling, and advanced Prompt structures.",
    },
    {
      icon: Award,
      title: "Open Source Advocate",
      description: "Passionate about modern clean code, UI/UX premium details, and fast apps.",
    },
  ]

  const stats = [
    { number: "8+", label: "Main Projects" },
    { number: "50+", label: "Clients Served" },
    { number: "5+", label: "Years Experience" },
    { number: "15K+", label: "Users Reached" },
  ]

  return (
    <div className="min-h-screen text-white overflow-x-hidden selection-enabled" style={{ background: "#08080A" }}>
      
      {/* Navbar header */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 bg-[#08080A]/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition">
          <ArrowLeft size={14} />
          Back to Home
        </Link>
        
        <Link href="/chat">
          <Button className="fyf-btn-primary text-xs px-4 h-9 rounded-xl">
            Launch FYY-AI
          </Button>
        </Link>
      </nav>

      {/* Hero Banner header */}
      <section className="max-w-4xl mx-auto px-4 pt-28 pb-12">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          
          {/* Avatar frame */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/20 to-rose-500/20 blur-xl opacity-80" />
            <div className="relative w-full h-full rounded-full border border-white/10 bg-[#121217] flex items-center justify-center shadow-xl">
              <div className="text-center">
                <span className="text-3xl font-black bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text text-transparent">
                  R
                </span>
                <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest font-black">RapXCode</p>
              </div>
            </div>
          </div>

          {/* Intro info */}
          <div className="flex-1 text-center sm:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                RapXCode
                <Sparkles size={16} className="text-yellow-400" />
              </h1>
              <p className="text-sm font-semibold text-rose-400 tracking-wide">
                Full-Stack Systems Architect & AI Specialist
              </p>
            </div>
            
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-xl">
              Passionate about bridging cutting-edge Large Language Models with modern clean web applications. Creator of FYY-AI, real-time sync architectures, and developer systems. Exploring high performance interface design.
            </p>

            {/* Social chips links */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
              <a
                href="https://github.com/RapXcode1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                <Globe size={12} />
                GitHub
              </a>
              <a
                href="https://instagram.com/rhafialghfr_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                <Camera size={12} />
                Instagram
              </a>
              <a
                href="mailto:rapxcode1@gmail.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-rose-400 hover:bg-red-500/20 transition"
              >
                <Mail size={12} />
                Contact Email
              </a>
            </div>
          </div>
        </div>

        {/* Stats segment row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
          {stats.map((s, idx) => (
            <div key={idx} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
              <p className="text-lg font-bold text-rose-400">{s.number}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs navigation */}
      <section className="border-t border-white/5 max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-4 border-b border-white/5 mb-8 overflow-x-auto">
          {["about", "projects", "skills", "contact"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-3 border-b-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors"
              style={{
                borderColor: activeTab === tab ? "#E11D48" : "transparent",
                color: activeTab === tab ? "#FFFFFF" : "#6B7280",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* About tab detail */}
        {activeTab === "about" && (
          <div className="grid sm:grid-cols-2 gap-8 animate-fade-up">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={13} className="text-rose-400" /> Professional Background
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  I specialize in designing and engineering performant full-stack systems. My work targets clean code structures, beautiful and intuitive user experiences, fast APIs, and reliable client-to-server integrations.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Strategic Strengths</h3>
                <ul className="space-y-1.5 text-xs text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Advanced Full-Stack Engineering
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Large Language Model & Vision APIs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Real-time WebSocket & Client Sync
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Premium Responsive UX Micro-Interactions
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-yellow-400" /> Core Achievements
              </h3>
              
              <div className="space-y-4">
                {achievements.map((ach, idx) => {
                  const Icon = ach.icon
                  return (
                    <div key={idx} className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon size={14} className="text-rose-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{ach.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{ach.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="grid sm:grid-cols-2 gap-4 animate-fade-up">
            {projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl hover:border-white/10 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">{proj.name}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mt-1.5">{proj.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Tech Stack</p>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.tech.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[9px] font-medium text-rose-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5 text-[10px]">
                  <span className="text-gray-500 font-medium">{proj.stats}</span>
                  <a
                    href={proj.link}
                    className="text-rose-400 hover:text-white font-bold transition-colors"
                  >
                    View Project →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills Progress Tab */}
        {activeTab === "skills" && (
          <div className="grid sm:grid-cols-3 gap-6 animate-fade-up">
            {skills.map((group, idx) => (
              <div key={idx} className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-1">
                  {group.category}
                </h3>
                
                <div className="space-y-3.5">
                  {group.items.map((skill, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-300 font-semibold">{skill.name}</span>
                        <span className="text-rose-400 font-bold">{skill.percentage}%</span>
                      </div>
                      
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full"
                          style={{ width: `${skill.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === "contact" && (
          <div className="max-w-md mx-auto animate-fade-up">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-5 text-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Connect & Collaborate</h3>
              
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                I am actively looking for innovative projects, freelance development inquiries, SaaS consulting slots, and full-stack API optimization tasks.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <a
                  href="mailto:rapxcode1@gmail.com"
                  className="fyf-btn-primary w-full py-2.5 rounded-xl font-semibold text-xs text-center flex items-center justify-center gap-1.5"
                >
                  <Mail size={12} />
                  rapxcode1@gmail.com
                </a>
                
                <a
                  href="https://instagram.com/rhafialghfr_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fyf-btn-ghost w-full py-2 rounded-xl font-semibold text-xs text-center flex items-center justify-center gap-1.5"
                >
                  <Camera size={12} />
                  rhafialghfr_
                </a>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/20 py-8 px-4 mt-20 text-center">
        <p className="text-[10px] text-gray-500 font-medium">© 2026 RapXCode · All Rights Reserved.</p>
        <p className="text-[9px] text-gray-600 mt-1 font-medium">
          Powered by FYY-GROQ SYSTEM INTELLIGENCE · Built with Next.js, Clerk & Supabase
        </p>
      </footer>

    </div>
  )
}
