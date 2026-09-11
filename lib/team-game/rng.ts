/**
 * Seeded PRNG (mulberry32). The simulation must replay the same way for
 * the same seed and commands, so tests can assert on outcomes and a
 * restart with the same seed reproduces the sprint.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [0, n). */
export function pick(rng: () => number, n: number): number {
  return Math.floor(rng() * n);
}
