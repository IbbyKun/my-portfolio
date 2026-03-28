"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { experiences, type Experience } from "@/data/experience"
import { useSimpleScrollLayout } from "@/components/portfolio/parallax-layout-context"
import { cn } from "@/lib/utils"

export interface ExperienceSectionProps {
  /** Lets inner `position: sticky` work; parallax scale breaks sticky. Set from page. */
  parallaxFlat?: boolean
}

/** Left inset aligned with site `max-w-6xl` + `px-6`; track spans to viewport right for card peek. */
const EXPERIENCE_RAIL_INSET =
  "max(1.5rem, calc((100vw - min(100vw, 72rem)) / 2 + 1.5rem))" as const

/** `parallaxFlat` is read by `ParallaxContainer` via props; not used inside. */
export function ExperienceSection(_props: ExperienceSectionProps) {
  const simpleScroll = useSimpleScrollLayout()
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [scrollDistance, setScrollDistance] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const linearLayout = reduceMotion || simpleScroll

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useLayoutEffect(() => {
    if (linearLayout) return

    const measure = () => {
      const track = trackRef.current
      const viewport = viewportRef.current
      if (!track || !viewport) return
      const visibleW = viewport.clientWidth
      const maxTx = Math.max(0, track.scrollWidth - visibleW)
      setScrollDistance(maxTx > 0 ? maxTx + 80 : 0)
    }

    measure()
    const ro = new ResizeObserver(measure)
    if (trackRef.current) ro.observe(trackRef.current)
    if (viewportRef.current) ro.observe(viewportRef.current)
    window.addEventListener("resize", measure)
    void document.fonts.ready.then(measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [linearLayout, experiences.length])

  useEffect(() => {
    if (linearLayout) return

    const onScroll = () => {
      const section = sectionRef.current
      const track = trackRef.current
      if (!section || !track) return

      const scrollable = section.offsetHeight - window.innerHeight
      if (scrollable <= 0) return

      const viewport = viewportRef.current
      const visibleW = viewport?.clientWidth ?? window.innerWidth

      const rect = section.getBoundingClientRect()
      // Top of tall block relative to viewport; advances 0 → negative as we scroll the pin range.
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable)
      const progress = scrollable > 0 ? scrolled / scrollable : 0

      const maxTx = Math.max(0, track.scrollWidth - visibleW)
      setTranslateX(-progress * maxTx)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    onScroll()
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [linearLayout, scrollDistance])

  const sectionMinHeight =
    linearLayout || scrollDistance <= 0
      ? undefined
      : (`calc(100vh + ${scrollDistance}px)` as const)

  if (linearLayout) {
    return (
      <section
        id="experience"
        className="relative min-h-screen overflow-x-hidden bg-card py-24 lg:py-32"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/80 to-transparent pointer-events-none" />

        <div className="relative mx-auto min-w-0 max-w-6xl px-6">
          <h2 className="text-sm uppercase tracking-widest text-primary mb-16 font-medium">
            Experience
          </h2>
          <div className="space-y-0">
            {experiences.map((exp) => (
              <ExperienceRow key={exp.id} exp={exp} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      id="experience"
      className={cn("relative bg-card", !sectionMinHeight && "min-h-screen")}
      style={sectionMinHeight ? { minHeight: sectionMinHeight } : undefined}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/80 to-transparent pointer-events-none z-10" />

      <div className="sticky top-0 flex h-screen min-h-0 flex-col">
        <div className="relative z-10 mx-auto w-full max-w-6xl shrink-0 px-6 pt-12 lg:pt-16">
          <div className="pb-6">
            <h2 className="text-sm font-medium uppercase tracking-widest text-primary">
              Experience
            </h2>
          </div>
        </div>

        <div
          ref={viewportRef}
          className="relative min-h-0 min-w-0 flex-1 overflow-visible pb-12 lg:pb-16"
          style={{
            marginLeft: EXPERIENCE_RAIL_INSET,
            width: `calc(100vw - ${EXPERIENCE_RAIL_INSET})`,
          }}
        >
          <div
            ref={trackRef}
            className={cn(
              "flex h-full w-max flex-nowrap items-stretch gap-5 md:gap-7 lg:gap-8",
              scrollDistance <= 0 && "justify-center",
            )}
            style={{
              transform:
                scrollDistance > 0 ? `translate3d(${translateX}px,0,0)` : undefined,
              willChange: scrollDistance > 0 ? "transform" : undefined,
            }}
          >
            {experiences.map((exp) => (
              <article
                key={exp.id}
                className="group flex w-[340px] min-w-0 max-w-[min(100vw-2rem,560px)] shrink-0 flex-col rounded-xl border border-border/50 bg-secondary/20 p-6 transition-colors hover:bg-secondary/35 sm:w-[380px] md:w-[440px] md:p-8 lg:w-[500px] xl:w-[560px]"
              >
                <p className="text-sm text-muted-foreground font-mono mb-4">{exp.period}</p>
                <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors flex flex-wrap items-center gap-2 mb-4">
                  <span>
                    {exp.title} · {exp.company}
                  </span>
                  {exp.companyUrl ? (
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  ) : null}
                </h3>
                <p className="mb-6 flex-1 break-words text-muted-foreground leading-relaxed">
                  {exp.description}
                </p>
                <div className="flex min-w-0 flex-wrap gap-2">
                  {exp.technologies.map((tech) => (
                    <Badge
                      key={tech}
                      variant="secondary"
                      className="border-0 bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ExperienceRow({ exp }: { exp: Experience }) {
  return (
    <div className="group grid min-w-0 grid-cols-1 gap-4 py-8 border-t border-border/50 transition-colors hover:bg-secondary/30 lg:grid-cols-[180px_1fr] lg:gap-8 lg:px-4 lg:-mx-4 lg:rounded-lg cursor-pointer">
      <div className="shrink-0 text-sm font-mono text-muted-foreground">{exp.period}</div>
      <div className="min-w-0 space-y-4">
        <div>
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-medium text-foreground transition-colors group-hover:text-primary">
            {exp.title} · {exp.company}
            {exp.companyUrl ? (
              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            ) : null}
          </h3>
        </div>
        <p className="break-words text-muted-foreground leading-relaxed">{exp.description}</p>
        <div className="flex min-w-0 flex-wrap gap-2">
          {exp.technologies.map((tech) => (
            <Badge
              key={tech}
              variant="secondary"
              className="bg-primary/10 text-primary border-0 hover:bg-primary/20"
            >
              {tech}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
