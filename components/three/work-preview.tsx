"use client"

import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
// Side-effect import: filters one upstream three.js deprecation log.
import "@/lib/three-console"

/**
 * Floating project preview for the work list.
 *
 * A single plane chases the cursor with a spring's worth of lag. Its velocity
 * drives two things: a bend in the geometry (the plane trails behind itself)
 * and an RGB split in the shader (the channels separate along the direction of
 * travel). Hovering a different row crossfades to that project's texture
 * rather than cutting.
 *
 * Orthographic camera at zoom 1, so one world unit is one CSS pixel and all
 * the sizing below can be written in pixels.
 *
 * Desktop-only by construction — it is driven entirely by hover, which does
 * not exist on touch. The caller is responsible for not mounting it there.
 *
 * The canvas sits on top of the work list, so `eventSource` is load-bearing:
 * r3f forces `pointer-events: auto` on the canvas unless an external source is
 * given, which would make the whole list unclickable.
 */

// ---------------------------------------------------------------------------
// Texture cache — textures load on first hover, never twice, and survive
// remounts. Six full-size PNGs is ~2.5MB; loading them upfront would be a
// visible cost for an effect most visitors trigger on one or two rows.
// ---------------------------------------------------------------------------

const textureCache = new Map<string, THREE.Texture>()
const inFlight = new Map<string, Promise<THREE.Texture>>()

function loadTexture(url: string): Promise<THREE.Texture> {
  const cached = textureCache.get(url)
  if (cached) return Promise.resolve(cached)

  const pending = inFlight.get(url)
  if (pending) return pending

  const promise = new Promise<THREE.Texture>((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.generateMipmaps = false
        textureCache.set(url, texture)
        inFlight.delete(url)
        resolve(texture)
      },
      undefined,
      (err) => {
        inFlight.delete(url)
        reject(err)
      },
    )
  })

  inFlight.set(url, promise)
  return promise
}

// ---------------------------------------------------------------------------
// Shader
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
uniform vec2  uVelocity;
uniform float uHover;
uniform float uTime;

varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;

  // Trailing bend: the leading edge lifts, the trailing edge lags. Scaled by
  // hover so the plane is flat while it is scaling away.
  float bendX = sin(uv.x * 3.14159) * uVelocity.x * -0.22;
  float bendY = sin(uv.y * 3.14159) * uVelocity.y * -0.22;
  pos.z += (bendX + bendY) * uHover;

  // Very slow idle undulation so it is never completely inert.
  pos.z += sin(uv.x * 4.0 + uTime * 0.8) * cos(uv.y * 3.0 + uTime * 0.6) * 3.0 * uHover;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform sampler2D uTexture;
uniform sampler2D uTexturePrev;
uniform float uMix;
uniform float uHasTexture;
uniform float uHasPrev;
uniform vec2  uVelocity;
uniform float uHover;
uniform vec2  uPlaneSize;
uniform vec2  uImageSize;
uniform vec2  uImageSizePrev;
uniform vec3  uAccent;

varying vec2 vUv;

/** object-fit: cover, in UV space. */
vec2 coverUv(vec2 uv, vec2 planeSize, vec2 imageSize) {
  if (imageSize.x <= 0.0 || imageSize.y <= 0.0) return uv;
  vec2 ratio = vec2(
    min((planeSize.x / planeSize.y) / (imageSize.x / imageSize.y), 1.0),
    min((planeSize.y / planeSize.x) / (imageSize.y / imageSize.x), 1.0)
  );
  return vec2(
    uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    uv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
}

void main() {
  // Channel separation along the direction of travel.
  vec2 shift = uVelocity * 0.00055;

  vec2 uvCur  = coverUv(vUv, uPlaneSize, uImageSize);
  vec2 uvPrev = coverUv(vUv, uPlaneSize, uImageSizePrev);

  vec3 current = vec3(
    texture2D(uTexture, uvCur + shift).r,
    texture2D(uTexture, uvCur).g,
    texture2D(uTexture, uvCur - shift).b
  ) * uHasTexture;

  vec3 previous = vec3(
    texture2D(uTexturePrev, uvPrev + shift).r,
    texture2D(uTexturePrev, uvPrev).g,
    texture2D(uTexturePrev, uvPrev - shift).b
  ) * uHasPrev;

  vec3 color = mix(previous, current, uMix);

  // Acid rim: a thin accent edge that only appears while hovering, so the
  // plane reads as part of the site rather than a floating screenshot.
  vec2 edge = abs(vUv - 0.5) * 2.0;
  float border = smoothstep(0.965, 1.0, max(edge.x, edge.y));
  color = mix(color, uAccent, border * 0.9);

  // Slight darkening at rest keeps the type above it readable.
  color *= mix(0.55, 1.0, uHover);

  gl_FragColor = vec4(color, uHover);
}
`

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const PLANE_W = 460
const PLANE_H = 300

interface PreviewSceneProps {
  activeUrl: string | null
}

function PreviewScene({ activeUrl }: PreviewSceneProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { viewport } = useThree()

  const position = useRef(new THREE.Vector2(0, 0))
  const velocity = useRef(new THREE.Vector2(0, 0))
  const initialised = useRef(false)

  const uniforms = useMemo(
    () => ({
      uTexture: { value: null as THREE.Texture | null },
      uTexturePrev: { value: null as THREE.Texture | null },
      uMix: { value: 1 },
      uHasTexture: { value: 0 },
      uHasPrev: { value: 0 },
      uVelocity: { value: new THREE.Vector2(0, 0) },
      uHover: { value: 0 },
      uTime: { value: 0 },
      uPlaneSize: { value: new THREE.Vector2(PLANE_W, PLANE_H) },
      uImageSize: { value: new THREE.Vector2(1, 1) },
      uImageSizePrev: { value: new THREE.Vector2(1, 1) },
      uAccent: { value: new THREE.Color("#ccff00") },
    }),
    [],
  )

  // Swap textures when the hovered row changes. The outgoing texture stays
  // bound as `uTexturePrev` and `uMix` drives the crossfade in useFrame.
  useEffect(() => {
    if (!activeUrl) return
    let cancelled = false

    loadTexture(activeUrl)
      .then((texture) => {
        if (cancelled) return
        const material = materialRef.current
        if (!material) return

        const u = material.uniforms
        if (u.uTexture.value) {
          u.uTexturePrev.value = u.uTexture.value
          u.uImageSizePrev.value.copy(u.uImageSize.value)
          u.uHasPrev.value = 1
        }

        // three types `Texture.image` as unknown; for a TextureLoader result
        // it is always an HTMLImageElement.
        const image = texture.image as HTMLImageElement
        u.uTexture.value = texture
        u.uImageSize.value.set(image.naturalWidth, image.naturalHeight)
        u.uHasTexture.value = 1
        u.uMix.value = 0
      })
      .catch(() => {
        // A missing screenshot should degrade to "no preview", not a crash.
      })

    return () => {
      cancelled = true
    }
  }, [activeUrl])

  useFrame((state, delta) => {
    const material = materialRef.current
    const mesh = meshRef.current
    if (!material || !mesh) return

    const dt = Math.min(delta, 1 / 30)
    material.uniforms.uTime.value += dt

    // --- Follow the pointer ------------------------------------------------
    const targetX = (state.pointer.x * viewport.width) / 2
    const targetY = (state.pointer.y * viewport.height) / 2

    // Snap on the first frame so the plane does not fly in from the origin.
    if (!initialised.current) {
      position.current.set(targetX, targetY)
      initialised.current = true
    }

    const prevX = position.current.x
    const prevY = position.current.y

    const follow = 1 - Math.pow(0.0000045, dt)
    position.current.x += (targetX - position.current.x) * follow
    position.current.y += (targetY - position.current.y) * follow

    velocity.current.set(position.current.x - prevX, position.current.y - prevY)
    material.uniforms.uVelocity.value.lerp(velocity.current, 0.2)

    mesh.position.set(position.current.x, position.current.y, 0)

    // Lean into the direction of travel — a few degrees, no more.
    mesh.rotation.z = THREE.MathUtils.damp(
      mesh.rotation.z,
      THREE.MathUtils.clamp(-velocity.current.x * 0.0016, -0.1, 0.1),
      6,
      dt,
    )

    // --- Hover in / out ----------------------------------------------------
    const targetHover = activeUrl ? 1 : 0
    material.uniforms.uHover.value = THREE.MathUtils.damp(
      material.uniforms.uHover.value,
      targetHover,
      8,
      dt,
    )

    const scale = 0.86 + material.uniforms.uHover.value * 0.14
    mesh.scale.setScalar(scale)

    // --- Texture crossfade -------------------------------------------------
    if (material.uniforms.uMix.value < 1) {
      material.uniforms.uMix.value = Math.min(1, material.uniforms.uMix.value + dt * 3.2)
    }
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[PLANE_W, PLANE_H, 24, 18]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Canvas wrapper
// ---------------------------------------------------------------------------

export function WorkPreview({
  activeUrl,
  className,
  eventSource,
}: {
  /** Image URL of the hovered project, or null when nothing is hovered. */
  activeUrl: string | null
  className?: string
  /** Element r3f listens on — the work list wrapper. See note above. */
  eventSource?: RefObject<HTMLElement | null>
}) {
  const [everHovered, setEverHovered] = useState(false)

  // Do not pay for a GL context until the visitor actually hovers a row.
  useEffect(() => {
    if (activeUrl) setEverHovered(true)
  }, [activeUrl])

  if (!everHovered) return null

  return (
    <div className={className} aria-hidden>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 100], zoom: 1, near: 0.1, far: 1000 }}
        dpr={[1, 1.75]}
        eventSource={eventSource as RefObject<HTMLElement>}
        eventPrefix="client"
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <PreviewScene activeUrl={activeUrl} />
      </Canvas>
    </div>
  )
}
