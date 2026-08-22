"use client"

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import Image from "next/image"
import { SectionHeader } from "@/components/primitives/section-header"
import { SplitText } from "@/components/primitives/split-text"
import { Reveal } from "@/components/primitives/reveal"
import { profile } from "@/data/profile"
import { sections } from "@/data/site"

const meta = sections.find((s) => s.id === "approach")!

/**
 * Approach — the manifesto section.
 *
 * Three positions, each a sticky-numbered row. The index column pins while its
 * paragraph scrolls past, which gives long-form copy a spine and keeps the
 * reader oriented in a section that is otherwise a wall of text.
 *
 * This is the section that does the staff-level work: it is the only place on
 * the site that argues for *how* decisions get made rather than listing what
 * was built.
 */
export function Approach() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Slow drift on the portrait — enough to feel parallaxed, not enough to read
  // as a gimmick. Range starts at 0% so the reduced-motion variant matches the
  // server render exactly (see the same pattern in hero.tsx); 8% is the most it
  // can travel before it outruns the -inset-y-[8%] overflow on its container.
  const portraitY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "8%"])

  return (
    <section
      ref={sectionRef}
      id={meta.id}
      className="relative z-10 scroll-mt-24 py-[var(--spacing-section)]"
    >
      <div className="container-grid">
        <SectionHeader
          index={meta.index}
          label={meta.label}
          title="How I think about the work"
          aside={`${profile.manifesto.length} positions`}
        />

        {/* ---- Intro + portrait ------------------------------------------ */}
        <div className="mt-16 grid gap-12 md:mt-24 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7 md:col-start-1">
            <SplitText
              as="p"
              className="text-lead text-grey-100 max-w-[52ch]"
              stagger={0.014}
            >
              {profile.intro}
            </SplitText>

            <Reveal delay={0.15} className="mt-10">
              <dl className="grid max-w-md grid-cols-1 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
                <div className="bg-ink p-5">
                  <dt className="label text-subtle">Based</dt>
                  <dd className="mt-2 text-sm text-paper">{profile.location}</dd>
                </div>
                <div className="bg-ink p-5">
                  <dt className="label text-subtle">Education</dt>
                  <dd className="mt-2 text-sm text-paper">{profile.education}</dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <Reveal className="md:col-span-4 md:col-start-9" y={24}>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md border border-line">
              <motion.div
                className="absolute inset-x-0 -inset-y-[8%]"
                style={{ y: portraitY }}
              >
                <Image
                  src="/portfolio_image.jpeg"
                  alt={`${profile.name}, ${profile.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-top grayscale transition-[filter] duration-700 hover:grayscale-0"
                  priority={false}
                />
              </motion.div>
              {/* Keeps the portrait in the palette rather than punching a
                  full-colour hole in a near-monochrome page. */}
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent"
                aria-hidden
              />
            </div>
          </Reveal>
        </div>

        {/* ---- Positions --------------------------------------------------- */}
        <ol className="mt-24 md:mt-36">
          {profile.manifesto.map((position, i) => (
            <li key={position.id} className="border-t border-line">
              <div className="grid gap-6 py-12 md:grid-cols-12 md:gap-8 md:py-16">
                <div className="md:col-span-2">
                  {/* Sticky index: pins beneath the floating nav while the
                      paragraph beside it scrolls. */}
                  <span className="label text-acid md:sticky md:top-32 md:block">
                    {position.index}
                  </span>
                </div>

                <h3 className="display text-d4 md:col-span-4 md:pr-8">
                  <SplitText as="span" stagger={0.04}>
                    {position.title}
                  </SplitText>
                </h3>

                <div className="md:col-span-6">
                  <Reveal delay={0.08 + i * 0.02}>
                    <p className="text-grey-200 max-w-[58ch] leading-relaxed">
                      {position.body}
                    </p>
                  </Reveal>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
