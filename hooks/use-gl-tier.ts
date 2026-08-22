"use client"

import { useEffect, useState } from "react"

/**
 * Decides how much WebGL this device should be asked to do.
 *
 * Resolved on the client only — every field has a conservative SSR default so
 * the first paint never assumes a GPU that might not be there. Components read
 * `ready` before mounting a canvas, which also avoids a hydration mismatch on
 * the `<Canvas>` subtree.
 */

export interface GLTier {
  /** False on reduced-motion or when WebGL is unavailable — render the static fallback. */
  enabled: boolean
  /** Post-processing is desktop-only; it is the first thing to go. */
  postProcessing: boolean
  particleCount: number
  dpr: [number, number]
  /** 0 freezes shader time. Used to honour reduced-motion without unmounting. */
  motionScale: number
  /** True once the client-side check has run. */
  ready: boolean
}

const SSR_DEFAULT: GLTier = {
  enabled: false,
  postProcessing: false,
  particleCount: 0,
  dpr: [1, 1],
  motionScale: 0,
  ready: false,
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    )
  } catch {
    return false
  }
}

export function useGLTier(): GLTier {
  const [tier, setTier] = useState<GLTier>(SSR_DEFAULT)

  useEffect(() => {
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    const resolve = () => {
      const reduced = reducedQuery.matches
      const hasWebGL = detectWebGL()

      if (!hasWebGL) {
        setTier({ ...SSR_DEFAULT, ready: true })
        return
      }

      const coarse = window.matchMedia("(pointer: coarse)").matches
      const narrow = window.innerWidth < 768
      const mobile = coarse || narrow

      // `deviceMemory` is Chromium-only; absent elsewhere, so treat unknown as
      // capable rather than penalising Safari and Firefox.
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
      const lowMemory = typeof memory === "number" && memory <= 4
      const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4
      const lowEnd = lowMemory || fewCores

      setTier({
        enabled: true,
        // Bloom + chromatic aberration are a full-screen pass per frame. Only
        // spend that on a desktop GPU that is not already struggling.
        postProcessing: !mobile && !lowEnd,
        particleCount: mobile ? 9000 : lowEnd ? 16000 : 30000,
        dpr: mobile ? [1, 1.5] : [1, 2],
        // Reduced motion keeps the visual but stops it moving.
        motionScale: reduced ? 0 : 1,
        ready: true,
      })
    }

    resolve()
    reducedQuery.addEventListener("change", resolve)
    return () => reducedQuery.removeEventListener("change", resolve)
  }, [])

  return tier
}
