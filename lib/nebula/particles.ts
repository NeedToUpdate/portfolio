/**
 * Structured nebula generation.
 *
 * Each cloud picks a structural profile that assembles the reusable
 * emitters from structures.ts into a distinct anatomy (PLAN.md):
 *
 *  - orion: irregular multi-lobe body with a bright pink core, two
 *    opposing inner crescents forming an hourglass flow, cool exterior
 *    gas, and dark dust cutting through the centre.
 *  - helix: a cool blue cavity inside a thick, broken, doubled
 *    amber-orange ring, with cometary knots pointing into the cavity
 *    and dark red outer material.
 *  - crab: a blue-white mottled core under a branching orange-red
 *    filament web with irregular extensions, no clean ring anywhere.
 *
 * Layers land in two draw buckets: "dust" alpha-blends in generation
 * order (volume -> body -> shells -> wisps -> dark dust lanes on top),
 * "emission" adds afterwards (glow, filament webs), so filament
 * crossings brighten naturally.
 */

import type { ProfileName, ProfilePalette, RGB } from "./palettes";
import { profilePalettes } from "./palettes";
import {
  arcShell,
  filamentWeb,
  glowSpots,
  lobeCluster,
  range,
  stroke,
  type Mask,
  type RawParticle,
  type Rng,
} from "./structures";
import { rasterizePathToMask } from "./sdf";
import { nebulaShapes } from "./shapes";

export interface CloudSpec {
  /** Center in uv space (0..1, y up). */
  x: number;
  y: number;
  /** Radius in min-axis units. */
  radius: number;
  profile: ProfileName;
  /** Optional palette override; used by mini decorative variants. */
  palette?: ProfilePalette;
  /** Total particle budget for this cloud. */
  count: number;
  /** Overall brightness multiplier. */
  bright?: number;
}

export interface ParticleBuffers {
  /** xyz per particle: local offset in cloud-radius units, z is depth. */
  position: Float32Array;
  /** size (radius units), seed, kind (0 emission, 1 dust) per particle. */
  data: Float32Array;
  /** cloud center uv xy + radius per particle. */
  cloud: Float32Array;
  /** rgba per particle, straight alpha. */
  color: Float32Array;
  /** drift amplitude, pointer response, morph weight per particle. */
  motion: Float32Array;
  /** Morph pool per particle: 0 glyph interior, 1 glyph outline. */
  roles: Uint8Array;
  count: number;
  /** Dust particles occupy [0, dustCount); emission [dustCount, count). */
  dustCount: number;
}

interface ProfileOutput {
  dust: RawParticle[];
  emission: RawParticle[];
}

/** Gaussian cavity mask: carves low-density holes out of a layer. */
function cavityMask(
  holes: { x: number; y: number; r: number; depth: number }[]
): Mask {
  return (x, y) => {
    let keep = 1;
    for (const h of holes) {
      const dx = x - h.x;
      const dy = y - h.y;
      keep *= 1 - h.depth * Math.exp(-(dx * dx + dy * dy) / (h.r * h.r));
    }
    return keep;
  };
}

const jitter = (rng: Rng, amount: number) => (rng() - 0.5) * amount;

/**
 * Orion-like anatomy. The two inner arcs open toward each other from
 * offset centres with different radii and spans, which reads as an
 * hourglass flow through the bright core rather than a ring.
 */
function orionProfile(rng: Rng, count: number, pal: ProfilePalette): ProfileOutput {
  const coreX = -0.14 + jitter(rng, 0.1);
  const coreY = 0.04 + jitter(rng, 0.1);
  // One offset cavity plus a small secondary one.
  const mask = cavityMask([
    { x: 0.5 + jitter(rng, 0.15), y: 0.42 + jitter(rng, 0.15), r: 0.42, depth: 0.8 },
    { x: -0.55 + jitter(rng, 0.1), y: -0.5 + jitter(rng, 0.1), r: 0.3, depth: 0.6 },
  ]);

  const dust: RawParticle[] = [];
  const emission: RawParticle[] = [];

  // Outer volume: several offset lobes, stretched, so the silhouette
  // is lopsided with one long extension.
  dust.push(
    ...lobeCluster(rng, {
      count: Math.round(count * 0.16),
      lobes: [
        { cx: coreX, cy: coreY, r: 0.85, sx: 1.15, sy: 0.9 },
        { cx: 0.45, cy: -0.35, r: 0.7, sx: 1.3, sy: 0.75 },
        { cx: -0.55, cy: 0.4, r: 0.55 },
        { cx: 0.75 + jitter(rng, 0.2), cy: 0.55, r: 0.45, sx: 1.4, sy: 0.6 },
      ],
      colors: pal.volume,
      alpha: [0.012, 0.05],
      size: [0.26, 0.5],
      drift: 0.03,
      pointer: 0.3,
      morph: 0.15,
      zSpread: 0.5,
    })
  );

  // Body: pink/violet mass around the core, cooler gas outward.
  dust.push(
    ...lobeCluster(rng, {
      count: Math.round(count * 0.2),
      lobes: [
        { cx: coreX, cy: coreY, r: 0.5, w: 1.6 },
        { cx: coreX + 0.42, cy: coreY - 0.3, r: 0.45, sx: 1.25, sy: 0.8 },
        { cx: coreX - 0.38, cy: coreY + 0.22, r: 0.35 },
      ],
      colors: pal.body,
      brightColors: pal.bodyBright,
      brightChance: 0.18,
      alpha: [0.04, 0.14],
      size: [0.09, 0.18],
      drift: 0.026,
      pointer: 0.55,
      morph: 1,
      mask,
    })
  );

  // Two opposing inner crescents: different centres, radii, spans,
  // widths, and brightness, one much cloudier than the other.
  dust.push(
    ...arcShell(rng, {
      count: Math.round(count * 0.11),
      cx: coreX - 0.06,
      cy: coreY + 0.1,
      r: 0.48 + jitter(rng, 0.08),
      a0: -0.4 + jitter(rng, 0.3),
      a1: 2.5 + jitter(rng, 0.3),
      width: 0.065,
      wobble: 0.14,
      gaps: 0.35,
      colors: pal.inner,
      brightColors: pal.innerBright,
      alpha: [0.07, 0.2],
      brightAlpha: 0.3,
      size: [0.035, 0.08],
      drift: 0.022,
      pointer: 0.75,
      morph: 1,
    })
  );
  dust.push(
    ...arcShell(rng, {
      count: Math.round(count * 0.09),
      cx: coreX + 0.24,
      cy: coreY - 0.14,
      r: 0.68 + jitter(rng, 0.1),
      a0: 2.8 + jitter(rng, 0.3),
      a1: 5.7 + jitter(rng, 0.3),
      width: 0.1,
      wobble: 0.2,
      gaps: 0.5,
      colors: pal.inner,
      brightColors: pal.innerBright,
      alpha: [0.05, 0.15],
      brightAlpha: 0.24,
      size: [0.045, 0.1],
      drift: 0.024,
      pointer: 0.75,
      morph: 1,
    })
  );

  // Outer shell: two broken violet-blue crescents near the boundary.
  for (const seg of [
    { a0: 0.4, a1: 1.9, r: 1.02 },
    { a0: 2.6, a1: 4.4, r: 1.12 },
  ]) {
    dust.push(
      ...arcShell(rng, {
        count: Math.round(count * 0.05),
        cx: coreX + jitter(rng, 0.15),
        cy: coreY + jitter(rng, 0.15),
        r: seg.r,
        a0: seg.a0 + jitter(rng, 0.4),
        a1: seg.a1 + jitter(rng, 0.4),
        width: 0.13,
        wobble: 0.12,
        gaps: 0.45,
        colors: pal.shell,
        brightColors: pal.shellBright,
        alpha: [0.03, 0.11],
        brightAlpha: 0.18,
        size: [0.07, 0.14],
        drift: 0.03,
        pointer: 0.6,
        morph: 0.5,
      })
    );
  }

  // Wisps: curved strands flowing through the centre between the arcs.
  for (let i = 0; i < 6; i++) {
    const a = rng() * Math.PI * 2;
    const r0 = range(rng, 0.25, 0.6);
    const a2 = a + range(rng, 1.2, 2.4);
    dust.push(
      ...stroke(rng, {
        count: Math.round(count * 0.012),
        from: [coreX + Math.cos(a) * r0, coreY + Math.sin(a) * r0],
        ctrl: [coreX + jitter(rng, 0.5), coreY + jitter(rng, 0.5)],
        to: [coreX + Math.cos(a2) * range(rng, 0.3, 0.65), coreY + Math.sin(a2) * range(rng, 0.3, 0.65)],
        width: range(rng, 0.03, 0.07),
        colors: pal.wisp,
        alpha: [0.03, 0.12],
        size: [0.04, 0.09],
        drift: 0.035,
        pointer: 0.9,
        morph: 1,
        mask,
      })
    );
  }

  // Faint gas inside the cavity so it never reads as a clean hole.
  dust.push(
    ...lobeCluster(rng, {
      count: Math.round(count * 0.03),
      lobes: [{ cx: 0.5, cy: 0.42, r: 0.4 }],
      colors: pal.cavity,
      alpha: [0.03, 0.1],
      size: [0.12, 0.24],
      drift: 0.02,
      pointer: 0.35,
      morph: 0.15,
    })
  );

  // Dark dust lanes cutting through the bright centre, drawn on top.
  for (let i = 0; i < 3; i++) {
    const a = range(rng, 0.5, 1.1) + i * 2.1;
    dust.push(
      ...stroke(rng, {
        count: Math.round(count * 0.02),
        from: [coreX + Math.cos(a) * 0.85, coreY + Math.sin(a) * 0.85],
        ctrl: [coreX + jitter(rng, 0.4), coreY + jitter(rng, 0.4)],
        to: [coreX - Math.cos(a + 0.5) * 0.7, coreY - Math.sin(a + 0.5) * 0.7],
        width: range(rng, 0.05, 0.1),
        colors: pal.dust,
        alpha: [0.05, 0.18],
        size: [0.1, 0.2],
        drift: 0.02,
        pointer: 0.45,
        morph: 0.1,
      })
    );
  }

  // Emission: glow tight around the core and the brighter arc.
  emission.push(
    ...glowSpots(rng, {
      count: Math.round(count * 0.06),
      spots: [
        { x: coreX, y: coreY, r: 0.45, w: 2 },
        { x: coreX - 0.1, y: coreY + 0.35, r: 0.35 },
        { x: coreX + 0.3, y: coreY - 0.2, r: 0.4, w: 0.7 },
      ],
      colors: pal.glow,
      alpha: [0.008, 0.038],
      size: [0.3, 0.6],
      drift: 0.02,
      pointer: 0.4,
      morph: 0.6,
    })
  );

  return { dust, emission };
}

/**
 * Helix-like anatomy: two offset broken rings (the doubled helix look)
 * around a cool blue cavity, cometary knots pointing inward, dark red
 * outer extensions.
 */
function helixProfile(rng: Rng, count: number, pal: ProfilePalette): ProfileOutput {
  const ringR = 0.72;
  const tilt = rng() * Math.PI * 2;
  const mask = cavityMask([{ x: 0, y: 0, r: 0.44, depth: 0.85 }]);

  const dust: RawParticle[] = [];
  const emission: RawParticle[] = [];

  // Outer volume: dark red-brown lobes sitting on the ring path.
  const volumeLobes = Array.from({ length: 6 }, (_, i) => {
    const a = tilt + (i / 6) * Math.PI * 2 + jitter(rng, 0.5);
    return {
      cx: Math.cos(a) * 0.8,
      cy: Math.sin(a) * 0.8,
      r: range(rng, 0.35, 0.55),
    };
  });
  dust.push(
    ...lobeCluster(rng, {
      count: Math.round(count * 0.16),
      lobes: volumeLobes,
      colors: pal.volume,
      alpha: [0.012, 0.05],
      size: [0.24, 0.45],
      drift: 0.026,
      pointer: 0.3,
      morph: 0.15,
      zSpread: 0.5,
    })
  );

  // Cool blue gas filling the cavity, faint enough to see stars through.
  dust.push(
    ...lobeCluster(rng, {
      count: Math.round(count * 0.12),
      lobes: [
        { cx: jitter(rng, 0.1), cy: jitter(rng, 0.1), r: 0.5, w: 1.5 },
        { cx: jitter(rng, 0.3), cy: jitter(rng, 0.3), r: 0.3 },
      ],
      colors: pal.body,
      brightColors: pal.bodyBright,
      brightChance: 0.12,
      alpha: [0.03, 0.08],
      size: [0.13, 0.26],
      drift: 0.02,
      pointer: 0.45,
      morph: 1,
    })
  );

  // The main ring: two full, heavily-broken arcs with offset centres
  // and different radii/widths, so they overlap like a wound ribbon.
  const ringA = { cx: 0.07, cy: -0.05, r: ringR * 0.92, width: 0.11, gaps: 0.3 };
  const ringB = { cx: -0.08, cy: 0.06, r: ringR * 1.08, width: 0.14, gaps: 0.45 };
  for (const ring of [ringA, ringB]) {
    dust.push(
      ...arcShell(rng, {
        count: Math.round(count * 0.14),
        cx: ring.cx,
        cy: ring.cy,
        r: ring.r,
        a0: tilt,
        a1: tilt + Math.PI * 2,
        width: ring.width,
        wobble: 0.11,
        gaps: ring.gaps,
        colors: pal.shell,
        brightColors: pal.shellBright,
        alpha: [0.04, 0.13],
        brightAlpha: 0.22,
        size: [0.07, 0.15],
        drift: 0.024,
        pointer: 0.6,
        morph: 1,
      })
    );
  }

  // Inner rim: short bright amber arcs where the ring faces the cavity,
  // mixed with a couple of cool blue arcs just inside.
  for (let i = 0; i < 3; i++) {
    const a0 = tilt + rng() * Math.PI * 2;
    dust.push(
      ...arcShell(rng, {
        count: Math.round(count * 0.035),
        cx: jitter(rng, 0.08),
        cy: jitter(rng, 0.08),
        r: range(rng, 0.5, 0.58),
        a0,
        a1: a0 + range(rng, 0.8, 1.8),
        width: 0.05,
        wobble: 0.1,
        gaps: 0.25,
        colors: pal.inner,
        brightColors: pal.innerBright,
        alpha: [0.06, 0.18],
        brightAlpha: 0.24,
        size: [0.04, 0.08],
        drift: 0.022,
        pointer: 0.75,
        morph: 1,
      })
    );
  }

  // Cometary knots: short strokes with heads at the cavity edge and
  // tails streaming outward into the ring.
  const knots = 8 + Math.floor(rng() * 6);
  for (let i = 0; i < knots; i++) {
    const a = rng() * Math.PI * 2;
    const head = 0.42 + rng() * 0.06;
    const tail = head + range(rng, 0.14, 0.26);
    dust.push(
      ...stroke(rng, {
        count: Math.round(count * 0.006),
        from: [Math.cos(a) * head, Math.sin(a) * head],
        ctrl: [Math.cos(a + 0.06) * ((head + tail) / 2), Math.sin(a + 0.06) * ((head + tail) / 2)],
        to: [Math.cos(a + 0.12) * tail, Math.sin(a + 0.12) * tail],
        width: 0.022,
        colors: pal.wisp,
        alpha: [0.06, 0.16],
        size: [0.025, 0.05],
        drift: 0.03,
        pointer: 0.9,
        morph: 1,
      })
    );
  }

  // Sparse dark red material breaking the outer edge of the ring.
  for (let i = 0; i < 2; i++) {
    const a = rng() * Math.PI * 2;
    dust.push(
      ...stroke(rng, {
        count: Math.round(count * 0.015),
        from: [Math.cos(a) * 0.75, Math.sin(a) * 0.75],
        ctrl: [Math.cos(a + 0.6) * 0.95, Math.sin(a + 0.6) * 0.95],
        to: [Math.cos(a + 1.2) * 0.8, Math.sin(a + 1.2) * 0.8],
        width: range(rng, 0.06, 0.1),
        colors: pal.dust,
        alpha: [0.05, 0.16],
        size: [0.09, 0.16],
        drift: 0.02,
        pointer: 0.45,
        morph: 0.1,
      })
    );
  }

  // Emission: cool glow in the cavity, warm glow on ring sections.
  emission.push(
    ...glowSpots(rng, {
      count: Math.round(count * 0.05),
      spots: [
        { x: 0, y: 0, r: 0.42, w: 1.4 },
        { x: Math.cos(tilt) * ringR, y: Math.sin(tilt) * ringR, r: 0.3 },
        { x: Math.cos(tilt + 2.4) * ringR, y: Math.sin(tilt + 2.4) * ringR, r: 0.3 },
      ],
      colors: pal.glow,
      alpha: [0.007, 0.032],
      size: [0.26, 0.55],
      drift: 0.018,
      pointer: 0.4,
      morph: 0.6,
    })
  );

  return { dust, emission };
}

/**
 * Crab-like anatomy: mottled blue-white body under an additive
 * filament web that stretches into irregular extensions.
 */
function crabProfile(rng: Rng, count: number, pal: ProfilePalette): ProfileOutput {
  const dust: RawParticle[] = [];
  const emission: RawParticle[] = [];

  dust.push(
    ...lobeCluster(rng, {
      count: Math.round(count * 0.14),
      lobes: [
        { cx: jitter(rng, 0.2), cy: jitter(rng, 0.2), r: 0.75, sx: 1.2, sy: 0.85 },
        { cx: range(rng, 0.3, 0.6), cy: jitter(rng, 0.5), r: 0.5 },
        { cx: -range(rng, 0.3, 0.6), cy: jitter(rng, 0.5), r: 0.45 },
      ],
      colors: pal.volume,
      alpha: [0.012, 0.045],
      size: [0.22, 0.42],
      drift: 0.026,
      pointer: 0.3,
      morph: 0.15,
      zSpread: 0.5,
    })
  );

  // Blue-white mottled core: several small bright lobes, not one blob.
  const coreLobes = Array.from({ length: 4 }, () => ({
    cx: jitter(rng, 0.5),
    cy: jitter(rng, 0.5),
    r: range(rng, 0.18, 0.32),
  }));
  dust.push(
    ...lobeCluster(rng, {
      count: Math.round(count * 0.2),
      lobes: coreLobes,
      colors: pal.body,
      brightColors: pal.bodyBright,
      brightChance: 0.18,
      alpha: [0.04, 0.12],
      size: [0.07, 0.15],
      drift: 0.024,
      pointer: 0.55,
      morph: 1,
    })
  );

  // A couple of subtle dark threads over the core.
  const a = rng() * Math.PI * 2;
  dust.push(
    ...stroke(rng, {
      count: Math.round(count * 0.015),
      from: [Math.cos(a) * 0.6, Math.sin(a) * 0.6],
      ctrl: [jitter(rng, 0.3), jitter(rng, 0.3)],
      to: [-Math.cos(a + 0.4) * 0.55, -Math.sin(a + 0.4) * 0.55],
      width: range(rng, 0.04, 0.07),
      colors: pal.dust,
      alpha: [0.04, 0.13],
      size: [0.08, 0.15],
      drift: 0.02,
      pointer: 0.45,
      morph: 0.1,
    })
  );

  // The filament web: the crab's signature, additive so crossings glow.
  emission.push(
    ...filamentWeb(rng, {
      count: Math.round(count * 0.42),
      roots: 22,
      origin: [0.12, 0.42],
      reach: 1.05,
      step: 0.035,
      curl: 0.55,
      branch: 0.08,
      colors: pal.filament,
      brightColors: pal.filamentBright,
      alpha: [0.05, 0.15],
      size: [0.022, 0.055],
      drift: 0.032,
      pointer: 0.95,
      morph: 1,
    })
  );
  // Irregular long extensions past the main body.
  emission.push(
    ...filamentWeb(rng, {
      count: Math.round(count * 0.08),
      roots: 5,
      origin: [0.5, 0.7],
      reach: 1.35,
      step: 0.045,
      curl: 0.4,
      branch: 0.04,
      colors: pal.filament,
      brightColors: pal.filamentBright,
      alpha: [0.04, 0.11],
      size: [0.02, 0.045],
      drift: 0.036,
      pointer: 1,
      morph: 1,
    })
  );

  emission.push(
    ...glowSpots(rng, {
      count: Math.round(count * 0.05),
      spots: [
        { x: 0, y: 0, r: 0.5, w: 2 },
        { x: jitter(rng, 0.6), y: jitter(rng, 0.6), r: 0.35 },
      ],
      colors: pal.glow,
      alpha: [0.006, 0.028],
      size: [0.24, 0.5],
      drift: 0.018,
      pointer: 0.4,
      morph: 0.6,
    })
  );

  return { dust, emission };
}

const profiles: Record<
  ProfileName,
  (rng: Rng, count: number, pal: ProfilePalette) => ProfileOutput
> = {
  orion: orionProfile,
  helix: helixProfile,
  crab: crabProfile,
};

/** Builds packed GPU buffers for the given clouds. */
export function generateParticles(clouds: CloudSpec[]): ParticleBuffers {
  const rng = Math.random;
  const dustFlat: { p: RawParticle; c: CloudSpec }[] = [];
  const emissionFlat: { p: RawParticle; c: CloudSpec }[] = [];

  for (const c of clouds) {
    const out = profiles[c.profile](rng, c.count, c.palette ?? profilePalettes[c.profile]);
    for (const p of out.dust) dustFlat.push({ p, c });
    for (const p of out.emission) emissionFlat.push({ p, c });
  }

  const all = [...dustFlat, ...emissionFlat];
  const count = all.length;
  const position = new Float32Array(count * 3);
  const data = new Float32Array(count * 3);
  const cloud = new Float32Array(count * 3);
  const color = new Float32Array(count * 4);
  const motion = new Float32Array(count * 3);
  const roles = new Uint8Array(count);

  all.forEach(({ p, c }, i) => {
    const kind = i < dustFlat.length ? 1 : 0;
    position.set([p.x, p.y, Math.max(-1, Math.min(1, p.z))], i * 3);
    data.set([p.size, rng(), kind], i * 3);
    cloud.set([c.x, c.y, c.radius], i * 3);
    color.set([p.color[0], p.color[1], p.color[2], p.alpha * (c.bright ?? 1)], i * 4);
    motion.set([p.drift, p.pointer, p.morph], i * 3);
    roles[i] = p.role;
  });

  return { position, data, cloud, color, motion, roles, count, dustCount: dustFlat.length };
}

export interface ShapePools {
  /** xy pairs on the glyph outline, in [-1,1] glyph space. */
  edge: Float32Array;
  /** xy pairs filling the glyph interior. */
  interior: Float32Array;
}

/**
 * Samples morph target points for a glyph, split into outline and
 * interior pools so shell/filament particles trace the boundary while
 * body gas fills it. Browser only (rasterizes to a canvas).
 */
export function sampleShapeTargets(shapeKey: string, poolSize: number): ShapePools {
  const empty = { edge: new Float32Array(0), interior: new Float32Array(0) };
  const path = nebulaShapes[shapeKey];
  if (!path) return empty;

  const size = 96;
  const mask = rasterizePathToMask(path, size);

  const interiorIdx: number[] = [];
  const edgeIdx: number[] = [];
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      if (!mask[i]) continue;
      const isEdge = !mask[i - 1] || !mask[i + 1] || !mask[i - size] || !mask[i + size];
      (isEdge ? edgeIdx : interiorIdx).push(i);
    }
  }
  if (interiorIdx.length === 0 && edgeIdx.length === 0) return empty;
  if (interiorIdx.length === 0) interiorIdx.push(...edgeIdx);
  if (edgeIdx.length === 0) edgeIdx.push(...interiorIdx);

  const sample = (pool: number[], n: number): Float32Array => {
    const out = new Float32Array(n * 2);
    for (let p = 0; p < n; p++) {
      const i = pool[Math.floor(Math.random() * pool.length)];
      out[p * 2] = ((i % size) / size) * 2 - 1;
      out[p * 2 + 1] = (Math.floor(i / size) / size) * 2 - 1;
    }
    return out;
  };

  return {
    edge: sample(edgeIdx, Math.floor(poolSize / 2)),
    interior: sample(interiorIdx, Math.ceil(poolSize / 2)),
  };
}
