"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"

/**
 * Custom cursor.
 *
 * A dot that springs after the pointer and swells when it is over anything
 * marked `data-cursor`. Elements can also set `data-cursor-label="VIEW"` to
 * put a word inside the swollen dot — used on the work list.
 *
 * `mix-blend-mode: difference` means it inverts whatever it crosses, so it
 * stays visible over the acid accent, over imagery, and over the WebGL layer
 * without needing a colour per context.
 *
 * Gated on a fine pointer and on reduced-motion. The `data-custom-cursor`
 * attribute on <html> is what hides the native cursor (see globals.css) — it
 * is only ever set once this component has confirmed it is safe to do so, so
 * a touch or reduced-motion user never ends up with no cursor at all.
 */

type CursorMode = "default" | "hover"

export function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState<CursorMode>("default")
  const [label, setLabel] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  // Light spring: enough lag to feel physical, not enough to feel broken.
  const springX = useSpring(x, { stiffness: 700, damping: 42, mass: 0.45 })
  const springY = useSpring(y, { stiffness: 700, damping: 42, mass: 0.45 })

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")

    const evaluate = () => setEnabled(fine.matches && !reduced.matches)
    evaluate()

    fine.addEventListener("change", evaluate)
    reduced.addEventListener("change", evaluate)
    return () => {
      fine.removeEventListener("change", evaluate)
      reduced.removeEventListener("change", evaluate)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      document.documentElement.removeAttribute("data-custom-cursor")
      return
    }

    document.documentElement.setAttribute("data-custom-cursor", "on")

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      if (!visible) setVisible(true)

      // Walk up from the event target to find the nearest opted-in element.
      const target = (e.target as Element | null)?.closest?.("[data-cursor]") ?? null
      if (target) {
        setMode("hover")
        setLabel(target.getAttribute("data-cursor-label"))
      } else {
        setMode("default")
        setLabel(null)
      }
    }

    const onLeave = () => setVisible(false)
    const onEnter = () => setVisible(true)

    window.addEventListener("pointermove", onMove, { passive: true })
    document.addEventListener("pointerleave", onLeave)
    document.addEventListener("pointerenter", onEnter)

    return () => {
      document.documentElement.removeAttribute("data-custom-cursor")
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerleave", onLeave)
      document.removeEventListener("pointerenter", onEnter)
    }
  }, [enabled, visible, x, y])

  if (!enabled) return null

  const size = mode === "hover" ? (label ? 84 : 48) : 10

  return (
    <motion.div
      className="cursor-root"
      style={{ x: springX, y: springY }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      aria-hidden
    >
      <div className="cursor-dot" style={{ width: size, height: size }} />
      <span className="cursor-label label" style={{ opacity: label ? 1 : 0 }}>
        {label}
      </span>
    </motion.div>
  )
}
