"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { experiences, type Experience } from "@/data/experience"
import { cn } from "@/lib/utils"

export interface ExperienceSectionProps {
  /** Lets inner `position: sticky` work; parallax scale breaks sticky. Set from page. */
  parallaxFlat?: boolean
  sectionIndex?: number
}

/** `parallaxFlat` is read by `ParallaxContainer` via props; not used inside. */
export function ExperienceSection(_props: ExperienceSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [scrollDistance, setScrollDistance] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useLayoutEffect(() => {
    if (reduceMotion) return

    const measure = () => {
      const track = trackRef.current
      if (!track) return
      const maxTx = Math.max(0, track.scrollWidth - window.innerWidth)
      setScrollDistance(maxTx > 0 ? maxTx + 80 : 0)
    }

    measure()
    const ro = new ResizeObserver(measure)
    if (trackRef.current) ro.observe(trackRef.current)
    window.addEventListener("resize", measure)
    void document.fonts.ready.then(measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [reduceMotion, experiences.length])

  useEffect(() => {
    if (reduceMotion) return

    const onScroll = () => {
      const section = sectionRef.current
      const track = trackRef.current
      if (!section || !track) return

      const scrollable = section.offsetHeight - window.innerHeight
      if (scrollable <= 0) return

      const rect = section.getBoundingClientRect()
      // Top of tall block relative to viewport; advances 0 → negative as we scroll the pin range.
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable)
      const progress = scrollable > 0 ? scrolled / scrollable : 0

      const maxTx = Math.max(0, track.scrollWidth - window.innerWidth)
      setTranslateX(-progress * maxTx)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    onScroll()
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [reduceMotion, scrollDistance])

  const sectionMinHeight =
    reduceMotion || scrollDistance <= 0
      ? undefined
      : (`calc(100vh + ${scrollDistance}px)` as const)

  if (reduceMotion) {
    return (
      <section
        id="experience"
        className="relative min-h-screen bg-card py-24 lg:py-32"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/80 to-transparent pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6">
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

      <div className="sticky top-0 h-screen flex flex-col overflow-hidden">
        <div className="relative z-10 pt-12 lg:pt-16 pb-6 px-6 max-w-5xl mx-auto w-full shrink-0">
          <h2 className="text-sm uppercase tracking-widest text-primary font-medium">
            Experience
          </h2>
        </div>

        <div className="relative flex-1 flex items-stretch min-h-0 min-w-0 overflow-x-visible">
          <div
            ref={trackRef}
            className={cn(
              "flex w-max flex-nowrap gap-4 md:gap-6 lg:gap-8 px-6 pb-12 lg:pb-16 items-stretch",
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
                className="group shrink-0 flex flex-col rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/35 transition-colors p-6 md:p-8 w-[min(88vw,420px)] sm:w-[min(85vw,480px)] lg:w-[min(80vw,520px)]"
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
                <p className="text-muted-foreground leading-relaxed flex-1 mb-6">
                  {exp.description}
                </p>
                <div className="flex flex-wrap gap-2">
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
    <div className="group grid lg:grid-cols-[180px_1fr] gap-4 lg:gap-8 py-8 border-t border-border/50 hover:bg-secondary/30 transition-colors px-4 -mx-4 rounded-lg cursor-pointer">
      <div className="text-sm text-muted-foreground font-mono">{exp.period}</div>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
            {exp.title} · {exp.company}
            {exp.companyUrl ? (
              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            ) : null}
          </h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">{exp.description}</p>
        <div className="flex flex-wrap gap-2">
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
