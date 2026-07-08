/**
 * Emission-line palettes modeled on real nebulae. Colors approximate
 * the dominant spectral lines:
 *   H-alpha 656nm (deep red), H-beta 486nm (blue),
 *   OIII 500.7nm (teal-green), SII 672nm (red-orange).
 * `dust` scales Beer-Lambert extinction (dark lanes).
 */

export interface NebulaPalette {
  name: string;
  /** Emission near the ionizing core; also the cool backlit rim tint. */
  core: [number, number, number];
  /** Main emission of the outer gas. */
  mid: [number, number, number];
  /** Filament emission. */
  filament: [number, number, number];
  /** Warm rim: the color a pillar edge glows where it faces the light. */
  warm: [number, number, number];
  /** Dust extinction strength, 0..1.2. */
  dust: number;
}

const rgb = (r: number, g: number, b: number): [number, number, number] => [
  r / 255,
  g / 255,
  b / 255,
];

// Approximate line colors.
const H_ALPHA = rgb(255, 60, 38);
const H_BETA = rgb(90, 150, 255);
const OIII = rgb(45, 240, 190);
const SII = rgb(230, 90, 40);

const blend = (
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

// Warm rim tones for lit pillar edges.
const OCHRE = rgb(198, 150, 96);
const RUST = rgb(210, 120, 70);
const PALE = rgb(200, 215, 240);

export const nebulaPalettes: NebulaPalette[] = [
  {
    // Teal OIII heart with red-orange filaments.
    name: "crab",
    core: OIII,
    mid: blend(H_ALPHA, SII, 0.4),
    filament: SII,
    warm: RUST,
    dust: 0.55,
  },
  {
    // Deep H-alpha glow with heavy dust silhouettes.
    name: "horsehead",
    core: blend(H_ALPHA, H_BETA, 0.25),
    mid: H_ALPHA,
    filament: blend(H_ALPHA, SII, 0.6),
    warm: rgb(220, 150, 110),
    dust: 1.1,
  },
  {
    // The Pillars of Creation, from the reference photo: rust-and-ochre
    // dust columns backlit by cyan H II glow.
    name: "pillars",
    core: rgb(94, 167, 179), // cyanGlow, the surrounding backlit halo
    mid: rgb(161, 108, 79), // warmDust, the body of the columns
    filament: rgb(101, 72, 62), // rustDust
    warm: rgb(195, 155, 104), // ochreRim, lit edges
    dust: 0.95,
  },
  {
    // Cool reflection nebula: starlight scattered by dust, mostly blue.
    name: "reflection",
    core: rgb(160, 200, 255),
    mid: H_BETA,
    filament: blend(H_BETA, OIII, 0.45),
    warm: PALE,
    dust: 0.35,
  },
  {
    // Supernova remnant lacework: cyan and red interleaved.
    name: "veil",
    core: OIII,
    mid: blend(H_ALPHA, H_BETA, 0.45),
    filament: H_ALPHA,
    warm: RUST,
    dust: 0.3,
  },
];

/** Deterministic pick given a 0..1 random value. */
export function pickPalette(random: number): NebulaPalette {
  const index = Math.min(
    nebulaPalettes.length - 1,
    Math.floor(random * nebulaPalettes.length)
  );
  return nebulaPalettes[index];
}
