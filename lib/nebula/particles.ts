/**
 * Particle generation for the point-cloud nebulae.
 *
 * Each cloud is thousands of soft sprites. Positions come from a
 * random-walk deposition around metaball-style lobes: walks wander out
 * from lobe centers and drop particles along the way, which produces
 * organic clumps and filaments instead of geometric blobs.
 *
 * Two gas kinds share each cloud (kind 0 = ionized emission gas,
 * kind 1 = molecular dust). Dust draws first with alpha blending so it
 * occludes the background; emission draws additively so it glows.
 */

import { rasterizePathToMask } from "./sdf";
import { nebulaShapes } from "./shapes";

export interface CloudSpec {
  /** Center in uv space (0..1). */
  x: number;
  y: number;
  /** Radius in min-axis units. */
  radius: number;
  strength: number;
}

export interface ParticleBuffers {
  /** xyz per particle: local offset in cloud-radius units, z is depth. */
  position: Float32Array;
  /** size (radius units), seed, kind per particle. */
  data: Float32Array;
  /** cloud center uv xy + radius per particle. */
  cloud: Float32Array;
  count: number;
  /** Dust particles occupy [0, dustCount); emission [dustCount, count). */
  dustCount: number;
}

interface Lobe {
  cx: number;
  cy: number;
  cz: number;
  r: number;
  kind: 0 | 1;
}

function gaussian(rand: () => number): number {
  // Box-Muller; good enough clustering without heavy math.
  const u = Math.max(rand(), 1e-6);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Deterministic-ish particle set for the given clouds. */
export function generateParticles(clouds: CloudSpec[], perCloud = 2600): ParticleBuffers {
  const rand = Math.random;
  const dust: number[][] = [];
  const emission: number[][] = [];

  for (const cloudSpec of clouds) {
    if (cloudSpec.strength <= 0) continue;

    // Four lobes per cloud: two bright, two dark, stuck together.
    const lobes: Lobe[] = Array.from({ length: 4 }, (_, i) => ({
      cx: (rand() - 0.5) * 0.9,
      cy: (rand() - 0.5) * 0.9,
      cz: (rand() - 0.5) * 0.6,
      r: 0.25 + rand() * 0.3,
      kind: (i < 2 ? 0 : 1) as 0 | 1,
    }));

    for (let i = 0; i < perCloud; i++) {
      const lobe = lobes[Math.floor(rand() * lobes.length)];

      // Random walk out from the lobe center: clumpy, filamentary.
      let px = lobe.cx;
      let py = lobe.cy;
      let pz = lobe.cz;
      const steps = 2 + Math.floor(rand() * 6);
      for (let s = 0; s < steps; s++) {
        const stepLen = lobe.r * 0.22;
        px += gaussian(rand) * stepLen;
        py += gaussian(rand) * stepLen;
        pz += gaussian(rand) * stepLen * 0.6;
      }

      const seed = rand();
      const isDust = lobe.kind === 1;
      // Emission fog sprites run large and dim; dust runs smaller, denser.
      const size = isDust ? 0.06 + rand() * 0.16 : 0.08 + rand() * 0.24;

      const entry = [
        px,
        py,
        pz,
        size,
        seed,
        lobe.kind,
        cloudSpec.x,
        cloudSpec.y,
        cloudSpec.radius,
      ];
      (isDust ? dust : emission).push(entry);
    }
  }

  const all = [...dust, ...emission];
  const count = all.length;
  const position = new Float32Array(count * 3);
  const data = new Float32Array(count * 3);
  const cloud = new Float32Array(count * 3);
  all.forEach((p, i) => {
    position.set([p[0], p[1], p[2]], i * 3);
    data.set([p[3], p[4], p[5]], i * 3);
    cloud.set([p[6], p[7], p[8]], i * 3);
  });

  return { position, data, cloud, count, dustCount: dust.length };
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
