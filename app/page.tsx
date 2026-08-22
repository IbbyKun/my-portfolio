import { Hero } from "@/components/sections/hero"
import { ProofStrip } from "@/components/sections/proof-strip"
import { Approach } from "@/components/sections/approach"
import { Work } from "@/components/sections/work"
import { TrackRecord } from "@/components/sections/track-record"
import { Capabilities } from "@/components/sections/capabilities"
import { Contact } from "@/components/sections/contact"
import { Footer } from "@/components/sections/footer"

/**
 * Reading order is deliberate:
 *
 *   Hero        — who, and at what level
 *   Proof       — the numbers, before any prose
 *   Approach    — how decisions get made          (the staff-level argument)
 *   Work        — what that produced              (the evidence)
 *   Track record— where the scope came from       (the history)
 *   Capabilities— the toolkit, as supporting detail
 *   Contact     — the ask
 *
 * Claims first, evidence second, tools last. The previous site led with tools.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ProofStrip />
      <Approach />
      <Work />
      <TrackRecord />
      <Capabilities />
      <Contact />
      <Footer />
    </>
  )
}
