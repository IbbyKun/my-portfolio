"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import Lenis from "lenis"

/**
 * Lenis smooth scroll.
 *
 * Everything on this page is scroll-driven — the WebGL camera, the nav state,
 * the section reveals — and native scroll on Windows/trackpad is too jumpy for
 * that to feel intentional. Lenis interpolates it.
 *
 * The instance is exposed via context so the nav can `scrollTo` through it
 * rather than fighting it with `element.scrollIntoView`.
 */

const LenisContext = createContext<Lenis | null>(null)

export function useLenis() {
  return useContext(LenisContext)
}

/** Scroll to a section id, accounting for the floating nav. */
export function useScrollToSection() {
  const lenis = useLenis()

  return (id: string) => {
    const target = document.getElementById(id)
    if (!target) return

    if (lenis) {
      lenis.scrollTo(target, { offset: -24, duration: 1.4 })
    } else {
      // Reduced motion, or Lenis not mounted: plain jump.
      target.scrollIntoView({ behavior: "auto", block: "start" })
    }
  }
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Respect the OS setting: no interpolation, just native scrolling.
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    const instance = new Lenis({
      // lerp, not duration+easing. A fixed duration re-targets on every wheel
      // tick, which is what made continuous scrolling feel like it was gliding
      // behind the input. A lerp tracks the pointer and settles on its own.
      lerp: 0.12,
      wheelMultiplier: 1,
      smoothWheel: true,
      // Touch devices already have momentum scrolling; doubling it feels wrong.
      syncTouch: false,
      touchMultiplier: 1.6,
    })

    setLenis(instance)

    const raf = (time: number) => {
      instance.raf(time)
      rafRef.current = requestAnimationFrame(raf)
    }
    rafRef.current = requestAnimationFrame(raf)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
