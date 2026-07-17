// Pure mapping logic for scripts/invalidate-cloudfront.mjs: route
// topology, file classification, and path building. No git, AWS, or
// dependency-cruiser calls here — everything the classifier needs comes
// in through a context object, so tests/cache-invalidation.test.ts can
// exercise every rule directly.

import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

export const SKIP_MARKER = "[skip-invalidate]";

// Every text route the site currently serves, excluding anything under
// /images/* or /_next/image* — those are handled separately (and often
// need nothing at all, see HASHED_IMAGE_RE below).
export const TEXT_FIXED_PATHS = [
  "/",
  "/about",
  "/contact",
  "/insights",
  "/projects",
  "/work",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
  "/llms.txt",
];

// Only used by the bootstrap (no tag yet) and diff-failure fallbacks,
// where nothing is known about what changed. A mapped image change
// invalidates its own variants instead — see optimizerVariantPaths().
export const IMAGE_WILDCARD_PATHS = ["/images/*", "/_next/image*"];

// previewImage/diagram source files get copied to a sha256-hashed twin
// by scripts/build-image-assets.mjs (see lib/images.ts). The hashed
// file is the only one ever linked to, so a new hash is a brand new
// URL — nothing to invalidate. This matches that naming scheme.
export const HASHED_IMAGE_RE = /\.[0-9a-f]{8}(\.og)?\.[a-z0-9]+$/i;

// Hand-versioned static assets (favicon-v2.ico, apple-touch-icon-v2.png,
// ...): editing one bumps the suffix and produces a new filename/URL on
// purpose (see the comment in app/layout.tsx), so it never needs
// invalidating either.
export const VERSIONED_ASSET_RE = /-v\d+\.[a-z0-9]+$/i;

// Build-level files that can change the bytes of any rendered page but
// sit outside every page's import graph. They refresh all text routes —
// never image variants, which only actual image bytes can change.
// lib/isr-cache-handler.js is here rather than left to the graph: no
// route imports it, but it writes the payloads pages are served from.
const BROAD_CONFIG_FILES = new Set([
  "next.config.js",
  "postcss.config.js",
  "tailwind.config.js",
  "tsconfig.json",
  "package.json",
  "package-lock.json",
  "lib/isr-cache-handler.js",
  // Root-level Next.js convention files: they ride along with (or run
  // in front of) every page, so they touch every text route.
  "instrumentation.ts",
  "instrumentation-client.ts",
  "middleware.ts",
]);

// Repo plumbing that never changes a served byte. Kept explicit so the
// report can distinguish "known no-op" from "unrecognized file" — both
// invalidate nothing, but the latter deserves a warning.
const TOOLING_RE =
  /^(\.github\/|scripts\/|tests\/|serverless-resources\/|backup\/|docs\/)|^(serverless(\.[a-z]+)?\.yml|jest\.config\.js|jest\.setup\.js|\.eslintrc\.json|\.gitignore|README\.md|next-env\.d\.ts)$/;

const SOURCE_EXT_RE = /\.(tsx?|jsx?|mjs|cjs|css)$/;

/** A file the import graph is expected to cover. */
export function isSourceFile(file) {
  return /^(app|components|lib|styles)\//.test(file) && SOURCE_EXT_RE.test(file);
}

// Derives the served path of an ordinary (non-dynamic) app route file,
// e.g. "app/about/page.tsx" -> "/about", "app/page.tsx" -> "/". Returns
// null for dynamic segments ([slug]) — those need slug enumeration and
// are handled as their own roots below, not generically.
export function staticRoutePath(file) {
  const m = file.match(/^app\/(?:(.+)\/)?(page|route)\.(tsx?|jsx?)$/);
  if (!m) return null;
  const seg = m[1];
  if (seg && /[[\]]/.test(seg)) return null;
  return seg ? `/${seg}` : "/";
}

export function isPageFile(file) {
  return /\/page\.(tsx?|jsx?)$/.test(file) || file === "app/page.tsx";
}

export function listSlugs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

// Enumerates every current insight/work slug from the checked-out content
// directories, rather than relying on a "/insights/*"-style wildcard — so
// the fallback always matches what's actually on the site right now.
export function fullPathList(ctx) {
  return [...fullTextPathList(ctx), ...IMAGE_WILDCARD_PATHS];
}

// Same as above but without the image wildcards — this is what a
// "global" text-only change (layout, broad config, ...) touches.
export function fullTextPathList(ctx) {
  return [
    ...TEXT_FIXED_PATHS,
    ...ctx.insightSlugs.map((s) => `/insights/${s}`),
    ...ctx.workSlugs.map((s) => `/work/${s}`),
  ];
}

/**
 * The optimizer variant paths for one public image, e.g.
 * "/images/portrait.webp" -> its /_next/image entries and nothing else.
 * Next's default loader builds "/_next/image?url=<encodeURIComponent(src)>
 * &w=..&q=..", with url always first, so a trailing wildcard after the
 * encoded source covers every width/quality variant of exactly this
 * image. The unencoded twin is cheap insurance against CloudFront
 * normalizing the invalidation path before matching — both entries stay
 * scoped to this one source file either way.
 */
export function optimizerVariantPaths(urlPath) {
  return [
    `/_next/image?url=${encodeURIComponent(urlPath)}*`,
    `/_next/image?url=${urlPath}*`,
  ];
}

// Parses `git diff --name-status`, expanding renames/copies (R100/C100)
// into a synthetic delete of the old path plus an add of the new one so
// each path gets classified under its own status.
export function parseNameStatus(output) {
  const entries = [];
  for (const line of output.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const [statusRaw, ...rest] = line.split("\t");
    const status = statusRaw[0];
    if ((status === "R" || status === "C") && rest.length === 2) {
      entries.push({ file: rest[0], status: "D" });
      entries.push({ file: rest[1], status: "A" });
    } else {
      entries.push({ file: rest[0], status });
    }
  }
  return entries;
}

/**
 * Walks app/ and returns the graph roots: every file that owns a URL,
 * mapped to the path(s) it serves. Dynamic segments expand from the
 * content slugs in `ctx`; the root layout and not-found page count as
 * owning every text route. Any app special file this doesn't recognize
 * (a future template.tsx, a new [param] route) maps to all text routes,
 * so being generic can only over-refresh, never miss.
 *
 * @returns {{ file: string, paths: string[] }[]}
 */
export function discoverRoots(ctx, appDir = "app") {
  const roots = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const file = full.replace(/\\/g, "/");
      if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;

      if (file === `${appDir}/layout.tsx` || file === `${appDir}/not-found.tsx`) {
        roots.push({ file, paths: fullTextPathList(ctx) });
      } else if (file === `${appDir}/sitemap.ts`) {
        roots.push({ file, paths: ["/sitemap.xml"] });
      } else if (file === `${appDir}/robots.ts`) {
        roots.push({ file, paths: ["/robots.txt"] });
      } else if (file === `${appDir}/opengraph-image.tsx`) {
        roots.push({ file, paths: ["/opengraph-image"] });
      } else if (file === `${appDir}/insights/[slug]/page.tsx`) {
        roots.push({
          file,
          paths: [
            ...ctx.insightSlugs.map((s) => `/insights/${s}`),
            "/insights",
            "/",
            "/sitemap.xml",
          ],
        });
      } else if (file === `${appDir}/work/[slug]/page.tsx`) {
        roots.push({
          file,
          paths: [
            ...ctx.workSlugs.map((s) => `/work/${s}`),
            "/work",
            "/",
            "/sitemap.xml",
          ],
        });
      } else {
        const servedPath = staticRoutePath(file);
        if (servedPath !== null) {
          roots.push({ file, paths: [servedPath] });
        } else if (/\/(page|route)\.(tsx?|jsx?)$/.test(file)) {
          // A dynamic route this function doesn't know — refresh broadly.
          roots.push({ file, paths: fullTextPathList(ctx) });
        }
        // Non-route .tsx under app/ (helpers, co-located components) are
        // ordinary graph nodes, not roots.
      }
    }
  };
  walk(appDir);
  return roots;
}

/**
 * Classifies one changed file straight to the paths it invalidates.
 * `status` is git's A/M/D for that path. `ctx` carries the content slugs
 * and the inverted import graph (`fileToPaths`, a Map of source file ->
 * Set of route paths — see graph.mjs).
 *
 * Returns { bucket, paths, warn? }: `bucket` names the matched rule for
 * the report, `warn` marks files that deserve a visible heads-up
 * (unrecognized, or source no route reaches). Unrecognized files
 * invalidate nothing — a purge of everything wouldn't make an unknown
 * file's effect any more known, it would just evict hundreds of good
 * cache entries.
 */
export function classifyChange(file, status, ctx) {
  let m;

  if ((m = file.match(/^content\/insights\/([^/]+)\.mdx?$/))) {
    return {
      bucket: "insight",
      slug: m[1],
      // A brand-new slug was never cached, so its own path needs nothing.
      paths: [
        ...(status === "A" ? [] : [`/insights/${m[1]}`]),
        "/insights",
        "/",
        "/sitemap.xml",
      ],
    };
  }
  if ((m = file.match(/^content\/work\/([^/]+)\.mdx?$/))) {
    return {
      bucket: "work",
      slug: m[1],
      paths: [
        ...(status === "A" ? [] : [`/work/${m[1]}`]),
        "/work",
        "/",
        "/sitemap.xml",
      ],
    };
  }
  if (file.startsWith("content/projects/"))
    return { bucket: "projects", paths: ["/projects", "/sitemap.xml"] };
  if (file.startsWith("content/career/")) return { bucket: "career", paths: ["/about"] };
  if (file.startsWith("content/skills/")) return { bucket: "skills", paths: ["/about"] };
  if (file === "content/home.md") return { bucket: "home", paths: ["/", "/about"] };
  if (file.startsWith("content/"))
    return { bucket: "content-unmapped", paths: [], warn: true };

  if (file.startsWith("public/images/")) {
    const name = path.basename(file);
    if (HASHED_IMAGE_RE.test(name)) {
      return { bucket: "image-hashed", paths: [] }; // self-busting twin
    }
    const urlPath = `/${file.slice("public/".length)}`;
    return {
      bucket: "image-direct",
      paths: [urlPath, ...optimizerVariantPaths(urlPath)],
    };
  }

  if (file.startsWith("public/")) {
    const name = path.basename(file);
    if (VERSIONED_ASSET_RE.test(name)) {
      return { bucket: "asset-versioned", paths: [] }; // self-busting
    }
    return { bucket: "static-root", paths: [`/${file.slice("public/".length)}`] };
  }

  if (BROAD_CONFIG_FILES.has(file)) {
    return { bucket: "broad-config", paths: fullTextPathList(ctx) };
  }

  if (isSourceFile(file)) {
    const servedPath = staticRoutePath(file);
    if (servedPath !== null && status === "A") {
      // Brand new route: nothing was ever cached at this path, so there's
      // nothing to purge. New pages need their sitemap entry refreshed;
      // new non-page routes (API-shaped route.ts) don't even need that.
      return isPageFile(file)
        ? { bucket: "new-route", paths: ["/sitemap.xml"] }
        : { bucket: "new-route", paths: [] };
    }
    if (servedPath !== null && status === "D") {
      // Deleted route: evict the dead URL so it 404s instead of serving
      // a stale cached copy.
      return { bucket: "deleted-route", paths: [servedPath, "/sitemap.xml"] };
    }
    const reached = ctx.fileToPaths.get(file);
    if (reached && reached.size > 0) {
      return { bucket: "code", paths: [...reached] };
    }
    // No route reaches it: an orphan, a deleted component (its importers
    // changed in the same push), or tooling that lives under lib/.
    return { bucket: "code-unreached", paths: [], warn: status !== "D" };
  }

  if (TOOLING_RE.test(file)) return { bucket: "tooling", paths: [] };

  return { bucket: "unknown", paths: [], warn: true };
}
