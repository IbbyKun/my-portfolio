"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import dynamic from "next/dynamic"
import { SectionHeader } from "@/components/primitives/section-header"
import { useHasHover } from "@/hooks/use-media-query"
import { useGLTier } from "@/hooks/use-gl-tier"
import { projects, type Project } from "@/data/projects"
import { sections } from "@/data/site"
import { cn } from "@/lib/utils"

const meta = sections.find((s) => s.id === "work")!

// Hover-only and desktop-only; there is no reason for it to be in the initial
// bundle. See the note in hero.tsx.
const WorkPreview = dynamic(
  () => import("@/components/three/work-preview").then((m) => m.WorkPreview),
  { ssr: false },
)

/**
 * Work.
 *
 * An editorial list rather than a card grid. Rows are quiet until you touch
 * them: hovering lifts the title and floats a WebGL preview of the project
 * under the cursor; clicking expands the row in place into a full case study.
 *
 * Expanding in place matters — a portfolio that navigates away to read one
 * project loses the comparison between them, and the comparison is the point.
 */
export function Work() {
  const listRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<Project | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const hasHover = useHasHover()
  const tier = useGLTier()
  const reduceMotion = useReducedMotion()

  // The floating preview needs a pointer and a GPU, and it must not fight an
  // open case study for attention.
  const previewEnabled = hasHover && tier.enabled && !reduceMotion
  const previewUrl =
    previewEnabled && hovered && !expanded && hovered.image !== "/placeholder.svg"
      ? hovered.image
      : null

  return (
    <section
      id={meta.id}
      className="relative z-10 scroll-mt-24 py-[var(--spacing-section)]"
    >
      <div className="container-grid">
        <SectionHeader
          index={meta.index}
          label={meta.label}
          title="Systems I have shipped"
          aside={`${projects.length} selected`}
        />
      </div>

      <div ref={listRef} className="relative mt-16 md:mt-24">
        {/* The preview canvas spans the whole list and is never interactive —
            pointer events belong to the rows underneath it. */}
        {previewEnabled ? (
          <WorkPreview
            activeUrl={previewUrl}
            eventSource={listRef}
            className="pointer-events-none absolute inset-0 z-20 hidden md:block"
          />
        ) : null}

        <ul
          className="container-grid relative z-10"
          onPointerLeave={() => setHovered(null)}
        >
          {projects.map((project, i) => (
            <WorkRow
              key={project.id}
              project={project}
              index={i}
              isExpanded={expanded === project.id}
              isDimmed={hovered !== null && hovered.id !== project.id && !expanded}
              onHover={() => setHovered(project)}
              onToggle={() =>
                setExpanded((current) => (current === project.id ? null : project.id))
              }
            />
          ))}
        </ul>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

function WorkRow({
  project,
  index,
  isExpanded,
  isDimmed,
  onHover,
  onToggle,
}: {
  project: Project
  index: number
  isExpanded: boolean
  isDimmed: boolean
  onHover: () => void
  onToggle: () => void
}) {
  const panelId = `work-panel-${project.id}`

  return (
    <li
      className="border-t border-line last:border-b"
      onPointerEnter={onHover}
      onFocus={onHover}
    >
      {/* ---- Row trigger --------------------------------------------------- */}
      <button
        type="button"
        onClick={onToggle}
        data-cursor
        data-cursor-label={isExpanded ? "CLOSE" : "OPEN"}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className={cn(
          "group grid w-full grid-cols-12 items-baseline gap-x-4 gap-y-3 py-8 text-left transition-opacity duration-500 md:gap-x-8 md:py-10",
          isDimmed ? "opacity-35" : "opacity-100",
        )}
      >
        <span className="label text-subtle col-span-2 md:col-span-1">
          {String(index + 1).padStart(2, "0")}
        </span>

        <span className="col-span-10 md:col-span-5">
          <span
            className={cn(
              "display text-d3 block transition-[transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
              "group-hover:translate-x-2 group-hover:text-acid group-focus-visible:translate-x-2 group-focus-visible:text-acid",
              isExpanded && "text-acid",
            )}
          >
            {project.title}
          </span>
        </span>

        <span className="label text-subtle col-span-8 md:col-span-3">
          {project.category}
        </span>

        <span className="label text-subtle col-span-4 hidden md:col-span-2 md:block">
          {project.year}
        </span>

        <span
          className={cn(
            // col-span-4 on mobile so the toggle lands hard right on the
            // second row; a single column at md, where it sits on row one.
            "col-span-4 flex justify-end text-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:col-span-1",
            isExpanded ? "rotate-45 text-acid" : "text-subtle group-hover:rotate-90",
          )}
          aria-hidden
        >
          +
        </span>
      </button>

      {/* ---- Expanded case study -------------------------------------------- */}
      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            id={panelId}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.35 },
            }}
            className="overflow-hidden"
          >
            <div className="grid gap-10 pt-2 pb-16 md:grid-cols-12 md:gap-8">
              {/* Screenshot */}
              <div className="md:col-span-5">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-line bg-ink-raised">
                  <Image
                    src={project.image}
                    alt={`${project.title} interface`}
                    fill
                    sizes="(max-width: 768px) 100vw, 42vw"
                    className="object-cover object-top"
                  />
                </div>

                <p className="label text-subtle mt-4">{project.role}</p>
              </div>

              {/* Narrative */}
              <div className="md:col-span-7">
                <p className="text-lead text-paper max-w-[46ch] text-balance">
                  {project.summary}
                </p>

                <div className="mt-8 space-y-5">
                  {project.body.map((paragraph, i) => (
                    <p key={i} className="text-grey-200 max-w-[62ch] leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Impact */}
                <dl className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
                  {project.impact.map((item) => (
                    <div key={item.label} className="bg-ink p-5">
                      <dt className="display text-acid text-lg leading-tight">
                        {item.value}
                      </dt>
                      <dd className="label text-subtle mt-2 leading-relaxed normal-case">
                        {item.label}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* Stack */}
                <ul className="mt-8 flex flex-wrap gap-2">
                  {project.stack.map((tech) => (
                    <li
                      key={tech}
                      className="label text-muted rounded-sm border border-line px-3 py-1.5"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>

                {(project.liveUrl || project.githubUrl) && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    {project.liveUrl ? (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor
                        className="label rounded-md bg-acid px-5 py-3 text-ink"
                      >
                        Visit site ↗
                      </a>
                    ) : null}
                    {project.githubUrl ? (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor
                        className="label rounded-md border border-line-strong px-5 py-3 text-paper transition-colors hover:border-acid hover:text-acid"
                      >
                        Source ↗
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  )
}
