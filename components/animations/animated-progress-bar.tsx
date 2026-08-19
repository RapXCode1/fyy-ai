"use client"

import { useEffect, useState } from 'react'

interface AnimatedProgressBarProps {
  percentage: number
  skill: string
  delay?: number
  className?: string
}

export function AnimatedProgressBar({
  percentage,
  skill,
  delay = 0,
  className = ""
}: AnimatedProgressBarProps) {
  const [currentPercentage, setCurrentPercentage] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (isVisible) {
      // Animate from 0 to target percentage
      const duration = 1500 // 1.5 seconds
      const steps = 60 // 60 fps
      const increment = percentage / (duration / (1000 / steps))
      let current = 0

      const animate = () => {
        current += increment
        if (current >= percentage) {
          setCurrentPercentage(percentage)
        } else {
          setCurrentPercentage(current)
          requestAnimationFrame(animate)
        }
      }

      // Start animation after a small delay
      setTimeout(() => {
        requestAnimationFrame(animate)
      }, 200)
    }
  }, [isVisible, percentage])

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-gray-300 text-sm font-medium">{skill}</span>
        <span className="text-rose-400 text-sm font-semibold">
          {Math.round(currentPercentage)}%
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-white/90 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
          style={{ width: `${currentPercentage}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>

          {/* Pulsing glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/50 to-rose-400/50 rounded-full animate-pulse-glow opacity-50"></div>
        </div>
      </div>
    </div>
  )
}