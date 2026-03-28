"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Image from "next/image"
import { Github, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { projects, type Project } from "@/data/projects"
import { cn } from "@/lib/utils"

const STACK_PEEK_PX = 20
const SCROLL_RELEASE_PX = 160
/** Fraction of each segment used to bring the card up from below (rest = hold / read) */
const CARD_ARRIVE_PORTION = 0.58

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

export interface ProjectsSectionProps {
  parallaxFlat?: boolean
}

/** `parallaxFlat` is read by `ParallaxContainer`; scroll math needs a non-sticky parent. */
export function ProjectsSection(_props: ProjectsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [scrollDistance, setScrollDistance] = useState(0)
  const [progress, setProgress] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [enterDistance, setEnterDistance] = useState(800)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useLayoutEffect(() => {
    const measure = () => {
      const vh = window.innerHeight
      // Travel far enough that the whole card enters from below the viewport
      setEnterDistance(Math.max(vh * 0.95 + 120, 620, vh * 0.88 + 400))
      const n = projects.length
      // Longer steps = more time to read each project in the limelight
      const step = Math.min(1020, Math.max(560, vh * 0.92))
      setScrollDistance(Math.max(1, n) * step + SCROLL_RELEASE_PX)
    }

    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [projects.length])

  useEffect(() => {
    if (reduceMotion) {
      setProgress(1)
      return
    }

    const onScroll = () => {
      const section = sectionRef.current
      if (!section) return

      const scrollable = section.offsetHeight - window.innerHeight
      if (scrollable <= 0) {
        setProgress(1)
        return
      }

      const rect = section.getBoundingClientRect()
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable)
      setProgress(scrollable > 0 ? scrolled / scrollable : 1)
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

  const n = projects.length
  const scaled = Math.min(n, Math.max(0, progress * n))
  const segment = Math.max(0, Math.min(n - 1, Math.floor(scaled - 1e-9)))
  let frac = scaled - segment
  if (frac > 1 - 1e-9) frac = 1
  if (frac < 1e-9) frac = 0

  /** Card motion for current segment: long travel tied to first part of scroll, then hold */
  const arrive = CARD_ARRIVE_PORTION > 0 ? Math.min(1, frac / CARD_ARRIVE_PORTION) : 1
  const cardTravel = 1 - arrive

  /** Same curve as card tilt / previous-card handoff — text fades with scroll, not after “stick” */
  const textHandoff = segment >= 1 ? smoothstep(arrive) : 0

  if (reduceMotion) {
    return (
      <section
        id="projects"
        className="relative min-h-screen bg-background py-24 lg:py-32 border-t border-border/40"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-card via-background to-background" />
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />
        <div className="pointer-events-none absolute top-1/4 left-0 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 space-y-16">
          <h2 className="text-sm uppercase tracking-widest text-primary font-medium">Projects</h2>
          <div className="grid gap-10 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectStackCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      id="projects"
      className={cn(
        "relative border-t border-border/40 bg-background",
        !sectionMinHeight && "min-h-screen",
      )}
      style={sectionMinHeight ? { minHeight: sectionMinHeight } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-card via-background to-muted/30" />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-[0.45]" />
      <div className="pointer-events-none absolute top-20 right-[10%] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-32 left-[5%] h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      <div className="sticky top-0 flex h-screen min-h-0 flex-col overflow-hidden">
        {/* True viewport centering for the whole block */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-6 sm:px-8">
          <div className="relative z-10 mx-auto w-full max-w-6xl">
            <p className="mb-6 text-center text-sm font-medium uppercase tracking-widest text-primary sm:mb-8 sm:text-left">
              Projects
            </p>

            <div className="grid w-full grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-14 xl:gap-20">
              {/* Left: crossfade */}
              <div className="relative mx-auto min-h-[240px] w-full max-w-xl lg:mx-0 lg:min-h-[18rem]">
                {segment === 0 ? (
                  <ProjectTextBlock project={projects[0]} />
                ) : (
                  <>
                    <div
                      className="absolute inset-x-0 top-0 flex flex-col items-start will-change-[opacity]"
                      style={{
                        opacity: 1 - textHandoff,
                        pointerEvents: textHandoff > 0.55 ? "none" : "auto",
                        zIndex: 1,
                      }}
                      aria-hidden={textHandoff >= 0.98}
                    >
                      <ProjectTextBlock project={projects[segment - 1]} />
                    </div>
                    <div
                      className="absolute inset-x-0 top-0 flex flex-col items-start will-change-[opacity]"
                      style={{
                        opacity: textHandoff,
                        pointerEvents: textHandoff < 0.45 ? "none" : "auto",
                        zIndex: 2,
                      }}
                      aria-hidden={textHandoff <= 0.02}
                    >
                      <ProjectTextBlock project={projects[segment]} />
                    </div>
                  </>
                )}
              </div>

              {/* Right: 3D stack — tilt only on cards behind the limelight */}
              <div className="mx-auto flex w-full max-w-[min(100%,600px)] justify-center lg:mx-0 lg:max-w-none lg:justify-end">
                <div
                  className="relative w-full lg:w-[min(100%,580px)]"
                  style={{
                    minHeight: "min(600px, 62vh)",
                    perspective: "1400px",
                    perspectiveOrigin: "50% 30%",
                  }}
                >
                  {projects.map((project, j) => {
                    if (j > segment) return null
                    const isFront = j === segment
                    const depth = segment - j

                    // Same scroll phase as the incoming card (`arrive`): previous card tilts & eases into peek
                    const tiltT =
                      j === segment
                        ? 0
                        : j < segment - 1
                          ? 1
                          : segment >= 1
                            ? smoothstep(arrive)
                            : 1

                    const stackSpread =
                      j === segment ? 0 : j < segment - 1 ? 1 : segment >= 1 ? tiltT : 1
                    const stackY = depth * STACK_PEEK_PX * stackSpread

                    const enterOffset = isFront ? cardTravel * enterDistance : 0
                    const y = stackY + enterOffset

                    const fullRotateZ = (j % 2 === 0 ? -1 : 1) * (1.15 + depth * 0.32)
                    const fullRotateY = 3.2 + depth * 0.42
                    const rotateZ = fullRotateZ * tiltT
                    const rotateY = fullRotateY * tiltT
                    const scale = 1 - depth * 0.004 * tiltT

                    const cardOpacity = isFront ? Math.min(1, 0.5 + 0.5 * arrive) : 1

                    const tiltTransform = [
                      `rotateY(${rotateY}deg)`,
                      `rotateZ(${rotateZ}deg)`,
                      `scale(${scale})`,
                    ].join(" ")

                    return (
                      <div
                        key={project.id}
                        className="absolute left-0 right-0 top-0 will-change-transform"
                        style={{
                          zIndex: j + 1,
                          transform: `translateY(${y}px)`,
                          transformOrigin: "50% 0%",
                          transformStyle: "preserve-3d",
                          opacity: cardOpacity,
                        }}
                      >
                        <div
                          className="will-change-transform"
                          style={{
                            transform: tiltTransform,
                            transformOrigin: "50% 0%",
                            transformStyle: "preserve-3d",
                          }}
                        >
                          <ProjectStackCard project={project} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProjectTextBlock({ project }: { project: Project }) {
  return (
    <>
      <h3 className="text-balance text-3xl font-semibold tracking-tight text-white lg:text-4xl xl:text-[2.5rem] lg:leading-tight">
        {project.title}
      </h3>
      <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground lg:max-w-2xl lg:text-lg">
        {project.description}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {project.technologies.map((tech) => (
          <Badge
            key={tech}
            variant="secondary"
            className="border-0 bg-primary/10 text-primary hover:bg-primary/20"
          >
            {tech}
          </Badge>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4">
        {project.githubUrl ? (
          <a
            href={project.githubUrl}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`${project.title} on GitHub`}
          >
            <Github className="h-5 w-5" />
          </a>
        ) : null}
        {project.liveUrl ? (
          <a
            href={project.liveUrl}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`${project.title} live demo`}
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        ) : null}
      </div>
    </>
  )
}

function ProjectStackCard({ project }: { project: Project }) {
  const useCoverPhoto = /\.(png|jpe?g|webp|gif)$/i.test(project.image)

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl shadow-black/25">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-secondary to-muted lg:h-56">
        {useCoverPhoto ? (
          <>
            <Image
              src={project.image}
              alt={`${project.title} preview`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 92vw, min(42rem, 40vw)"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent"
              aria-hidden
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 lg:h-[5rem] lg:w-[5rem]">
              <span className="text-3xl font-bold text-primary lg:text-4xl">
                {project.title.charAt(0)}
              </span>
            </div>
          </div>
        )}
        {project.featured ? (
          <div className="absolute left-4 top-4 z-10">
            <Badge className="bg-primary font-medium text-primary-foreground">Featured</Badge>
          </div>
        ) : null}
      </div>
      <div className="space-y-3 p-5 lg:space-y-3 lg:p-6">
        <h4 className="text-lg font-semibold leading-snug text-foreground lg:text-xl">
          {project.title}
        </h4>
        <p className="line-clamp-5 text-sm leading-relaxed text-muted-foreground lg:line-clamp-6 lg:text-base">
          {project.description}
        </p>
      </div>
    </div>
  )
}
