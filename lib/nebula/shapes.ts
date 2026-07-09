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
  // Open book: insights.
  book: "M50 20 C38 10 20 10 8 16 L8 82 C20 76 38 76 50 86 C62 76 80 76 92 82 L92 16 C80 10 62 10 50 20 Z",
  // Rising bars: the results strip.
  bars: "M12 88 L12 62 L28 62 L28 88 Z M42 88 L42 40 L58 40 L58 88 Z M72 88 L72 16 L88 16 L88 88 Z",
  // Paper plane: contact.
  plane: "M6 52 L94 10 L62 90 L46 60 Z",
  // Payment card with clipped corners: payments case studies.
  card: "M10 26 L90 26 L94 32 L94 68 L90 74 L10 74 L6 68 L6 32 Z",
  // Database cylinder: data case studies.
  db: "M18 24 C18 13 82 13 82 24 L82 76 C82 87 18 87 18 76 Z",
  // Map pin: location.
  pin: "M50 6 C70 6 84 21 84 40 C84 63 50 94 50 94 C50 94 16 63 16 40 C16 21 30 6 50 6 Z",
  // Two server slabs: infrastructure.
  stack: "M10 16 L90 16 L90 44 L10 44 Z M10 56 L90 56 L90 84 L10 84 Z",
  // Three linked nodes: systems. Connectors run edge to edge so the
  // nonzero fill never self-cancels against the circles.
  nodes:
    "M15 26 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0 Z M63 38 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0 Z M33 80 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0 Z M40 32 L63 38 L64 32 L41 26 Z M29 39 L39 69 L45 67 L35 37 Z M66 47 L51 68 L56 71 L71 50 Z",
  // Git branch: code and GitHub.
  branch:
    "M19 18 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z M19 82 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z M65 30 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z M26 29 L26 71 L34 71 L34 29 Z M31 49 L64 30 L66 36 L33 55 Z",
  // Puffy cloud: cloud platforms.
  cloud:
    "M26 78 C10 78 4 62 14 52 C8 38 22 26 36 32 C42 16 68 16 74 32 C90 28 98 46 88 56 C96 66 86 78 72 78 Z",
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

/** Insight tags map to glyphs; anything unknown gets the book. */
export function tagShape(tag: string): NebulaShapeKey {
  return tagShapes[tag] ?? "book";
}
