"use client"

import { useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { noiseChunk } from "@/components/three/shaders/noise"

/**
 * Hero particle field.
 *
 * A wide elliptical cloud of points sitting behind the hero type. Three
 * things drive it:
 *
 *  - a slow flow field (simplex), so it is always breathing;
 *  - the pointer, which pushes points away and lights them acid;
 *  - scroll, which raises turbulence and pulls the cloud apart as you leave
 *    the hero — order dissolving into flow.
 *
 * Rendered additively with `depthWrite: false`: on a near-black canvas that
 * gives real accumulation in dense regions, which is what the bloom pass then
 * has something to grab onto.
 */

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uScroll;
uniform vec3  uPointer;
uniform float uPointerStrength;
uniform float uSize;
uniform float uPixelRatio;

attribute float aScale;
attribute float aSeed;

varying float vSeed;
varying float vGlow;
varying float vFade;

${noiseChunk}

void main() {
  vec3 pos = position;

  float t = uTime * 0.055;

  // --- Flow field ---------------------------------------------------------
  // Two octaves: a broad churn plus a finer shimmer.
  vec3 flow  = snoiseVec3(pos * 0.20 + vec3(0.0, t, t * 0.4)) * 1.00;
  flow      += snoiseVec3(pos * 0.62 - vec3(t * 0.7, 0.0, 0.0)) * 0.32;

  // Scroll raises turbulence and biases the cloud upward as the hero leaves.
  float turbulence = mix(0.55, 2.30, uScroll);
  pos += flow * turbulence;
  pos.y += uScroll * 2.4;

  // --- Pointer repulsion --------------------------------------------------
  vec2 toPointer = pos.xy - uPointer.xy;
  float dist = length(toPointer);
  float influence = smoothstep(3.2, 0.0, dist) * uPointerStrength;
  pos.xy += normalize(toPointer + 1e-4) * influence * 1.35;
  pos.z  += influence * 0.6;

  vGlow = influence;
  vSeed = aSeed;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Perspective-correct sizing, clamped so near points do not become blobs.
  float size = uSize * aScale * uPixelRatio * (8.0 / -mvPosition.z);
  gl_PointSize = clamp(size, 0.5, 14.0);

  // Fade with depth and as the hero scrolls away, so nothing pops out.
  vFade = smoothstep(-16.0, -2.0, mvPosition.z) * (1.0 - uScroll * 0.85);
}
`

const fragmentShader = /* glsl */ `
uniform vec3 uColorBase;
uniform vec3 uColorAccent;

varying float vSeed;
varying float vGlow;
varying float vFade;

void main() {
  // Round, soft-edged point. Cheaper than a texture and stays crisp at any DPR.
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float alpha = smoothstep(0.5, 0.06, d);
  if (alpha < 0.01) discard;

  // A tenth of the cloud is accent-tinted at rest; the pointer lights the rest.
  float accent = smoothstep(0.90, 1.0, vSeed) + vGlow * 0.9;
  vec3 color = mix(uColorBase, uColorAccent, clamp(accent, 0.0, 1.0));

  // Density does most of the work, but at 0.16 the field was invisible on
  // anything but an OLED panel in a dark room.
  gl_FragColor = vec4(color, alpha * vFade * (0.28 + vGlow * 0.6));
}
`

export function ParticleField({
  count = 30000,
  /** Set 0 to freeze all motion (reduced-motion users). */
  motionScale = 1,
}: {
  count?: number
  motionScale?: number
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { viewport, size } = useThree()

  // Pointer is tracked in world space and eased, so the repulsion trails the
  // cursor slightly instead of snapping to it.
  const pointer = useRef(new THREE.Vector3(0, 0, 0))
  const pointerTarget = useRef(new THREE.Vector3(0, 0, 0))
  const pointerStrength = useRef(0)

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const seeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Elliptical disc, denser toward the middle. The 0.62 exponent is what
      // concentrates mass at the centre instead of at the rim.
      const radius = Math.pow(Math.random(), 0.62) * 7.2
      const theta = Math.random() * Math.PI * 2

      positions[i * 3 + 0] = Math.cos(theta) * radius * 1.75
      positions[i * 3 + 1] = Math.sin(theta) * radius * 0.72
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4.5

      // Long tail on scale: mostly small points with a few bright anchors.
      scales[i] = 0.35 + Math.pow(Math.random(), 3.0) * 1.9
      seeds[i] = Math.random()
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1))
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1))
    // The shader displaces points well outside their authored bounds; without
    // this they get frustum-culled at the edges of the disc.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 24)
    return geo
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uPointer: { value: new THREE.Vector3(0, 0, 0) },
      uPointerStrength: { value: 0 },
      uSize: { value: 3.9 },
      uPixelRatio: { value: 1 },
      uColorBase: { value: new THREE.Color("#8c8c88") },
      uColorAccent: { value: new THREE.Color("#ccff00") },
    }),
    [],
  )

  useFrame((state, delta) => {
    const material = materialRef.current
    if (!material) return

    // Clamp delta: a backgrounded tab returns a huge first frame otherwise.
    const dt = Math.min(delta, 1 / 30)

    material.uniforms.uTime.value += dt * motionScale
    material.uniforms.uPixelRatio.value = Math.min(state.gl.getPixelRatio(), 2)

    // --- Scroll progress through the hero ---------------------------------
    const heroHeight = size.height || 1
    const progress = Math.min(window.scrollY / heroHeight, 1)
    material.uniforms.uScroll.value = THREE.MathUtils.damp(
      material.uniforms.uScroll.value,
      progress,
      6,
      dt,
    )

    // --- Pointer ----------------------------------------------------------
    pointerTarget.current.set(
      (state.pointer.x * viewport.width) / 2,
      (state.pointer.y * viewport.height) / 2,
      0,
    )
    pointer.current.lerp(pointerTarget.current, 1 - Math.pow(0.0015, dt))
    material.uniforms.uPointer.value.copy(pointer.current)

    // Ramp the repulsion in once the pointer has actually moved, so the cloud
    // is undisturbed on first paint.
    const wantStrength = state.pointer.x === 0 && state.pointer.y === 0 ? 0 : motionScale
    pointerStrength.current = THREE.MathUtils.damp(pointerStrength.current, wantStrength, 3, dt)
    material.uniforms.uPointerStrength.value = pointerStrength.current

    // Whole-cloud parallax — a few degrees of lean toward the pointer.
    const group = pointsRef.current
    if (group) {
      group.rotation.y = THREE.MathUtils.damp(
        group.rotation.y,
        state.pointer.x * 0.14 * motionScale,
        2,
        dt,
      )
      group.rotation.x = THREE.MathUtils.damp(
        group.rotation.x,
        -state.pointer.y * 0.09 * motionScale,
        2,
        dt,
      )
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
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
  )
}
