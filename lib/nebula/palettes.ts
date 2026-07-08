/**
 * Layer palettes for the three structural nebula profiles, taken from
 * PLAN.md. Each profile keeps one coherent family of colors: most gas
 * stays dark and muted, the saturated hues are reserved for small
 * active regions (bright shell sections, cores, filament crossings).
 */

export type RGB = [number, number, number];

const hex = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

export interface ProfilePalette {
  /** Broad soft silhouette gas. */
  volume: RGB[];
  /** Compressed outer boundary: broken rings, crescents, walls. */
  shell: RGB[];
  /** Rare bright compressed shell sections. */
  shellBright: RGB[];
  /** Interior gas, ordered dark -> bright (indexed by local density). */
  body: RGB[];
  /** Small luminous core regions. */
  bodyBright: RGB[];
  /** Inner arcs / broken inner rings. */
  inner: RGB[];
  innerBright: RGB[];
  /** Soft curved wisps buried in the body. */
  wisp: RGB[];
  /** Branching filament network (remnant profiles only). */
  filament: RGB[];
  filamentBright: RGB[];
  /** Dark dust lanes that occlude gas beneath them. */
  dust: RGB[];
  /** Faint material inside low-density cavities. */
  cavity: RGB[];
  /** Additive emission glow. */
  glow: RGB[];
  /** Tints handed to the background pass (distant haze + H II fields). */
  bg: { core: RGB; mid: RGB; fil: RGB };
}

/** Orion-like: pink/violet centre, cool blue exterior, opposing arcs. */
export const ORION: ProfilePalette = {
  volume: [hex("#3B1822"), hex("#29203B"), hex("#26384B"), hex("#4A3B5C")],
  shell: [hex("#5577A8"), hex("#766AA1"), hex("#A94778")],
  shellBright: [hex("#DF4F92"), hex("#F2A8C8")],
  body: [hex("#4A3B5C"), hex("#577DAA"), hex("#8877AF"), hex("#8B315F"), hex("#D94C8A")],
  bodyBright: [hex("#F3A4C5"), hex("#F2A8C8"), hex("#D94C8A")],
  inner: [hex("#8B72B2"), hex("#668BB4"), hex("#D84B8B")],
  innerBright: [hex("#F0A0C2"), hex("#D84B8B")],
  wisp: [hex("#9A416D"), hex("#C85B87"), hex("#75668D"), hex("#536A84")],
  filament: [],
  filamentBright: [],
  dust: [hex("#1A101C"), hex("#211313"), hex("#260E12"), hex("#0D1722")],
  cavity: [hex("#10182A"), hex("#1A1122"), hex("#252B35")],
  glow: [hex("#E64D92"), hex("#8C63BF"), hex("#4E91C4"), hex("#F5A8CA")],
  bg: { core: hex("#DF4F92"), mid: hex("#8B315F"), fil: hex("#8C63BF") },
};

/** Helix-like: cool blue cavity inside a thick broken amber ring. */
export const HELIX: ProfilePalette = {
  volume: [hex("#3B2924"), hex("#51232B"), hex("#3B1822"), hex("#4C131A")],
  shell: [hex("#C35A25"), hex("#E28B35"), hex("#742126")],
  shellBright: [hex("#F2B85A"), hex("#E28B35")],
  body: [hex("#3E4F91"), hex("#4269A4"), hex("#55539A"), hex("#569CC2")],
  bodyBright: [hex("#569CC2"), hex("#6296C2")],
  inner: [hex("#E49B43"), hex("#C9582C"), hex("#6296C2")],
  innerBright: [hex("#F3C56D"), hex("#E49B43")],
  wisp: [hex("#B9582B"), hex("#C88542"), hex("#692124"), hex("#526C88")],
  filament: [],
  filamentBright: [],
  dust: [hex("#260E12"), hex("#211313"), hex("#1A101C")],
  cavity: [hex("#10182A"), hex("#252B35"), hex("#1A1122")],
  glow: [hex("#477AB2"), hex("#54A5C4"), hex("#E5963E"), hex("#CF6128")],
  bg: { core: hex("#E28B35"), mid: hex("#742126"), fil: hex("#F2B85A") },
};

/** Crab-like: blue-white core under a branching orange filament web. */
export const CRAB: ProfilePalette = {
  volume: [hex("#26384B"), hex("#29203B"), hex("#51232B")],
  shell: [hex("#C84422"), hex("#D16B2D"), hex("#6E1B16")],
  shellBright: [hex("#F0A043")],
  body: [hex("#4E7EA1"), hex("#6AAFD1"), hex("#90C6E8"), hex("#D5ECF6")],
  bodyBright: [hex("#D5ECF6"), hex("#A6D6EE")],
  inner: [hex("#E27B32"), hex("#E65F24"), hex("#F2B15E")],
  innerBright: [hex("#F2B15E")],
  wisp: [hex("#B9582B"), hex("#526C88"), hex("#75668D")],
  filament: [hex("#681B18"), hex("#B84D24"), hex("#D96227"), hex("#EB913E")],
  filamentBright: [hex("#F3B969"), hex("#EB913E")],
  dust: [hex("#211313"), hex("#0D1722"), hex("#1A101C")],
  cavity: [hex("#10182A"), hex("#252B35")],
  glow: [hex("#A6D6EE"), hex("#62AFD2"), hex("#D96729"), hex("#EC9B42")],
  bg: { core: hex("#62AFD2"), mid: hex("#4E7EA1"), fil: hex("#D96729") },
};

export const profilePalettes = { orion: ORION, helix: HELIX, crab: CRAB } as const;

export type ProfileName = keyof typeof profilePalettes;
