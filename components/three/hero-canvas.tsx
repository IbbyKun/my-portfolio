"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import { Canvas } from "@react-three/fiber"
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing"
import { KernelSize } from "postprocessing"
import * as THREE from "three"
import { ParticleField } from "@/components/three/particle-field"
import { useGLTier } from "@/hooks/use-gl-tier"
// Side-effect import: filters one upstream three.js deprecation log.
import "@/lib/three-console"

/**
 * The hero WebGL scene.
 *
 * Scoped to the hero element rather than fixed to the viewport: the canvas is
 * opaque (post-processing and alpha canvases do not get along), so it must not
 * extend past the section it belongs to.
 *
 * It also stops rendering entirely once the hero leaves the viewport —
 * `frameloop="never"` means zero GPU cost for the rest of the page, which
 * matters because the particle field is the most expensive thing here by an
 * order of magnitude.
 *
 * `eventSource` matters more than it looks. Without it r3f listens on the
 * canvas itself and hard-sets `pointer-events: auto` on it — which both swallows
 * clicks meant for the content above and stops pointer tracking the moment the
 * cursor crosses a heading. Pointing it at the section makes the canvas
 * `pointer-events: none` and tracks the cursor across the whole hero.
 */

/** Hoisted so a new Vector2 is not allocated on every render. */
const CHROMATIC_OFFSET = new THREE.Vector2(0.0006, 0.0009)

function Effects() {
  return (
    <EffectComposer
      // The normal pass is off by default in v3 and nothing here needs it;
      // MSAA is pure cost on a point cloud with no geometry edges to smooth.
      multisampling={0}
    >
      {/* MEDIUM rather than LARGE: on a point cloud the extra blur radius is
          barely visible but costs a noticeably wider full-screen convolution. */}
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.12}
        luminanceSmoothing={0.35}
        kernelSize={KernelSize.MEDIUM}
        mipmapBlur
      />
      {/* Only `offset` is passed: v3 mistypes this effect's remaining props
          (radialModulation, modulationOffset, blendFunction all resolve away),
          and the defaults are what we want anyway. */}
      <ChromaticAberration offset={CHROMATIC_OFFSET} />
      {/* The film-grain pass was dropped: the CSS .grain overlay already covers
          the whole page, so this was a second full-screen pass painting an
          effect the visitor was already seeing. */}
      <Vignette offset={0.28} darkness={0.72} eskil={false} />
    </EffectComposer>
  )
}

export function HeroCanvas({
  className,
  eventSource,
}: {
  className?: string
  /** Element r3f should listen on. Should be the whole hero section. */
  eventSource?: RefObject<HTMLElement | null>
}) {
  const tier = useGLTier()
  const containerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      // Generous margin so the loop is already running before it scrolls back in.
      { rootMargin: "20% 0px 20% 0px", threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={className} aria-hidden>
      {tier.ready && tier.enabled ? (
        <Canvas
          // `never` halts rendering outright; r3f still renders on demand if
          // something invalidates, which is what we want on re-entry.
          frameloop={inView ? "always" : "never"}
          // Post-processing cost scales with pixel count, and four full-screen
          // passes at DPR 2 on a 4K display is the most expensive thing on the
          // site. 1.5 is indistinguishable here and ~44% fewer pixels.
          dpr={tier.postProcessing ? [1, 1.5] : tier.dpr}
          eventSource={eventSource as RefObject<HTMLElement>}
          eventPrefix="client"
          camera={{ position: [0, 0, 11], fov: 46, near: 0.1, far: 60 }}
          gl={{
            antialias: false,
            alpha: false,
            powerPreference: "high-performance",
            stencil: false,
            depth: false,
          }}
          style={{ position: "absolute", inset: 0 }}
        >
          {/* Opaque clear colour matched to --color-ink so the canvas is
              invisible against the page until the particles light up. */}
          <color attach="background" args={["#0a0a0a"]} />
          <ParticleField count={tier.particleCount} motionScale={tier.motionScale} />
          {tier.postProcessing ? <Effects /> : null}
        </Canvas>
      ) : null}
    </div>
  )
}
