"use client"

import { SplitText } from "@/components/primitives/split-text"
import { Reveal } from "@/components/primitives/reveal"
import { cn } from "@/lib/utils"

/**
 * The editorial section header used by every section: hairline rule, a
 * monospace index/label row beneath it, then the display heading.
 *
 * Keeping this in one place is what makes the page feel like a designed
 * system rather than six sections that happen to share a font.
 */
export function SectionHeader({
  index,
  label,
  title,
  aside,
  className,
}: {
  index: string
  label: string
  title: string
  /** Optional right-hand copy — a thesis line or count. */
  aside?: string
  className?: string
}) {
  return (
    <header className={cn("w-full", className)}>
      <Reveal y={0}>
        <div className="rule" />
      </Reveal>

      <div className="flex items-baseline justify-between gap-6 pt-4">
        <div className="label text-subtle flex items-baseline gap-3">
          <span className="text-acid">{index}</span>
          <span>{label}</span>
        </div>
        {aside ? (
          <span className="label text-subtle hidden text-right sm:block">{aside}</span>
        ) : null}
      </div>

      <SplitText
        as="h2"
        className="display text-d2 mt-8 max-w-[18ch] text-balance md:mt-12"
        stagger={0.035}
      >
        {title}
      </SplitText>
    </header>
  )
}
