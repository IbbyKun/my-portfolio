"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { nodes, edges, tiers } from "@/data/infrastructure"
// Shell size, camera path and handover timing are shared with the page
// companion so the two objects can be made to coincide exactly. See the module.
import { SHELL_R } from "@/lib/core-flight"
import "@/lib/three-console"

/**
 * Inside the companion.
 *
 * This scene owns the entire journey — approach, entry, interior and retreat —
 * rather than handing off to another object partway through. That is the whole
 * design: the shell you fly toward is rendered here, so the camera can actually
 * pass through it. An earlier version grew the page's scroll companion instead
 * and cross-faded at the moment of entry, which could never work, because the
 * companion draws into a fixed 1250px box and therefore cannot grow past the
 * viewport. It read as a ball vanishing, not as going inside one.
 *
 * Scroll drives one number, `progress`, and everything follows from it: the
 * camera flies from outside the shell down to the core and back out again. The
 * only perspective camera on the site, because depth is the entire point.
 */

/** Where the named services sit, as a band inside the shell. */
const R_INNER = 3.6
const R_OUTER = 14

const SHELL_POINTS = 20000
const MESH_COUNT = 190
const CURVE_STEPS = 30

// ---------------------------------------------------------------------------
// Deterministic helpers — no Math.random anywhere near a render path
// ---------------------------------------------------------------------------

function hash(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

export interface Placed {
  id: string
  label: string
  tier: string
  pos: THREE.Vector3
}

/**
 * Scatters the named services through the volume inside the shell.
 *
 * Deliberately loose rather than laid out on tidy shells: the brief was
 * scattered nodes wired to a core, and a regular lattice reads as a diagram.
 * Depth still biases the radius, so the tiers keep their rough ordering — state
 * near the middle, edge further out — without it being geometrically obvious.
 */
function placeNodes(): Placed[] {
  const golden = Math.PI * (3 - Math.sqrt(5))
  return nodes.map((node, i) => {
    const jitter = 0.72 + hash(i, 31) * 0.62
    const radius = THREE.MathUtils.lerp(R_INNER, R_OUTER, node.depth) * jitter
    const theta = i * golden * 2.7 + hash(i, 41) * 1.4
    const y = (hash(i, 2) - 0.5) * 1.5
    const ring = Math.sqrt(Math.max(0.12, 1 - y * y))
    return {
      id: node.id,
      label: node.label,
      tier: node.tier,
      pos: new THREE.Vector3(
        Math.cos(theta) * ring * radius,
        y * radius * 0.82,
        Math.sin(theta) * ring * radius,
      ),
    }
  })
}

/**
 * A wired path between two points.
 *
 * A quadratic bow, plus a sine that runs along its length and is pinned to zero
 * at both ends so the line still meets its endpoints cleanly. Both halves are
 * implemented identically here and in the charge shader, so the packets track
 * the drawn line exactly instead of drifting off it.
 */
interface Path {
  a: THREE.Vector3
  c: THREE.Vector3
  b: THREE.Vector3
  perp: THREE.Vector3
  freq: number
  phase: number
  amp: number
  radial: boolean
}

function samplePath(p: Path, t: number, out: THREE.Vector3) {
  const u = 1 - t
  out.set(
    u * u * p.a.x + 2 * u * t * p.c.x + t * t * p.b.x,
    u * u * p.a.y + 2 * u * t * p.c.y + t * t * p.b.y,
    u * u * p.a.z + 2 * u * t * p.c.z + t * t * p.b.z,
  )
  const wave = Math.sin(t * p.freq + p.phase) * p.amp * Math.sin(Math.PI * t)
  out.addScaledVector(p.perp, wave)
  return out
}

function buildPaths(placed: Placed[]): Path[] {
  const index = new Map(placed.map((p) => [p.id, p.pos]))
  const origin = new THREE.Vector3(0, 0, 0)
  const up = new THREE.Vector3(0, 1, 0)
  const alt = new THREE.Vector3(1, 0, 0)
  const out: Path[] = []

  const make = (a: THREE.Vector3, b: THREE.Vector3, i: number, radial: boolean): Path => {
    const run = b.clone().sub(a)
    const len = run.length()
    const axis = Math.abs(run.clone().normalize().dot(up)) > 0.9 ? alt : up
    const perp = run.clone().cross(axis).normalize()
    const side = i % 2 === 0 ? 1 : -1
    const c = a
      .clone()
      .add(b)
      .multiplyScalar(0.5)
      .addScaledVector(perp, len * (radial ? 0.22 : 0.14) * side)
    return {
      a: a.clone(),
      c,
      b: b.clone(),
      perp,
      // Two to three full waves over the run, so the line reads as slack cable
      // rather than as a wobble or as a sine wave being demonstrated.
      freq: 6.5 + hash(i, 53) * 6,
      phase: hash(i, 59) * Math.PI * 2,
      amp: len * (radial ? 0.075 : 0.05) * (0.6 + hash(i, 61)),
      radial,
    }
  }

  placed.forEach((p, i) => out.push(make(origin, p.pos, i, true)))
  edges.forEach((e, i) => {
    const a = index.get(e.from)
    const b = index.get(e.to)
    if (a && b) out.push(make(a, b, i + 17, false))
  })

  // Nearest-neighbour links on top of the real topology. A pure starburst from
  // one centre is a radial diagram; a network needs lateral connections too,
  // and those are what make the reference images read as neural rather than as
  // a sun with rays. Deduplicated against the topology edges, so a real
  // dependency is never drawn twice.
  const drawn = new Set(edges.map((e) => [e.from, e.to].sort().join("|")))
  placed.forEach((p, i) => {
    const near = placed
      .map((q, j) => ({ q, j, d: p.pos.distanceToSquared(q.pos) }))
      .filter((c) => c.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
    for (const c of near) {
      const key = [p.id, c.q.id].sort().join("|")
      if (drawn.has(key)) continue
      drawn.add(key)
      out.push(make(p.pos, c.q.pos, i + 61, false))
    }
  })

  return out
}

// ---------------------------------------------------------------------------
// Outer shell — the ball you fly into
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * The core: a single node, not a sphere.
 *
 * It used to be a 1500-point shell, which at this camera distance read as a
 * second ball sitting inside the first — a mass, where what the reference
 * images have at the centre is one very bright *point* that everything is
 * wired to.
 *
 * So: one vertex. A hot centre inside a wide soft halo, with the bloom pass
 * doing the rest. Everything else in the scene is timed to its beat.
 */
function Core({ inside }: { inside: React.RefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3))
    return g
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uInside: { value: 0 },
      uAccent: { value: new THREE.Color("#e8ffa8") },
    }),
    [],
  )
  useFrame((_, delta) => {
    const m = matRef.current
    if (!m) return
    m.uniforms.uTime.value += Math.min(delta, 1 / 30)
    m.uniforms.uInside.value = inside.current ?? 0
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          uniform float uTime;
          varying float vBeat;
          void main() {
            // A slow swell, not a strobe. This is the clock the charge and the
            // node flares are timed to, so its rate sets the feel of the whole
            // scene — fast reads as firing, slow reads as breathing.
            vBeat = 0.5 + 0.5 * sin(uTime * 0.5);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (108.0 + vBeat * 28.0) * (26.0 / -mv.z);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uAccent;
          uniform float uInside;
          varying float vBeat;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            // Hot centre inside a wide soft halo. Two falloffs rather than one,
            // because a single gaussian is either a hard dot or a vague cloud.
            float centre = pow(smoothstep(0.055, 0.0, d), 0.7);
            float halo = pow(smoothstep(0.5, 0.0, d), 3.2);
            float a = centre + halo * 0.26;
            if (a < 0.004) discard;
            gl_FragColor = vec4(uAccent, a * (0.75 + vBeat * 0.25) * uInside);
          }
        `}
      />
    </points>
  )
}

// ---------------------------------------------------------------------------
// Wired paths, and the charge running along them
// ---------------------------------------------------------------------------

/**
 * Filaments.
 *
 * Tubes, not lines. `THREE.Line` cannot be given a width — `linewidth` is
 * ignored by every desktop driver — so a line-based graph is always exactly one
 * pixel and always looks like a wireframe diagram. Real geometry can be given
 * thickness, taper with distance, catch a rim light, and most importantly it
 * can bloom, which is what makes the reference images read as filaments with
 * light inside them rather than as a chart.
 *
 * Every tube is merged into one geometry per family, so this is two draw calls
 * rather than forty-four.
 */
function Filaments({ paths, inside }: { paths: Path[]; inside: React.RefObject<number> }) {
  const radialMat = useRef<THREE.ShaderMaterial>(null)
  const linkMat = useRef<THREE.ShaderMaterial>(null)

  const { radial, links } = useMemo(() => {
    const build = (family: Path[], radius: number) => {
      const parts = family.map((path) => {
        const pts: THREE.Vector3[] = []
        for (let s = 0; s <= CURVE_STEPS; s++) {
          pts.push(samplePath(path, s / CURVE_STEPS, new THREE.Vector3()))
        }
        const curve = new THREE.CatmullRomCurve3(pts)
        return new THREE.TubeGeometry(curve, CURVE_STEPS + 6, radius, 5, false)
      })
      const merged = parts.length ? mergeGeometries(parts) : new THREE.BufferGeometry()
      parts.forEach((g) => g.dispose())
      return merged ?? new THREE.BufferGeometry()
    }
    return {
      radial: build(paths.filter((p) => p.radial), 0.028),
      links: build(paths.filter((p) => !p.radial), 0.018),
    }
  }, [paths])

  useEffect(
    () => () => {
      radial.dispose()
      links.dispose()
    },
    [radial, links],
  )

  const mkUniforms = (colour: string, gain: number) => ({
    uColor: { value: new THREE.Color(colour) },
    uInside: { value: 0 },
    uGain: { value: gain },
  })
  const radialUniforms = useMemo(() => mkUniforms("#ccff00", 1), [])
  const linkUniforms = useMemo(() => mkUniforms("#cfcfc6", 0.5), [])

  useFrame(() => {
    const v = inside.current ?? 0
    if (radialMat.current) radialMat.current.uniforms.uInside.value = v
    if (linkMat.current) linkMat.current.uniforms.uInside.value = v
  })

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  `

  const fragmentShader = /* glsl */ `
    uniform vec3 uColor;
    uniform float uInside;
    uniform float uGain;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      // Rim light. Additive tubes lit only by a flat colour read as plastic
      // rods; weighting the silhouette makes them read as glowing filaments,
      // and it is the rim that the bloom pass then picks up.
      float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 1.6);
      // Brighter at the core end, since that is where the charge comes from.
      float along = 1.0 - vUv.x;
      float a = (0.025 + rim * 0.19) * (0.4 + along * 0.6) * uGain * uInside;
      if (a < 0.002) discard;
      gl_FragColor = vec4(uColor, a);
    }
  `

  return (
    <group>
      <mesh geometry={radial} frustumCulled={false}>
        <shaderMaterial
          ref={radialMat}
          uniforms={radialUniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh geometry={links} frustumCulled={false}>
        <shaderMaterial
          ref={linkMat}
          uniforms={linkUniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/**
 * Out-of-focus blobs.
 *
 * A handful of very large, very soft sprites scattered through the volume. A
 * real depth-of-field pass would cost a full-screen blur every frame for an
 * effect that is decorative here; a few oversized points sell the same depth
 * for nothing, and the bloom pass smears them into exactly the soft bokeh the
 * reference images have.
 */
function Bokeh({ inside }: { inside: React.RefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const N = 46
    const pos: number[] = []
    const seed: number[] = []
    for (let i = 0; i < N; i++) {
      const r = 4 + hash(i, 91) * 20
      const t = hash(i, 93) * Math.PI * 2
      const y = (hash(i, 95) - 0.5) * 2
      const ring = Math.sqrt(Math.max(0.05, 1 - y * y))
      pos.push(Math.cos(t) * ring * r, y * r, Math.sin(t) * ring * r)
      seed.push(hash(i, 97))
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1))
    return g
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uInside: { value: 0 }, uAccent: { value: new THREE.Color("#ccff00") } }),
    [],
  )
  useFrame((_, delta) => {
    const m = matRef.current
    if (!m) return
    m.uniforms.uTime.value += Math.min(delta, 1 / 30)
    m.uniforms.uInside.value = inside.current ?? 0
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          uniform float uTime;
          attribute float aSeed;
          varying float vSeed;
          void main() {
            vSeed = aSeed;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (60.0 + aSeed * 140.0) * (26.0 / -mv.z);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uAccent;
          uniform float uInside;
          varying float vSeed;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            // A wide, very soft disc — this is a defocused highlight, so it has
            // almost no edge at all.
            float a = pow(smoothstep(0.5, 0.0, d), 2.2);
            if (a < 0.004) discard;
            gl_FragColor = vec4(uAccent, a * 0.05 * (0.4 + vSeed) * uInside);
          }
        `}
      />
    </points>
  )
}

function Charge({ paths, inside }: { paths: Path[]; inside: React.RefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const pos: number[] = []
    const A: number[] = []
    const C: number[] = []
    const B: number[] = []
    const P: number[] = []
    const wave: number[] = []
    const off: number[] = []
    const spd: number[] = []
    const rad: number[] = []

    paths.forEach((p, i) => {
      const count = p.radial ? 2 : 1
      for (let k = 0; k < count; k++) {
        pos.push(0, 0, 0)
        A.push(p.a.x, p.a.y, p.a.z)
        C.push(p.c.x, p.c.y, p.c.z)
        B.push(p.b.x, p.b.y, p.b.z)
        P.push(p.perp.x, p.perp.y, p.perp.z)
        wave.push(p.freq, p.phase, p.amp)
        off.push(k / count + hash(i, 83) * 0.12)
        spd.push(p.radial ? 0.085 : 0.05)
        rad.push(p.radial ? 1 : 0)
      }
    })

    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute("aA", new THREE.Float32BufferAttribute(A, 3))
    g.setAttribute("aC", new THREE.Float32BufferAttribute(C, 3))
    g.setAttribute("aB", new THREE.Float32BufferAttribute(B, 3))
    g.setAttribute("aPerp", new THREE.Float32BufferAttribute(P, 3))
    g.setAttribute("aWave", new THREE.Float32BufferAttribute(wave, 3))
    g.setAttribute("aOffset", new THREE.Float32BufferAttribute(off, 1))
    g.setAttribute("aSpeed", new THREE.Float32BufferAttribute(spd, 1))
    g.setAttribute("aRadial", new THREE.Float32BufferAttribute(rad, 1))
    return g
  }, [paths])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uInside: { value: 0 }, uAccent: { value: new THREE.Color("#ccff00") } }),
    [],
  )
  useFrame((_, delta) => {
    const m = matRef.current
    if (!m) return
    m.uniforms.uTime.value += Math.min(delta, 1 / 30)
    m.uniforms.uInside.value = inside.current ?? 0
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          uniform float uTime;
          attribute vec3 aA;
          attribute vec3 aC;
          attribute vec3 aB;
          attribute vec3 aPerp;
          attribute vec3 aWave;   // freq, phase, amplitude
          attribute float aOffset;
          attribute float aSpeed;
          attribute float aRadial;
          varying float vLife;
          varying float vRadial;

          void main() {
            float t = fract(uTime * aSpeed + aOffset);

            // Identical to samplePath() on the CPU, so a packet sits exactly on
            // the drawn line rather than near it.
            float u = 1.0 - t;
            vec3 p = u * u * aA + 2.0 * u * t * aC + t * t * aB;
            p += aPerp * (sin(t * aWave.x + aWave.y) * aWave.z * sin(3.14159265 * t));

            // Bright leaving the core, spent on arrival — direction has to be
            // readable from a still frame, not only from motion.
            vLife = pow(1.0 - t, 1.3);
            vRadial = aRadial;

            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (1.6 + vLife * 4.0) * (26.0 / -mv.z);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uAccent;
          uniform float uInside;
          varying float vLife;
          varying float vRadial;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float a = smoothstep(0.5, 0.05, d);
            if (a < 0.01) discard;
            gl_FragColor = vec4(uAccent, a * vLife * mix(0.3, 0.95, vRadial) * uInside);
          }
        `}
      />
    </points>
  )
}

// ---------------------------------------------------------------------------
// Scattered filler and node markers
// ---------------------------------------------------------------------------

function Filler({ inside }: { inside: React.RefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const pos: number[] = []
    const seed: number[] = []
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < MESH_COUNT; i++) {
      const y = 1 - (i / (MESH_COUNT - 1)) * 2
      const ring = Math.sqrt(Math.max(0, 1 - y * y))
      const t = i * golden
      const r = THREE.MathUtils.lerp(R_INNER, R_OUTER * 1.25, hash(i, 3))
      pos.push(
        Math.cos(t) * ring * r + (hash(i, 5) - 0.5) * 3,
        y * r * 0.7 + (hash(i, 7) - 0.5) * 3,
        Math.sin(t) * ring * r + (hash(i, 11) - 0.5) * 3,
      )
      seed.push(hash(i, 17))
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1))
    return g
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uInside: { value: 0 }, uAccent: { value: new THREE.Color("#ccff00") } }),
    [],
  )
  useFrame((_, delta) => {
    const m = matRef.current
    if (!m) return
    m.uniforms.uTime.value += Math.min(delta, 1 / 30)
    m.uniforms.uInside.value = inside.current ?? 0
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          uniform float uTime;
          attribute float aSeed;
          varying float vBlink;
          void main() {
            // Lit by a wave leaving the core, so the whole volume reads as
            // being powered from the middle rather than twinkling at random.
            float dist = length(position);
            vBlink = 0.3 + 0.7 * pow(max(0.0, sin(uTime * 0.5 - dist * 0.16 + aSeed * 2.0)), 3.0);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (1.8 + vBlink * 2.6) * (26.0 / -mv.z);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uAccent;
          uniform float uInside;
          varying float vBlink;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float a = smoothstep(0.5, 0.05, d);
            if (a < 0.01) discard;
            gl_FragColor = vec4(uAccent, a * vBlink * 0.22 * uInside);
          }
        `}
      />
    </points>
  )
}

function Nodes({ placed, inside }: { placed: Placed[]; inside: React.RefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const pos: number[] = []
    const dist: number[] = []
    placed.forEach((p) => {
      pos.push(p.pos.x, p.pos.y, p.pos.z)
      dist.push(p.pos.length())
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute("aDist", new THREE.Float32BufferAttribute(dist, 1))
    return g
  }, [placed])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uInside: { value: 0 },
      uAccent: { value: new THREE.Color("#ccff00") },
      uBase: { value: new THREE.Color("#cfcfc6") },
    }),
    [],
  )
  useFrame((_, delta) => {
    const m = matRef.current
    if (!m) return
    m.uniforms.uTime.value += Math.min(delta, 1 / 30)
    m.uniforms.uInside.value = inside.current ?? 0
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          uniform float uTime;
          attribute float aDist;
          varying float vArrive;
          void main() {
            // A node flares as the charge that left the core reaches it: same
            // clock, offset by its distance, so arrival and flare coincide.
            vArrive = pow(max(0.0, sin(uTime * 0.5 - aDist * 0.12)), 4.0);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            // Clamped: a node a couple of units from the camera would
            // otherwise fill a quarter of the screen with one ring.
            gl_PointSize = clamp((10.0 + vArrive * 10.0) * (26.0 / -mv.z), 4.0, 46.0);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uAccent;
          uniform vec3 uBase;
          uniform float uInside;
          varying float vArrive;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            // A ring with a centre, so nodes read as sockets and stay
            // distinguishable from the dust of the core and the filler.
            float ring = smoothstep(0.5, 0.42, d) * smoothstep(0.24, 0.33, d);
            float centre = smoothstep(0.14, 0.02, d);
            float a = ring * 0.95 + centre;
            if (a < 0.01) discard;
            gl_FragColor = vec4(mix(uBase, uAccent, 0.35 + vArrive * 0.65),
                                a * (0.45 + vArrive * 0.55) * uInside);
          }
        `}
      />
    </points>
  )
}

// ---------------------------------------------------------------------------
// The interior
// ---------------------------------------------------------------------------

/**
 * Everything inside the ball.
 *
 * Mounted as a child of the scroll companion's own scene, not a canvas of its
 * own. That is the whole point: there is one ball on this page, and this is
 * what is inside it. Two canvases meant two spheres, and no amount of matching
 * their size, colour and spin stopped the swap from being visible — because
 * there genuinely were two objects.
 *
 * Authored against a nominal shell radius of SHELL_R world units. The companion
 * scales this group by (its current world radius / SHELL_R), so these
 * coordinates stay meaningful whatever size the ball happens to be.
 */
export function Interior({
  inside,
  labelHost,
}: {
  /** 0 outside the shell, 1 once the camera is through it. */
  inside: React.RefObject<number>
  labelHost: React.RefObject<HTMLDivElement | null>
}) {
  const { camera, size } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const placed = useMemo(() => placeNodes(), [])
  const paths = useMemo(() => buildPaths(placed), [placed])
  const scratch = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        groupRef.current.rotation.y + 0.05,
        1,
        dt,
      )
    }

    // Labels are projected here rather than mounted with drei's Html: the
    // elements already exist, so this is a transform-only write.
    const host = labelHost.current
    const group = groupRef.current
    if (!host || !group) return
    const lit = inside.current ?? 0
    const children = host.children
    for (let i = 0; i < placed.length && i < children.length; i++) {
      const el = children[i] as HTMLElement
      if (lit < 0.01) {
        if (el.style.opacity !== "0") el.style.opacity = "0"
        continue
      }
      scratch.copy(placed[i].pos).applyMatrix4(group.matrixWorld)
      const depth = scratch.distanceTo(camera.position)
      scratch.project(camera)
      const x = (scratch.x * 0.5 + 0.5) * size.width
      const y = (-scratch.y * 0.5 + 0.5) * size.height
      const near = THREE.MathUtils.clamp(1 - (depth - 10) / 34, 0, 1)

      // Fade out over the reading column — a label on top of body text is
      // worse than no label, and no 3D arrangement keeps them clear on its own.
      const across = x / size.width
      const clear = 1 - THREE.MathUtils.smoothstep(across, 0.5, 0.68)

      // Behind the camera used to be a hard cut to zero, which made labels
      // blink on and off as nodes swung past the lens — and a label that
      // vanishes in one frame reads as a glitch, not as depth. Fade across the
      // boundary, and keep anything off the sides of the frame quiet too.
      const facing = 1 - THREE.MathUtils.smoothstep(scratch.z, 0.86, 1)
      const onScreen =
        THREE.MathUtils.smoothstep(x, -40, 90) * (1 - THREE.MathUtils.smoothstep(x, size.width - 200, size.width - 40))

      const target = near * lit * clear * facing * onScreen
      // Damped, so nothing on this layer can change faster than the eye reads
      // as motion.
      const prev = Number.parseFloat(el.style.opacity) || 0
      const next = prev + (target - prev) * (1 - Math.pow(0.002, dt))
      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
      el.style.opacity = next < 0.004 ? "0" : next.toFixed(3)
    }
  })

  return (
    <group ref={groupRef}>
      <Core inside={inside} />
      <Bokeh inside={inside} />
      <Filler inside={inside} />
      <Filaments paths={paths} inside={inside} />
      <Charge paths={paths} inside={inside} />
      <Nodes placed={placed} inside={inside} />
    </group>
  )
}

/** The named services, for the DOM label layer. */
export function interiorNodes() {
  return placeNodes()
}

export { tiers, SHELL_R }
