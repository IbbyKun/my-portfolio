/**
 * The one place the flight into the core is described.
 *
 * Two separate objects have to agree perfectly for the illusion to hold: the
 * page-wide scroll companion, which is an orthographic point sphere drawn in a
 * fixed box, and the core scene's shell, which is a perspective point sphere in
 * its own canvas. If their on-screen size, position or timing disagree by even
 * a little, the handover reads as one ball vanishing and a different one
 * appearing — which is exactly what it did before this module existed.
 *
 * So neither owns the numbers. Both import them from here and derive the same
 * answer from the same scroll value.
 */

/** Radius of the shell in the core scene's world units. */
export const SHELL_R = 22
/** Perspective camera field of view, degrees. */
export const FOV = 58
/** Camera distance at the two ends of the journey, and at its closest point. */
export const CAM_FAR = 82
export const CAM_NEAR = 12

/**
 * The crossover window, as a fraction of the section's scroll.
 *
 * Kept short. The companion is drawn over an opaque canvas that is itself
 * fading in, so mid-crossover both are partly transparent — brief enough and
 * the eye reads one continuous object; linger and it reads as a dissolve.
 */
export const HANDOVER_IN: [number, number] = [0.015, 0.075]
export const HANDOVER_OUT: [number, number] = [0.925, 0.985]

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** Camera distance at a given section progress. In, hold, out. */
export function cameraZ(progress: number) {
  const p = Math.min(1, Math.max(0, progress))
  const journey = Math.sin(Math.PI * p)
  return CAM_FAR + (CAM_NEAR - CAM_FAR) * journey
}

const HALF_FOV = (FOV * Math.PI) / 360

/**
 * On-screen radius, in CSS pixels, of a sphere of world radius `r` seen from
 * distance `z`.
 *
 * Note the asin: a sphere's silhouette is set by its *tangent* lines, not by a
 * flat slice through its centre, and the two diverge sharply once the sphere is
 * large relative to the viewing distance. Sizing the ball with the naive
 * `r / (z * tan(fov/2))` ratio made it half again as wide as asked for at the
 * larger anchors — correct for a small distant object, badly wrong for one
 * filling a third of the screen.
 */
export function radiusToPixels(r: number, z: number, viewportHeight: number) {
  if (z <= r) return viewportHeight * 4 // camera inside the sphere
  return (Math.tan(Math.asin(r / z)) / Math.tan(HALF_FOV)) * (viewportHeight / 2)
}

/** The inverse: the world radius that projects to `px` at distance `z`. */
export function pixelsToRadius(px: number, z: number, viewportHeight: number) {
  const angle = Math.atan((px / (viewportHeight / 2)) * Math.tan(HALF_FOV))
  return z * Math.sin(Math.min(angle, Math.PI / 2 - 0.01))
}

/** On-screen radius of the shell at a given point in the flight. */
export function shellRadiusPx(progress: number, viewportHeight: number) {
  return radiusToPixels(SHELL_R, cameraZ(progress), viewportHeight)
}

/**
 * 0 while the companion owns the ball, 1 while the core scene does.
 * Both objects cross-fade on this single value.
 */
export function handover(progress: number) {
  return (
    smoothstep(HANDOVER_IN[0], HANDOVER_IN[1], progress) *
    (1 - smoothstep(HANDOVER_OUT[0], HANDOVER_OUT[1], progress))
  )
}

/* -------------------------------------------------------------------------
 * Progress channel
 *
 * Module-level rather than React state, for the same reason the capability
 * focus is: the companion reads this inside useFrame, sixty times a second.
 * -1 means the core section is not engaged and the companion should behave
 * normally.
 * ---------------------------------------------------------------------- */

let coreProgress = -1

export function setCoreProgress(value: number) {
  coreProgress = value
}

export function getCoreProgress() {
  return coreProgress
}
