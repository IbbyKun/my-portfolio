"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { SectionHeader } from "@/components/primitives/section-header"
import { Reveal } from "@/components/primitives/reveal"
import { experiences } from "@/data/experience"
import { sections } from "@/data/site"
import { cn } from "@/lib/utils"

const meta = sections.find((s) => s.id === "track-record")!

/**
 * Track record.
 *
 * A timeline where each role states its *scope* before its story — the fastest
 * way for someone senior reading this to work out what level I have operated
 * at. The current role starts expanded; the rest open on click, so the section
 * is scannable in five seconds and readable in five minutes.
 */
export function TrackRecord() {
  // Current role open by default — it is the one that answers "what now?".
  const [open, setOpen] = useState<string | null>(
    experiences.find((e) => e.current)?.id ?? experiences[0]?.id ?? null,
  )

  return (
    <section
      id={meta.id}
      className="relative z-10 scroll-mt-24 py-[var(--spacing-section)]"
    >
      <div className="container-grid">
        <SectionHeader
          index={meta.index}
          label={meta.label}
          title="Where the scope came from"
          aside="2022 — Present"
        />

        <ol className="mt-16 md:mt-24">
          {experiences.map((role, i) => {
            const isOpen = open === role.id
            const panelId = `role-panel-${role.id}`

            return (
              <li key={role.id} className="border-t border-line last:border-b">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : role.id)}
                  data-cursor
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="group grid w-full grid-cols-12 items-start gap-x-4 gap-y-2 py-8 text-left md:gap-x-8 md:py-10"
                >
                  {/* Period */}
                  <div className="col-span-12 flex items-center gap-3 md:col-span-3">
                    <span className="label text-subtle">{role.period}</span>
                    {role.current ? (
                      <span className="relative flex size-1.5" aria-label="Current role">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-acid opacity-60" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-acid" />
                      </span>
                    ) : null}
                  </div>

                  {/* Title + company + scope */}
                  <div className="col-span-11 md:col-span-8">
                    <h3
                      className={cn(
                        "display text-d4 transition-colors duration-500",
                        isOpen ? "text-acid" : "text-paper group-hover:text-acid",
                      )}
                    >
                      {role.company}
                    </h3>
                    <p className="text-grey-100 mt-2 text-base">{role.title}</p>
                    <p className="text-subtle mt-1 text-sm italic">{role.scope}</p>
                  </div>

                  <span
                    className={cn(
                      "col-span-1 flex justify-end text-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      isOpen ? "rotate-45 text-acid" : "text-subtle group-hover:rotate-90",
                    )}
                    aria-hidden
                  >
                    +
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      id={panelId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.3 },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-8 pb-14 md:grid-cols-12 md:gap-8">
                        <div className="md:col-span-8 md:col-start-4">
                          <div className="space-y-5">
                            {role.body.map((paragraph, j) => (
                              <p
                                key={j}
                                className="text-grey-200 max-w-[62ch] leading-relaxed"
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>

                          {/* Highlights */}
                          <ul className="mt-8 space-y-3">
                            {role.highlights.map((highlight) => (
                              <li
                                key={highlight}
                                className="text-grey-100 flex gap-3 text-sm leading-relaxed"
                              >
                                <span className="text-acid mt-[0.35em] shrink-0" aria-hidden>
                                  —
                                </span>
                                <span className="max-w-[58ch]">{highlight}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Stack */}
                          <ul className="mt-8 flex flex-wrap gap-2">
                            {role.stack.map((tech) => (
                              <li
                                key={tech}
                                className="label text-muted rounded-sm border border-line px-3 py-1.5"
                              >
                                {tech}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            )
          })}
        </ol>

        <Reveal delay={0.1} className="mt-12">
          <p className="label text-subtle">
            Full history and references available on request
          </p>
        </Reveal>
      </div>
    </section>
  )
}
