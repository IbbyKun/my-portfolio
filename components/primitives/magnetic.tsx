"use client"

import { useRef, type ReactNode } from "react"
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

/**
 * Magnetic hover: the element leans toward the pointer while it is inside its
 * bounds, then springs back.
 *
 * Only ever active for a mouse — on touch there is no hover state to respond
 * to, and the transform would just fight the tap. The reduced-motion check
 * gates the event handler rather than the rendered tree, so the server and
 * client render identically (both start at x/y = 0) and hydration is clean.
 */
export function Magnetic({
  children,
  className,
  /** How far the element may travel, as a fraction of pointer offset. */
  strength = 0.28,
}: {
  children: ReactNode
  className?: string
  strength?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 180, damping: 18, mass: 0.35 })
  const springY = useSpring(y, { stiffness: 180, damping: 18, mass: 0.35 })

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || e.pointerType !== "mouse") return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength)
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={cn("rm-static", className)}
      style={{ x: springX, y: springY }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
    >
      {children}
    </motion.div>
  )
}
