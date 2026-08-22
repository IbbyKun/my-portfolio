"use client"

import { useEffect, useState } from "react"

/**
 * Reactive media query.
 *
 * Always starts false so server and first client render agree; callers should
 * treat `false` as "not yet known" and degrade to the simpler experience,
 * which is the right default for every use here (hover effects, WebGL).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)

    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [query])

  return matches
}

/** True only for devices that can actually hover — mouse, trackpad, stylus. */
export function useHasHover(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)")
}
