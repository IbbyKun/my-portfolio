"use client"

import { useEffect, useRef, useState } from "react"
import { skillCategories, stats } from "@/data/skills"

export interface SkillsSectionProps {
  parallaxFlat?: boolean
  /** When flat, still zoom out slightly as the next section (e.g. Contact) slides over */
  parallaxScaleWithNext?: boolean
  /** Driven by ParallaxContainer when parallaxScaleWithNext — scale inner column only so bg stays full-bleed */
  parallaxContentScale?: number
}

export function SkillsSection({
  parallaxContentScale = 1,
  ..._props
}: SkillsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="skills"
      className="sticky bottom-0 isolate z-0 scroll-mt-0 bg-background py-20 lg:py-28 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-transparent" />
      <div
        className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[min(520px,55vh)] w-[min(520px,70vw)] rounded-full bg-primary/[0.06] blur-3xl"
        aria-hidden
      />

      <div
        className="relative mx-auto w-full max-w-6xl origin-top px-6"
        style={
          parallaxContentScale < 1
            ? {
                transform: `scale(${parallaxContentScale})`,
                willChange: "transform",
              }
            : undefined
        }
      >
        <h2 className="mb-10 text-sm font-medium uppercase tracking-widest text-primary lg:mb-12">
          Skills & Technologies
        </h2>

        <div className="mb-14 border-b border-border pb-14 lg:mb-16 lg:pb-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-10">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`text-left transition-all duration-700 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="mb-2 text-4xl font-bold text-primary lg:text-5xl">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-3 xl:gap-x-10 xl:gap-y-12">
          {skillCategories.map((category, categoryIndex) => (
            <div
              key={category.id}
              className={`space-y-4 transition-all duration-700 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
              style={{ transitionDelay: `${120 + categoryIndex * 60}ms` }}
            >
              <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill, skillIndex) => (
                  <span
                    key={skill}
                    className={`cursor-default rounded-md bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition-all duration-500 hover:bg-primary/10 hover:text-primary ${
                      isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
                    }`}
                    style={{
                      transitionDelay: `${120 + categoryIndex * 60 + skillIndex * 25}ms`,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
