/**
 * Scene layout: where each structured cloud sits, how big it is, and
 * which profile and palette it uses. Fixed once per boot; the renderer
 * reads the result for the background wash uniforms.
 */
import type { CloudSpec } from "./particles";
import { miniPalettes, type MiniPaletteName, type ProfileName } from "./palettes";

export type NebulaVariant = "full" | "mini" | "demo";
export type NebulaCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type NebulaMiniShape = ProfileName | "random";
export type NebulaMiniSize = "md" | "lg" | "xl" | "phone-xl";

export interface NebulaSceneOptions {
  variant: NebulaVariant;
  corner: NebulaCorner;
  miniShape: NebulaMiniShape;
  color: MiniPaletteName | "random";
  size: NebulaMiniSize;
  heroClouds: "default" | "right";
}

const MINI_CORNERS: Record<NebulaCorner, [number, number]> = {
  // uv space, y up; pulled in from the edges so the gas has room.
  "top-left": [0.16, 0.76],
  "top-right": [0.84, 0.76],
  "bottom-left": [0.16, 0.24],
  "bottom-right": [0.84, 0.24],
};

// Mobile radii run ~70-90vmin: at phone sizes a 30vmin corner cloud
// reads as a smudge. Sprite sizes scale with the radius, so the bigger
// footprint costs nothing extra as long as the count stays put (the
// density constant below compensates).
const MINI_SIZE_RADIUS: Record<NebulaMiniSize, { mobile: number; desktop: number }> = {
  // Match the full landing scene's ~0.40 mobile cloud footprint; the
  // larger variants retain the same four-point size progression.
  md: { mobile: 0.4, desktop: 0.19 },
  lg: { mobile: 0.44, desktop: 0.23 },
  xl: { mobile: 0.48, desktop: 0.28 },
  // Phones only. An orion cloud packs most of its mass into the lobes
  // around one core, so at a shared radius it reads far tighter than
  // the helix on the case-study pages, whose warm gas fills a wide
  // annulus. This widens the phone footprint to match; desktop stays at
  // md, where the corner accent is small and clears the prose column.
  "phone-xl": { mobile: 0.52, desktop: 0.19 },
};

const MINI_PROFILES: ProfileName[] = ["orion", "helix", "crab"];
const MINI_COLORS: Exclude<MiniPaletteName, "profile">[] = ["aurora", "solar", "frost"];

export const jitter = () => (Math.random() - 0.5) * 0.06;

export function buildClouds({
  variant,
  corner,
  miniShape,
  color,
  size,
  heroClouds,
}: NebulaSceneOptions): CloudSpec[] {
  const isMini = variant === "mini";
  const isDemo = variant === "demo";
  const isDesktop = window.innerWidth >= 768;

  // Particle count scales with footprint; the smaller clouds carry
  // finer structure, so they get a higher areal density.
  const countFor = (r: number, density: number) =>
    Math.max(1200, Math.min(24000, Math.round(density * r * r)));

  // Size the hero at ~30vmax, expressed in our min-axis radius units.
  const vRatio =
    Math.max(window.innerWidth, window.innerHeight) /
    Math.min(window.innerWidth, window.innerHeight);
  // Portrait gets its own scene below: no hero at all, two small
  // bright clouds in the open corners instead.
  const portrait = window.innerHeight > window.innerWidth;
  // A medium hero (~20vmax, down from ~30): big enough to anchor
  // the corner, small enough that its structure stays readable.
  const heroR = Math.min(0.38, (isDesktop ? 0.2 : 0.18) * vRatio);
  // Portrait clouds run ~80vmin: at 0.19 they read teeny on a
  // phone. The density constants below hold the counts where the
  // small clouds had them, so brightness and cost don't move.
  const ringR = isDesktop ? 0.21 : portrait ? 0.4 : 0.17;
  const webR = isDesktop ? 0.16 : portrait ? 0.17 : 0.13;
  const miniRadius = MINI_SIZE_RADIUS[size] ?? MINI_SIZE_RADIUS.md;
  const miniR = (isDesktop ? miniRadius.desktop : miniRadius.mobile) + Math.random() * 0.025;

  const [miniX, miniY] = MINI_CORNERS[corner];
  const pickedMiniShape =
    miniShape === "random"
      ? MINI_PROFILES[Math.floor(Math.random() * MINI_PROFILES.length)]!
      : miniShape;
  const pickedMiniColor =
    color === "random" ? MINI_COLORS[Math.floor(Math.random() * MINI_COLORS.length)]! : color;
  return isDemo
    ? [{ x: 0.5, y: 0.5, radius: 0.34, profile: "helix", count: 15000 }]
    : isMini
    ? [
        {
          // One decorative cloud with independently selectable shape
          // and palette, larger than the original corner accent.
          x: miniX + jitter(),
          y: miniY + jitter(),
          radius: miniR,
          profile: pickedMiniShape,
          palette: miniPalettes[pickedMiniColor] ?? undefined,
          // Mobile density compensates the much larger radius so
          // the count — and with it per-pixel brightness and the
          // particle budget — matches the old small cloud.
          count: countFor(miniR, isDesktop ? 155000 : 30000),
        },
      ]
    : portrait
    ? [
        // Phones: the hero disc never had open sky to live in —
        // the card stack covers it and only a washed glow gets
        // through. Instead, the two strongest profiles run big
        // (~80vmin) and bright: an Orion cloud low, the amber ring
        // high. No web here; it reads as a smudge at phone sizes.
        // Ordered bottom-first so the tint pair (A low, B high)
        // lines up.
        {
          x: (heroClouds === "right" ? 0.82 : 0.35) + jitter(),
          y: 0.24 + jitter(),
          radius: ringR,
          profile: "orion",
          count: countFor(ringR, 45000),
          bright: 1.35,
        },
        {
          x:
            (heroClouds === "right"
              ? 0.8
              : Math.random() < 0.5
                ? 0.3
                : 0.7) + jitter(),
          y: 0.74 + jitter(),
          radius: ringR,
          profile: "helix",
          count: countFor(ringR, 41000),
          bright: 1.3,
        },
      ]
    : [
        {
          // The hero: an Orion-like structured cloud in the lower-right.
          // Dimmed a touch: per-pixel brightness follows areal
          // density, so the lower density and bright do the work.
          x: 0.74 + jitter(),
          y: 0.26 + jitter(),
          radius: heroR,
          profile: "orion",
          count: countFor(heroR, 80000),
          bright: 0.9,
        },
        {
          // A Helix-like broken ring up top, opposite the hero.
          x: (Math.random() < 0.5 ? 0.2 : 0.84) + jitter(),
          y: 0.8 + jitter(),
          radius: ringR,
          profile: "helix",
          count: countFor(ringR, 160000),
        },
        {
          // A Crab-like filament web anchoring the bottom-left.
          x: 0.14 + jitter(),
          y: 0.22 + jitter(),
          radius: webR,
          profile: "crab",
          count: countFor(webR, 170000),
        },
      ];
}
