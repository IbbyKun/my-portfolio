"use client"

import { useEffect, useRef, useState, ReactNode } from "react"

interface ParallaxSectionProps {
  children: ReactNode
  className?: string
  zIndex: number
}

export function ParallaxSection({ children, className = "", zIndex }: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [opacity, setOpacity] = useState(1)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      
      const rect = sectionRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Calculate how far past the top the section has scrolled
      if (rect.top < 0) {
        // Section is being scrolled past
        const progress = Math.min(1, Math.abs(rect.top) / (windowHeight * 0.5))
        setOpacity(1 - progress * 0.8)
        setScale(1 - progress * 0.05)
      } else {
        setOpacity(1)
        setScale(1)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      ref={sectionRef}
      className={`sticky top-0 min-h-screen ${className}`}
      style={{
        zIndex,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "center top",
        transition: "transform 0.1s ease-out",
      }}
    >
      {children}
    </div>
  )
}

interface HorizontalParallaxSectionProps {
  children: ReactNode
  className?: string
  zIndex: number
}

export function HorizontalParallaxSection({ children, className = "", zIndex }: HorizontalParallaxSectionProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{ zIndex }}
    >
      {children}
    </div>
  )
}
