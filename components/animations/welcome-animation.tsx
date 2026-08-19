"use client"

import { useEffect, useState } from 'react'
import { Sparkles, Zap, Brain } from 'lucide-react'

interface WelcomeAnimationProps {
  title: string
  subtitle?: string
  delay?: number
}

export function WelcomeAnimation({ title, subtitle, delay = 0 }: WelcomeAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setShowAnimation(true), delay)
    const timer2 = setTimeout(() => setShowContent(true), delay + 800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [delay])

  return (
    <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Animated background particles */}
      {showAnimation && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-rose-400/30 rounded-full animate-float-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Main welcome content */}
      <div className="relative z-10 text-center space-y-6">
        {/* Animated icons */}
        {showAnimation && (
          <div className="flex justify-center space-x-4 mb-8">
            <div className="animate-bounce-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse-glow">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
            </div>
            <div className="animate-bounce-in" style={{ animationDelay: '0.4s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse-glow">
                <Brain size={28} className="text-white" />
              </div>
            </div>
            <div className="animate-bounce-in" style={{ animationDelay: '0.6s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse-glow">
                <Zap size={28} className="text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Title with typewriter effect */}
        {showContent && (
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold animate-typewriter">
              <span className="bg-gradient-to-r from-red-500 via-rose-400 to-white bg-clip-text text-transparent">
                {title}
              </span>
            </h1>
            {subtitle && (
              <p className="text-lg md:text-xl text-gray-300 animate-fade-in-up max-w-2xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Animated underline */}
        {showContent && (
          <div className="animate-slide-in-left">
            <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-white rounded-full mx-auto animate-pulse-glow" />
          </div>
        )}
      </div>

      {/* Floating geometric shapes */}
      {showAnimation && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-4 h-4 border-2 border-red-400/30 rotate-45 animate-float-slow" />
          <div className="absolute top-3/4 right-1/4 w-6 h-6 border-2 border-rose-400/30 rounded-full animate-float-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-red-400/30 rotate-12 animate-float-slow" style={{ animationDelay: '2s' }} />
        </div>
      )}
    </div>
  )
}

export function HeroWelcomeAnimation() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    // Check if welcome was already seen (prevents repeating on reload) with try-catch for mobile safety
    try {
      if (typeof window !== 'undefined') {
        const seen = localStorage.getItem('fyy-ai-welcome-seen')
        if (seen === 'true') {
          setIsVisible(false)
          setShowWelcome(false)
          return
        }
      }
    } catch (e) {
      console.warn("localStorage is disabled or blocked in this browser:", e)
    }

    const timer = setTimeout(() => setShowWelcome(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (showWelcome && isVisible) {
      // Start fade out after 3 seconds
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true)
      }, 3000)

      // Hide completely after fade out animation (1 second)
      const hideTimer = setTimeout(() => {
        setIsVisible(false)
        try {
          localStorage.setItem('fyy-ai-welcome-seen', 'true')
        } catch (e) {
          console.warn("Could not save to localStorage:", e)
        }
      }, 4000)

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [showWelcome, isVisible])

  // Instant dismiss function (clicking anywhere closes welcome animation immediately)
  const handleDismiss = () => {
    setIsFadingOut(true)
    setTimeout(() => {
      setIsVisible(false)
      try {
        localStorage.setItem('fyy-ai-welcome-seen', 'true')
      } catch (e) {
        console.warn("Could not save to localStorage:", e)
      }
    }, 500) // Fast exit
  }

  if (!showWelcome || !isVisible) return null

  return (
    <div 
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-opacity duration-1000 ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      title="Click anywhere to skip welcome screen"
    >
      <div className="text-center space-y-8 animate-scale-in max-w-md px-4">
        {/* Logo animation */}
        <div className="animate-bounce-in">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-red-500/50 overflow-hidden">
            <img src="/logo.png" alt="FYY-AI Logo" className="w-20 h-20 object-contain animate-pulse" />
          </div>
        </div>

        {/* Welcome text */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-500 via-rose-400 to-white bg-clip-text text-transparent">
            Welcome to <span className="fyy-identity pr-2 inline-block">FYY-AI</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-md mx-auto">
            Experience the future of AI with advanced Merah Putih intelligence
          </p>
          <p className="text-xs text-rose-400/70 animate-pulse font-medium mt-2">
            (Tap anywhere to skip)
          </p>
        </div>

        {/* Loading animation */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}