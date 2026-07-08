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

/** Aurora variant: green/cyan active regions over a cool violet body. */
export const AURORA: ProfilePalette = {
  volume: [hex("#102C2D"), hex("#14243B"), hex("#251B3E"), hex("#163A38")],
  shell: [hex("#29A88E"), hex("#49C6B0"), hex("#5865B8")],
  shellBright: [hex("#8EF5D2"), hex("#63E0B2")],
  body: [hex("#263E6B"), hex("#315C7E"), hex("#416B71"), hex("#4BBE98"), hex("#7FE7C5")],
  bodyBright: [hex("#B8FFE5"), hex("#8EF5D2"), hex("#54D6A4")],
  inner: [hex("#35B99A"), hex("#6E73C8"), hex("#48D0B0")],
  innerBright: [hex("#B8FFE5"), hex("#7FE7C5")],
  wisp: [hex("#39B08F"), hex("#5CC5BE"), hex("#6A6DB6"), hex("#345C78")],
  filament: [hex("#1F6D64"), hex("#32A887"), hex("#55D6AA"), hex("#9EF2D4")],
  filamentBright: [hex("#C7FFE9"), hex("#8EF5D2")],
  dust: [hex("#071719"), hex("#111329"), hex("#101C24")],
  cavity: [hex("#081B27"), hex("#12172B"), hex("#172936")],
  glow: [hex("#6FF0C4"), hex("#36CFA4"), hex("#6C8EEB"), hex("#C7FFE9")],
  bg: { core: hex("#6FF0C4"), mid: hex("#315C7E"), fil: hex("#6E73C8") },
};

/** Solar variant: gold, ember, and crimson with restrained dark dust. */
export const SOLAR: ProfilePalette = {
  volume: [hex("#3A2118"), hex("#4A1E22"), hex("#543017"), hex("#281A20")],
  shell: [hex("#C76724"), hex("#E89D34"), hex("#8D2B20")],
  shellBright: [hex("#FFD27A"), hex("#FFAB45")],
  body: [hex("#5E2B2B"), hex("#8D3A27"), hex("#B75926"), hex("#E38D34"), hex("#F4C169")],
  bodyBright: [hex("#FFE0A0"), hex("#F4C169"), hex("#FF9E3D")],
  inner: [hex("#C94D2D"), hex("#E98635"), hex("#F4B95D")],
  innerBright: [hex("#FFE0A0"), hex("#FFB454")],
  wisp: [hex("#AB3F2B"), hex("#D66C2F"), hex("#E49B43"), hex("#6E2A25")],
  filament: [hex("#742119"), hex("#B64024"), hex("#E16A28"), hex("#F4B95D")],
  filamentBright: [hex("#FFE0A0"), hex("#F4B95D")],
  dust: [hex("#1F0D0D"), hex("#281211"), hex("#35130E")],
  cavity: [hex("#1C1016"), hex("#28191D"), hex("#2F1C12")],
  glow: [hex("#FFD27A"), hex("#F29635"), hex("#D7472C"), hex("#FFE0A0")],
  bg: { core: hex("#F29635"), mid: hex("#8D2B20"), fil: hex("#FFD27A") },
};

/** Frost variant: blue, white, and violet with small magenta highlights. */
export const FROST: ProfilePalette = {
  volume: [hex("#16263D"), hex("#20234A"), hex("#26384B"), hex("#171C33")],
  shell: [hex("#4A7CB6"), hex("#79A7D8"), hex("#766FC4")],
  shellBright: [hex("#D9F1FF"), hex("#A8D8F7")],
  body: [hex("#314C73"), hex("#4D77A9"), hex("#7DAFD2"), hex("#B7DDF2"), hex("#CBB8F2")],
  bodyBright: [hex("#E6F7FF"), hex("#B7DDF2"), hex("#D0B9FF")],
  inner: [hex("#6296C2"), hex("#8B83D6"), hex("#AFCDEA")],
  innerBright: [hex("#E6F7FF"), hex("#CBB8F2")],
  wisp: [hex("#5577A8"), hex("#75668D"), hex("#8B83D6"), hex("#79A7D8")],
  filament: [hex("#345C88"), hex("#5A83BD"), hex("#8B83D6"), hex("#CBB8F2")],
  filamentBright: [hex("#E6F7FF"), hex("#D0B9FF")],
  dust: [hex("#0B1220"), hex("#10182A"), hex("#18142A")],
  cavity: [hex("#0B1626"), hex("#121A30"), hex("#1C1833")],
  glow: [hex("#A8D8F7"), hex("#D9F1FF"), hex("#A78BFA"), hex("#F1D9FF")],
  bg: { core: hex("#A8D8F7"), mid: hex("#4D77A9"), fil: hex("#A78BFA") },
};

export const profilePalettes = { orion: ORION, helix: HELIX, crab: CRAB } as const;

export const miniPalettes = {
  profile: null,
  aurora: AURORA,
  solar: SOLAR,
  frost: FROST,
} as const;

export type ProfileName = keyof typeof profilePalettes;
export type MiniPaletteName = keyof typeof miniPalettes;
