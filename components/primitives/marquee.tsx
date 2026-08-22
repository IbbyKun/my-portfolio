"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Infinite marquee.
 *
 * The track holds the content twice and translates by exactly -50%, so the
 * loop point is seamless regardless of content width. Runs on a CSS keyframe
 * rather than a rAF loop — it stays smooth while the main thread is busy with
 * WebGL, and it costs nothing when off-screen.
 */
export function Marquee({
  children,
  className,
  /** Seconds for one full cycle. Longer = slower. */
  duration = 40,
  direction = "left",
  pauseOnHover = false,
}: {
  children: ReactNode
  className?: string
  duration?: number
  direction?: "left" | "right"
  pauseOnHover?: boolean
}) {
  return (
    <div
      className={cn("marquee-root relative w-full overflow-hidden", className)}
      style={
        {
          "--marquee-duration": `${duration}s`,
          "--marquee-hover-state": pauseOnHover ? "paused" : "running",
        } as React.CSSProperties
      }
    >
      <div className="marquee-track" data-direction={direction}>
        {/* Duplicate is aria-hidden so screen readers hear the strip once. */}
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}
