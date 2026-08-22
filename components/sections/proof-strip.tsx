"use client"

import { Marquee } from "@/components/primitives/marquee"
import { RevealGroup, RevealItem } from "@/components/primitives/reveal"
import { profile } from "@/data/profile"
import { integrations } from "@/data/capabilities"

/**
 * The band between the hero and the first real section.
 *
 * Two jobs: give the eye somewhere to land after the hero, and front-load the
 * four numbers that establish scope before anyone has read a paragraph. The
 * marquee underneath is breadth — the point is the length of the list, not any
 * individual item, which is why it moves instead of sitting in a grid.
 */
export function ProofStrip() {
  return (
    <section
      id="proof"
      className="relative z-10 border-y border-line bg-ink"
    >
      {/* ---- Numbers ---------------------------------------------------- */}
      <div className="container-grid">
        <RevealGroup className="grid grid-cols-2 divide-x divide-y divide-line md:grid-cols-4 md:divide-y-0">
          {profile.proof.map((item) => (
            <RevealItem
              key={item.label}
              className="flex flex-col gap-2 px-4 py-8 first:pl-0 md:px-8 md:py-12"
            >
              <span className="display text-d4 text-acid leading-none">{item.value}</span>
              <span className="label text-subtle max-w-[18ch]">{item.label}</span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      {/* ---- Integration marquee ---------------------------------------- */}
      <div className="border-t border-line py-5">
        <Marquee duration={52} pauseOnHover>
          {integrations.map((name) => (
            <span key={name} className="flex items-center">
              <span className="label text-subtle px-6 whitespace-nowrap">{name}</span>
              <span className="size-1 rounded-full bg-acid/50" aria-hidden />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
