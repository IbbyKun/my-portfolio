/**
 * Film grain overlay.
 *
 * An inline SVG fractal-noise tile as a data URI — no network request, no
 * binary asset, and it scales to any DPR. The CSS in globals.css jitters it
 * in eight steps so it reads as grain rather than as a dirty screen.
 *
 * This is a server component: the markup never changes, so there is no reason
 * to ship it to the client.
 */

const NOISE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="220" height="220" filter="url(#n)"/></svg>`

const NOISE_URL = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`

export function Grain() {
  return (
    <div
      className="grain"
      aria-hidden
      style={{ ["--grain-src" as string]: NOISE_URL }}
    />
  )
}
