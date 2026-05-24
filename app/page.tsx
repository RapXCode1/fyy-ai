"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Sparkles,
  Zap,
  MessageSquare,
  ImageIcon,
  FileText,
  Mic,
  Brain,
  Shield,
  Download,
  Upload,
  Volume2,
  Palette,
  Lock,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import SpaceBackground from "@/components/space-background"
import { HeroWelcomeAnimation } from "@/components/animations/welcome-animation"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { FramerFadeIn, FramerStaggerContainer, FramerStaggerItem } from "@/components/animations/framer-animations"

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/chat")
    }
  }, [isLoaded, isSignedIn, router])

  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-cyan-500 rounded-2xl rotate-45" />
          <p className="text-cyan-500 font-bold tracking-widest animate-pulse">RESTORING SESSION...</p>
        </div>
      </div>
    )
  }
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: MessageSquare,
      title: "Advanced Chat",
      description: "Multi-model AI chat with real-time responses",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Mic,
      title: "Voice Interaction",
      description: "Speak naturally and get intelligent responses",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: ImageIcon,
      title: "Image Generation",
      description: "Create stunning visuals powered by AI",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: FileText,
      title: "Document Analysis",
      description: "Upload and analyze files intelligently",
      color: "from-orange-500 to-red-500",
    },
  ]

  const models = [
    {
      name: "FYY-Llama 3.3 (PRO)",
      description: "Our flagship multimodal model",
      speed: "Lightning",
      power: "⚡⚡⚡⚡⚡",
    },
    {
      name: "FYY-Llama 4 Scout",
      description: "Next-gen reasoning engine",
      speed: "Fast",
      power: "⚡⚡⚡⚡⚡",
    },
    {
      name: "FYY-GPT-OSS 120B",
      description: "Ultra-high performance",
      speed: "Balanced",
      power: "⚡⚡⚡⚡⚡",
    },
    {
      name: "FYY-Qwen 3 32B",
      description: "Advanced logic & multilingual",
      speed: "Fast",
      power: "⚡⚡⚡⚡",
    },
  ]

  const benefits = [
    {
      icon: Zap,
      title: "100% Free Forever",
      description: "No hidden charges, no premium tiers, completely free to use",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Brain,
      title: "Advanced AI Models",
      description: "Access to 4 powerful AI models powered by FYY-Groq LLM",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and never stored on our servers",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Ultra-fast response times with optimized AI models",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Upload,
      title: "Multi-Format Support",
      description: "Upload images, documents, and files for intelligent analysis",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: Volume2,
      title: "Voice Interaction",
      description: "Speak naturally and get responses in multiple languages",
      color: "from-indigo-500 to-purple-500",
    },
  ]

  const capabilities = [
    {
      icon: MessageSquare,
      text: "Natural Language Processing",
      stat: "90% Accuracy",
    },
    {
      icon: Palette,
      text: "Image Generation & Analysis",
      stat: "Real-time Processing",
    },
    {
      icon: FileText,
      text: "Document Understanding",
      stat: "50MB Support",
    },
    {
      icon: Mic,
      text: "Multi-Language Support",
      stat: "100+ Languages",
    },
    {
      icon: Download,
      text: "Export & Download",
      stat: "All Formats",
    },
    {
      icon: Lock,
      text: "End-to-End Encrypted",
      stat: "HIGH-Secured Grade",
    },
  ]

  return (
    <div className="min-h-screen bg-background relative transition-all duration-500 overflow-x-hidden">
      {/* Background decoration that adapts to theme is handled by globals.css */}
      <SpaceBackground />

      {/* Welcome Animation Overlay */}
      <HeroWelcomeAnimation />
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-card/60 backdrop-blur-[var(--theme-blur)] border-b border-border shadow-[var(--theme-shadow)] transition-all duration-500" style={{ borderBottomWidth: 'var(--theme-border-width)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-cyan-400/30 overflow-hidden">
              <img src="/logo.png" alt="FYY-AI Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl sm:text-2xl fyy-identity tracking-tighter bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent pr-2 inline-block">
              FYY-AI
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <a href="#about" className="text-gray-300 hover:text-white transition text-sm lg:text-base">
              About
            </a>
            <a href="#features" className="text-gray-300 hover:text-white transition text-sm lg:text-base">
              Features
            </a>
            <a href="#benefits" className="text-gray-300 hover:text-white transition text-sm lg:text-base">
              Benefits
            </a>
            <a href="#models" className="text-gray-300 hover:text-white transition text-sm lg:text-base">
              Models
            </a>
            <a href="/developer" className="text-gray-300 hover:text-white transition text-sm lg:text-base">
              Developer
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* CTA Button */}
          <Link href="/chat" className="hidden sm:block">
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0 text-sm">
              Start Chatting
            </Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/50 backdrop-blur-sm">
            <div className="px-4 py-4 space-y-3">
              <a href="#about" className="block text-gray-300 hover:text-white transition py-2">
                About
              </a>
              <a href="#features" className="block text-gray-300 hover:text-white transition py-2">
                Features
              </a>
              <a href="#benefits" className="block text-gray-300 hover:text-white transition py-2">
                Benefits
              </a>
              <a href="#models" className="block text-gray-300 hover:text-white transition py-2">
                Models
              </a>
              <a href="/developer" className="block text-gray-300 hover:text-white transition py-2">
                Developer
              </a>
              <Link href="/chat" className="block">
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0">
                  Start Chatting
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        className="pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 7rem)' }}
      >
        <div className="text-center space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            {/* Main Title - Appears First */}
            <FramerFadeIn direction="up" delay={200}>
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                Meet{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent fyy-identity pr-3 inline-block">FYY-AI</span>
              </h1>
            </FramerFadeIn>

            {/* Badge - Appears Second */}
            <FramerFadeIn direction="down" delay={400}>
              <div className="inline-block px-3 sm:px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="text-xs sm:text-sm text-cyan-400 font-medium">Welcome to the Future of AI</span>
              </div>
            </FramerFadeIn>

            {/* Subtitle - Appears Third */}
            <FramerFadeIn direction="up" delay={600}>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto px-2">
                Experience unlimited possibilities with 4 cutting-edge AI models. Chat, create, analyze, and
                innovate with full Multimodal support.{" "}
                <span className="text-green-400 font-semibold">100% Free To Use. Developed by RapXCode.</span>
              </p>
            </FramerFadeIn>
          </div>

          {/* Buttons - Appear Last */}
          <FramerFadeIn direction="up" delay={800}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/chat" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0 text-base h-11 sm:h-12 px-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30 animate-pulse-glow"
                >
                  Start Exploring <ChevronRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 text-base h-11 sm:h-12 px-6 bg-transparent w-full sm:w-auto transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/10"
                onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn More
              </Button>
            </div>
          </FramerFadeIn>
        </div>

        {/* Floating Demo Card - Appears After Hero Content */}
        <FramerFadeIn direction="up" delay={1000}>
          <div className="mt-12 sm:mt-20 relative px-2 sm:px-0 max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-3xl animate-pulse-glow opacity-50"></div>
            <div
              className="relative bg-card border-border p-6 sm:p-8 transition-all duration-500 hover:scale-[1.02]"
              style={{
                borderRadius: 'var(--radius)',
                borderWidth: 'var(--theme-border-width)',
                boxShadow: 'var(--theme-shadow)',
                backdropFilter: 'blur(var(--theme-blur))'
              }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-floating-dots"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-floating-dots" style={{ animationDelay: '1s' }}></div>

              <div className="relative space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center flex-shrink-0 animate-energy-spark">
                    <span className="text-white text-sm font-bold">AI</span>
                  </div>
                  <span className="text-white font-semibold text-sm sm:text-base"><span className="fyy-identity pr-1 inline-block">FYY-AI</span> Assistant</span>
                </div>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                  I can help you with anything from creative writing to code debugging. I'm powered by FYY-Groq's LLM and can handle text, voice, images, and documents. What would you like to explore today?
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs hover:scale-110 transition-transform animate-floating-dots">
                    Multi-Modal
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-300 text-xs hover:scale-110 transition-transform animate-floating-dots" style={{ animationDelay: '0.5s' }}>
                    Real-Time
                  </span>
                  <span className="px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/50 text-pink-300 text-xs hover:scale-110 transition-transform animate-floating-dots" style={{ animationDelay: '1s' }}>
                    Advanced
                  </span>
                </div>
              </div>
            </div>
          </div>
        </FramerFadeIn>
      </section>

      {/* About AI Section */}
      <section id="about" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black/40 border-y border-white/10 relative z-10">
        <div className="max-w-6xl mx-auto">
          <FramerFadeIn direction="up" delay={100}>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">About <span className="fyy-identity pr-2 inline-block">FYY-AI</span></h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
                Learn about our revolutionary AI platform
              </p>
            </div>
          </FramerFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold text-white">What is <span className="fyy-identity pr-1.5 inline-block">FYY-AI</span>?</h3>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                  FYY-AI is an advanced artificial intelligence platform powered by FYY-Groq's LLM, featuring Llama, GPT, and Qwen models.
                  It brings the power of state-of-the-art AI technology to everyone, completely free.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold text-white">Why Choose <span className="fyy-identity pr-1.5 inline-block">FYY-AI</span>?</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-sm sm:text-base">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Powered by FYY-Groq LLM - Fast and Reliable AI Inference</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm sm:text-base">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">4 Advanced Models to Choose From</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm sm:text-base">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Multi-Modal Capabilities: Text, Voice, Images</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm sm:text-base">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Lightning Fast Response Times</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm sm:text-base">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Works on All Devices - Mobile, Tablet, Desktop</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative px-2 sm:px-0">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="text-center">
                    <img src="/logo.png" alt="FYY-AI Logo" className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 object-contain" />
                    <h4 className="text-lg sm:text-xl font-bold text-white">Next Generation AI</h4>
                    <p className="text-gray-400 mt-2 text-sm">
                      Built with latest AI technology for maximum performance
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 sm:p-4 text-center">
                      <p className="text-cyan-400 text-xs sm:text-sm font-semibold">Accuracy</p>
                      <p className="text-white text-lg sm:text-xl font-bold">90%+</p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 sm:p-4 text-center">
                      <p className="text-purple-400 text-xs sm:text-sm font-semibold">Response Time</p>
                      <p className="text-white text-lg sm:text-xl font-bold">&lt;Under 3s</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4 text-center">
                      <p className="text-green-400 text-xs sm:text-sm font-semibold">Cost</p>
                      <p className="text-white text-lg sm:text-xl font-bold">Free 100%</p>
                    </div>
                    <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-3 sm:p-4 text-center">
                      <p className="text-pink-400 text-xs sm:text-sm font-semibold">Languages</p>
                      <p className="text-white text-lg sm:text-xl font-bold">100+</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black/30 relative z-10">
        <div className="max-w-7xl mx-auto">
          <FramerFadeIn direction="up" delay={200}>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">Powerful Features</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
                Everything you need to harness the power of AI
              </p>
            </div>
          </FramerFadeIn>

          <FramerStaggerContainer
            staggerChildren={0.15}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <FramerStaggerItem key={index}>
                  <div className="group relative h-full">
                    <div
                      className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"
                      style={{
                        backgroundImage: `linear-gradient(to bottom right, var(--color-${feature.color.split(" ")[1]}), var(--color-${feature.color.split(" ")[3]}))`,
                        borderRadius: 'var(--radius)'
                      }}
                    ></div>
                    <div
                      className="relative bg-card border-border p-4 sm:p-6 transition-all duration-300 h-full group-hover:translate-y-[-4px]"
                      style={{
                        borderRadius: 'var(--radius)',
                        borderWidth: 'var(--theme-border-width)',
                        boxShadow: 'var(--theme-shadow)',
                        backdropFilter: 'blur(var(--theme-blur))'
                      }}
                    >
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${feature.color} p-2 sm:p-3 mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-full h-full text-white" />
                      </div>
                      <h3 className="text-white font-semibold text-base sm:text-lg mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">{feature.description}</p>
                    </div>
                  </div>
                </FramerStaggerItem>
              )
            })}
          </FramerStaggerContainer>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border-y border-white/10 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          <FramerFadeIn direction="up" delay={100}>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">Why <span className="fyy-identity pr-2 inline-block">FYY-AI</span>?</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
                Key features and benefits that make us different
              </p>
            </div>
          </FramerFadeIn>

          <FramerStaggerContainer
            staggerChildren={0.15}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <FramerStaggerItem key={index}>
                  <div
                    className="group bg-card border-border p-4 sm:p-6 transition-all duration-300 h-full"
                    style={{
                      borderRadius: 'var(--radius)',
                      borderWidth: 'var(--theme-border-width)',
                      boxShadow: 'var(--theme-shadow)',
                      backdropFilter: 'blur(var(--theme-blur))'
                    }}
                  >
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${benefit.color} p-2 sm:p-3 mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-2">{benefit.title}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">{benefit.description}</p>
                  </div>
                </FramerStaggerItem>
              )
            })}
          </FramerStaggerContainer>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black/30 relative z-10">
        <div className="max-w-7xl mx-auto">
          <FramerFadeIn direction="up" delay={100}>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
                Advanced Capabilities
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">What you can do with <span className="fyy-identity pr-1 inline-block">FYY-AI</span></p>
            </div>
          </FramerFadeIn>

          <FramerStaggerContainer
            staggerChildren={0.12}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {capabilities.map((capability, index) => {
              const Icon = capability.icon
              return (
                <FramerStaggerItem key={index}>
                  <div
                    className="bg-card border-border p-4 sm:p-6 transition-all h-full"
                    style={{
                      borderRadius: 'var(--radius)',
                      borderWidth: 'var(--theme-border-width)',
                      boxShadow: 'var(--theme-shadow)',
                      backdropFilter: 'blur(var(--theme-blur))'
                    }}
                  >
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 flex-shrink-0 animate-pulse" />
                      <span className="text-xs sm:text-sm font-semibold text-purple-400">{capability.stat}</span>
                    </div>
                    <h3 className="text-white font-semibold text-sm sm:text-base">{capability.text}</h3>
                  </div>
                </FramerStaggerItem>
              )
            })}
          </FramerStaggerContainer>
        </div>
      </section>

      {/* Models Section */}
      <section id="models" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <FramerFadeIn direction="up" delay={100}>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">AI Models</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
                Choose from 4 powerful AI models powered by Groq, all free to use
              </p>
            </div>
          </FramerFadeIn>

          <FramerStaggerContainer
            staggerChildren={0.2}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {models.map((model, index) => (
              <FramerStaggerItem key={index}>
                <div
                  className="group relative overflow-hidden bg-card border-border transition-all duration-300 cursor-pointer transform h-full"
                  style={{
                    borderRadius: 'var(--radius)',
                    borderWidth: 'var(--theme-border-width)',
                    boxShadow: 'var(--theme-shadow)',
                    backdropFilter: 'blur(var(--theme-blur))'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-white font-bold text-base sm:text-lg">{model.name}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">{model.description}</p>
                    </div>
                    <div className="space-y-2 pt-2 sm:pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs sm:text-sm">Speed</span>
                        <span className="text-cyan-400 font-semibold text-xs sm:text-sm">{model.speed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs sm:text-sm">Power</span>
                        <span className="text-yellow-400 text-xs sm:text-sm">{model.power}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </FramerStaggerItem>
            ))}
          </FramerStaggerContainer>
        </div>
      </section>

      {/* Pricing Section - Removed as per explicit instruction to omit */}

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <FramerFadeIn direction="up" delay={200}>
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">Ready to Experience <span className="fyy-identity pr-2 inline-block">FYY-AI</span>?</h2>
              <p className="text-gray-300 text-base sm:text-lg">
                Join thousands of users exploring the power of advanced AI. Start chatting now—completely free!
              </p>
            </div>
            <FramerFadeIn direction="up" delay={400}>
              <Link href="/chat">
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0 text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-10 w-full sm:w-auto transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30 animate-pulse-glow">
                  Start Chatting Now <ChevronRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </FramerFadeIn>
          </div>
        </FramerFadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold text-sm sm:text-base mb-4">Core Services</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li>
                  <Link href="/chat" className="hover:text-white transition">
                    💬 Chat Workspace
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="hover:text-white transition">
                    🎨 Image Studio 2D
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="hover:text-white transition">
                    📞 Live Phone Voice Call
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="hover:text-white transition">
                    📂 Document Analyst
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm sm:text-base mb-4">AI Engines</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li>
                  <a href="#models" className="hover:text-white transition">
                    🧠 FYY-Llama 4 Scout
                  </a>
                </li>
                <li>
                  <a href="#models" className="hover:text-white transition">
                    ⚡ FYY-GPT-OSS 120B
                  </a>
                </li>
                <li>
                  <a href="#models" className="hover:text-white transition">
                    🔥 FYY-Llama 3.3 Complete
                  </a>
                </li>
                <li>
                  <a href="#models" className="hover:text-white transition">
                    🌐 FYY-Qwen 3 Multilingual
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm sm:text-base mb-4">Legal</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm sm:text-base mb-4">Contact</h4>
              <p className="text-xs sm:text-sm text-gray-400">By RapXCode</p>
              <p className="text-xs sm:text-sm text-gray-400">100% Free AI Platform</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-xs sm:text-sm text-gray-400">
            <p>© 2026 <span className="fyy-identity pr-0.5 inline-block">FYY-AI</span>. All rights reserved. Powered by FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM).</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
