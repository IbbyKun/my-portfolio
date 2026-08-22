"use client"

import { useEffect, useState } from "react"
import { profile } from "@/data/profile"

/**
 * Live local clock.
 *
 * Small detail, but it is the one element on the page that proves it is a
 * living site rather than a screenshot — and for someone hiring across time
 * zones it is genuinely useful information.
 *
 * Renders the location only until mounted: the server has no idea what time
 * it is in Karachi at hydration, and guessing produces a mismatch.
 */

const TIME_ZONE = "Asia/Karachi"

function formatNow() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  }).format(new Date())
}

export function LocalTime() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    setTime(formatNow())
    // Tick on the minute boundary rather than every second — the seconds are
    // not shown, so a 1s interval would be 60x the wakeups for no visible gain.
    const align = window.setTimeout(
      () => {
        setTime(formatNow())
        const interval = window.setInterval(() => setTime(formatNow()), 60_000)
        // Stash on the timeout id's closure for cleanup below.
        cleanup = () => window.clearInterval(interval)
      },
      (60 - new Date().getSeconds()) * 1000,
    )

    let cleanup: (() => void) | null = null

    return () => {
      window.clearTimeout(align)
      cleanup?.()
    }
  }, [])

  return (
    <span className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
      <span>{profile.location}</span>
      <span className="text-paper tabular-nums" suppressHydrationWarning>
        {time ? `${time} PKT` : "—:— PKT"}
      </span>
    </span>
  )
}
