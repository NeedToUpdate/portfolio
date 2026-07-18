/**
 * Shapes the nebula condenses into when a section is hovered.
 * Keys match data-nebula-shape attributes in the page markup.
 * Paths are filled silhouettes in a 0..100 viewBox: simple, chunky
 * outlines read best through gas.
 */

export const nebulaShapes: Record<string, string> = {
  // Four-point star: the hero.
  spark:
    "M50 2 L60 40 L98 50 L60 60 L50 98 L40 60 L2 50 L40 40 Z",
  // Hexagon: systems and structure, for case studies.
  hex: "M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z",
  // Document page with a folded corner: a single strong silhouette for
  // insights and reading, without internal contours that split the gas.
  document:
    "M18 7 L64 7 L88 31 L88 93 L18 93 Z",
  // Magnifying glass: reading, inspecting, and exploring an insight.
  article:
    "stroke:M70 40 A30 30 0 1 1 10 40 A30 30 0 1 1 70 40 M61 61 L91 91",
  // Human bust: personal biography and identity.
  profile:
    "M50 7 C66 7 77 19 77 34 C77 45 71 54 62 59 L62 68 C77 72 89 80 94 93 L6 93 C11 80 23 72 38 68 L38 59 C29 54 23 45 23 34 C23 19 34 7 50 7 Z",
  // Rising bars: the results strip.
  bars: "M12 88 L12 62 L28 62 L28 88 Z M42 88 L42 40 L58 40 L58 88 Z M72 88 L72 16 L88 16 L88 88 Z",
  // Paper plane: contact.
  plane: "M6 52 L94 10 L62 90 L46 60 Z",
  // Social marks use chunky filled geometry so gas can preserve their
  // identity after sampling. They are morph targets, not displayed SVGs.
  email:
    "stroke:M10 26 L90 26 L90 76 L10 76 L10 26 L50 58 L90 26",
  linkedin:
    "M10 34 L28 34 L28 88 L10 88 Z M10 14 L28 14 L28 29 L10 29 Z M38 34 L56 34 L56 41 C63 33 73 31 82 35 C91 39 94 48 94 61 L94 88 L76 88 L76 63 C76 55 73 50 67 50 C60 50 56 55 56 64 L56 88 L38 88 Z",
  github:
    "M18 16 L34 27 C44 22 56 22 66 27 L82 16 L86 38 C92 47 94 58 91 69 C87 83 74 91 59 93 L59 76 C65 73 69 68 69 62 C69 52 61 47 50 47 C39 47 31 52 31 62 C31 68 35 73 41 76 L41 93 C26 91 13 83 9 69 C6 58 8 47 14 38 Z",
  // Payment card with clipped corners: payments case studies.
  card:
    "stroke:M12 24 L88 24 Q94 24 94 30 L94 70 Q94 76 88 76 L12 76 Q6 76 6 70 L6 30 Q6 24 12 24 Z M7 40 L93 40 M16 61 L40 61",
  // Database cylinder: data case studies.
  db:
    "stroke:M18 24 C18 12 82 12 82 24 C82 36 18 36 18 24 M18 24 L18 76 C18 88 82 88 82 76 L82 24 M18 50 C18 62 82 62 82 50 M18 76 C18 88 82 88 82 76",
  // Map pin: location.
  pin: "M50 6 C70 6 84 21 84 40 C84 63 50 94 50 94 C50 94 16 63 16 40 C16 21 30 6 50 6 Z",
  // Two server slabs: infrastructure.
  stack:
    "stroke:M12 14 L88 14 Q94 14 94 20 L94 40 Q94 46 88 46 L12 46 Q6 46 6 40 L6 20 Q6 14 12 14 Z M12 54 L88 54 Q94 54 94 60 L94 80 Q94 86 88 86 L12 86 Q6 86 6 80 L6 60 Q6 54 12 54 Z M16 30 L24 30 M16 70 L24 70 M34 30 L82 30 M34 70 L82 70",
  // Three linked nodes: systems. Connectors run edge to edge so the
  // nonzero fill never self-cancels against the circles.
  nodes:
    "M15 26 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0 Z M63 38 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0 Z M33 80 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0 Z M40 32 L63 38 L64 32 L41 26 Z M29 39 L39 69 L45 67 L35 37 Z M66 47 L51 68 L56 71 L71 50 Z",
  // Git branch: code and GitHub.
  branch:
    "M19 18 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z M19 82 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z M65 30 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z M26 29 L26 71 L34 71 L34 29 Z M31 49 L64 30 L66 36 L33 55 Z",
  // Puffy cloud: cloud platforms.
  cloud:
    "stroke:M26 78 C12 78 6 68 10 58 C12 53 16 50 21 49 C17 37 27 28 38 31 C43 18 64 17 72 31 C84 27 94 36 92 48 C98 53 98 63 93 69 C89 75 82 78 72 78 Z",
  // Two interlocking capsules: a chain link, for "copy link".
  link:
    "stroke:M23 35 L43 35 A15 15 0 0 1 43 65 L23 65 A15 15 0 0 1 23 35 Z M57 35 L77 35 A15 15 0 0 1 77 65 L57 65 A15 15 0 0 1 57 35 Z",
};

export type NebulaShapeKey = keyof typeof nebulaShapes;

const categoryShapes: Record<string, NebulaShapeKey> = {
  payments: "card",
  data: "db",
  reporting: "bars",
  infrastructure: "stack",
};

/** Case-study categories map to glyphs; anything unknown gets the node web. */
export function categoryShape(category: string): NebulaShapeKey {
  return categoryShapes[category] ?? "nodes";
}

const tagShapes: Record<string, NebulaShapeKey> = {
  ai: "nodes",
  architecture: "hex",
  engineering: "branch",
  process: "branch",
  infrastructure: "stack",
  kubernetes: "stack",
  "platform-engineering": "stack",
  "home-automation": "cloud",
};

/** Insight tags map to glyphs; anything unknown gets the article shape. */
export function tagShape(tag: string): NebulaShapeKey {
  return tagShapes[tag] ?? "article";
}
