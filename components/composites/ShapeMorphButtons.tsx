import InteractiveFigure from "./InteractiveFigure";

const SHAPES: { key: string; label: string }[] = [
  { key: "spark", label: "Spark" },
  { key: "hex", label: "Hexagon" },
  { key: "book", label: "Book" },
  { key: "nodes", label: "Node web" },
  { key: "db", label: "Database" },
  { key: "cloud", label: "Cloud" },
];

/**
 * Real nebula triggers, not a mock of one. Each span below carries an
 * actual data-nebula-shape key, the same attribute a nav link or a
 * project title uses. No local state, no client JS: the morph is
 * handled by NebulaBackground's document-level pointerover listener,
 * exactly as it is everywhere else on the site.
 */
export default function ShapeMorphButtons() {
  return (
    <InteractiveFigure caption="Hover a shape and watch the nebula in the corner of this page.">
      <div className="flex flex-wrap gap-3">
        {SHAPES.map((shape) => (
          <span
            key={shape.key}
            data-testid={`shape-${shape.key}`}
            data-nebula-shape={shape.key}
            tabIndex={0}
            className="cursor-default rounded-md border border-line/60 px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent/70 hover:text-ink focus-visible:border-accent/70 focus-visible:text-ink"
          >
            {shape.label}
          </span>
        ))}
      </div>
    </InteractiveFigure>
  );
}
