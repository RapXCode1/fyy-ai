"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, Globe, User, Camera, ExternalLink, ArrowLeft, Code, Zap, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeroWelcomeAnimation } from "@/components/animations/welcome-animation"
import { FadeInSection, StaggeredFadeIn } from "@/components/animations/fade-in-section"
import { AnimatedProgressBar } from "@/components/animations/animated-progress-bar"

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState("about")

  const skills = [
    {
      category: "Frontend",
      items: [
        { name: "React", percentage: 95 },
        { name: "Next.js", percentage: 90 },
        { name: "TypeScript", percentage: 85 },
        { name: "Tailwind CSS", percentage: 95 },
        { name: "Vue.js", percentage: 80 }
      ]
    },
    {
      category: "Backend",
      items: [
        { name: "Node.js", percentage: 90 },
        { name: "Python", percentage: 85 },
        { name: "PostgreSQL", percentage: 88 },
        { name: "MongoDB", percentage: 82 },
        { name: "REST APIs", percentage: 95 }
      ]
    },
    {
      category: "AI/ML",
      items: [
        { name: "Groq LPU", percentage: 95 },
        { name: "Meta Llama 4", percentage: 92 },
        { name: "LLMs & Vision", percentage: 88 },
        { name: "Prompt Engineering", percentage: 95 }
      ]
    },
    {
      category: "DevOps",
      items: [
        { name: "Docker", percentage: 85 },
        { name: "Linux / VPS", percentage: 90 },
        { name: "AWS", percentage: 80 },
        { name: "GitHub Actions", percentage: 88 },
        { name: "CI/CD", percentage: 85 }
      ]
    },
  ]

  const projects = [
    {
      name: "FYY-AI",
      description: "Advanced AI intelligence platform with multimodal Groq models, voice I/O, and image analysis",
      tech: ["Next.js", "Groq API", "TypeScript", "Tailwind CSS"],
      link: "https://github.com/RapXcode1/fyy-ai",
      stats: "4 Models, 50+ Features",
    },
    {
      name: "RealTime Chat System",
      description: "Scalable real-time messaging platform with encryption and media support",
      tech: ["React", "WebSocket", "MongoDB", "Node.js"],
      link: "#",
      stats: "10K+ Users",
    },
    {
      name: "AI Content Generator",
      description: "Automated content generation system for blogs and social media",
      tech: ["Python", "GPT APIs", "PostgreSQL", "FastAPI"],
      link: "https://github.com/RapXcode1",
      stats: "1M+ Generated",
    },
    {
      name: "Developer Dashboard",
      description: "Analytics and monitoring dashboard for API usage and performance tracking",
      tech: ["Next.js", "PostgreSQL", "Recharts", "Tailwind"],
      link: "#",
      stats: "100+ Clients",
    },
  ]

  const achievements = [
    {
      icon: Code,
      title: "Full Stack Developer",
      description: "Expert in modern web development with 5+ years experience",
    },
    {
      icon: Zap,
      title: "AI Specialist",
      description: "Proficient with LLMs, prompt engineering, and AI integration",
    },
    {
      icon: Award,
      title: "Open Source Contributor",
      description: "Active contributor to multiple popular open source projects",
    },
  ]

  const stats = [
    { number: "4+", label: "Projects" },
    { number: "50+", label: "Clients" },
    { number: "5+", label: "Years Exp" },
    { number: "1K+", label: "Users Served" },
  ]

  return (
    <div className="min-h-screen bg-background relative transition-all duration-500 overflow-x-hidden">
      {/* Background decoration that adapts to theme */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      {/* Welcome Animation Overlay */}
      <HeroWelcomeAnimation />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-card/60 backdrop-blur-[var(--theme-blur)] border-b border-border shadow-[var(--theme-shadow)] transition-all duration-500" style={{ borderBottomWidth: 'var(--theme-border-width)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <Link href="/chat">
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0">
              Try FYY-AI
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8rem)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Avatar */}
          <FadeInSection direction="left" delay={300}>
            <div className="flex justify-center md:justify-start">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl opacity-50"></div>
                <div
                  className="relative w-full h-full bg-card border-border rounded-full flex items-center justify-center overflow-hidden animate-scale-in"
                  style={{ borderWidth: 'var(--theme-border-width)', boxShadow: 'var(--theme-shadow)' }}
                >
                  <div className="text-center">
                    <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      R
                    </div>
                    <p className="text-xs text-gray-400 mt-2">RapXCode</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>

          {/* Info */}
          <div className="md:col-span-2 space-y-6">
            <FadeInSection direction="up" delay={500}>
              <div className="space-y-2">
                <h1 className="text-5xl md:text-6xl font-bold text-white animate-typewriter">R-Developer</h1>
                <p className="text-xl text-cyan-400 font-semibold animate-fade-in-up" style={{ animationDelay: '0.7s' }}>Full Stack Developer & AI Specialist</p>
                <p className="text-gray-300 max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                  Passionate about building innovative web applications powered by artificial intelligence. Creator of
                  FYY-AI and other groundbreaking projects. Always exploring the intersection of technology and
                  creativity.
                </p>
              </div>
            </FadeInSection>

            {/* Social Links */}
            <FadeInSection direction="up" delay={1100}>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/RapXcode1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted border border-border rounded-lg text-foreground transition"
                >
                  <Globe size={18} />
                  GitHub
                </a>
                <a
                  href="https://instagram.com/rhafialghfr_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition hover:scale-105"
                >
                  <Camera size={18} />
                  Instagram
                </a>
                <a
                  href="mailto:rapxcode1@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/50 rounded-lg text-cyan-300 transition hover:scale-105"
                >
                  <Mail size={18} />
                  Email
                </a>
              </div>
            </FadeInSection>

            {/* Stats */}
            <FadeInSection direction="up" delay={1300}>
              <StaggeredFadeIn
                children={stats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-card border-border p-4 text-center transition-all duration-300"
                    style={{ borderRadius: 'var(--radius)', borderWidth: 'var(--theme-border-width)', boxShadow: 'var(--theme-shadow)' }}
                  >
                    <p className="text-2xl font-bold text-cyan-400">{stat.number}</p>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                  </div>
                ))}
                staggerDelay={100}
                direction="up"
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-4 border-b border-white/10 mb-8 overflow-x-auto">
            {["about", "projects", "skills", "contact"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 border-b-2 transition font-medium capitalize whitespace-nowrap ${activeTab === tab
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* About Tab */}
          {activeTab === "about" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">About Me</h3>
                  <p className="text-gray-300 leading-relaxed">
                    I'm a passionate full-stack developer with a deep interest in artificial intelligence and modern web
                    technologies. With over 5 years of experience, I've worked on projects ranging from early-stage
                    startups to enterprise-scale applications.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Expertise</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                      Full-Stack Web Development
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                      AI & Machine Learning Integration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                      Cloud Architecture & DevOps
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                      Real-time Applications
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Key Achievements</h3>
                  <div className="space-y-4">
                    {achievements.map((achievement, index) => {
                      const Icon = achievement.icon
                      return (
                        <div key={index} className="flex gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Icon size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{achievement.title}</p>
                            <p className="text-sm text-gray-400">{achievement.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <StaggeredFadeIn
              children={projects.map((project, index) => (
                <div
                  key={index}
                  className="group bg-card border-border rounded-lg p-6 hover:bg-muted/10 transition-all"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                      <p className="text-gray-400">{project.description}</p>
                    </div>

                    <div>
                      <p className="text-xs text-cyan-400 font-semibold mb-2">TECH STACK</p>
                      <div className="flex flex-wrap gap-2">
                        {project.tech.map((tech, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs hover:scale-110 transition-transform"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-sm text-gray-400">{project.stats}</span>
                      <a href={project.link} className="text-primary hover:text-primary/80 transition">
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              staggerDelay={200}
              direction="up"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            />
          )}

          {/* Skills Tab */}
          {activeTab === "skills" && (
            <StaggeredFadeIn
              children={skills.map((skillGroup, index) => (
                <div key={index}>
                  <h3 className="text-lg font-bold text-white mb-4">{skillGroup.category}</h3>
                  <div className="space-y-4">
                    {skillGroup.items.map((skill, i) => (
                      <AnimatedProgressBar
                        key={i}
                        skill={skill.name}
                        percentage={skill.percentage}
                        delay={i * 200 + index * 300} // Stagger animation per skill and category
                        className="hover:scale-105 transition-transform duration-300"
                      />
                    ))}
                  </div>
                </div>
              ))}
              staggerDelay={400}
              direction="up"
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            />
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            <div className="max-w-2xl">
              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 rounded-lg p-8 space-y-6">
                <h3 className="text-2xl font-bold text-white">Get in Touch</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                    <a href="mailto:rapxcode1@gmail.com" className="text-cyan-400 hover:text-cyan-300">
                      rapxcode1@gmail.com
                    </a>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Social Media</label>
                    <div className="flex gap-3">
                      <a
                        href="https://github.com/RapXcode1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-cyan-400 transition"
                      >
                        GitHub
                      </a>
                      <a
                        href="https://instagram.com/rhafialghfr_"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-cyan-400 transition"
                      >
                        Instagram
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Available for</label>
                    <ul className="space-y-2 text-gray-300">
                      <li>Freelance Projects</li>
                      <li>Consulting & Advisory</li>
                      <li>Full-time Opportunities</li>
                      <li>Collaborations</li>
                    </ul>
                  </div>
                </div>

                <Link href="/chat">
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0">
                    Start a Conversation with FYY-AI
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 text-sm">© 2026 RapXCode (R-Developer). All rights reserved.</p>
          <p className="text-gray-500 text-xs mt-2">
            Built with Next.js, TypeScript, Tailwind CSS, and powered by FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)
          </p>
        </div>
      </footer>
    </div>
  )
}
