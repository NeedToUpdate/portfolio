/**
 * Hover-shape tracking: which data-nebula-shape trigger the reader is
 * pointing at or focused on, and where each particle lands when the
 * structured layers condense into that glyph.
 */
import { sampleShapeTargets, type ShapePools } from "./particles";

const TARGET_POOL = 1024; // glyph sample points per shape

// A trigger's data-nebula-shape can sit on the hovered/focused element
// itself (nav links, TextLink, footer icons) or on a decorative span
// nested inside a larger link (a card's title, a list row's CTA).
// Pointer hover naturally lands on whichever element is innermost, so
// closest() alone finds it; keyboard focus lands on the outer link, so
// a descendant lookup is needed too.
export function resolveShapeKey(
  el: Element | null,
  includeDescendants = false
): string | null {
  if (!el) return null;
  const match =
    el.closest?.("[data-nebula-shape]") ??
    (includeDescendants ? el.querySelector?.("[data-nebula-shape]") : null);
  return match?.getAttribute("data-nebula-shape") ?? null;
}

/**
 * Reports the shape under the pointer or keyboard focus. Events before
 * isReady() returns true are ignored. Returns a detach function.
 */
export function attachShapeHover(
  isReady: () => boolean,
  onShape: (key: string | null) => void
): () => void {
  const onPointerOver = (e: Event) => {
    if (!isReady()) return;
    onShape(resolveShapeKey(e.target as Element | null));
  };

  // Keyboard parity: focusing a trigger morphs the shape the same way
  // hovering it does. focusin/focusout bubble (focus/blur don't), so one
  // pair of document listeners covers every trigger on the page.
  const onFocusIn = (e: FocusEvent) => {
    if (!isReady()) return;
    onShape(resolveShapeKey(e.target as Element | null, true));
  };

  const onFocusOut = (e: FocusEvent) => {
    if (!isReady()) return;
    // Tabbing directly from one trigger to another should hand off, not
    // flash back to "no shape" in between.
    if (resolveShapeKey(e.relatedTarget as Element | null, true) === null) {
      onShape(null);
    }
  };

  document.addEventListener("pointerover", onPointerOver, { passive: true });
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);

  return () => {
    document.removeEventListener("pointerover", onPointerOver);
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
  };
}

/** The per-particle facts that decide where each one lands in a glyph. */
export interface ShapeTargetInput {
  count: number;
  roles: Uint8Array;
  seeds: Float32Array;
}

/**
 * Returns a function that maps a shape key to per-particle glyph
 * targets (xy pairs), or null when the shape has no sample points.
 * Sampled pools are cached for the lifetime of the returned function.
 */
export function createShapeTargeter(): (
  key: string,
  particles: ShapeTargetInput
) => Float32Array | null {
  const targetCache = new Map<string, ShapePools>();

  return (key, { count: particleCount, roles: particleRoles, seeds: particleSeeds }) => {
    let pools = targetCache.get(key);
    if (!pools) {
      pools = sampleShapeTargets(key, TARGET_POOL);
      targetCache.set(key, pools);
    }
    const { edge, interior } = pools;
    if (edge.length === 0 && interior.length === 0) return null;
    const targets = new Float32Array(particleCount * 2);
    // Spike stars (role 2) space evenly along the outline instead of
    // seeding randomly, so they bead the shape's edge like a rim of
    // young stars. The edge pool is stratified, so rank order maps to
    // even coverage.
    let starTotal = 0;
    for (let i = 0; i < particleCount; i++) {
      if (particleRoles[i] === 2) starTotal++;
    }
    let starRank = 0;
    for (let i = 0; i < particleCount; i++) {
      // Shell/filament particles trace the outline; body gas fills it.
      const onEdge = particleRoles[i] >= 1 && edge.length > 0;
      const pool = onEdge ? edge : interior;
      const pairs = pool.length / 2;
      let idx: number;
      if (particleRoles[i] === 2 && onEdge && starTotal > 0) {
        idx = Math.min(pairs - 1, Math.floor(((starRank + 0.5) / starTotal) * pairs));
        starRank++;
      } else {
        idx = Math.min(pairs - 1, Math.floor(particleSeeds[i] * pairs));
      }
      targets[i * 2] = pool[idx * 2];
      targets[i * 2 + 1] = pool[idx * 2 + 1];
    }
    return targets;
  };
}
