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
};

export type NebulaShapeKey = keyof typeof nebulaShapes;

const categoryShapes: Record<string, NebulaShapeKey> = {
  payments: "card",
  data: "db",
  reporting: "bars",
  infrastructure: "hex",
};

/** Case-study categories map to glyphs; anything unknown gets the hex. */
export function categoryShape(category: string): NebulaShapeKey {
  return categoryShapes[category] ?? "hex";
}
