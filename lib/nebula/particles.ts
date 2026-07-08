/**
 * Particle generation for the point-cloud nebulae.
 *
 * Each cloud is thousands of soft sprites deposited along tapered Bezier
 * "fingers" that rise from a shared base, after the Pillars of Creation:
 * columns wide and dense at the bottom, narrowing to hooked tips. This
 * gives recognizable dusty pillars instead of round blobs.
 *
 * Two gas kinds share each cloud (kind 0 = ionized emission gas,
 * kind 1 = molecular dust). Dust draws first with alpha blending so it
 * occludes the background; emission draws additively so it glows.
 *
 * Each particle also carries a rim value (0 buried in the core, 1 at the
 * surface) and a facing value (-1 backlit .. 1 toward a top-left light).
 * The shader keeps cores near-black and lights only the thin rims:
 * warm gold where they face the light, cool cyan where backlit.
 */

import { rasterizePathToMask } from "./sdf";
import { nebulaShapes } from "./shapes";

/** Global sprite-size multiplier: smaller = finer, higher-resolution gas. */
const GLOBAL_SIZE = 0.7;

export interface CloudSpec {
  /** Center in uv space (0..1). */
  x: number;
  y: number;
  /** Radius in min-axis units. */
  radius: number;
  strength: number;
  /** Color palette index: 0 = pillars, 1 = red, 2 = blue. */
  paletteGroup: 0 | 1 | 2;
  /** Morphology: tapered columns or round blobs. */
  shape: "pillar" | "round";
  /** Pillar count (pillar shape only). */
  fingerCount?: number;
  /** Horizontal spread multiplier (pillar shape only): >1 fans wider. */
  spread?: number;
  /** Particle count for this cloud; falls back to the global default. */
  count?: number;
  /** Sprite size multiplier: <1 makes finer, crisper particles. */
  sizeScale?: number;
  /** Brightness multiplier for this cloud's particles (default 1). */
  bright?: number;
}

export interface ParticleBuffers {
  /** xyz per particle: local offset in cloud-radius units, z is depth. */
  position: Float32Array;
  /** size (radius units), seed, kind per particle. */
  data: Float32Array;
  /** cloud center uv xy + radius per particle. */
  cloud: Float32Array;
  /** rim (0 core..1 surface), facing (-1 backlit..1 lit) per particle. */
  shade: Float32Array;
  /** palette group (0 or 1) per particle. */
  palette: Float32Array;
  /** brightness multiplier per particle. */
  bright: Float32Array;
  count: number;
  /** Dust particles occupy [0, dustCount); emission [dustCount, count). */
  dustCount: number;
}

type Vec2 = [number, number];

interface Finger {
  p0: Vec2;
  p1: Vec2;
  p2: Vec2;
  p3: Vec2;
  baseR: number;
  tipR: number;
  /** Sideways wobble of the centreline. */
  wobAmp: number;
  wobFreq: number;
  wobPhase: number;
  /** Radius bulges: swells and pinches that break up the smooth taper. */
  bulgeAmp: number;
  bulgeFreq: number;
  bulgePhase: number;
}

function gaussian(rand: () => number): number {
  // Box-Muller: standard normal, for round-blob clustering.
  const u = Math.max(rand(), 1e-6);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function bezier(f: Finger, t: number): Vec2 {
  const s = 1 - t;
  const a = s * s * s;
  const b = 3 * s * s * t;
  const c = 3 * s * t * t;
  const d = t * t * t;
  return [
    a * f.p0[0] + b * f.p1[0] + c * f.p2[0] + d * f.p3[0],
    a * f.p0[1] + b * f.p1[1] + c * f.p2[1] + d * f.p3[1],
  ];
}

/** Radius along a finger: holds width, then tapers, with lumps. */
function taper(f: Finger, t: number): number {
  const body = f.tipR + (f.baseR - f.tipR) * Math.pow(1 - t, 0.5);
  const head = (f.baseR - f.tipR) * 0.3 * Math.exp(-Math.pow((t - 0.85) / 0.12, 2));
  const bulge = f.bulgeAmp * Math.sin(t * f.bulgeFreq + f.bulgePhase);
  return Math.max(0.05, body + head + bulge);
}

function makeFingers(rand: () => number, count: number, spread: number): Finger[] {
  const baseCx = (rand() - 0.5) * 0.2 * spread;
  const baseCy = -0.6;
  const fingers: Finger[] = [];
  for (let k = 0; k < count; k++) {
    const bx = baseCx + (k - (count - 1) / 2) * (0.28 + rand() * 0.1) * spread;
    const by = baseCy + rand() * 0.08;
    const height = 0.85 + rand() * 0.35; // shorter, stouter columns
    const tipX = bx + (rand() - 0.5) * 0.16; // gentle lean, not a fan
    const ty = by + height;
    fingers.push({
      p0: [bx, by],
      p1: [bx + (rand() - 0.5) * 0.1, by + height * 0.4],
      p2: [tipX + (rand() - 0.5) * 0.1, by + height * 0.72],
      p3: [tipX, ty],
      baseR: 0.52 + rand() * 0.18,
      tipR: 0.2 + rand() * 0.1, // fat, stout columns with a soft taper
      wobAmp: 0.03 + rand() * 0.04,
      wobFreq: 4 + rand() * 5,
      wobPhase: rand() * Math.PI * 2,
      bulgeAmp: 0.045 + rand() * 0.05,
      bulgeFreq: 2.5 + rand() * 3,
      bulgePhase: rand() * Math.PI * 2,
    });
  }
  return fingers;
}

/** Appends one particle's flat entry to a bucket. */
function emit(
  bucket: number[][],
  c: CloudSpec,
  px: number,
  py: number,
  pz: number,
  size: number,
  seed: number,
  kind: 0 | 1,
  rim: number,
  facing: number
): void {
  bucket.push([
    px, py, pz, size, seed, kind, c.x, c.y, c.radius, rim, facing, c.paletteGroup, c.bright ?? 1,
  ]);
}

/**
 * Layered particle populations. Dust layers draw back to front in this
 * order: large soft volume fills the mass, medium opaque body gives it
 * substance, small sharp detail sits on top defining the outline. A soft
 * emission layer adds the surrounding glow. Blur and opacity follow
 * sprite size in the shader, so each layer reads distinctly.
 */
interface Layer {
  frac: number;
  emission: boolean;
  sizeMin: number;
  sizeVar: number;
  /** Deposit on the surface (outline) rather than through the body. */
  surface: boolean;
  /** Radial fill exponent and reach (body layers). */
  magPow: number;
  magMul: number;
}

const LAYERS: Layer[] = [
  { frac: 0.3, emission: false, sizeMin: 0.18, sizeVar: 0.14, surface: false, magPow: 0.4, magMul: 1.25 }, // volume
  { frac: 0.28, emission: false, sizeMin: 0.08, sizeVar: 0.05, surface: false, magPow: 0.5, magMul: 1.0 }, // body
  { frac: 0.22, emission: false, sizeMin: 0.028, sizeVar: 0.026, surface: true, magPow: 0.5, magMul: 1.0 }, // detail / outline
  { frac: 0.2, emission: true, sizeMin: 0.12, sizeVar: 0.2, surface: false, magPow: 0.4, magMul: 1.5 }, // glow
];

/** Deposits layered particles along tapered Bezier pillars. */
function depositPillars(
  c: CloudSpec,
  perCloud: number,
  rand: () => number,
  dust: number[][],
  emission: number[][]
): void {
  const fingers = makeFingers(rand, c.fingerCount ?? 3, c.spread ?? 1);
  const sizeScale = (c.sizeScale ?? 1) * GLOBAL_SIZE;

  for (const L of LAYERS) {
    const n = Math.round(perCloud * L.frac);
    const bucket = L.emission ? emission : dust;
    for (let i = 0; i < n; i++) {
      const finger = fingers[Math.floor(rand() * fingers.length)];
      const t = Math.pow(rand(), 1.15);
      const centre = bezier(finger, t);
      centre[0] += finger.wobAmp * Math.sin(t * finger.wobFreq + finger.wobPhase);
      const rad = taper(finger, t);

      const ang = rand() * Math.PI * 2;
      const mag = L.surface
        ? rad * (0.75 + rand() * 0.35) // ride the outline
        : Math.pow(rand(), L.magPow) * rad * L.magMul;
      const ox = Math.cos(ang) * mag;
      const oz = Math.sin(ang) * mag;

      const rim = Math.min(mag / Math.max(rad, 1e-4), 1);
      const facing = mag > 1e-4 ? Math.max(-1, Math.min(1, -ox / mag)) : 0;
      const size = (L.sizeMin + rand() * L.sizeVar) * sizeScale;

      emit(
        bucket,
        c,
        centre[0] + ox,
        centre[1] + (rand() - 0.5) * 0.04,
        oz,
        size,
        rand(),
        L.emission ? 0 : 1,
        rim,
        facing
      );
    }
  }
}

/**
 * Deposits particles as an irregular cluster of offset, elongated lobes.
 * Several lumps of varied size and stretch, spread apart and sampled by
 * weight, give a lopsided nebula rather than a perfect circle.
 */
function depositRound(
  c: CloudSpec,
  perCloud: number,
  rand: () => number,
  dust: number[][],
  emission: number[][]
): void {
  const lobeCount = 3 + Math.floor(rand() * 3); // 3-5 lumps
  const lobes = Array.from({ length: lobeCount }, () => ({
    cx: (rand() - 0.5) * 1.1,
    cy: (rand() - 0.5) * 1.1,
    cz: (rand() - 0.5) * 0.6,
    r: 0.22 + rand() * 0.4,
    sx: 0.6 + rand() * 0.9, // per-lobe stretch
    sy: 0.6 + rand() * 0.9,
    sz: 0.6 + rand() * 0.6,
    w: 0.4 + rand(), // sampling weight: bigger lumps get more particles
  }));
  const totalW = lobes.reduce((s, l) => s + l.w, 0);
  const sizeScale = (c.sizeScale ?? 1) * GLOBAL_SIZE;

  for (const L of LAYERS) {
    const n = Math.round(perCloud * L.frac);
    const bucket = L.emission ? emission : dust;
    for (let i = 0; i < n; i++) {
      let pick = rand() * totalW;
      let lobe = lobes[0];
      for (const l of lobes) {
        pick -= l.w;
        if (pick <= 0) {
          lobe = l;
          break;
        }
      }

      let gx = gaussian(rand);
      let gy = gaussian(rand);
      let gz = gaussian(rand);
      let rim: number;
      if (L.surface) {
        // Project onto a shell so detail particles ride the surface.
        const gm = Math.hypot(gx, gy, gz) || 1;
        const shell = 1.8 + rand() * 0.5;
        gx = (gx / gm) * shell;
        gy = (gy / gm) * shell;
        gz = (gz / gm) * shell;
        rim = Math.min(shell / 2.2, 1);
      } else {
        rim = Math.min(Math.hypot(gx, gy, gz) / 2.2, 1);
      }

      const ox = gx * lobe.r * 0.5 * lobe.sx;
      const oy = gy * lobe.r * 0.5 * lobe.sy;
      const oz = gz * lobe.r * 0.5 * lobe.sz;
      const mag = Math.hypot(ox, oy, oz);
      const facing = mag > 1e-4 ? Math.max(-1, Math.min(1, -ox / mag)) : 0;
      const size = (L.sizeMin + rand() * L.sizeVar) * sizeScale;

      emit(
        bucket,
        c,
        lobe.cx + ox,
        lobe.cy + oy,
        oz,
        size,
        rand(),
        L.emission ? 0 : 1,
        rim,
        facing
      );
    }
  }
}

/** Particle set for the given clouds, by each cloud's morphology. */
export function generateParticles(clouds: CloudSpec[], perCloud = 2600): ParticleBuffers {
  const rand = Math.random;
  const dust: number[][] = [];
  const emission: number[][] = [];

  for (const cloudSpec of clouds) {
    if (cloudSpec.strength <= 0) continue;
    const n = cloudSpec.count ?? perCloud;
    if (cloudSpec.shape === "round") {
      depositRound(cloudSpec, n, rand, dust, emission);
    } else {
      depositPillars(cloudSpec, n, rand, dust, emission);
    }
  }

  const all = [...dust, ...emission];
  const count = all.length;
  const position = new Float32Array(count * 3);
  const data = new Float32Array(count * 3);
  const cloud = new Float32Array(count * 3);
  const shade = new Float32Array(count * 2);
  const palette = new Float32Array(count);
  const bright = new Float32Array(count);
  all.forEach((p, i) => {
    position.set([p[0], p[1], p[2]], i * 3);
    data.set([p[3], p[4], p[5]], i * 3);
    cloud.set([p[6], p[7], p[8]], i * 3);
    shade.set([p[9], p[10]], i * 2);
    palette[i] = p[11];
    bright[i] = p[12];
  });

  return { position, data, cloud, shade, palette, bright, count, dustCount: dust.length };
}

/**
 * Samples target points inside a glyph for the morph. Returns points in
 * [-1, 1] glyph space, biased toward the outline so shapes read crisply.
 * Browser only (rasterizes to a canvas).
 */
export function sampleShapeTargets(shapeKey: string, count: number): Float32Array {
  const path = nebulaShapes[shapeKey];
  const out = new Float32Array(count * 2);
  if (!path) return out;

  const size = 96;
  const mask = rasterizePathToMask(path, size);

  // Collect interior and edge points.
  const interior: number[] = [];
  const edge: number[] = [];
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      if (!mask[i]) continue;
      const isEdge =
        !mask[i - 1] || !mask[i + 1] || !mask[i - size] || !mask[i + size];
      (isEdge ? edge : interior).push(i);
    }
  }
  const pool = interior.length > 0 ? interior : edge;
  if (pool.length === 0) return out;

  for (let p = 0; p < count; p++) {
    // Two thirds outline, one third fill: the glyph edge carries the shape.
    const fromEdge = edge.length > 0 && p % 3 !== 0;
    const src = fromEdge ? edge : pool;
    const i = src[Math.floor(Math.random() * src.length)];
    const x = i % size;
    const y = Math.floor(i / size);
    out[p * 2] = (x / size) * 2 - 1;
    out[p * 2 + 1] = (y / size) * 2 - 1;
  }
  return out;
}
