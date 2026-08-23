"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { Reveal } from "@/components/primitives/reveal"
import { practices, nodes, tiers } from "@/data/infrastructure"
import { sections } from "@/data/site"
import { cn } from "@/lib/utils"
import { handover, setCoreProgress } from "@/lib/core-flight"

/**
 * Inside the core.
 *
 * Three viewport-heights of approach, a long middle spent inside, and two more
 * of retreat. The height is the feature: the scene's whole job is to make
 * scrolling feel like travel, and travel needs distance. A shorter section
 * turns the flight into a cut.
 *
 * The scene is sticky and viewport-height, so it holds still while the copy
 * moves past it. Everything is driven by one scroll value — there is no
 * timeline, no autoplay and nothing that runs on its own, so scrubbing
 * backwards is simply the same journey in reverse.
 *
 * The section deliberately has no `overflow-hidden`: that would make it a
 * scroll container, and a sticky child inside a non-scrollable scroll container
 * never sticks — it silently falls back to its static position, which puts the
 * core at the top of the frame instead of centred.
 */
const meta = sections.find((s) => s.id === "core")!

export function Core() {
  const sectionRef = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const [active, setActive] = useState(0)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  // Tell the page companion where in the flight we are. Module-level rather
  // than context: it is read inside useFrame, sixty times a second.
  //
  // Disengaging is done here, with an observer, and not from the scroll
  // handler below. `useScroll` only emits when its value *changes*, so once the
  // section is fully scrolled past, progress sits at 1 and never fires again —
  // which left the flight permanently engaged and pinned the ball to the middle
  // of the screen for the rest of the page. The footer never got its dome back.
  useEffect(() => {
    setCoreProgress(-1)
    const el = sectionRef.current
    if (!el) return () => setCoreProgress(-1)
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) setCoreProgress(-1)
      },
      { threshold: 0 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      setCoreProgress(-1)
    }
  }, [])

  useEffect(
    () =>
      scrollYProgress.on("change", (v) => {
        // `useScroll` clamps to 0 both *before* the section and *at* its start,
        // so the value alone cannot say whether the flight is engaged — taken
        // at face value it pins the companion to the middle of the screen for
        // the entire page above this one. The section's own rect settles it.
        const rect = sectionRef.current?.getBoundingClientRect()
        const engaged =
          !!rect && rect.top < window.innerHeight && rect.bottom > 0
        setCoreProgress(engaged ? v : -1)
        // The scene reads this every frame. Routing it through React state
        // would re-render the section sixty times a second to move one number.
        progress.current = v
        // Practices are paced to the interior stretch only, so none of them go
        // past while the camera is still outside the shell.
        const t = (v - 0.34) / 0.34
        setActive((prev) => {
          const next = Math.min(
            practices.length - 1,
            Math.max(0, Math.floor(t * practices.length)),
          )
          return next === prev ? prev : next
        })
      }),
    [scrollYProgress],
  )

  // The scene's own opacity IS the handover. At the section's edges it is zero,
  // so the only ball on screen is the page companion; it comes up over a very
  // short window during which both are the same size in the same place, and
  // goes back down symmetrically on the way out. Two balls are never both
  // visible — which is what made the old version read as one object vanishing
  // and a different one arriving.
  const sceneOpacity = useTransform(scrollYProgress, (v) => handover(v))

  // Copy is only present while the camera is inside. Outside it, the frame
  // belongs to the object being approached.
  const copyOpacity = useTransform(scrollYProgress, [0.24, 0.34, 0.7, 0.78], [0, 1, 1, 0])
  const introOpacity = useTransform(scrollYProgress, [0, 0.08, 0.22, 0.3], [0, 1, 1, 0])
  const outroOpacity = useTransform(scrollYProgress, [0.8, 0.88, 1], [0, 1, 0.7])

  return (
    <section ref={sectionRef} id="core" className="relative z-10 md:h-[520vh]">
      {/* Desktop: five viewports of pinned flight. Hidden entirely on phones,
          where there is no WebGL to fly through — see useGLTier. */}
      <div className="pointer-events-none sticky top-0 hidden h-screen w-full overflow-hidden md:block">
        {/* No canvas here. The scroll companion — the ball that has been with
            you since the hero — is the only WebGL object on the page, and it
            renders its own interior once the camera is inside it. This section
            just tells it how far through the flight we are, and supplies the
            words. */}

        {/* Vignette, so the graph never touches the section edges. Fades in
            with the flight, so it does not darken the page above. */}
        <motion.div
          style={{ opacity: sceneOpacity }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--color-ink)_92%)]"
          aria-hidden
        />

        {/* --- Approach ----------------------------------------------------- */}
        <motion.div
          style={{ opacity: introOpacity }}
          className="absolute inset-x-0 bottom-[12vh] px-[var(--spacing-gutter)]"
        >
          <div className="container-grid">
            <p className="label text-acid">
              {meta.index} · {meta.label}
            </p>
            <h2 className="display text-d2 text-paper mt-4 max-w-[16ch]">
              What it all runs on
            </h2>
            <p className="text-subtle mt-4 max-w-[42ch] text-sm">
              Keep scrolling — the rest of this is inside.
            </p>
          </div>
        </motion.div>

        {/* --- Interior ----------------------------------------------------- */}
        <motion.div
          style={{ opacity: copyOpacity }}
          className="absolute inset-0 px-[var(--spacing-gutter)]"
        >
          {/* One scrim, on the side the copy is on. The graph is a light source
              and body text cannot win against one — but darkening both sides
              boxed the network into a letterbox, so only the reading side is
              protected and the rest of the frame stays open. */}
          <div
            className="absolute inset-y-0 right-0 w-[52%] bg-[linear-gradient(to_left,var(--color-ink)_40%,transparent)]"
            aria-hidden
          />

          {/* Above the scrim: it is absolutely positioned, so without a
              stacking context of its own the copy paints underneath it. */}
          <div className="container-grid relative z-10 flex h-full items-center">
            <div className="w-full">
              {/* One practice at a time. The previous version put a
                  seven-item legend on the left as well, which meant two
                  columns of body copy competing with each other and with the
                  graph — three things in the frame, none of them able to
                  breathe. The tiers are named on the nodes themselves. */}
              {/* `relative` is load-bearing. The inactive practices are
                  positioned `absolute inset-x-0` so they can crossfade in
                  place, and without a positioned ancestor here that resolved
                  against the sticky container instead — so every outgoing
                  practice was laid out full-width from the left gutter and
                  flashed on the left of the screen each time the copy changed. */}
              <div className="relative md:col-span-5 md:ml-auto md:w-[46%]">
                <p className="label text-acid">{practices[active]?.index}</p>
                {practices.map((practice, i) => (
                  <motion.div
                    key={practice.id}
                    initial={false}
                    animate={{ opacity: i === active ? 1 : 0, y: i === active ? 0 : 12 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className={i === active ? "relative" : "pointer-events-none absolute inset-x-0"}
                    aria-hidden={i !== active}
                  >
                    <h3 className="display text-d4 text-paper mt-3 max-w-[18ch]">
                      {practice.title}
                    </h3>
                    <p className="text-grey-100 mt-5 max-w-[44ch] leading-[1.7]">
                      {practice.body}
                    </p>
                  </motion.div>
                ))}

                {/* Where you are in the list, without spelling it out. */}
                <ul className="mt-10 flex gap-2" aria-hidden>
                  {practices.map((practice, i) => (
                    <li
                      key={practice.id}
                      className={cn(
                        "h-px w-8 transition-colors duration-500",
                        i === active ? "bg-acid" : "bg-line-strong",
                      )}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tier vocabulary, as one quiet row rather than a column of
            paragraphs. It is orientation, not reading matter. */}
        <motion.ul
          style={{ opacity: copyOpacity }}
          className="absolute inset-x-0 bottom-8 flex flex-wrap gap-x-6 gap-y-2 px-[var(--spacing-gutter)]"
          aria-hidden
        >
          {tiers.map((tier) => (
            <li key={tier.id} className="label text-subtle text-[0.6rem]">
              {tier.label}
            </li>
          ))}
        </motion.ul>

        {/* --- Retreat ------------------------------------------------------ */}
        <motion.div
          style={{ opacity: outroOpacity }}
          className="absolute inset-x-0 bottom-[12vh] px-[var(--spacing-gutter)]"
        >
          <div className="container-grid">
            <p className="text-subtle max-w-[40ch] text-sm">
              {nodes.length} services, {tiers.length} tiers, one core. Full diagrams
              and configs on request.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Phones, and screen readers everywhere, get the same thing: the section
          as plain prose in normal document flow. On desktop this is the
          accessible equivalent of a layer that is positioned, animated and
          mostly hidden at any given scroll offset; on a phone it is simply the
          section. One tree, so the two can never say different things. */}
      <div className="container-grid py-[var(--spacing-section)] md:sr-only md:py-0">
        <p className="label text-acid">
          {meta.index} · {meta.label}
        </p>
        <h2 className="display text-d2 text-paper mt-4 max-w-[14ch]">
          What it all runs on
        </h2>
        <p className="text-lead text-grey-100 mt-6 max-w-[46ch]">
          The layer underneath the product decisions — the part that has to stay
          up while those decisions get made.
        </p>

        <ol className="mt-14">
          {practices.map((practice) => (
            <li key={practice.id} className="border-t border-line py-8 last:border-b">
              <p className="label text-subtle">{practice.index}</p>
              <h3 className="display text-d4 text-paper mt-3">{practice.title}</h3>
              <p className="text-grey-100 mt-4 max-w-[52ch] leading-relaxed">
                {practice.body}
              </p>
            </li>
          ))}
        </ol>

        <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2">
          {tiers.map((tier) => (
            <li key={tier.id} className="label text-subtle text-[0.6rem]">
              {tier.label}
            </li>
          ))}
        </ul>
        <p className="text-subtle mt-8 max-w-[42ch] text-sm">
          {nodes.length} services, {tiers.length} tiers, one core. Full diagrams
          and configs on request.
        </p>
      </div>
    </section>
  )
}
