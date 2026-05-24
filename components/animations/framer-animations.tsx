"use client"

import { motion, useInView, AnimatePresence } from "framer-motion"
import { useRef, useState, useEffect } from "react"

// Hook to detect mobile devices dynamically (safely prevents Next.js hydration mismatches)
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent)
      const isSmallScreen = window.innerWidth <= 768
      setIsMobile(isMobileUA || isSmallScreen)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  return isMobile
}

interface FramerFadeInProps {
  children: React.ReactNode
  direction?: "up" | "down" | "left" | "right" | "none"
  delay?: number
  duration?: number
  className?: string
  distance?: number
  blur?: boolean
}

export const FramerFadeIn = ({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className = "",
  distance = 30,
  blur = true,
}: FramerFadeInProps) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const isMobile = useIsMobile()

  // Disable expensive Gaussian blur filter animation on mobile GPUs to guarantee smooth 60fps
  const shouldBlur = blur && !isMobile

  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  }

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...directions[direction],
        filter: shouldBlur ? "blur(12px)" : "none",
        scale: 0.9,
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              x: 0,
              y: 0,
              filter: shouldBlur ? "blur(0px)" : "none",
              scale: 1,
            }
          : {}
      }
      transition={{
        duration: duration,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const FramerStaggerContainer = ({
  children,
  delayChildren = 0,
  staggerChildren = 0.1,
  className = "",
}: {
  children: React.ReactNode
  delayChildren?: number
  staggerChildren?: number
  className?: string
}) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            delayChildren: delayChildren / 1000,
            staggerChildren: staggerChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const FramerStaggerItem = ({
  children,
  direction = "up",
  distance = 20,
}: {
  children: React.ReactNode
  direction?: "up" | "down" | "left" | "right"
  distance?: number
}) => {
  const isMobile = useIsMobile()
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  }

  return (
    <motion.div
      variants={{
        hidden: { 
          opacity: 0, 
          ...directions[direction], 
          filter: isMobile ? "none" : "blur(8px)", 
          scale: 0.9 
        },
        show: { 
          opacity: 1, 
          x: 0, 
          y: 0, 
          filter: isMobile ? "none" : "blur(0px)", 
          scale: 1,
          transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1]
          }
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// Special "Zuuup" entry for chat bubbles
export const ZuuupEntry = ({
  children,
  side = "left",
  className = "",
}: {
  children: React.ReactNode
  side?: "left" | "right"
  className?: string
}) => {
  const isMobile = useIsMobile()
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        x: side === "left" ? -40 : 40, 
        y: 20, 
        scale: 0.8,
        filter: isMobile ? "none" : "blur(15px)",
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0, 
        scale: 1,
        filter: isMobile ? "none" : "blur(0px)",
      }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1], // Custom snappy but smooth curve
        filter: isMobile ? undefined : { duration: 0.3 },
        opacity: { duration: 0.3 }
      }}
      className={className}
      style={{ transformOrigin: side === "left" ? "bottom left" : "bottom right" }}
    >
      {children}
    </motion.div>
  )
}
