"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { SectionHeader } from "@/components/primitives/section-header"
import { capabilities } from "@/data/capabilities"
import { setCompanionFocus } from "@/lib/companion-signal"
import { sections } from "@/data/site"
import { cn } from "@/lib/utils"

const meta = sections.find((s) => s.id === "capabilities")!

/**
 * Capabilities.
 *
 * Five domains, each led by a thesis rather than a tag cloud. Tools appear as
 * supporting evidence — five per domain by default, with the long tail behind
 * a disclosure so the section stays a page rather than a spreadsheet.
 *
 * The right column is not a canvas of its own — it is a docking slot. The
 * page-wide scroll companion settles into `#companion-dock` while this section
 * is on screen, and its surface tightens as you move down the domain list. One
 * object for the whole page reads as a companion; one per section reads as
 * repetition.
 */
export function Capabilities() {
  const [activeIndex, setActiveIndex] = useState(-1)

  // Drives the caption locally and the companion's shader globally.
  const focus = (index: number) => {
    setActiveIndex(index)
    setCompanionFocus(index)
  }
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <section
      id={meta.id}
      className="relative z-10 scroll-mt-24 py-[var(--spacing-section)]"
    >
      <div className="container-grid">
        <SectionHeader
          index={meta.index}
          label={meta.label}
          title="What I bring to a system"
          aside={`${capabilities.length} domains`}
        />

        <div className="mt-16 grid gap-16 md:mt-24 md:grid-cols-12 md:gap-8">
          {/* ---- Domain list ---------------------------------------------- */}
          <div
            className="md:col-span-7"
            onPointerLeave={() => focus(-1)}
          >
            <ol>
              {capabilities.map((domain, i) => {
                const isOpen = expanded === domain.id
                const panelId = `capability-panel-${domain.id}`

                return (
                  <li key={domain.id} className="border-t border-line last:border-b">
                    <div
                      onPointerEnter={() => focus(i)}
                      onFocus={() => focus(i)}
                    >
                      <div className="grid grid-cols-12 items-baseline gap-x-4 pt-8 md:gap-x-6">
                        <span className="label text-acid col-span-2 md:col-span-1">
                          {domain.index}
                        </span>
                        <h3 className="display text-d4 col-span-10 md:col-span-11">
                          {domain.name}
                        </h3>
                      </div>

                      <div className="grid grid-cols-12 gap-x-4 pb-8 md:gap-x-6">
                        <div className="col-span-12 md:col-span-11 md:col-start-2">
                          <p className="text-grey-200 mt-4 max-w-[54ch] leading-relaxed">
                            {domain.thesis}
                          </p>

                          {/* Core tools — always visible */}
                          <ul className="mt-6 flex flex-wrap gap-2">
                            {domain.core.map((tool) => (
                              <li
                                key={tool}
                                className="label text-paper rounded-sm border border-line-strong px-3 py-1.5"
                              >
                                {tool}
                              </li>
                            ))}
                          </ul>

                          {/* Extended tools — behind a disclosure */}
                          <AnimatePresence initial={false}>
                            {isOpen ? (
                              <motion.div
                                id={panelId}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  height: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                                  opacity: { duration: 0.3 },
                                }}
                                className="overflow-hidden"
                              >
                                <ul className="flex flex-wrap gap-2 pt-2">
                                  {domain.extended.map((tool) => (
                                    <li
                                      key={tool}
                                      className="label text-subtle rounded-sm border border-line px-3 py-1.5"
                                    >
                                      {tool}
                                    </li>
                                  ))}
                                </ul>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>

                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : domain.id)}
                            data-cursor
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            className={cn(
                              "label mt-5 flex items-center gap-2 transition-colors",
                              isOpen ? "text-acid" : "text-subtle hover:text-paper",
                            )}
                          >
                            {isOpen ? "Show less" : `+${domain.extended.length} more`}
                            <span
                              className={cn(
                                "transition-transform duration-400",
                                isOpen && "rotate-180",
                              )}
                              aria-hidden
                            >
                              ↓
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* ---- Ambient object -------------------------------------------- */}
          {/* Desktop only. On mobile the grid collapses to one column, so this
              would be ~450px of empty square plus a caption inviting a hover
              that a touch device cannot perform. The companion keeps its
              ambient pass behind the copy there instead. */}
          <div className="hidden md:col-span-4 md:col-start-9 md:block">
            <div className="md:sticky md:top-32">
              {/* Docking slot for the scroll companion — intentionally
                  empty. The companion measures this element and settles into
                  it while the section is in view. */}
              <div id="companion-dock" className="relative aspect-square w-full" />

              <div className="mt-6">
                <div className="rule mb-4" />
                <p className="label text-subtle">
                  {activeIndex >= 0
                    ? capabilities[activeIndex].name
                    : "Hover a domain"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
