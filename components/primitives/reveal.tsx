"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * Scroll-entrance primitives.
 *
 * Short, small, once-only — the brief was "slight motion", so this is a 16px
 * lift over 0.6s rather than anything that announces itself.
 *
 * As with SplitText, reduced motion is handled by the `rm-static` class rather
 * than a JSX branch: branching on a client-only preference renders a different
 * tree on the server and breaks hydration. See globals.css.
 */

const EASE = [0.16, 1, 0.3, 1] as const

export function Reveal({
  children,
  className,
  delay = 0,
  /** Travel distance in px. Negative values come from above. */
  y = 16,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  return (
    <motion.div
      className={cn("rm-static", className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/** Staggered container for lists of `RevealItem` children. */
export function RevealGroup({
  children,
  className,
  stagger = 0.06,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
  y = 16,
}: {
  children: ReactNode
  className?: string
  y?: number
}) {
  return (
    <motion.div
      className={cn("rm-static", className)}
      variants={{
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  )
}
