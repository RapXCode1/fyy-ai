"use client"

import React from 'react'
import { useScrollAnimation, useParallax } from '@/hooks/use-scroll-animation'
import { cn } from '@/lib/utils'

interface FadeInSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale' | 'reveal'
  threshold?: number
  triggerOnce?: boolean
  exitAnimation?: boolean
}

export function FadeInSection({
  children,
  className,
  delay = 0,
  direction = 'up',
  threshold = 0.1,
  triggerOnce = true,
  exitAnimation = false
}: FadeInSectionProps) {
  const { elementRef, isVisible, isInView } = useScrollAnimation({
    threshold,
    triggerOnce: triggerOnce && !exitAnimation,
    delay
  })

  const getAnimationClass = () => {
    if (!isVisible && !isInView) return 'opacity-0'

    if (isVisible && isInView) {
      switch (direction) {
        case 'up':
          return 'animate-reveal-up'
        case 'down':
          return 'animate-fade-in-down'
        case 'left':
          return 'animate-reveal-left'
        case 'right':
          return 'animate-reveal-right'
        case 'scale':
          return 'animate-reveal-scale'
        case 'reveal':
          return 'animate-reveal-up'
        case 'fade':
        default:
          return 'animate-fade-in'
      }
    }

    // Exit animation when scrolling away
    if (exitAnimation && !isInView && triggerOnce) {
      switch (direction) {
        case 'up':
          return 'animate-fade-out-up'
        case 'down':
          return 'animate-fade-out-down'
        case 'left':
          return 'animate-fade-out-left'
        case 'right':
          return 'animate-fade-out-right'
        default:
          return 'animate-fade-out-up'
      }
    }

    return 'opacity-0'
  }

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all duration-500 ease-out',
        getAnimationClass(),
        className
      )}
    >
      {children}
    </div>
  )
}

interface StaggeredFadeInProps {
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
}

export function StaggeredFadeIn({
  children,
  className,
  staggerDelay = 200,
  direction = 'up'
}: StaggeredFadeInProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeInSection
          key={index}
          delay={index * staggerDelay}
          direction={direction}
          className="w-full"
        >
          {child}
        </FadeInSection>
      ))}
    </div>
  )
}

interface ParallaxSectionProps {
  children: React.ReactNode
  speed?: number
  className?: string
}

export function ParallaxSection({ children, speed = 0.5, className }: ParallaxSectionProps) {
  const { elementRef, offset } = useParallax(speed)

  return (
    <div
      ref={elementRef}
      className={cn('relative', className)}
      style={{
        transform: `translateY(${offset * speed}px)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      {children}
    </div>
  )
}

interface ScaleInOnScrollProps {
  children: React.ReactNode
  className?: string
  delay?: number
  scale?: number
}

export function ScaleInOnScroll({
  children,
  className,
  delay = 0,
  scale = 0.8
}: ScaleInOnScrollProps) {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.2,
    delay
  })

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible
          ? 'opacity-100 scale-100'
          : `opacity-0 scale-[${scale}]`,
        className
      )}
    >
      {children}
    </div>
  )
}

interface SlideInOnScrollProps {
  children: React.ReactNode
  className?: string
  direction?: 'left' | 'right' | 'up' | 'down'
  distance?: number
  delay?: number
}

export function SlideInOnScroll({
  children,
  className,
  direction = 'left',
  distance = 50,
  delay = 0
}: SlideInOnScrollProps) {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    delay
  })

  const getTransform = () => {
    if (isVisible) return 'translateX(0) translateY(0)'

    switch (direction) {
      case 'left':
        return `translateX(-${distance}px)`
      case 'right':
        return `translateX(${distance}px)`
      case 'up':
        return `translateY(-${distance}px)`
      case 'down':
        return `translateY(${distance}px)`
    }
  }

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        transform: getTransform()
      }}
    >
      {children}
    </div>
  )
}