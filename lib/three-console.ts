import { getConsoleFunction, setConsoleFunction } from "three"

/**
 * Quietens one known-upstream three.js deprecation notice.
 *
 * `THREE.Clock` was deprecated in r183 in favour of `THREE.Timer`, and
 * `@react-three/fiber` still constructs one per `<Canvas>` (see
 * `events-*.esm.js`, `clock: new THREE.Clock()`). 9.7.0 is the current stable
 * release and it has no fix, so the only choices are to pin three back to
 * 0.182, to live with three identical lines of console noise on every reload —
 * one per canvas, doubled again under StrictMode — or to filter it.
 *
 * `setConsoleFunction` is three's own supported interception hook, so this is
 * a filter rather than a patch: the exact deprecation string is dropped and
 * everything else three logs is forwarded to the real console untouched. That
 * matters — a blanket `console.warn` override would also swallow genuine
 * shader-compile and texture errors, which are the warnings worth reading.
 *
 * Delete this file once r3f moves to `THREE.Timer`.
 */

const SILENCED = /^THREE\.Clock: This module has been deprecated/

// Module side-effect, installed once. Import this before anything mounts a
// `<Canvas>`; a second import is a no-op because ESM modules evaluate once.
if (getConsoleFunction() === null) {
  setConsoleFunction((type, message, ...params) => {
    if (SILENCED.test(message)) return
    // eslint-disable-next-line no-console
    console[type](message, ...params)
  })
}

export {}
