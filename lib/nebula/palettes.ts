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
  /** Young diffraction-spiked stars sprinkled over the active regions. */
  star: RGB[];
  /** Tints handed to the background pass (distant haze + H II fields). */
  bg: { core: RGB; mid: RGB; fil: RGB };
}

/**
 * Orion-like, matched to the classic M42 photograph: deep maroon-red
 * surround, sage-green gas fronts, a salmon-rust interior, and a
 * blazing white-green core cluster.
 */
export const ORION: ProfilePalette = {
  volume: [hex("#331014"), hex("#3A1418"), hex("#2A1414"), hex("#241C20")],
  shell: [hex("#5E8574"), hex("#6FA089"), hex("#9A544A"), hex("#4E7062")],
  shellBright: [hex("#A8D8BC"), hex("#C8E8D2")],
  // Ordered dark -> bright: the body indexes this radially, so the
  // centre runs pale peach-white and deepens through salmon and rust
  // into the maroon edges.
  body: [
    hex("#2A161A"),
    hex("#4A2026"),
    hex("#7A3630"),
    hex("#A85040"),
    hex("#C97258"),
    hex("#E09A78"),
    hex("#EFC0A0"),
  ],
  bodyBright: [hex("#F2E9D8"), hex("#E8F2E0"), hex("#F6D9BC")],
  inner: [hex("#74A088"), hex("#C97258"), hex("#8FBC9E")],
  innerBright: [hex("#DCEED9"), hex("#F0DFC0")],
  wisp: [hex("#5E8878"), hex("#9A5240"), hex("#566E62"), hex("#8A5A50")],
  filament: [],
  filamentBright: [],
  dust: [hex("#200D0D"), hex("#2A1210"), hex("#1C1112"), hex("#14161A")],
  cavity: [hex("#1A1214"), hex("#222A26"), hex("#101820")],
  glow: [hex("#D9805C"), hex("#8FBC9E"), hex("#F0E6D0"), hex("#C25036")],
  star: [hex("#F4FFF8"), hex("#EAF8F0"), hex("#D6EFFF"), hex("#FFE9C4")],
  bg: { core: hex("#D9805C"), mid: hex("#7A3630"), fil: hex("#74A088") },
};

/**
 * Helix-like, matched to the photograph: a saturated orange-amber ring
 * with a golden inner rim, steel-blue interior, and near-black brown
 * surround.
 */
export const HELIX: ProfilePalette = {
  volume: [hex("#241007"), hex("#331708"), hex("#3F1D0A"), hex("#1E1210")],
  // Deep red-orange ramping through saturated orange into amber.
  shell: [hex("#7A2A0A"), hex("#B24A10"), hex("#D96A14"), hex("#ED8B24"), hex("#E8A04E")],
  shellBright: [hex("#FFC768"), hex("#FFE3AC"), hex("#FFAD42")],
  // Ordered dark -> bright: steel blue deepening at the rim, paling
  // toward a soft blue-white centre.
  body: [
    hex("#1E323C"),
    hex("#2A4A5A"),
    hex("#3A6E82"),
    hex("#5C9CB0"),
    hex("#8FC6D4"),
    hex("#CBE8EE"),
  ],
  bodyBright: [hex("#E8F7F9"), hex("#D2EEF2")],
  inner: [hex("#F0A83C"), hex("#D96A14"), hex("#7ABCCC"), hex("#F5D8A0")],
  innerBright: [hex("#FFE3AC"), hex("#FFC768")],
  wisp: [hex("#B2521A"), hex("#C88A3C"), hex("#6E2410"), hex("#4E7C8C")],
  filament: [],
  filamentBright: [],
  dust: [hex("#240D06"), hex("#1C1008"), hex("#170D10")],
  cavity: [hex("#12242C"), hex("#1C3038"), hex("#101820")],
  glow: [hex("#4A90A8"), hex("#6ABCCC"), hex("#ED8B24"), hex("#C2500E"), hex("#FFC768")],
  star: [hex("#FFF4DC"), hex("#FFE2B0"), hex("#D6ECFF"), hex("#EAF4FF")],
  bg: { core: hex("#ED8B24"), mid: hex("#7A2A0A"), fil: hex("#FFC768") },
};

/**
 * Remnant web, matched to the Cat's Eye photograph: a cyan-blue core
 * inside teal halo gas, crossed by salmon-orange filament arcs.
 */
export const CRAB: ProfilePalette = {
  volume: [hex("#0E262C"), hex("#133A40"), hex("#1A3138"), hex("#241C26")],
  shell: [hex("#C2603C"), hex("#DE8656"), hex("#6E2A1C")],
  shellBright: [hex("#F6B084")],
  // Ordered dark -> bright: teal edge to a pale cyan-white centre.
  body: [
    hex("#1E4A60"),
    hex("#2E6E88"),
    hex("#4E9EBC"),
    hex("#86CCE2"),
    hex("#C8ECF6"),
  ],
  bodyBright: [hex("#ECFAFF"), hex("#C0EAF4")],
  inner: [hex("#DE8656"), hex("#E06B3A"), hex("#F2B47E")],
  innerBright: [hex("#F6B084"), hex("#FFD6AE")],
  wisp: [hex("#3E8C90"), hex("#55AEB0"), hex("#BE7050")],
  filament: [hex("#8A3A22"), hex("#C2603C"), hex("#E07C42"), hex("#F0A468")],
  filamentBright: [hex("#FFD2A0"), hex("#F6B888")],
  dust: [hex("#16100E"), hex("#0C1A1E"), hex("#141018")],
  cavity: [hex("#0E2228"), hex("#1A2C32")],
  glow: [hex("#86D8DE"), hex("#4FB6C4"), hex("#E07C42"), hex("#B4ECF0")],
  star: [hex("#EAFBFF"), hex("#CFF0FF"), hex("#A8E0F0")],
  bg: { core: hex("#4FB6C4"), mid: hex("#1E4A60"), fil: hex("#E07C42") },
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
  star: [hex("#E6FFF7"), hex("#BFF5E4"), hex("#9FE8FF")],
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
  star: [hex("#FFF3D9"), hex("#FFE0A0"), hex("#FFD187"), hex("#EAF4FF")],
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
  star: [hex("#F4FAFF"), hex("#CFE4FF"), hex("#D8CCFF")],
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
