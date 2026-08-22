"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react"
import { navSections, sections } from "@/data/site"
import { contactHrefs } from "@/lib/contact-hrefs"
import { profile } from "@/data/profile"
import { useScrollToSection } from "@/components/chrome/smooth-scroll"
import { Magnetic } from "@/components/primitives/magnetic"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

/**
 * Floating navigation.
 *
 * Three behaviours, all driven off scroll position:
 *
 *  1. **Morph** — over the hero it is wide and transparent, so it reads as
 *     part of the page. Past the hero it contracts into a blurred pill that
 *     floats over the content.
 *  2. **Auto-hide** — scrolling down past the fold retracts it; scrolling up
 *     brings it straight back. Reading is uninterrupted, navigation is one
 *     gesture away.
 *  3. **Scroll spy** — the active section gets an acid pill that slides
 *     between items via a shared `layoutId`.
 *
 * On mobile it collapses to a wordmark + menu pill that opens a full-screen
 * overlay, because six labels do not fit in a pill at 375px.
 */

/** Horizontal padding of the contracted bar, in px. */
const PILL_PADDING = 10
/** Every control in the bar is this tall, so they share one centre line. */
const CONTROL_H = "h-9"
/** Width cap in the expanded state — matches the page container. */
const EXPANDED_MAX = 1536


export function FloatingNav() {
  const { scrollY } = useScroll()
  const scrollTo = useScrollToSection()

  const navRef = useRef<HTMLElement>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const [condensed, setCondensed] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [active, setActive] = useState<string>(sections[0].id)
  const [menuOpen, setMenuOpen] = useState(false)
  /** Natural width of the nav's contents, measured. See the effect below. */
  const [pillWidth, setPillWidth] = useState<number | null>(null)

  // --- Measure the contracted pill --------------------------------------
  // The contracted width used to be a hardcoded 780px. The contents actually
  // need ~896px, and every child is `shrink-0`, so the CTA simply spilled out
  // past the rounded border. Measuring means the pill always fits its own
  // contents — including after a font swap or a label change.
  useEffect(() => {
    const el = navRef.current
    if (!el) return

    const measure = () => {
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0
      // Children are laid out with `justify-between`, so the nav's own width
      // tells us nothing about its intrinsic size — sum the children instead.
      // offsetWidth of 0 means `hidden` at this breakpoint; skip those.
      const kids = (Array.from(el.children) as HTMLElement[]).filter(
        (k) => k.offsetWidth > 0,
      )
      if (kids.length === 0) return

      const content =
        kids.reduce((sum, k) => sum + k.getBoundingClientRect().width, 0) +
        gap * (kids.length - 1) +
        PILL_PADDING * 2 +
        2 // borders

      setPillWidth((prev) =>
        prev !== null && Math.abs(prev - content) < 1 ? prev : Math.ceil(content),
      )
    }

    measure()
    // Children are shrink-0, so their widths do not change when the pill
    // resizes — observing them cannot feed back into itself.
    const observer = new ResizeObserver(measure)
    Array.from(el.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [])

  // --- Morph + auto-hide -------------------------------------------------
  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0
    const delta = current - previous

    setCondensed(current > 80)

    // Scroll spy. This used to be an IntersectionObserver that sorted the
    // intersecting entries by `top` and took the first. Two sections can be in
    // the band at once, and ascending order picks the one *leaving* it — so a
    // large jump could latch onto the previous section and, because nothing
    // crossed the band afterwards, no further callback ever arrived to correct
    // it. Reading the answer straight off scroll position cannot get stuck:
    // the active section is simply the last one whose top has passed the band.
    const list = offsets.current
    if (list.length > 0) {
      const line = current + window.innerHeight * 0.25
      let next = list[0].id
      for (const s of list) {
        if (s.top <= line) next = s.id
      }
      setActive((prev) => (prev === next ? prev : next))
    }

    // Never hide while the overlay is open, and never near the very top.
    if (menuOpen || current < 240) {
      setHidden(false)
      return
    }
    if (Math.abs(delta) < 4) return
    setHidden(delta > 0)
  })

  // --- Scroll spy --------------------------------------------------------
  // Document-space top of every section, refreshed only when the layout can
  // actually change. Keeping these cached means the spy costs one comparison
  // per scroll event instead of a layout read per section per frame.
  const offsets = useRef<{ id: string; top: number }[]>([])

  useEffect(() => {
    const measure = () => {
      offsets.current = sections
        .map((s) => {
          const el = document.getElementById(s.id)
          if (!el) return null
          return { id: s.id, top: el.getBoundingClientRect().top + window.scrollY }
        })
        .filter((v): v is { id: string; top: number } => v !== null)
        .sort((a, b) => a.top - b.top)
    }

    measure()
    window.addEventListener("resize", measure)
    // Expanding a role or a case study moves everything below it.
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    return () => {
      window.removeEventListener("resize", measure)
      observer.disconnect()
    }
  }, [])

  // Lock the page while the overlay is open.
  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : ""
    return () => {
      document.documentElement.style.overflow = ""
    }
  }, [menuOpen])

  // Close on Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menuOpen])

  const go = (id: string) => {
    setMenuOpen(false)
    // Let the overlay begin unmounting before we take over the scroll.
    requestAnimationFrame(() => scrollTo(id))
  }

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 px-[var(--spacing-gutter)] pt-4 md:pt-6"
        animate={{ y: hidden ? "-140%" : "0%" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.nav
          ref={navRef}
          className={cn(
            "mx-auto flex items-center justify-between gap-2 rounded-xl border transition-colors duration-500",
            condensed
              // blur-md rather than blur-xl, with a denser background to make
              // up the difference: a 24px backdrop blur repainting behind a
              // scrolling page was measurably expensive for no visual gain.
              ? "border-line-strong bg-ink/85 backdrop-blur-md"
              : "border-transparent bg-transparent",
          )}
          // initial={false} skips the mount animation. Without it motion tries
          // to animate max-width from the computed "none", which it cannot
          // interpolate — that was the console warning.
          initial={false}
          animate={{
            // Only contract to a compact pill where the links are actually
            // shown; on mobile the bar stays full width so the wordmark and
            // menu button sit at opposite edges.
            maxWidth:
              condensed && isDesktop && pillWidth ? pillWidth : EXPANDED_MAX,
            paddingLeft: condensed ? PILL_PADDING : 4,
            paddingRight: condensed ? PILL_PADDING : 4,
            paddingTop: condensed ? PILL_PADDING : 4,
            paddingBottom: condensed ? PILL_PADDING : 4,
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Wordmark ---------------------------------------------------- */}
          <button
            type="button"
            onClick={() => go("index")}
            data-cursor
            className={cn("group flex shrink-0 items-center gap-2.5 rounded-md px-3", CONTROL_H)}
            aria-label="Back to top"
          >
            <span
              className="size-2 rounded-full bg-acid transition-transform duration-500 group-hover:scale-150"
              aria-hidden
            />
            <span className="display text-[0.9rem] leading-none tracking-tight">
              {profile.name.split(" ")[1]}
            </span>
            {/* Short tag, not the full title — the nav pill has no room for it. */}
            <span className="label text-subtle hidden leading-none sm:inline">
              {profile.disciplines[0]}
            </span>
          </button>

          {/* Section links (desktop) ------------------------------------- */}
          <ul className="hidden items-center gap-0.5 md:flex">
            {navSections.map((section) => {
              const isActive = active === section.id
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => go(section.id)}
                    data-cursor
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      // inline-flex + a shared height, rather than vertical
                      // padding: padding centres the *line box*, and an
                      // all-caps mono line box has descender space below the
                      // baseline that no capital ever occupies — so the text
                      // sat visibly high inside the active chip. Centring the
                      // glyph box in a fixed-height flex box fixes it.
                      // nowrap: "Track Record" wrapped once the bar contracted.
                      "label relative inline-flex items-center justify-center rounded-md px-3.5 leading-none whitespace-nowrap transition-colors duration-300",
                      CONTROL_H,
                      isActive ? "text-ink" : "text-muted hover:text-paper",
                    )}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-md bg-acid"
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      />
                    ) : null}
                    <span className="relative">{section.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* CTA + mobile toggle ----------------------------------------- */}
          <div className="flex shrink-0 items-center gap-2">
            <Magnetic className="hidden md:block" strength={0.12}>
              <a
                href={contactHrefs.email}
                data-cursor
                className={cn(
                  "group relative inline-flex items-center gap-2 overflow-hidden rounded-md border border-line-strong px-4 text-paper transition-colors duration-300 hover:border-acid",
                  CONTROL_H,
                )}
              >
                {/* Acid wipes in from the left rather than the whole button
                    swapping colour — the fill reads as a deliberate action,
                    and it keeps the straight edges legible while it happens. */}
                <span
                  className="absolute inset-0 origin-left scale-x-0 bg-acid transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                  aria-hidden
                />
                <span className="label relative leading-none transition-colors duration-300 group-hover:text-ink">
                  Get in touch
                </span>
                <span
                  className="relative leading-none transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
                  aria-hidden
                >
                  ↗
                </span>
              </a>
            </Magnetic>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              data-cursor
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className={cn(
                "label inline-flex items-center gap-2.5 rounded-md border border-line-strong px-4 leading-none md:hidden",
                CONTROL_H,
              )}
            >
              {menuOpen ? "Close" : "Menu"}
              <span className="flex flex-col gap-[3px]" aria-hidden>
                <span
                  className={cn(
                    "block h-px w-3.5 bg-current transition-transform duration-300",
                    menuOpen && "translate-y-[2px] rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "block h-px w-3.5 bg-current transition-transform duration-300",
                    menuOpen && "-translate-y-[2px] -rotate-45",
                  )}
                />
              </span>
            </button>
          </div>
        </motion.nav>
      </motion.header>

      {/* Mobile overlay -------------------------------------------------- */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col justify-between bg-ink px-[var(--spacing-gutter)] pt-28 pb-10 md:hidden"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav>
              <ul>
                {navSections.map((section, i) => (
                  <motion.li
                    key={section.id}
                    className="border-b border-line"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.06 + i * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => go(section.id)}
                      className="flex w-full items-baseline justify-between py-5 text-left"
                    >
                      <span className="display text-d4">{section.label}</span>
                      <span className="label text-subtle">{section.index}</span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <div className="rule" />
              <a
                href={contactHrefs.email}
                className="label flex items-center justify-between rounded-md bg-acid px-6 py-4 text-ink"
              >
                {profile.email}
                <span aria-hidden>↗</span>
              </a>
              <p className="label text-subtle">{profile.location}</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
