"use client"

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import dynamic from "next/dynamic"
import { SplitText } from "@/components/primitives/split-text"
import { useScrollToSection } from "@/components/chrome/smooth-scroll"
import { LocalTime } from "@/components/sections/local-time"
import { profile } from "@/data/profile"

// Three.js is ~380KB of the bundle and renders nothing during SSR — see
// useGLTier. Splitting it out keeps it off the hydration critical path.
const HeroCanvas = dynamic(
  () => import("@/components/three/hero-canvas").then((m) => m.HeroCanvas),
  { ssr: false },
)

/**
 * Hero.
 *
 * Corner-anchored editorial layout: status top-left, clock top-right, the
 * name filling the lower half, meta along the bottom edge. The WebGL field
 * sits behind everything and is masked into the page by a gradient at the
 * bottom, so there is no visible seam where the canvas ends.
 *
 * The name is intentionally the largest thing on the site and never competes
 * with the particles — the field is kept at low base alpha in the fragment
 * shader precisely so the type stays legible over it.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const scrollTo = useScrollToSection()
  const reduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })

  // Content drifts up slightly faster than the page and fades as it leaves,
  // so the hero hands off to the next section instead of just scrolling away.
  //
  // Reduced motion collapses the output range rather than dropping the `style`
  // prop: both variants evaluate to the same thing at progress 0, which is the
  // only state the server can render, so hydration stays clean either way.
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "26%"])
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.65],
    [1, reduceMotion ? 1 : 0],
  )

  const [firstName, lastName] = profile.name.split(" ")

  return (
    <section
      ref={sectionRef}
      id="index"
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-28 pb-8 md:pt-32 md:pb-10"
    >
      <HeroCanvas className="pointer-events-none absolute inset-0 z-0" eventSource={sectionRef} />

      {/* Masks the bottom edge of the canvas into the page background. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-56 bg-gradient-to-b from-transparent to-ink"
        aria-hidden
      />

      <motion.div
        className="relative z-10 flex flex-1 flex-col justify-between"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {/* ---- Status row -------------------------------------------------- */}
        <div className="container-grid">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-1.5" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-acid opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-acid" />
              </span>
              <p className="label text-muted max-w-[22ch] sm:max-w-none">
                {profile.availability}
              </p>
            </div>

            <div className="label text-subtle text-right">
              <LocalTime />
            </div>
          </div>
        </div>

        {/* ---- Name plate --------------------------------------------------- */}
        <div className="container-grid mt-14 md:mt-20">
          <h1 className="display text-d1">
            <SplitText as="span" className="block" stagger={0.05}>
              {firstName}
            </SplitText>
            <span className="flex items-end gap-[0.12em]">
              <SplitText as="span" className="block text-acid" delay={0.12} stagger={0.05}>
                {lastName}
              </SplitText>
              <motion.span
                className="mb-[0.18em] hidden size-[0.09em] rounded-full bg-acid sm:block"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.75, duration: 0.5, ease: [0.34, 1.4, 0.64, 1] }}
                aria-hidden
              />
            </span>
          </h1>

          <div className="mt-8 grid gap-5 md:mt-10 md:grid-cols-12 md:gap-8">
            <p className="label text-subtle md:col-span-3 md:pt-2">{profile.title}</p>

            <div className="md:col-span-9">
              {/* This is a statement, not a caption. It was set at --text-lead
                  (1.5rem max) next to a 13rem name, which made it read as a
                  subtitle. Now it is near-display size, full paper white, at a
                  tight measure so it breaks into three declarative lines. */}
              <SplitText
                as="p"
                className="text-paper max-w-[26ch] text-[clamp(1.5rem,2.8vw,2.6rem)] leading-[1.12] font-medium tracking-[-0.022em]"
                delay={0.3}
                stagger={0.026}
              >
                {profile.statement}
              </SplitText>
            </div>
          </div>
        </div>

        {/* ---- Bottom meta -------------------------------------------------- */}
        <div className="container-grid mt-12 md:mt-14">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.8 }}
          >
            <div className="rule mb-4" />
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
              <ul className="label text-subtle flex flex-wrap items-center gap-x-5 gap-y-2">
                {profile.disciplines.map((discipline, i) => (
                  <li key={discipline} className="flex items-center gap-5">
                    {discipline}
                    {i < profile.disciplines.length - 1 ? (
                      <span className="size-1 rounded-full bg-acid/60" aria-hidden />
                    ) : null}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => scrollTo("approach")}
                data-cursor
                className="label text-muted group flex items-center gap-3 transition-colors hover:text-paper"
              >
                Scroll
                <span
                  className="inline-block transition-transform duration-500 group-hover:translate-y-1"
                  aria-hidden
                >
                  ↓
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
