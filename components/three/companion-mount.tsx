"use client"

import dynamic from "next/dynamic"

/**
 * Client boundary for the scroll companion.
 *
 * `next/dynamic` with `ssr: false` cannot be called from a server component,
 * and the root layout is one — so the dynamic import lives here. Same reason
 * as the other three canvases: it renders nothing during SSR, so shipping
 * three.js in the initial chunk for it would be pure cost.
 */
const ScrollCompanion = dynamic(
  () => import("@/components/three/scroll-companion").then((m) => m.ScrollCompanion),
  { ssr: false },
)

export function CompanionMount() {
  return <ScrollCompanion />
}
