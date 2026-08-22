/**
 * A one-value channel between the Capabilities list and the WebGL companion.
 *
 * Deliberately not React state: the companion reads this inside `useFrame`,
 * sixty times a second. Routing it through context would re-render the whole
 * section tree every time the pointer crossed a row, to move a number that
 * only a shader ever reads.
 */

let focus = -1

/** Index of the hovered capability domain, or -1 for none. */
export function setCompanionFocus(value: number) {
  focus = value
}

export function getCompanionFocus() {
  return focus
}
