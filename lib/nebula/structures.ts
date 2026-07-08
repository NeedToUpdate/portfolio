/**
 * Reusable structure emitters for the nebula generator.
 *
 * Each emitter deposits raw particles (cloud-local coordinates, radius
 * units) for one kind of structure: soft lobe clusters, broken arc
 * shells, branching filament webs, bezier strokes, and glow spots.
 * Nebula profiles combine these with their own geometry, so the clouds
 * share machinery but not silhouettes: a ring nebula is two offset
 * broken arcs, an Orion-like cloud is two opposing crescents, a
 * remnant is a filament web — never the same recolored circle.
 */

import type { RGB } from "./palettes";

export type Rng = () => number;

/** One raw particle before cloud placement and buffer packing. */
export interface RawParticle {
  x: number;
  y: number;
  z: number;
  /** Sprite size in cloud-radius units. */
  size: number;
  color: RGB;
  alpha: number;
  /** Ambient drift amplitude (radius units). */
  drift: number;
  /** Pointer wake response, 0 heavy .. ~1 light gas. */
  pointer: number;
  /** Glyph morph weight, 0 stays put .. 1 flies to the shape. */
  morph: number;
  /** Morph pool: 0 fills the glyph interior, 1 rides its outline. */
  role: 0 | 1;
}

/** Density multiplier in local space, 0..1: cavities carve gas away. */
export type Mask = (x: number, y: number) => number;

export interface LobeSpec {
  cx: number;
  cy: number;
  r: number;
  /** Anisotropic stretch. */
  sx?: number;
  sy?: number;
  /** Sampling weight; defaults to r^2. */
  w?: number;
}

interface LayerFeel {
  alpha: [number, number];
  size: [number, number];
  drift: number;
  pointer: number;
  morph: number;
}

export const range = (rng: Rng, lo: number, hi: number): number => lo + rng() * (hi - lo);

export function gaussian(rng: Rng): number {
  const u = Math.max(rng(), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** Random palette color with a small per-particle brightness jitter. */
export function tint(rng: Rng, colors: RGB[], jitter = 0.16): RGB {
  const c = colors[Math.floor(rng() * colors.length)];
  const m = 1 - jitter + rng() * jitter * 2;
  return [Math.min(1, c[0] * m), Math.min(1, c[1] * m), Math.min(1, c[2] * m)];
}

/**
 * Smooth 1D noise, periodic over 2*PI. Used to modulate arc radius,
 * width, and continuity so no shell is a clean circle.
 */
export function periodicNoise(rng: Rng, cells: number): (ang: number) => number {
  const v = Array.from({ length: cells }, () => rng());
  return (ang) => {
    const x = ((((ang / (Math.PI * 2)) % 1) + 1) % 1) * cells;
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    return v[i % cells] * (1 - s) + v[(i + 1) % cells] * s;
  };
}

/**
 * Soft overlapping lobes: the outer volume and interior body gas.
 * Irregularity comes from the lobe arrangement, not the sprite shape.
 */
export function lobeCluster(
  rng: Rng,
  opts: LayerFeel & {
    count: number;
    lobes: LobeSpec[];
    /** Either a flat palette or dark->bright ramp picked by local density. */
    colors: RGB[];
    /** Optional bright ramp end: mixed in near lobe centres. */
    brightColors?: RGB[];
    /** Chance a centre particle uses the bright ramp (default 0.25). */
    brightChance?: number;
    mask?: Mask;
    zSpread?: number;
    role?: 0 | 1;
  }
): RawParticle[] {
  const out: RawParticle[] = [];
  const weights = opts.lobes.map((l) => l.w ?? l.r * l.r);
  const totalW = weights.reduce((s, w) => s + w, 0);
  let guard = opts.count * 6;

  while (out.length < opts.count && guard-- > 0) {
    let pick = rng() * totalW;
    let lobe = opts.lobes[0];
    for (let i = 0; i < opts.lobes.length; i++) {
      pick -= weights[i];
      if (pick <= 0) {
        lobe = opts.lobes[i];
        break;
      }
    }

    const gx = gaussian(rng) * 0.5;
    const gy = gaussian(rng) * 0.5;
    const x = lobe.cx + gx * lobe.r * (lobe.sx ?? 1);
    const y = lobe.cy + gy * lobe.r * (lobe.sy ?? 1);
    if (opts.mask && rng() > opts.mask(x, y)) continue;

    // 0 at lobe centre .. 1 at the soft edge.
    const d = Math.min(Math.hypot(gx, gy), 1);
    const bright =
      opts.brightColors && d < 0.35 && rng() < (opts.brightChance ?? 0.25);
    const color = bright
      ? tint(rng, opts.brightColors!)
      : tint(rng, opts.colors);
    // Edges fade: alpha eases down toward the lobe boundary.
    const edgeFade = 1 - d * 0.65;
    out.push({
      x,
      y,
      z: gaussian(rng) * (opts.zSpread ?? 0.35),
      size: range(rng, opts.size[0], opts.size[1]),
      color,
      alpha: range(rng, opts.alpha[0], opts.alpha[1]) * edgeFade * (bright ? 1.15 : 1),
      drift: opts.drift * range(rng, 0.6, 1.4),
      pointer: opts.pointer * range(rng, 0.7, 1.3),
      morph: opts.morph,
      role: opts.role ?? 0,
    });
  }
  return out;
}

/**
 * A broken shell arc: compressed gas along a noisy circular path.
 * Width, radius, and continuity all vary along the arc; narrow
 * sections get brighter (compression), wide sections stay cloudy.
 * Gaps keep it from ever reading as a drawn outline.
 */
export function arcShell(
  rng: Rng,
  opts: LayerFeel & {
    count: number;
    cx: number;
    cy: number;
    r: number;
    /** Angular span; can exceed 2*PI for a full ring. */
    a0: number;
    a1: number;
    /** Gaussian half-width across the shell, radius units. */
    width: number;
    /** Radius modulation fraction (0.1 = +-10%). */
    wobble: number;
    /** 0 continuous .. 1 heavily broken. */
    gaps: number;
    colors: RGB[];
    brightColors?: RGB[];
    /** Peak alpha for rare compressed sections. */
    brightAlpha?: number;
    mask?: Mask;
  }
): RawParticle[] {
  const out: RawParticle[] = [];
  const nRadius = periodicNoise(rng, 7);
  const nWidth = periodicNoise(rng, 9);
  const nGap = periodicNoise(rng, 6);
  const nBright = periodicNoise(rng, 11);
  let guard = opts.count * 8;

  while (out.length < opts.count && guard-- > 0) {
    const u = rng();
    const ang = opts.a0 + u * (opts.a1 - opts.a0);

    // Continuity: sections where gap-noise dips below the threshold thin
    // out sharply instead of disappearing, so breaks stay gassy.
    const g = nGap(ang);
    const broken = g < opts.gaps * 0.75;
    if (broken && rng() > 0.18) continue;

    const rr = opts.r * (1 + opts.wobble * (nRadius(ang) * 2 - 1));
    const w = opts.width * (0.4 + 1.3 * nWidth(ang * 1.3 + 2.1));
    const off = gaussian(rng) * w;
    const x = opts.cx + Math.cos(ang) * (rr + off);
    const y = opts.cy + Math.sin(ang) * (rr + off);
    if (opts.mask && rng() > opts.mask(x, y)) continue;

    // Compression: the narrower the shell here, the brighter it runs.
    const compression = Math.max(0, 1 - w / opts.width);
    const hot =
      opts.brightColors &&
      nBright(ang) * (0.45 + compression) > 0.62 &&
      rng() < 0.6;
    // The inner-facing edge glows; the outer edge dissolves outward.
    const innerEdge = off < -w * 0.35 ? 0.3 : 0;
    const endFade =
      Math.min(1, Math.min(u, 1 - u) * 12) * (broken ? 0.35 : 1);

    let alpha = range(rng, opts.alpha[0], opts.alpha[1]);
    if (hot) alpha = range(rng, opts.alpha[1], opts.brightAlpha ?? opts.alpha[1] * 1.6);
    alpha *= endFade * (1 + innerEdge);

    out.push({
      x,
      y,
      z: gaussian(rng) * 0.25,
      size: range(rng, opts.size[0], opts.size[1]) * (hot ? 0.8 : 1),
      color: hot ? tint(rng, opts.brightColors!) : tint(rng, opts.colors),
      alpha,
      drift: opts.drift * range(rng, 0.6, 1.4),
      pointer: opts.pointer * range(rng, 0.7, 1.3),
      morph: opts.morph,
      role: 1,
    });
  }
  return out;
}

/**
 * A branching filament web: random walkers stepping outward from a
 * central band, splitting and fading. Small overlapping sprites along
 * each path read as connected strands; additive blending brightens
 * the crossings for free.
 */
export function filamentWeb(
  rng: Rng,
  opts: LayerFeel & {
    /** Total particle budget. */
    count: number;
    /** Number of seed walkers. */
    roots: number;
    /** Radial band [min,max] where walkers start. */
    origin: [number, number];
    /** Walkers die past this radius. */
    reach: number;
    /** Step length, radius units. */
    step: number;
    /** Heading randomness per step, radians. */
    curl: number;
    /** Branch probability per step. */
    branch: number;
    colors: RGB[];
    brightColors: RGB[];
    mask?: Mask;
  }
): RawParticle[] {
  const out: RawParticle[] = [];
  interface Walker {
    x: number;
    y: number;
    heading: number;
    life: number;
    width: number;
  }
  const walkers: Walker[] = [];
  for (let i = 0; i < opts.roots; i++) {
    const ang = rng() * Math.PI * 2;
    const r = range(rng, opts.origin[0], opts.origin[1]);
    walkers.push({
      x: Math.cos(ang) * r,
      y: Math.sin(ang) * r,
      // Mostly outward, with spread so strands tangle.
      heading: ang + (rng() - 0.5) * 1.6,
      life: range(rng, 0.55, 1),
      width: range(rng, 0.5, 1),
    });
  }

  while (walkers.length > 0 && out.length < opts.count) {
    const wk = walkers[walkers.length - 1];
    const dist = Math.hypot(wk.x, wk.y);
    if (wk.life <= 0 || dist > opts.reach) {
      walkers.pop();
      continue;
    }

    // Bias gently outward so the web stretches toward the edge.
    const outward = Math.atan2(wk.y, wk.x);
    let turn = (rng() - 0.5) * opts.curl;
    const dAng = Math.atan2(Math.sin(outward - wk.heading), Math.cos(outward - wk.heading));
    turn += dAng * 0.08;
    wk.heading += turn;
    wk.x += Math.cos(wk.heading) * opts.step;
    wk.y += Math.sin(wk.heading) * opts.step;
    wk.life -= opts.step * range(rng, 0.4, 0.9);
    wk.width *= 0.995;

    if (opts.mask && rng() > opts.mask(wk.x, wk.y)) continue;

    const fade = Math.min(1, wk.life * 3) * (1 - dist / (opts.reach * 1.15));
    if (fade <= 0.02) continue;
    const hot = rng() < 0.12;
    out.push({
      x: wk.x + gaussian(rng) * 0.012,
      y: wk.y + gaussian(rng) * 0.012,
      z: gaussian(rng) * 0.2,
      size: range(rng, opts.size[0], opts.size[1]) * (0.5 + wk.width * 0.5),
      color: hot ? tint(rng, opts.brightColors) : tint(rng, opts.colors),
      alpha: range(rng, opts.alpha[0], opts.alpha[1]) * fade * (hot ? 1.4 : 1),
      drift: opts.drift * range(rng, 0.7, 1.5),
      pointer: opts.pointer * range(rng, 0.8, 1.3),
      morph: opts.morph,
      role: 1,
    });

    if (rng() < opts.branch && walkers.length < opts.roots * 4) {
      walkers.push({
        x: wk.x,
        y: wk.y,
        heading: wk.heading + (rng() < 0.5 ? -1 : 1) * range(rng, 0.4, 1.1),
        life: wk.life * range(rng, 0.4, 0.8),
        width: wk.width * 0.8,
      });
    }
  }
  return out;
}

/**
 * A soft band of gas along a quadratic bezier: curved wisps inside the
 * body, or — with dark colors on the dust bucket — a dust lane that
 * occludes whatever is beneath it.
 */
export function stroke(
  rng: Rng,
  opts: LayerFeel & {
    count: number;
    from: [number, number];
    ctrl: [number, number];
    to: [number, number];
    /** Gaussian half-width across the band. */
    width: number;
    colors: RGB[];
    /** Fade the band's ends (default true) so it never has hard tips. */
    fadeEnds?: boolean;
    mask?: Mask;
    role?: 0 | 1;
  }
): RawParticle[] {
  const out: RawParticle[] = [];
  const nAlong = periodicNoise(rng, 5);
  let guard = opts.count * 5;
  while (out.length < opts.count && guard-- > 0) {
    const t = rng();
    const s = 1 - t;
    const px = s * s * opts.from[0] + 2 * s * t * opts.ctrl[0] + t * t * opts.to[0];
    const py = s * s * opts.from[1] + 2 * s * t * opts.ctrl[1] + t * t * opts.to[1];
    // Tangent -> normal, for spread across the band.
    const tx = 2 * s * (opts.ctrl[0] - opts.from[0]) + 2 * t * (opts.to[0] - opts.ctrl[0]);
    const ty = 2 * s * (opts.ctrl[1] - opts.from[1]) + 2 * t * (opts.to[1] - opts.ctrl[1]);
    const len = Math.hypot(tx, ty) || 1;
    const off = gaussian(rng) * opts.width * (0.6 + 0.8 * nAlong(t * Math.PI * 2));
    const x = px + (-ty / len) * off;
    const y = py + (tx / len) * off;
    if (opts.mask && rng() > opts.mask(x, y)) continue;

    const endFade =
      opts.fadeEnds === false ? 1 : Math.min(1, Math.min(t, 1 - t) * 6);
    out.push({
      x,
      y,
      z: gaussian(rng) * 0.2,
      size: range(rng, opts.size[0], opts.size[1]),
      color: tint(rng, opts.colors),
      alpha: range(rng, opts.alpha[0], opts.alpha[1]) * endFade,
      drift: opts.drift * range(rng, 0.6, 1.4),
      pointer: opts.pointer * range(rng, 0.7, 1.3),
      morph: opts.morph,
      role: opts.role ?? 0,
    });
  }
  return out;
}

/** Large soft additive spots: localized emission around active regions. */
export function glowSpots(
  rng: Rng,
  opts: LayerFeel & {
    count: number;
    spots: { x: number; y: number; r: number; w?: number }[];
    colors: RGB[];
  }
): RawParticle[] {
  const out: RawParticle[] = [];
  const weights = opts.spots.map((sp) => sp.w ?? 1);
  const totalW = weights.reduce((s, w) => s + w, 0);
  for (let i = 0; i < opts.count; i++) {
    let pick = rng() * totalW;
    let spot = opts.spots[0];
    for (let k = 0; k < opts.spots.length; k++) {
      pick -= weights[k];
      if (pick <= 0) {
        spot = opts.spots[k];
        break;
      }
    }
    // Uniform across the disc, not centre-stacked: additive sprites
    // piling up at a spot centre blow out to white.
    const d = Math.sqrt(rng());
    const ang = rng() * Math.PI * 2;
    out.push({
      x: spot.x + Math.cos(ang) * d * spot.r,
      y: spot.y + Math.sin(ang) * d * spot.r,
      z: gaussian(rng) * 0.3,
      size: range(rng, opts.size[0], opts.size[1]),
      color: tint(rng, opts.colors),
      alpha: range(rng, opts.alpha[0], opts.alpha[1]) * (1 - d * 0.5),
      drift: opts.drift * range(rng, 0.6, 1.4),
      pointer: opts.pointer,
      morph: opts.morph,
      role: 0,
    });
  }
  return out;
}
