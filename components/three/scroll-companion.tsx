"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { noiseChunk } from "@/components/three/shaders/noise"
import { useGLTier } from "@/hooks/use-gl-tier"
import { getCompanionFocus } from "@/lib/companion-signal"
// The core section's flight. The companion becomes the same ball, in the same
// place, at the same size, for the moment the two swap over.
import { getCoreProgress, shellRadiusPx } from "@/lib/core-flight"
import { CAM_FAR, FOV, SHELL_R, cameraZ, pixelsToRadius } from "@/lib/core-flight"
import { Interior, interiorNodes } from "@/components/three/core-scene"
// Side-effect import: filters one upstream three.js deprecation log.
import "@/lib/three-console"

/**
 * The scroll companion.
 *
 * One object that travels the whole page with you: a sphere built from ~26k
 * points inside a counter-rotating wireframe cage. It weaves from side to side
 * as you move between sections, docks into its slot in Capabilities, and then
 * leaves again — so it reads as a single thing accompanying you rather than a
 * decoration repeated per section.
 *
 * It is a point cloud rather than a solid shell for two reasons. It is the
 * same material as the hero's particle field, so the page has one idea in it
 * instead of two; and a solid additive shell at this size covered the copy it
 * passed behind, which a cloud simply does not.
 *
 * It is interactive three ways:
 *   - it leans toward the cursor, and the lean strengthens with proximity;
 *   - the cursor sends ripples across the surface like a finger in water —
 *     the pointer is transformed into object space each frame, so the rings
 *     stay centred on the cursor even while the sphere spins;
 *   - you can grab and throw it — drag adds angular velocity, which then
 *     decays. Grabbing only engages near the object, so it never steals a
 *     text selection elsewhere on the page.
 *
 * Architecture note: the canvas is a small fixed box (see BOX) that is moved
 * around the viewport with a compositor-only CSS transform — it is NOT a
 * full-viewport canvas. A viewport-sized always-on alpha surface has to be
 * rasterised and composited over the whole page every frame, and measured at
 * roughly double the frame cost of the entire rest of the page for an object
 * ~200px wide. Drawing into a small box and translating it is several times
 * cheaper and looks identical.
 *
 * Camera is orthographic at zoom 1, so one world unit is one CSS pixel and all
 * the placement maths below can be written directly in pixels.
 */

/** Side length of the GL box, in CSS px.
 *
 *  A point can sit at up to (SHELL_RADIUS + amplitude + ripple) geometry units
 *  from the centre, and `group.scale` is radius / CAGE_RADIUS — so the worst
 *  pixel extent is about 1.0x the nominal radius, plus a few px of point size.
 *  BOX has to be twice that or the cloud clips against its own canvas. */
const BOX = 1250
/** Usable half-extent inside the box, with a margin for point size. */
const HALF = BOX / 2 - 24
/** Hard cap on radius when settled. A settled point sits at most
 *  (SHELL_RADIUS + amplitude) / CAGE_RADIUS ~= 0.89 of the radius from centre,
 *  so HALF / 0.89 is the ceiling — but the ball is deliberately held below it.
 *  The extra room in the box belongs to the spindle, which is longer than the
 *  ball is wide; sizing the ball to the box as well would mean growing the
 *  canvas twice over. */
const MAX_RADIUS = Math.min(591, Math.floor(HALF / 0.89))

// ---------------------------------------------------------------------------
// Choreography
//
// Where the companion sits while each section owns the viewport, as a fraction
// of the viewport. The hero is deliberately absent — the particle field owns
// that screen, and two WebGL objects competing for it looks like a mistake.
// ---------------------------------------------------------------------------

interface Anchor {
  id: string
  /** Fraction of viewport width / height for the object's centre. Values at or
   *  beyond 0 and 1 deliberately hang the object off the edge of the screen. */
  x: number
  y: number
  /** Radius as a fraction of the viewport's short side, so it scales. */
  rFrac: number
  /** 0 hides it entirely. */
  opacity: number
  /** Baseline unravel at this anchor, on top of whatever the hop adds. 1 means
   *  loose dots — used at the hero so the object arrives as drifting particles
   *  and gathers into a ball on the way out. */
  disperse?: number
}

// Sized so only about half of the object is ever on screen — it reads as a
// mass passing behind the page rather than a widget sitting on it.
const ANCHORS: Anchor[] = [
  // The hero's own particle field owns that screen, so this is invisible here —
  // but it is invisible *as loose dots at the field's scale*, sitting where the
  // field sits. Leaving the hero therefore looks like some of those particles
  // gathering themselves into a body and setting off, rather than like a second
  // object fading up out of nowhere.
  { id: "index", x: 0.5, y: 0.46, rFrac: 0.44, opacity: 0, disperse: 0.9 },
  // The waypoint that makes the handover legible. Without it the object faded
  // up at the same time as it travelled, so it arrived at Approach already
  // formed and read as a second, unrelated object appearing in the corner.
  //
  // Its x is 0.7, not screen centre, on purpose. The proof strip is only ~240px
  // tall, so this anchor gets 240px of scroll to reach Approach — try to cross
  // the whole viewport in that distance and the cloud is off the right edge
  // before you can read it, which looked exactly like it had blinked out. A
  // short move keeps it on screen and lets the hero exit be a gathering; the
  // first real flight is the Approach -> Work crossing, which has 850px to
  // play with.
  { id: "proof", x: 0.7, y: 0.38, rFrac: 0.46, opacity: 0.85, disperse: 0.5 },
  { id: "approach", x: 1.02, y: 0.32, rFrac: 0.46, opacity: 1 },
  { id: "work", x: -0.02, y: 0.62, rFrac: 0.44, opacity: 1 },
  { id: "track-record", x: 1.06, y: 0.46, rFrac: 0.5, opacity: 1 },
  // Capabilities is special-cased: it docks to #companion-dock.
  { id: "capabilities", x: 0.84, y: 0.44, rFrac: 0.42, opacity: 1 },
  // The handoff. The companion swells to fill the viewport, centres, and
  // dissolves — and the core scene fades up behind it with its own camera
  // already inside a cloud of points. Neither object moves through the other;
  // the illusion is that the shell you were watching is the one you end up in,
  // and it holds because both are the same dust at the same scale.
  // Centre screen, and sized to match the core scene's shell exactly — see the
  // override in the frame loop, which takes over from this anchor as soon as
  // the section starts. The anchor exists so the approach is already in the
  // right place before the override engages, with nothing to snap.
  { id: "core", x: 0.5, y: 0.5, rFrac: 0.252, opacity: 1, disperse: 0 },
  { id: "contact", x: 1.02, y: 0.34, rFrac: 0.45, opacity: 1 },
]

/** Document-space geometry, recomputed only on resize — never per frame. */
interface SectionBox {
  id: string
  top: number
  height: number
  anchor: Anchor
}

// ---------------------------------------------------------------------------
// Shader
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
uniform vec3  uPointer;      // pointer position in object space
uniform float uPointerForce; // 0..1, ramps with proximity
uniform float uSize;
uniform float uSizeBoost;
uniform float uPixelRatio;
uniform float uDisperse;     // 0 = a ball, 1 = streams in flight
uniform vec2  uTravel;       // unit direction of travel, view space
uniform float uStreamScale;  // stream dimensions, scaled with the ball's size

attribute float aScale;
attribute float aSeed;
attribute vec2  aOrbit;      // (start angle, 0..1 distance from stream axis)
attribute float aStream;     // which stream this point belongs to

const float STREAM_COUNT = 3.0;

varying float vSeed;
varying float vCrest;    // signed ripple height, for lighting the wave tops
varying float vFade;     // depth fade, front hemisphere brighter than the back
varying float vDisperse;
varying float vCore;     // 1 in a stream's middle, 0 at its tips

${noiseChunk}

void main() {
  // Every point sits on a unit shell, so its own position is its normal.
  vec3 dir = normalize(position);

  // --- Idle swell ---------------------------------------------------------
  // One octave, not two. This runs per point per frame and simplex is the most
  // expensive thing in the file; a second octave cost about as much as the
  // entire rest of the page and, on a point cloud this fine, was not visible.
  float n = snoise(dir * uFrequency + vec3(0.0, uTime * 0.16, uTime * 0.11));

  // --- Fluid ripple -------------------------------------------------------
  // Concentric waves travelling out from the cursor *across the surface*, so
  // the rings wrap the sphere the way they would on a liquid skin rather than
  // projecting a flat disc onto it. Distance is the chord between the two
  // directions rather than the angle between them: it is monotonic in the
  // angle, so the rings look identical, and it avoids an acos per point.
  vec3 pdir = normalize(uPointer);
  float chord = length(dir - pdir);

  // Rings fade out about two thirds of the way around, and the phase runs
  // negative with time so crests travel outward from the touch point instead
  // of collapsing into it.
  float reach = smoothstep(1.9, 0.0, chord);
  float wave = sin(chord * 9.5 - uTime * 4.2);
  float ripple = wave * reach * uPointerForce;

  vCrest = ripple;
  vSeed = aSeed;

  float displacement = n * uAmplitude + ripple * 0.22;
  vec3 displaced = position + dir * displacement;

  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);

  // --- Unravel: the ball pours into streams --------------------------------
  // Worked in view space, which for this orthographic camera at zoom 1 means
  // everything below is in CSS pixels.
  //
  // Two earlier versions of this were wrong in instructive ways. Scattering
  // each point along its own random vector is an explosion, not a flow. Then
  // resolving the whole cloud onto the travel axis and stretching it 3.6x gave
  // one ribbon, which read as a zig-zag snake — and spread twenty thousand
  // points so thin across the viewport that the object effectively vanished
  // mid-hop before reappearing as a ball.
  //
  // And a comet — tight nose, fanned wake — was wrong for a different reason:
  // it has a front, so scrolling back up played the animation face-backwards.
  //
  // So: three unequal streams, each a spindle. They meet at both tips and only
  // come apart through the middle, which is symmetric under reversal and says
  // the right thing — one body leaving, one body arriving, the loose part is
  // the journey. Concentrating the points into a few bodies rather than a
  // uniform haze is what keeps them visible the whole way across.
  vec3 centre = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 rel = mv.xyz - centre;

  vec2 alongAxis = uTravel;
  vec2 acrossAxis = vec2(-uTravel.y, uTravel.x);

  // Where this point sits along its stream: 0 and 1 are the two tips, 0.5 is
  // the middle. Slightly compressed toward the middle, because the tips are
  // narrow and would otherwise pile up points — and with additive blending a
  // dense tip is a blown-out tip.
  float sgn = aSeed * 2.0 - 1.0;
  float u = 0.5 + 0.5 * sign(sgn) * pow(abs(sgn), 1.35);

  // A spindle, not a comet. Both tips converge and the middle is wide and
  // scrambled, so the cloud looks the same travelling either way — a comet has
  // a front, which meant scrolling back up ran the animation face-backwards.
  // It also says the right thing: everything leaves one body and gathers into
  // one body again, and the loose part is the journey in between.
  float mid = abs(u - 0.5) * 2.0;      // 1 at both tips, 0 in the middle
  float bulge = 1.0 - mid * mid;       // 0 at both tips, 1 in the middle

  float fan = (6.0 + bulge * 86.0) * uStreamScale;

  // Per-stream character. Three streams that are copies of each other read as
  // a mechanism; these are deliberately unequal in length, offset, phase and
  // wave depth, so they cross over rather than running in parallel. Derived by
  // hashing the stream index so there is no lookup table to keep in step.
  float sLen = 0.78 + fract(aStream * 0.37) * 0.5;
  float sSide = (fract(aStream * 0.41 + 0.17) - 0.5) * 2.0;
  float sPhase = aStream * 2.399;
  float sAmp = 0.7 + fract(aStream * 0.83) * 0.8;
  float sShift = (fract(aStream * 0.53 + 0.31) - 0.5) * 110.0;

  // Lateral offset rides the bulge, so the streams meet at both tips and only
  // separate through the middle. This is what makes them read as one body
  // coming apart and closing up again rather than as three separate objects.
  float laneOffset = sSide * 86.0 * bulge * uStreamScale;

  // Scatter along the axis as well as across it, and only where the stream is
  // already loose — the tips stay tight so they still resolve to a point.
  float jitterAlong = (fract(aOrbit.x * 0.1591549) - 0.5) * 120.0 * bulge * uStreamScale;
  float sAlong = (0.5 - u) * 840.0 * sLen * uStreamScale + sShift * uStreamScale + jitterAlong;

  // Two waves at different rates, per-stream phase and depth. One shallow wave
  // was too orderly and one steep wave was a zig-zag; a pair drifting out of
  // step reads as floating.
  float bend = (
    sin(u * 3.1 + sPhase + uTime * 1.4) * 42.0 * sAmp +
    sin(u * 6.7 - sPhase + uTime * 2.1) * 16.0
  ) * bulge * uStreamScale;

  // Corkscrew, with *differential* rotation — the trick the three.js galaxy
  // example turns on. Points near a stream's axis sweep round faster than
  // points at its edge, so the stream shears into a spiral rather than
  // rotating like a rigid rod. That is what makes the dots read as moving
  // *through* space instead of being carried across the screen as a shape.
  float orbitR = aOrbit.y * fan;
  float orbitA = aOrbit.x + u * 3.2 + uTime * (2.4 / (0.35 + aOrbit.y * 1.6));
  vec2 swirl = vec2(cos(orbitA), sin(orbitA)) * orbitR;

  // Per-point wobble on top of the orbit, phased off the point's own start
  // angle so no two share one. Stops the swirl reading as concentric rings:
  // the dots jostle against each other instead of holding formation.
  vec2 wobble = vec2(
    sin(aOrbit.x * 7.3 + uTime * 2.6),
    cos(aOrbit.x * 4.1 + uTime * 1.9)
  ) * fan * 0.22;

  float sAcross = laneOffset + bend + swirl.x + wobble.x;

  vec3 streamRel = vec3(
    alongAxis * sAlong + acrossAxis * sAcross,
    swirl.y * 0.7 + wobble.y * 0.6
  );

  // Interpolating between the two positions, rather than adding an offset to
  // the sphere, is what bounds the extent: the cloud is never wider than the
  // larger of the ball and the stream layout, so it cannot stretch itself off
  // the edge of its own canvas.
  vec3 finalRel = mix(rel, streamRel, uDisperse);
  mv.xyz = centre + finalRel;

  vDisperse = uDisperse;
  vCore = 1.0 - mid;

  gl_Position = projectionMatrix * mv;

  // Front/back without a depth buffer: the normal matrix is a pure rotation
  // here (uniform scale), so the z of the rotated direction is the signed
  // facing. Additive blending has no occlusion, so this is what stops the far
  // hemisphere from filling the middle in. It flattens out as the ball comes
  // apart, because loose dots have no front or back.
  float facing = (normalMatrix * dir).z;
  vFade = mix(0.18 + 0.82 * smoothstep(-1.0, 1.0, facing), 0.75, uDisperse);

  // Orthographic camera: size is in pixels regardless of depth, so the dots
  // stay the same gauge whatever radius the object is currently at — the ball
  // gets denser as it grows rather than blurrier.
  float size = uSize * uSizeBoost * aScale * uPixelRatio * (0.72 + 0.5 * vFade);
  gl_PointSize = clamp(size * (1.0 + abs(ripple) * 0.9) * mix(1.0, 0.86, uDisperse), 0.5, 10.0);
}
`

const fragmentShader = /* glsl */ `
uniform vec3  uAccent;
uniform vec3  uBase;
uniform vec3  uFlight;
uniform float uOpacity;

varying float vSeed;
varying float vCrest;
varying float vFade;
varying float vDisperse;
varying float vCore;

void main() {
  // Same round soft-edged point as the hero field, so the two objects read as
  // the same material seen twice.
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float alpha = smoothstep(0.5, 0.06, d);
  if (alpha < 0.01) discard;

  // A slice of the cloud is accent-tinted at rest; the wave crests light the
  // rest, so the ripple is visible as brightness travelling outward and not
  // only as geometry.
  float crest = smoothstep(0.0, 0.85, vCrest);

  // While the object is in flight the accent is pulled right back. Bright acid
  // streaming across the page read as an effect happening *to* the page rather
  // than as the object moving through it. Only the noses keep any colour,
  // which is what makes the direction of travel legible.
  //
  // Crucially the desaturated state is a *pale* neutral, not the resting base.
  // Dulling toward the base grey took the luminance out along with the hue and
  // the streams went nearly invisible mid-hop — which is the real reason the
  // object seemed to blink out between the hero and its first anchor.
  float accent = clamp(smoothstep(0.72, 1.0, vSeed) + crest * 1.15, 0.0, 1.0);
  // A whisper of colour where the cloud is densest, nowhere else.
  float glint = smoothstep(0.75, 1.0, vCore) * 0.14;
  vec3 restColor = mix(uBase, uAccent, accent);
  vec3 flightColor = mix(uFlight, uAccent, glint);
  vec3 color = mix(restColor, flightColor, vDisperse);

  // Scattered dots dim a little, so the reassembly reads as the cloud gaining
  // substance rather than only gaining tidiness.
  // The tips thin out and the middle carries the weight, so the spindle shape
  // is in the brightness as well as in the geometry.
  float body = mix(1.0, 0.58 + vCore * 0.42, vDisperse);
  gl_FragColor = vec4(color, alpha * vFade * (0.62 + crest * 0.5) * body * uOpacity);
}
`

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

/** Geometry radius of the cage; everything scales relative to this. */
/** Matches Tailwind's `md`. */
const MOBILE_BREAKPOINT = 768

const CAGE_RADIUS = 2.28

/** Radius of the point shell, in the same geometry units as the cage. */
const SHELL_RADIUS = 1.9
/** Points on the shell.
 *
 *  Cost here is per-point primitive setup, not fill: halving the pixel ratio
 *  changes nothing measurable, halving the count changes a lot. That is a
 *  vertex/setup bound, which a real GPU parallelises and a software rasteriser
 *  does not — but this object is on screen for the whole page rather than one
 *  screen like the hero field, so it is kept meaningfully below the hero's 30k
 *  rather than matched to it. */
const POINT_COUNT = 16000
/** Streams the shell breaks into while travelling. Must match STREAM_COUNT in
 *  the vertex shader.
 *
 *  On count and BOX: both cost roughly linearly and independently, and the
 *  pixel ratio costs nothing measurable — this is a per-primitive setup bound,
 *  not a fill bound. BOX is set by the spindle, which is longer than the ball
 *  is wide, so lengthening the streams is what makes the canvas grow. These two
 *  numbers are the dials if the page ever needs to give time back. */
const STREAM_COUNT = 3

function Companion({
  motionScale,
  wrapperRef,
  interiorRef,
  inside,
}: {
  motionScale: number
  /** The full-viewport host. Only its opacity is written now — the ball itself
   *  is placed in world space so that the camera can fly into it. */
  wrapperRef: React.RefObject<HTMLDivElement | null>
  /** The interior's group, scaled and positioned to sit inside the ball. */
  interiorRef: React.RefObject<THREE.Group | null>
  inside: React.RefObject<number>
}) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const cageRef = useRef<THREE.LineSegments>(null)
  /** The shell thins as the camera passes through it. */
  const shellFade = useRef(1)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Layout, measured on mount/resize rather than per frame — reading
  // getBoundingClientRect sixty times a second for six elements is a layout
  // read the page does not need.
  const boxes = useRef<SectionBox[]>([])
  // The dock element itself, not a cached rect. #companion-dock is
  // `position: sticky`, so its document-space top is only valid while it is
  // unstuck — once it pins, `top - scrollY` drifts by exactly the distance it
  // has stuck for, and the object climbs out of the top of the column. The
  // live viewport rect is the only honest source, so it is read per frame.
  const dockEl = useRef<HTMLElement | null>(null)
  const footerEl = useRef<HTMLElement | null>(null)

  // Live state
  const pos = useRef(new THREE.Vector2(0, 0))
  const radius = useRef(100)
  const opacity = useRef(0)
  const spin = useRef(new THREE.Vector2(0, 0)) // angular velocity, x=yaw y=pitch
  const dragging = useRef(false)
  const pointerPx = useRef(new THREE.Vector2(-9999, -9999))
  const pointerLocal = useRef(new THREE.Vector3())
  const pointerForce = useRef(0)
  const placed = useRef(false)
  /** 0 = a ball, 1 = fully unravelled. Eased, so hops are not instantaneous. */
  const disperse = useRef(0)
  const travelDir = useRef(new THREE.Vector2(1, 0))
  const travelTarget = useRef(new THREE.Vector2(1, 0))

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: 0.14 },
      uFrequency: { value: 1.6 },
      uPointer: { value: new THREE.Vector3(0, 0, 1) },
      uPointerForce: { value: 0 },
      uSize: { value: 5.8 },
      uPixelRatio: { value: 1 },
      uDisperse: { value: 0 },
      uSizeBoost: { value: 1 },
      uStreamScale: { value: 1 },
      uTravel: { value: new THREE.Vector2(1, 0) },
      // Base is a warm grey rather than near-black: with additive blending an
      // unlit dot has to still be a dot, or the sphere only exists on hover.
      uAccent: { value: new THREE.Color("#ccff00") },
      uBase: { value: new THREE.Color("#8c8c88") },
      // Deliberately brighter than uBase: this is the in-flight colour, and it
      // has to hold its luminance while giving up its hue.
      uFlight: { value: new THREE.Color("#cfcfc6") },
      uOpacity: { value: 0 },
    }),
    [],
  )

  const cageGeometry = useMemo(
    () => new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(CAGE_RADIUS, 1)),
    [],
  )
  useEffect(() => () => cageGeometry.dispose(), [cageGeometry])

  // A Fibonacci lattice, not random spherical coordinates: random points bunch
  // at the poles and leave visible thin bands, which on a slowly rotating ball
  // is the one artefact you cannot stop looking at. The golden angle spaces
  // them evenly at any count.
  const shellGeometry = useMemo(() => {
    const positions = new Float32Array(POINT_COUNT * 3)
    const scales = new Float32Array(POINT_COUNT)
    const seeds = new Float32Array(POINT_COUNT)
    const orbit = new Float32Array(POINT_COUNT * 2)
    const stream = new Float32Array(POINT_COUNT)
    const golden = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < POINT_COUNT; i++) {
      const y = 1 - (i / (POINT_COUNT - 1)) * 2
      const ring = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = i * golden

      // A little thickness, so it is a shell rather than a soap bubble.
      const r = SHELL_RADIUS * (1 + (Math.random() - 0.5) * 0.05)
      positions[i * 3 + 0] = Math.cos(theta) * ring * r
      positions[i * 3 + 1] = y * r
      positions[i * 3 + 2] = Math.sin(theta) * ring * r

      // Long tail: mostly fine dust with a few brighter anchors, as in the hero.
      scales[i] = 0.4 + Math.pow(Math.random(), 3) * 1.7
      seeds[i] = Math.random()

      // This point's orbit around its stream's axis, precomputed so the shader
      // needs a sin and a cos rather than an atan and a length per frame.
      // sqrt on the radius spreads points evenly over the disc instead of
      // bunching them at the axis.
      orbit[i * 2 + 0] = Math.random() * Math.PI * 2
      orbit[i * 2 + 1] = Math.sqrt(Math.random())

      // Which stream this point joins when the ball comes apart. Assigned by
      // lattice index rather than at random, so each stream draws from a
      // contiguous band of the sphere and the shell peels into ribbons instead
      // of five interleaved clouds of speckle.
      stream[i] = Math.floor((i / POINT_COUNT) * STREAM_COUNT) % STREAM_COUNT
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1))
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1))
    geo.setAttribute("aOrbit", new THREE.BufferAttribute(orbit, 2))
    geo.setAttribute("aStream", new THREE.BufferAttribute(stream, 1))
    return geo
  }, [])
  useEffect(() => () => shellGeometry.dispose(), [shellGeometry])

  // --- Measure the page -----------------------------------------------------
  useEffect(() => {
    const measure = () => {
      const scrollY = window.scrollY
      boxes.current = ANCHORS.flatMap((anchor) => {
        const el = document.getElementById(anchor.id)
        if (!el) return []
        const rect = el.getBoundingClientRect()
        return [{ id: anchor.id, top: rect.top + scrollY, height: rect.height, anchor }]
      })

      dockEl.current = document.getElementById("companion-dock")
      footerEl.current = document.getElementById("colophon")
    }

    measure()
    window.addEventListener("resize", measure)
    // Sections change height when a case study or a role is expanded.
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    return () => {
      window.removeEventListener("resize", measure)
      observer.disconnect()
    }
  }, [])

  // --- Pointer + drag -------------------------------------------------------
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const prevX = pointerPx.current.x
      const prevY = pointerPx.current.y
      pointerPx.current.set(e.clientX, e.clientY)

      if (dragging.current && prevX > -9000) {
        // Horizontal drag spins around Y, vertical around X — the intuitive
        // mapping when you grab a ball on screen.
        spin.current.x += (e.clientX - prevX) * 0.00035
        spin.current.y += (e.clientY - prevY) * 0.00035
      }
    }

    const onDown = (e: PointerEvent) => {
      // Only grab if the press actually lands on the object, otherwise every
      // click on the page would fling it.
      const dx = e.clientX - pos.current.x
      const dy = e.clientY - pos.current.y
      if (Math.hypot(dx, dy) < radius.current * 1.15 && opacity.current > 0.3) {
        dragging.current = true
      }
    }

    const onUp = () => {
      dragging.current = false
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onDown, { passive: true })
    window.addEventListener("pointerup", onUp, { passive: true })
    window.addEventListener("pointercancel", onUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [])

  useFrame((state, delta) => {
    const group = groupRef.current
    const material = materialRef.current
    if (!group || !material) return

    const dt = Math.min(delta, 1 / 30)
    const t = dt * motionScale

    material.uniforms.uTime.value += t
    material.uniforms.uPixelRatio.value = Math.min(state.gl.getPixelRatio(), 2)

    // ---- Where should it be? ---------------------------------------------
    // Viewport dimensions come from the window, not from useThree().size —
    // the canvas is only BOX px across, so its own size says nothing about
    // where on the page the object belongs.
    const scrollY = window.scrollY
    const vw = window.innerWidth
    const vh = window.innerHeight
    const coreRaw = getCoreProgress()
    const coreEngaged = coreRaw >= 0 && coreRaw <= 1
    const coreP = coreEngaged ? coreRaw : 0
    const centreOfScreen = scrollY + vh / 2

    let targetX = vw * 0.8
    let targetY = vh * 0.4
    let targetR = 100
    let targetO = 0
    let targetDisperse = 0
    let docked = false
    // The axis the streams lie along, in page coordinates.
    let axisX = 0
    let axisY = 0

    const list = boxes.current
    // The anchors are a continuous timeline, not a set of intervals. Matching
    // on `centreOfScreen` falling *inside* a section left dead zones wherever a
    // section carried no anchor — the proof strip sits between the hero and
    // Approach, so the companion blinked out for the length of it and faded
    // back in afterwards. Taking the last anchor the centre line has passed,
    // and measuring progress across the gap to the next one, means unanchored
    // sections simply become part of the preceding anchor's span.
    let index = -1
    for (let i = 0; i < list.length; i++) {
      if (list[i].top <= centreOfScreen) index = i
    }

    if (index >= 0) {
      const box = list[index]
      const next = list[index + 1]
      const span = next ? next.top - box.top : Math.max(box.height, 1)
      const progress = THREE.MathUtils.clamp(
        (centreOfScreen - box.top) / Math.max(span, 1),
        0,
        1,
      )
      const from = box.anchor
      const to = next ? next.anchor : box.anchor
      const blend = Math.max(0, (progress - 0.6) / 0.4) // last 40% of the span

      // ---- Unravel on the hop ---------------------------------------------
      // Driven by the anchor pair rather than by how fast the object happens
      // to be moving, so the same scroll always produces the same choreography
      // rather than one that depends on how hard you flicked the wheel. A hop
      // that crosses the viewport comes fully apart; a short shuffle between
      // two anchors on the same side barely ruffles. The bell curve puts peak
      // dispersion mid-flight and returns it to a solid ball on arrival.
      const hop = Math.abs(to.x - from.x)
      const bell = Math.sin(Math.PI * Math.min(1, blend))
      // Whichever is stronger: the hop's own bell curve, or the baseline the
      // anchors themselves ask for. The hero's baseline of 1 decays to
      // approach's 0 across the blend, which is the gathering-up.
      const baseline = THREE.MathUtils.lerp(from.disperse ?? 0, to.disperse ?? 0, blend)
      targetDisperse = Math.max(Math.min(1, hop / 0.7) * bell, baseline)

      // The streams lie along the *path* between the two anchors, not along the
      // object's current velocity. Everything else here is already a pure
      // function of scroll position and so reverses correctly on its own;
      // velocity was the one quantity that did not, because scrolling back up
      // negates it and the whole cloud turned inside out in a single frame.
      // The path between a given pair of anchors is the same line whichever way
      // you are travelling along it, so there is nothing left to flip.
      axisX = (to.x - from.x) * vw
      axisY = (to.y - from.y) * vh

      const shortSide = Math.min(vw, vh)
      targetX = THREE.MathUtils.lerp(from.x, to.x, blend) * vw
      targetY = THREE.MathUtils.lerp(from.y, to.y, blend) * vh
      targetR = THREE.MathUtils.lerp(from.rFrac, to.rFrac, blend) * shortSide
      targetO = THREE.MathUtils.lerp(from.opacity, to.opacity, blend)

      // Docking: while the Capabilities slot is on screen, the companion
      // settles into it instead of following the anchor path.
      if ((box.id === "capabilities" || next?.id === "capabilities") && dockEl.current) {
        // Read, never write, and only inside the one section that docks: this
        // is a layout read in a rAF, and the only style write in this frame
        // happens further down, after every read.
        const rect = dockEl.current.getBoundingClientRect()
        const size = Math.min(rect.width, rect.height)
        const visible = rect.top < vh * 0.85 && rect.bottom > vh * 0.15
        if (visible && size > 0) {
          docked = true
          targetDisperse = 0
          targetX = rect.left + rect.width / 2
          targetY = rect.top + size / 2
          // Overflows its slot rather than sitting neatly inside it, so the
          // docked state matches the scale it travels at.
          targetR = size * 0.56
          targetO = 1
        }
      }
    }

    // ---- Footer: the resting state ---------------------------------------
    // Keyed to how far the footer has entered the viewport rather than to the
    // centre line the anchors use. The footer is shorter than half a screen, so
    // the centre line can never reach it — which is why the companion used to
    // simply wink out at the bottom of the page. Here it instead swells and
    // sinks until only its upper cap is above the fold, and stays there.
    const footer = footerEl.current
    if (footer) {
      const rect = footer.getBoundingClientRect()
      const entered = THREE.MathUtils.clamp(
        (vh - rect.top) / Math.max(1, Math.min(rect.height, vh * 0.55)),
        0,
        1,
      )
      if (entered > 0) {
        // Wide enough to read as a horizon rather than as a ball that happens
        // to be low: the cap spans most of the viewport.
        const restR = Math.min(MAX_RADIUS, Math.max(vw, vh) * 0.5)
        const ease = entered * entered * (3 - 2 * entered)
        targetX = THREE.MathUtils.lerp(targetX, vw * 0.5, ease)
        // Centre on the fold, so exactly the upper half is visible.
        targetY = THREE.MathUtils.lerp(targetY, vh, ease)
        targetR = THREE.MathUtils.lerp(targetR, restR, ease)
        targetO = THREE.MathUtils.lerp(targetO, 1, ease)
        targetDisperse *= 1 - ease
      }
    }

    // ---- The core flight ---------------------------------------------------
    // While the core section is on screen the companion stops choreographing
    // itself and simply *becomes* that section's shell: same centre, same
    // on-screen radius, computed from the same camera path. Then it fades out
    // over a short window as the section's own canvas fades in over the top of
    // it. Because both are a sphere of dust of identical size in identical
    // position, the swap has nothing to give itself away with.
    if (coreEngaged) {
      targetX = vw / 2
      targetY = vh / 2
      // Only used for the frames before the flight proper starts; once engaged
      // the world radius is frozen and the camera does the work.
      targetR = shellRadiusPx(0, vh)
      targetO = 1
      targetDisperse = 0
    }

    targetR = Math.min(targetR, MAX_RADIUS)

    // Below the md breakpoint every column is full width, so the anchors have
    // no gutter to sit in and the object lands squarely on top of body copy —
    // acid green under grey text is the one place this thing can actively hurt
    // the page. Push it further past the edge and drop it to a tint. The
    // docked state is exempt: its slot is a real empty block on mobile, so it
    // is the one place the companion is not competing with anything.
    if (vw < MOBILE_BREAKPOINT && !docked) {
      targetX += (targetX >= vw / 2 ? 1 : -1) * targetR * 0.5
      targetO *= 0.42
    }

    if (!placed.current) {
      // Avoid a fly-in from the origin on first paint.
      pos.current.set(targetX, targetY)
      radius.current = targetR
      placed.current = true
    }

    // `pos` is the object's centre in *viewport* px.
    if (opacity.current < 0.02) {
      // Invisible: cut straight to the target rather than gliding there
      // unseen. Otherwise the fade-in is spent travelling across the screen
      // from wherever it was last visible, and it arrives late.
      pos.current.set(targetX, targetY)
      radius.current = targetR
    } else {
      pos.current.x = THREE.MathUtils.damp(pos.current.x, targetX, 4.5, dt)
      pos.current.y = THREE.MathUtils.damp(pos.current.y, targetY, 4.5, dt)
      radius.current = THREE.MathUtils.damp(radius.current, targetR, 4, dt)
    }
    opacity.current = THREE.MathUtils.damp(opacity.current, targetO, 5, dt)
    disperse.current = THREE.MathUtils.damp(disperse.current, targetDisperse * motionScale, 6, dt)

    // View space has y up, the page has y down, hence the negated component.
    // A zero-length axis means the last anchor, where `to` is `from`; keep
    // whatever the axis already was rather than snapping to a default.
    const axisLen = Math.hypot(axisX, axisY)
    if (axisLen > 1) {
      let nx = axisX / axisLen
      let ny = -axisY / axisLen
      // The spindle has no front, so what matters is the *line* it lies along,
      // not a direction along that line: +d and -d draw the same cloud. Say so
      // explicitly by always taking whichever of the two lies nearer the
      // current heading.
      //
      // Without this the 180-degree problem just moves rather than going away.
      // Consecutive hops deliberately alternate left and right, so crossing
      // from one anchor pair to the next reverses the raw axis — and lerping a
      // vector to its own negation passes through zero, where normalising it
      // yields a garbage direction and the cloud snaps. Canonicalising first
      // turns that 180-degree swing into the few degrees the two paths
      // genuinely differ by.
      if (nx * travelDir.current.x + ny * travelDir.current.y < 0) {
        nx = -nx
        ny = -ny
      }
      travelTarget.current.set(nx, ny)
    }
    // Ease the remainder, so even that small change never lands in one frame.
    travelDir.current.lerp(travelTarget.current, 1 - Math.pow(0.0008, dt))
    if (travelDir.current.lengthSq() > 1e-6) travelDir.current.normalize()

    material.uniforms.uDisperse.value = disperse.current
    material.uniforms.uTravel.value.copy(travelDir.current)

    // Move the box, not the mesh: a transform on a small fixed element is a
    // compositor operation, whereas repositioning inside a viewport-sized
    // canvas would mean paying for that canvas everywhere.
    const wrapper = wrapperRef.current
    if (wrapper) wrapper.style.opacity = String(opacity.current)

    // ---- Placement --------------------------------------------------------
    // The canvas is the whole viewport and the camera is a perspective one, so
    // the ball is placed by moving it in world space rather than by moving a
    // div. That is what lets the camera fly *into* it: a small box translated
    // around the page cannot be entered, which is why this used to need a
    // second sphere in a second canvas, and why the swap between them was
    // always visible however carefully they were matched.
    const camDist = coreEngaged ? cameraZ(coreP) : CAM_FAR
    camera.position.z = THREE.MathUtils.damp(camera.position.z, camDist, 5, dt)
    // Slide the frame left of the copy column once inside; zero at both ends,
    // so the ball is dead centre whenever the page is looking at it as a ball.
    const journey = coreEngaged ? Math.sin(Math.PI * coreP) : 0
    camera.position.x = THREE.MathUtils.damp(camera.position.x, 3.1 * journey, 4, dt)
    camera.lookAt(camera.position.x, 0, 0)

    // World units per CSS pixel on the plane the ball sits in. Correct for
    // *position*, which is a point on that plane — but not for the ball's
    // radius, which is a silhouette and needs the tangent relation instead.
    const unitsPerPx = (2 * camera.position.z * Math.tan((FOV * Math.PI) / 360)) / vh

    const drawRadius = Math.min(radius.current, MAX_RADIUS)
    // Normally the world radius tracks the wanted pixel radius, so the ball is
    // the size the choreography asks for. During the flight it is frozen and
    // the camera moves instead — which is what makes it grow. The two agree
    // exactly at the handover point, by construction: the core anchor's pixel
    // radius is defined as SHELL_R at CAM_FAR.
    const worldR = coreEngaged
      ? SHELL_R
      : pixelsToRadius(drawRadius, camera.position.z, vh)
    group.scale.setScalar(worldR / CAGE_RADIUS)
    group.position.set(
      (pos.current.x - vw / 2) * unitsPerPx,
      -(pos.current.y - vh / 2) * unitsPerPx,
      0,
    )
    if (interiorRef.current) {
      // The interior is authored against a shell of SHELL_R world units.
      interiorRef.current.scale.setScalar(worldR / SHELL_R)
      interiorRef.current.position.copy(group.position)
    }
    // Nothing inside is drawn until the camera has passed through the shell.
    inside.current = 1 - THREE.MathUtils.smoothstep(camera.position.z, SHELL_R * 0.8, SHELL_R * 2.1)
    // ...and the shell itself thins out as you go through it, so it is not a
    // wall of dust hanging behind your head.
    shellFade.current = THREE.MathUtils.smoothstep(camera.position.z, SHELL_R * 0.7, SHELL_R * 1.8)

    // Streams are laid out in pixels, so they have to be told how big the
    // object currently is or a phone would get a 900px comet.
    material.uniforms.uStreamScale.value = THREE.MathUtils.clamp(drawRadius / 450, 0.3, 1.0)

    // A fixed number of points spread over a larger sphere is a sparser
    // sphere, so the dots grow with the radius. Without this the footer's
    // zoomed-in cap would read as thin dust next to the hero field it is
    // supposed to rhyme with.
    material.uniforms.uSizeBoost.value = THREE.MathUtils.clamp(drawRadius / 430, 0.9, 1.5)
    material.uniforms.uOpacity.value = shellFade.current

    // ---- Pointer proximity ------------------------------------------------
    const screenX = pos.current.x
    const screenY = pos.current.y
    const dist = Math.hypot(pointerPx.current.x - screenX, pointerPx.current.y - screenY)
    const proximity = THREE.MathUtils.clamp(
      1 - (dist - radius.current * 0.4) / (radius.current * 1.8),
      0,
      1,
    )
    pointerForce.current = THREE.MathUtils.damp(
      pointerForce.current,
      proximity * opacity.current * motionScale,
      6,
      dt,
    )
    material.uniforms.uPointerForce.value = pointerForce.current

    // Pointer into object space, so the ripple follows the cursor on screen
    // rather than rotating away with the mesh.
    //
    // This used to read the cursor's offset from the ball's centre straight
    // into world units, which was correct only while the camera was
    // orthographic at zoom 1 and one world unit was one pixel. Under
    // perspective that assumption is off by the pixels-per-unit factor, so the
    // rings appeared somewhere other than under the cursor. Now the pointer is
    // placed on the ball's own plane in world space and converted properly.
    if (pointerForce.current > 0.001) {
      pointerLocal.current.set(
        (pointerPx.current.x - vw / 2) * unitsPerPx,
        -(pointerPx.current.y - vh / 2) * unitsPerPx,
        // One radius toward the camera, so the ripple centres on the surface
        // facing the viewer rather than on the equator. Only the direction
        // survives — the shader normalises this.
        worldR,
      )
      group.worldToLocal(pointerLocal.current)
      material.uniforms.uPointer.value.copy(pointerLocal.current)
    }

    // ---- Rotation ----------------------------------------------------------
    if (!dragging.current) {
      // Idle drift, plus decay of whatever spin the last throw imparted.
      spin.current.x = THREE.MathUtils.damp(spin.current.x, 0.0028 * motionScale, 1.6, dt)
      spin.current.y = THREE.MathUtils.damp(spin.current.y, 0, 1.6, dt)
    }

    group.rotation.y += spin.current.x * 60 * dt
    group.rotation.x += spin.current.y * 60 * dt

    // A few degrees of lean toward the cursor on top of the spin.
    const leanX = ((pointerPx.current.x - screenX) / vw) * 0.8 * pointerForce.current
    const leanY = ((pointerPx.current.y - screenY) / vh) * 0.8 * pointerForce.current
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, leanX, 3, dt)

    if (cageRef.current) {
      cageRef.current.rotation.y -= t * 0.34
      cageRef.current.rotation.x += t * 0.12 + leanY * 0.01
      const cageMat = cageRef.current.material as THREE.LineBasicMaterial
      // Also fades as the camera passes through the shell. Left at full
      // strength it stays on screen once you are inside as a handful of long
      // straight lines cutting across the network — the one thing in the frame
      // that reads as a diagram rather than as a place.
      cageMat.opacity = 0.07 * (1 - disperse.current) * shellFade.current
    }

    // ---- Section character -------------------------------------------------
    const focus = getCompanionFocus()
    const engaged = focus >= 0
    material.uniforms.uAmplitude.value = THREE.MathUtils.damp(
      material.uniforms.uAmplitude.value,
      engaged ? 0.22 : 0.14,
      4,
      dt,
    )
    material.uniforms.uFrequency.value = THREE.MathUtils.damp(
      material.uniforms.uFrequency.value,
      engaged ? 1.6 + focus * 0.26 : 1.6,
      3,
      dt,
    )
  })

  return (
    <group ref={groupRef}>
      <points geometry={shellGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* The cage stays, but quieter than it was against the solid shell — it
          gives the cloud an edge to sit inside without drawing lines across
          the copy behind it. */}
      <lineSegments ref={cageRef} geometry={cageGeometry}>
        <lineBasicMaterial color="#ccff00" transparent opacity={0.07} />
      </lineSegments>
    </group>
  )
}

/** Wraps the ball and its contents so both can be positioned from one place. */
function Scene({
  motionScale,
  wrapperRef,
  labelHost,
  interiorRef,
  inside,
  showInterior,
}: {
  motionScale: number
  wrapperRef: React.RefObject<HTMLDivElement | null>
  labelHost: React.RefObject<HTMLDivElement | null>
  interiorRef: React.RefObject<THREE.Group | null>
  inside: React.RefObject<number>
  showInterior: boolean
}) {
  return (
    <>
      <Companion
        motionScale={motionScale}
        wrapperRef={wrapperRef}
        interiorRef={interiorRef}
        inside={inside}
      />
      {/* Mounted only near the core section. Leaving it in the scene graph and
          fading it with an alpha uniform is not free — additive geometry at
          zero alpha is still rasterised every frame, and the tubes, charge and
          filler together cost more than doubled the page's frame time. */}
      {showInterior ? (
        <group ref={interiorRef}>
          <Interior inside={inside} labelHost={labelHost} />
        </group>
      ) : null}
    </>
  )
}

// ---------------------------------------------------------------------------

/** The named services, resolved once so the DOM label layer and the scene
 *  iterate the same list in the same order. */
const LABELS = interiorNodes()

export function ScrollCompanion() {
  const tier = useGLTier()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const labelHost = useRef<HTMLDivElement>(null)
  const interiorRef = useRef<THREE.Group>(null)
  const inside = useRef(0)
  /** Mount the bloom pass a little before the flight, so its shader compile
   *  does not land mid-scroll. */
  const [coreNear, setCoreNear] = useState(false)

  useEffect(() => {
    const el = document.getElementById("core")
    if (!el) return
    const io = new IntersectionObserver(([e]) => setCoreNear(e.isIntersecting), {
      rootMargin: "35% 0px 35% 0px",
      threshold: 0,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const [awake, setAwake] = useState(true)
  const [overHero, setOverHero] = useState(true)

  // The one canvas that lives for the whole visit, so the one that genuinely
  // must stop when the tab is not being looked at.
  useEffect(() => {
    const onVisibility = () => setAwake(!document.hidden)
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  // Idle at the very top of the page, where the companion is invisible and the
  // particle field owns the GPU. Observed from the outside rather than from the
  // scene's own opacity — gating the loop on state the loop itself produces
  // would mean it could never start again.
  //
  // The threshold is deliberately 0.98, not something like 0.75: the loop has
  // to be warm and settled well before the companion begins to fade in, or its
  // damped opacity visibly ramps up as you scroll instead of it simply being
  // there. Releasing at the first scratch of scroll costs nothing, because the
  // companion's own target opacity keeps it invisible until it is wanted.
  useEffect(() => {
    const hero = document.getElementById("index")
    if (!hero) return
    const observer = new IntersectionObserver(
      ([entry]) => setOverHero(entry.intersectionRatio > 0.98),
      { threshold: [0, 0.9, 0.98, 1] },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  if (!tier.ready || !tier.enabled) return null

  return (
    <div
      ref={wrapperRef}
      data-companion=""
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0 }}
      aria-hidden
    >
      <Canvas
        frameloop={awake && !overHero ? "always" : "never"}
        dpr={[1, Math.min(tier.dpr[1], 1.25)]}
        // Perspective, not orthographic. The ball is placed by moving it in
        // world space rather than by translating a small box around the page,
        // which is the only way the camera can be flown *into* it — and
        // therefore the only way there can be one ball rather than two.
        camera={{ fov: FOV, near: 0.1, far: 600, position: [0, 0, CAM_FAR] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        // r3f sets `pointer-events: auto` on its wrapper whenever no
        // `eventSource` is given. This companion reads the pointer from its own
        // window listeners and must never intercept a click. The `style` prop
        // is spread after r3f's default, so this wins.
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <Scene
          motionScale={tier.motionScale}
          wrapperRef={wrapperRef}
          labelHost={labelHost}
          interiorRef={interiorRef}
          inside={inside}
          showInterior={coreNear}
        />
        {/* No post-processing on this canvas, deliberately. A bloom pass is a
            full-screen effect — it cannot be scoped to the interior, so it lit
            up the ball itself as well, and because the pass has to be mounted
            ahead of time to keep its shader compile out of the flight, that
            brightening landed a whole section early. The interior carries its
            own glow in its shaders instead. */}
      </Canvas>

      {/* Node labels are real DOM text — selectable, legible at any pixel
          ratio, and not baked into a texture. Hidden from assistive tech
          because the same names appear in the section's own copy. */}
      <div ref={labelHost} className="pointer-events-none absolute inset-0" aria-hidden>
        {LABELS.map((node) => (
          <div
            key={node.id}
            className="label text-paper absolute top-0 left-0 -translate-y-1/2 pl-4 text-[0.62rem] whitespace-nowrap opacity-0 will-change-transform"
          >
            {node.label}
          </div>
        ))}
      </div>
    </div>
  )
}
