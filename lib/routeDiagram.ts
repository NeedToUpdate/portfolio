/**
 * Shared styling for the "click a path, watch it light up" diagrams
 * used across insight write-ups (request routing, brain routing,
 * network paths). Layouts differ per diagram; only the node/arrow
 * visual language is common, so only that is shared.
 */

export function routeNodeClass(active: boolean, blocked = false, interactive = false): string {
  if (blocked) {
    return "rounded-md border border-red-900/60 bg-red-950/20 px-3 py-1.5 font-mono text-xs text-red-400/70 line-through decoration-red-500/50";
  }
  // Nodes that are themselves the control must read as buttons, not
  // labels: a raised, filled surface says "press me" in a way a bare
  // outline never does. This is what stops the diagram looking like a
  // static picture. Selected fills with accent, like a pressed toggle.
  if (interactive) {
    const button =
      "cursor-pointer rounded-md border px-3 py-1.5 font-mono text-xs shadow-sm transition-colors";
    return active
      ? `${button} border-accent/70 bg-accent/20 text-ink`
      : `${button} border-line bg-raised text-ink hover:border-accent/60 hover:bg-accent/10`;
  }
  // Non-interactive nodes are lit path segments, not controls: keep them
  // as quiet outlines that brighten only when their path is active.
  return `rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
    active ? "border-accent/70 text-ink" : "border-line/60 text-muted"
  }`;
}

export function routeArrowClass(active: boolean, blocked = false): string {
  if (blocked) return "text-red-500/60";
  return active ? "text-accent" : "text-muted/50";
}
