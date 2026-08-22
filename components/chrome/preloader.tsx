"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { profile } from "@/data/profile"

/**
 * Intro curtain.
 *
 * Counts to 100 and lifts. Three rules keep it from becoming the thing people
 * remember about the site for the wrong reasons:
 *
 *  - it is short (~1.3s) and never blocks interaction beyond that;
 *  - it shows once per session, not once per navigation;
 *  - reduced-motion skips it entirely.
 *
 * The counter is honest about being decorative — it is eased, not tied to real
 * asset progress, because the page is already interactive by the time it runs.
 * Tying it to load events would make fast connections wait for nothing.
 */

const SESSION_KEY = "intro-shown"
const DURATION_MS = 1300

export function Preloader() {
  const [active, setActive] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const seen = sessionStorage.getItem(SESSION_KEY) === "1"

    if (reduced || seen) return

    setActive(true)
    sessionStorage.setItem(SESSION_KEY, "1")
    document.documentElement.style.overflow = "hidden"

    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS, 1)
      // Ease-out-expo, so it sprints then settles on 100.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setCount(Math.round(eased * 100))

      if (t < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        setActive(false)
        document.documentElement.style.overflow = ""
      }
    }

    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      document.documentElement.style.overflow = ""
    }
  }, [])

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col justify-between bg-ink px-[var(--spacing-gutter)] py-8"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        >
          <div className="flex items-start justify-between">
            <span className="label text-subtle">{profile.name}</span>
            <span className="label text-subtle">{profile.location}</span>
          </div>

          <div className="flex items-end justify-between gap-6">
            <span className="display text-d2 text-paper tabular-nums leading-none">
              {String(count).padStart(3, "0")}
            </span>
            <span className="label text-acid mb-2">Loading</span>
          </div>

          {/* Progress rule */}
          <div className="relative h-px w-full bg-line">
            <motion.div
              className="absolute inset-y-0 left-0 bg-acid"
              style={{ width: `${count}%` }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
