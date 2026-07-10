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
  starSprinkle,
  stroke,
  wispStreaks,
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
  /** streak orientation per particle, radians (wisp sprites only). */
  angle: Float32Array;
  /** Morph pool per particle: 0 glyph interior, 1 glyph outline. */
  roles: Uint8Array;
  count: number;
  /** Dust particles occupy [0, dustCount); emission [dustCount, count). */
  dustCount: number;
  /**
   * Glyph sprites sit at the end of their buckets so they draw as
   * contiguous ranges through their own program: wisp streaks occupy
   * [dustCount - wispCount, dustCount), spike stars [count - starCount,
   * count).
   */
  wispCount: number;
  starCount: number;
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

  // Body: pink/violet mass around the core, cooler gas outward. The
  // radial gradient runs the palette ramp from hot centre to cool edge.
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
      gradient: true,
      alpha: [0.04, 0.14],
      size: [0.09, 0.18],
      drift: 0.026,
      pointer: 0.55,
      morph: 1,
      mask,
    })
  );

  // Two opposing inner crescents: different centres, radii, spans,
  // widths, and brightness, one much cloudier than the other. The
  // geometry is shared with the wisp and star layers below.
  const arcA = {
    cx: coreX - 0.06,
    cy: coreY + 0.1,
    r: 0.22 + jitter(rng, 0.05),
    a0: -0.4 + jitter(rng, 0.3),
    a1: 2.5 + jitter(rng, 0.3),
  };
  const arcB = {
    cx: coreX + 0.24,
    cy: coreY - 0.14,
    r: 0.27 + jitter(rng, 0.05),
    a0: 2.8 + jitter(rng, 0.3),
    a1: 5.7 + jitter(rng, 0.3),
  };
  dust.push(
    ...arcShell(rng, {
      count: Math.round(count * 0.11),
      ...arcA,
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
      ...arcB,
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

  // Outer shell: two broken crescents hugging the core region. In the
  // photos the bright shells live in the inner half of the nebula;
  // only faint diffuse gas reaches the silhouette.
  for (const seg of [
    { a0: 0.4, a1: 1.9, r: 0.28 },
    { a0: 2.6, a1: 4.4, r: 0.33 },
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

  // Large brush-stroke wisps riding the crescents and a broad outer
  // remnant ring: oriented fiber sprites aligned with the local flow.
  dust.push(
    ...wispStreaks(rng, {
      count: Math.round(count * 0.016),
      arcs: [
        { ...arcA, width: 0.055 },
        { ...arcB, width: 0.07 },
        { cx: coreX, cy: coreY, r: 0.31 + jitter(rng, 0.05), width: 0.09 },
      ],
      colors: pal.wisp,
      brightColors: pal.innerBright,
      // Chained strand links overlap ~2.5x, so per-sprite alpha runs low.
      alpha: [0.02, 0.07],
      size: [0.07, 0.17],
      drift: 0.03,
      pointer: 0.85,
      morph: 0.5,
    })
  );

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

  // Young spiked stars above the gas: a rim hugging the crescents plus
  // a wide scatter that reaches into the outer volume gas, so they
  // don't all cluster on the arcs. The hero carries more of these than
  // the smaller clouds, and a lower size bias means more of them land
  // large and bright instead of almost all staying small.
  emission.push(
    ...starSprinkle(rng, {
      count: Math.max(38, Math.round(count * 0.007)),
      arcs: [
        { ...arcA, width: 0.08 },
        { ...arcB, width: 0.1 },
      ],
      blobs: [
        { cx: coreX, cy: coreY, r: 0.5 },
        { cx: coreX, cy: coreY, r: 1.05 },
      ],
      scatter: 0.55,
      colors: pal.star,
      alpha: [0.14, 0.5],
      size: [0.022, 0.1],
      sizeBias: 1.8,
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
  // The ring sits well inside the dark outer material, like the
  // photograph: the faint volume reaches more than twice as far out.
  const ringR = 0.3;
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
  // The radial gradient warms the centre toward pale blue-white.
  dust.push(
    ...lobeCluster(rng, {
      count: Math.round(count * 0.12),
      lobes: [
        { cx: jitter(rng, 0.1), cy: jitter(rng, 0.1), r: 0.5, w: 1.5, sx: 1.1, sy: 0.85 },
        { cx: jitter(rng, 0.3), cy: jitter(rng, 0.3), r: 0.3 },
      ],
      colors: pal.body,
      brightColors: pal.bodyBright,
      brightChance: 0.12,
      gradient: true,
      alpha: [0.03, 0.08],
      size: [0.13, 0.26],
      drift: 0.02,
      pointer: 0.45,
      morph: 1,
    })
  );

  // The main ring: two full, heavily-broken arcs with offset centres
  // and different radii/widths, so they overlap like a wound ribbon.
  // Both are squashed into rotated ellipses so the silhouette never
  // reads as a clean circle.
  const squash = range(rng, 0.72, 0.9);
  const ringRot = rng() * Math.PI;
  const ringA = {
    cx: 0.1 + jitter(rng, 0.06),
    cy: -0.06 + jitter(rng, 0.06),
    r: ringR * 0.9,
    width: 0.11,
    gaps: 0.3,
    sx: 1.04,
    sy: squash,
    rot: ringRot,
  };
  const ringB = {
    cx: -0.1 + jitter(rng, 0.06),
    cy: 0.07 + jitter(rng, 0.06),
    r: ringR * 1.1,
    width: 0.15,
    gaps: 0.5,
    sx: 1,
    sy: Math.min(1, squash + 0.14),
    rot: ringRot + jitter(rng, 0.7),
  };
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
        wobble: 0.17,
        gaps: ring.gaps,
        sx: ring.sx,
        sy: ring.sy,
        rot: ring.rot,
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

  // Brush-stroke wisps flowing along both rings: the stretched remnant
  // strands around the old shell.
  dust.push(
    ...wispStreaks(rng, {
      count: Math.round(count * 0.03),
      arcs: [
        { ...ringA, width: 0.07 },
        { ...ringB, width: 0.08 },
      ],
      colors: pal.wisp,
      brightColors: pal.shellBright,
      alpha: [0.02, 0.075],
      size: [0.09, 0.2],
      drift: 0.028,
      pointer: 0.85,
      morph: 0.5,
    })
  );

  // Inner rim: short bright amber arcs where the ring faces the cavity,
  // mixed with a couple of cool blue arcs just inside.
  for (let i = 0; i < 3; i++) {
    const a0 = tilt + rng() * Math.PI * 2;
    dust.push(
      ...arcShell(rng, {
        count: Math.round(count * 0.035),
        cx: jitter(rng, 0.08),
        cy: jitter(rng, 0.08),
        r: range(rng, 0.22, 0.26),
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
    const head = 0.14 + rng() * 0.03;
    const tail = head + range(rng, 0.09, 0.16);
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
        from: [Math.cos(a) * 0.35, Math.sin(a) * 0.35],
        ctrl: [Math.cos(a + 0.6) * 0.45, Math.sin(a + 0.6) * 0.45],
        to: [Math.cos(a + 1.2) * 0.38, Math.sin(a + 1.2) * 0.38],
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

  // Spiked stars along the ring shells, with a few shining through the
  // cavity and a few more scattered out into the dark outer material,
  // the way field stars show through the real Helix. A smaller cloud
  // gets fewer of these than the hero.
  emission.push(
    ...starSprinkle(rng, {
      count: Math.max(14, Math.round(count * 0.0032)),
      arcs: [
        { ...ringA, width: 0.1 },
        { ...ringB, width: 0.12 },
      ],
      blobs: [
        { cx: 0, cy: 0, r: 0.2 },
        { cx: 0, cy: 0, r: 0.95 },
      ],
      scatter: 0.45,
      colors: pal.star,
      alpha: [0.12, 0.46],
      size: [0.025, 0.08],
      sizeBias: 2.1,
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
      gradient: true,
      alpha: [0.04, 0.12],
      size: [0.07, 0.15],
      drift: 0.024,
      pointer: 0.55,
      morph: 1,
    })
  );

  // Remnant wisp loops: large oriented streaks tracing a few tangled
  // elliptical shells around the web, the old supernova's leftovers.
  const loops = Array.from({ length: 3 }, () => ({
    cx: jitter(rng, 0.18),
    cy: jitter(rng, 0.18),
    r: range(rng, 0.16, 0.28),
    width: 0.08,
    sx: range(rng, 0.9, 1.1),
    sy: range(rng, 0.7, 0.95),
    rot: rng() * Math.PI,
  }));
  dust.push(
    ...wispStreaks(rng, {
      count: Math.round(count * 0.035),
      arcs: loops,
      colors: pal.wisp,
      brightColors: pal.filamentBright,
      alpha: [0.02, 0.07],
      size: [0.09, 0.19],
      drift: 0.03,
      pointer: 0.9,
      morph: 0.5,
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

  // Spiked stars over the blue-white core, plus a scatter reaching
  // into the outer volume gas around the remnant edge. Fewer than the
  // hero, in keeping with this cloud's smaller footprint.
  emission.push(
    ...starSprinkle(rng, {
      count: Math.max(14, Math.round(count * 0.0032)),
      arcs: [{ cx: 0, cy: 0, r: 0.22, width: 0.14 }],
      blobs: [
        ...coreLobes.map((l) => ({ cx: l.cx, cy: l.cy, r: l.r * 1.2 })),
        { cx: 0, cy: 0, r: 0.9 },
      ],
      scatter: 0.55,
      colors: pal.star,
      alpha: [0.12, 0.46],
      size: [0.02, 0.08],
      sizeBias: 2.1,
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

  // Pull the glyph sprites (wisps, stars) to the end of their buckets:
  // each bucket then splits into two contiguous draw ranges, so the gas
  // keeps its lean shader and the glyphs get their own program. Wisps
  // end up above the dark dust lanes, which suits remnant strands.
  const dustGas = dustFlat.filter((e) => e.p.kind !== 3);
  const wisps = dustFlat.filter((e) => e.p.kind === 3);
  const emissionGas = emissionFlat.filter((e) => e.p.kind !== 2);
  const stars = emissionFlat.filter((e) => e.p.kind === 2);

  const all = [...dustGas, ...wisps, ...emissionGas, ...stars];
  const count = all.length;
  const position = new Float32Array(count * 3);
  const data = new Float32Array(count * 3);
  const cloud = new Float32Array(count * 3);
  const color = new Float32Array(count * 4);
  const motion = new Float32Array(count * 3);
  const angle = new Float32Array(count);
  const roles = new Uint8Array(count);

  all.forEach(({ p, c }, i) => {
    // Glyph kind: the draw bucket by default, or the particle's own
    // override (2 spike star, 3 wisp streak).
    const kind = p.kind ?? (i < dustFlat.length ? 1 : 0);
    position.set([p.x, p.y, Math.max(-1, Math.min(1, p.z))], i * 3);
    data.set([p.size, rng(), kind], i * 3);
    cloud.set([c.x, c.y, c.radius], i * 3);
    color.set([p.color[0], p.color[1], p.color[2], p.alpha * (c.bright ?? 1)], i * 4);
    motion.set([p.drift, p.pointer, p.morph], i * 3);
    angle[i] = p.angle ?? 0;
    roles[i] = p.role;
  });

  return {
    position,
    data,
    cloud,
    color,
    motion,
    angle,
    roles,
    count,
    dustCount: dustFlat.length,
    wispCount: wisps.length,
    starCount: stars.length,
  };
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
 * body gas fills it. The edge pool is sampled stratified (evenly
 * through the edge-pixel list) so indexing it by rank spaces spike
 * stars uniformly along the outline. Browser only (rasterizes to a
 * canvas).
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

  const sample = (pool: number[], n: number, stratified = false): Float32Array => {
    const out = new Float32Array(n * 2);
    for (let p = 0; p < n; p++) {
      const at = stratified
        ? Math.min(pool.length - 1, Math.floor(((p + Math.random()) / n) * pool.length))
        : Math.floor(Math.random() * pool.length);
      const i = pool[at];
      out[p * 2] = ((i % size) / size) * 2 - 1;
      out[p * 2 + 1] = (Math.floor(i / size) / size) * 2 - 1;
    }
    return out;
  };

  return {
    edge: sample(edgeIdx, Math.floor(poolSize / 2), true),
    interior: sample(interiorIdx, Math.ceil(poolSize / 2)),
  };
}
