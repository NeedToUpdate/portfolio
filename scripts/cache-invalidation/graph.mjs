// First-party import graph for scripts/invalidate-cloudfront.mjs.
//
// buildAdjacency() runs dependency-cruiser over the source tree to get a
// file -> local-deps map. invertGraph() turns that, plus the route roots
// from map.mjs, into a file -> route-paths map by transitive
// reachability: a changed source file invalidates exactly the routes
// that render it. This replaces the old hand-maintained GLOBAL_FILES
// list — and the full-purge fallback for any component that wasn't on it.
//
// reachableFrom/invertGraph are pure so tests can run them against a
// synthetic adjacency; only buildAdjacency touches dependency-cruiser,
// via a dynamic import so importing this module stays cheap.

/** Normalize to a POSIX, repo-relative path so keys match `git diff` output. */
function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

/**
 * Cruise the source dirs and return a file -> first-party-deps adjacency.
 * node_modules, core modules, and unresolved specifiers are dropped, so
 * only real repo files remain as edges.
 *
 * @returns {Promise<Record<string, string[]>>}
 */
export async function buildAdjacency({
  sourceDirs = ["app", "components", "lib", "styles"],
  tsConfig = "tsconfig.json",
} = {}) {
  const { cruise } = await import("dependency-cruiser");

  const result = await cruise(sourceDirs, {
    // Resolve the "@/..." alias from tsconfig paths.
    tsConfig: { fileName: tsConfig },
    // Follow type-only imports too. Over-approximating is safe here — it
    // can only widen a route's dependency set, never miss one.
    tsPreCompilationDeps: true,
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(node_modules|\\.next|backup)(/|$)" },
    // Treat CSS and image imports as graph nodes (so styles/globals.css
    // resolves) without trying to parse their contents.
    extraExtensionsToScan: [".css", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"],
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css"],
    },
  });

  const adjacency = {};
  for (const mod of result.output.modules ?? []) {
    adjacency[normalizePath(mod.source)] = (mod.dependencies ?? [])
      .filter(
        (dep) =>
          dep.resolved &&
          !dep.coreModule &&
          !dep.couldNotResolve &&
          !dep.resolved.startsWith("node_modules"),
      )
      .map((dep) => normalizePath(dep.resolved));
  }
  return adjacency;
}

/**
 * Every file transitively reachable from `start` (inclusive of `start`).
 * @returns {Set<string>}
 */
export function reachableFrom(adjacency, start) {
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const dep of adjacency[current] ?? []) {
      if (!seen.has(dep)) {
        seen.add(dep);
        stack.push(dep);
      }
    }
  }
  return seen;
}

/**
 * Invert the graph: for each root, every file it reaches accumulates
 * that root's paths. The result maps a changed source file to the union
 * of route paths that render it. Files reached by no root are absent —
 * which classifyChange() treats as "invalidate nothing".
 *
 * @param {Record<string, string[]>} adjacency
 * @param {{ file: string, paths: string[] }[]} roots
 * @returns {Map<string, Set<string>>}
 */
export function invertGraph(adjacency, roots) {
  const fileToPaths = new Map();
  for (const root of roots) {
    for (const file of reachableFrom(adjacency, root.file)) {
      let paths = fileToPaths.get(file);
      if (!paths) {
        paths = new Set();
        fileToPaths.set(file, paths);
      }
      for (const routePath of root.paths) paths.add(routePath);
    }
  }
  return fileToPaths;
}
