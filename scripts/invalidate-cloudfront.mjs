// Computes which CloudFront paths need invalidating from the git diff
// since the last successful invalidation, then runs it.
//
// Usage: node scripts/invalidate-cloudfront.mjs <dev|prod>
// Requires: aws CLI configured, GITHUB_TOKEN + GITHUB_REPOSITORY env vars
// (both already present by default in a GitHub Actions step), a full
// (non-shallow) git checkout with tags.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, appendFileSync } from "node:fs";
import path from "node:path";

const STAGE = process.argv[2];
if (STAGE !== "dev" && STAGE !== "prod") {
  console.error("Usage: node scripts/invalidate-cloudfront.mjs <dev|prod>");
  process.exit(1);
}

const TAG = `cf-invalidated-${STAGE}`;
const STACK_NAME = `portfolio-${STAGE}`;
const SKIP_MARKER = "[skip-invalidate]";

// Every text route the site currently serves, excluding anything under
// /images/* or /_next/image* — those are handled separately (and often
// need nothing at all, see IMAGE_HASHED_RE below).
const TEXT_FIXED_PATHS = [
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

const IMAGE_WILDCARD_PATHS = ["/images/*", "/_next/image*"];

// previewImage/diagram source files get copied to a sha256-hashed twin
// by scripts/build-image-assets.mjs (see lib/images.ts). The hashed
// file is the only one ever linked to, so a new hash is a brand new
// URL — nothing to invalidate. This matches that naming scheme.
const HASHED_IMAGE_RE = /\.[0-9a-f]{8}(\.og)?\.[a-z0-9]+$/i;

// Hand-versioned static assets (favicon-v2.ico, apple-touch-icon-v2.png,
// ...): editing one bumps the suffix and produces a new filename/URL on
// purpose (see the comment in app/layout.tsx), so it never needs
// invalidating either.
const VERSIONED_ASSET_RE = /-v\d+\.[a-z0-9]+$/i;

// Shared UI/layout code: rendered on (or affects metadata of) every
// text route, but never touches image bytes.
const GLOBAL_FILES = new Set([
  "app/layout.tsx",
  "app/not-found.tsx",
  "lib/site.ts",
  "lib/seo.ts",
  "lib/content.ts",
  "lib/types.ts",
  "lib/format.ts",
  "lib/routeDiagram.ts",
  "components/composites/Nav.tsx",
  "components/composites/Footer.tsx",
  "components/composites/StarField.tsx",
  "components/composites/PageShell.tsx",
  "components/composites/NebulaBackground.tsx",
  "components/composites/Breadcrumbs.tsx",
  "components/composites/Section.tsx",
  "components/composites/SectionHeading.tsx",
  "components/composites/TagList.tsx",
  "components/composites/DividedList.tsx",
  "components/composites/MdxContent.tsx",
  "components/composites/Markdown.tsx",
  "components/composites/mdx-components.tsx",
  "components/composites/AdjacentNav.tsx",
  "components/composites/InsightListItem.tsx",
  "components/composites/CaseStudyListItem.tsx",
  "components/composites/CapabilityList.tsx",
  "components/composites/ProjectCard.tsx",
]);

function isSharedUiPrimitive(file) {
  return file.startsWith("components/ui/");
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function linesOf(output) {
  return output.split("\n").map((l) => l.trim()).filter(Boolean);
}

function tagExists(tag) {
  try {
    git(["rev-parse", "-q", "--verify", `refs/tags/${tag}`]);
    return true;
  } catch {
    return false;
  }
}

function listSlugs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

// Enumerates every current insight/work slug from the checked-out content
// directories, rather than relying on a "/insights/*"-style wildcard — so
// the fallback always matches what's actually on the site right now.
function fullPathList() {
  const insightSlugs = listSlugs("content/insights");
  const workSlugs = listSlugs("content/work");
  return [
    ...TEXT_FIXED_PATHS,
    ...IMAGE_WILDCARD_PATHS,
    ...insightSlugs.map((s) => `/insights/${s}`),
    ...workSlugs.map((s) => `/work/${s}`),
  ];
}

// Same as above but without the image wildcards — this is what a
// "global" text-only change (layout, nav, site identity, ...) touches.
function fullTextPathList() {
  const insightSlugs = listSlugs("content/insights");
  const workSlugs = listSlugs("content/work");
  return [
    ...TEXT_FIXED_PATHS,
    ...insightSlugs.map((s) => `/insights/${s}`),
    ...workSlugs.map((s) => `/work/${s}`),
  ];
}

// Derives the served path of an ordinary (non-dynamic) app route file,
// e.g. "app/about/page.tsx" -> "/about", "app/page.tsx" -> "/". Returns
// null for dynamic segments ([slug]) — those need slug enumeration and
// are handled as their own bucket below, not generically.
function staticRoutePath(file) {
  const m = file.match(/^app\/(?:(.+)\/)?(page|route)\.(tsx?|jsx?)$/);
  if (!m) return null;
  const seg = m[1];
  if (seg && /[[\]]/.test(seg)) return null;
  return seg ? `/${seg}` : "/";
}

function isPageFile(file) {
  return /\/page\.(tsx?|jsx?)$/.test(file) || file === "app/page.tsx";
}

// Parses `git diff --name-status`, expanding renames/copies (R100/C100)
// into a synthetic delete of the old path plus an add of the new one so
// each path gets classified under its own status.
function parseNameStatus(output) {
  const entries = [];
  for (const line of linesOf(output)) {
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

// Classifies one changed file into an invalidation bucket. `status` is
// git's A/M/D (added/modified/deleted) for that path.
function classify(file, status) {
  let m;

  if (GLOBAL_FILES.has(file) || isSharedUiPrimitive(file)) {
    return { bucket: "global" };
  }

  if (file === "app/insights/[slug]/page.tsx") return { bucket: "template-insight" };
  if (file === "app/work/[slug]/page.tsx") return { bucket: "template-work" };
  if (file === "app/robots.ts") return { bucket: "robots" };
  if (file === "app/sitemap.ts") return { bucket: "sitemap" };
  if (file === "app/opengraph-image.tsx") return { bucket: "og" };

  const staticPath = staticRoutePath(file);
  if (staticPath !== null) {
    if (status === "A") {
      // Brand new route: nothing was ever cached at this path, so there's
      // nothing to purge. New pages need their sitemap entry refreshed;
      // new non-page routes (API-shaped route.ts) don't even need that.
      return isPageFile(file) ? { bucket: "sitemap" } : { bucket: "noop" };
    }
    return { bucket: "static-route", path: staticPath };
  }

  if ((m = file.match(/^content\/insights\/([^/]+)\.mdx?$/)))
    return { bucket: "insight", slug: m[1], isNew: status === "A" };
  if ((m = file.match(/^content\/work\/([^/]+)\.mdx?$/)))
    return { bucket: "work", slug: m[1], isNew: status === "A" };
  if (file.startsWith("content/projects/")) return { bucket: "projects" };
  if (file.startsWith("content/career/")) return { bucket: "career" };
  if (file.startsWith("content/skills/")) return { bucket: "skills" };
  if (file === "content/home.md") return { bucket: "home" };

  if (file.startsWith("public/images/")) {
    const name = path.basename(file);
    return HASHED_IMAGE_RE.test(name)
      ? { bucket: "noop" } // self-busting content-hashed twin, see HASHED_IMAGE_RE
      : { bucket: "image-direct", file };
  }

  if (file.startsWith("public/")) {
    const name = path.basename(file);
    if (VERSIONED_ASSET_RE.test(name)) return { bucket: "noop" }; // self-busting, see VERSIONED_ASSET_RE
    return { bucket: "static-root", path: `/${file.slice("public/".length)}` };
  }

  return { bucket: "unknown" };
}

function addPathsFor(paths, entry) {
  switch (entry.bucket) {
    case "global":
      for (const p of fullTextPathList()) paths.add(p);
      break;
    case "template-insight":
      for (const s of listSlugs("content/insights")) paths.add(`/insights/${s}`);
      paths.add("/insights");
      paths.add("/");
      paths.add("/sitemap.xml");
      break;
    case "template-work":
      for (const s of listSlugs("content/work")) paths.add(`/work/${s}`);
      paths.add("/work");
      paths.add("/");
      paths.add("/sitemap.xml");
      break;
    case "static-route":
      paths.add(entry.path);
      break;
    case "insight":
      if (!entry.isNew) paths.add(`/insights/${entry.slug}`);
      paths.add("/insights");
      paths.add("/");
      paths.add("/sitemap.xml");
      break;
    case "work":
      if (!entry.isNew) paths.add(`/work/${entry.slug}`);
      paths.add("/work");
      paths.add("/");
      paths.add("/sitemap.xml");
      break;
    case "projects":
      paths.add("/projects");
      paths.add("/sitemap.xml");
      break;
    case "career":
    case "skills":
      paths.add("/about");
      break;
    case "home":
      paths.add("/");
      paths.add("/about");
      break;
    case "image-direct":
      paths.add(`/${entry.file.slice("public/".length)}`);
      paths.add("/_next/image*");
      break;
    case "static-root":
      paths.add(entry.path);
      break;
    case "robots":
      paths.add("/robots.txt");
      break;
    case "sitemap":
      paths.add("/sitemap.xml");
      break;
    case "og":
      paths.add("/opengraph-image");
      break;
    case "noop":
      break;
  }
}

function computeInvalidation() {
  if (!tagExists(TAG)) {
    return { paths: fullPathList(), matches: [], reason: `bootstrap: no ${TAG} tag found yet`, commitRange: [] };
  }

  const commitRange = (() => {
    try {
      return linesOf(git(["log", `${TAG}..HEAD`, "--format=%H"]));
    } catch {
      return [];
    }
  })();

  let changed;
  try {
    changed = parseNameStatus(git(["diff", "--name-status", TAG, "HEAD"]));
  } catch (err) {
    return { paths: fullPathList(), matches: [], reason: `git diff ${TAG}..HEAD failed: ${err.message}`, commitRange };
  }

  if (changed.length === 0) {
    return { paths: [], matches: [], reason: null, commitRange };
  }

  const paths = new Set();
  const matches = [];
  const unknownFiles = [];

  for (const { file, status } of changed) {
    const entry = classify(file, status);
    matches.push({ file, status, bucket: entry.bucket, slug: entry.slug });
    if (entry.bucket === "unknown") {
      unknownFiles.push(file);
    } else {
      addPathsFor(paths, entry);
    }
  }

  if (unknownFiles.length > 0) {
    return {
      paths: fullPathList(),
      matches,
      reason: `unmapped file(s) changed, falling back to full invalidation: ${unknownFiles.join(", ")}`,
      commitRange,
    };
  }

  return { paths: [...paths], matches, reason: null, commitRange };
}

async function findSkipMarker(shas) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo || shas.length === 0) return null;

  for (const sha of shas) {
    let res;
    try {
      res = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}/pulls`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
    } catch {
      continue;
    }
    if (!res.ok) continue;
    const prs = await res.json();
    for (const pr of prs) {
      if (typeof pr.title === "string" && pr.title.includes(SKIP_MARKER)) {
        return { sha, prNumber: pr.number, prTitle: pr.title };
      }
    }
  }
  return null;
}

function getDistributionId(stackName) {
  const out = execFileSync(
    "aws",
    [
      "cloudformation",
      "describe-stacks",
      "--stack-name",
      stackName,
      "--query",
      "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue",
      "--output",
      "text",
    ],
    { encoding: "utf8" }
  ).trim();
  if (!out) throw new Error(`Could not resolve CloudFrontDistributionId from stack ${stackName}`);
  return out;
}

function moveTag() {
  execFileSync("git", ["tag", "-f", TAG], { stdio: "inherit" });
  execFileSync("git", ["push", "origin", `refs/tags/${TAG}`, "--force"], { stdio: "inherit" });
}

function report(lines) {
  const text = lines.join("\n") + "\n";
  process.stdout.write(text);
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) appendFileSync(summaryFile, text);
}

async function main() {
  const { paths, matches, reason, commitRange } = computeInvalidation();

  const lines = [`## CloudFront invalidation — ${STAGE}`, ""];

  if (matches.length > 0) {
    lines.push("**Matched files:**");
    for (const m of matches) lines.push(`- \`${m.status ?? "?"} ${m.file}\` → ${m.bucket}${m.slug ? ` (${m.slug})` : ""}`);
    lines.push("");
  }
  if (reason) {
    lines.push(`**Note:** ${reason}`, "");
  }

  if (paths.length === 0) {
    lines.push("Nothing to invalidate.");
    report(lines);
    moveTag();
    return;
  }

  const distId = getDistributionId(STACK_NAME);
  const command = `aws cloudfront create-invalidation --distribution-id ${distId} --paths ${paths
    .map((p) => `"${p}"`)
    .join(" ")}`;

  lines.push("**Paths:**");
  for (const p of paths) lines.push(`- \`${p}\``);
  lines.push("", "**Command:**", "```", command, "```", "");

  const skip = await findSkipMarker(commitRange);
  if (skip) {
    lines.push(
      `**Skipped** — PR #${skip.prNumber} ("${skip.prTitle}") in this range is marked \`${SKIP_MARKER}\`. Not running the command above; the tag stays put so these paths roll into the next invalidation that does run.`
    );
    report(lines);
    return;
  }

  report(lines);

  try {
    execFileSync("aws", ["cloudfront", "create-invalidation", "--distribution-id", distId, "--paths", ...paths], {
      stdio: "inherit",
    });
  } catch (err) {
    report(["", "**Invalidation call failed.** Copy the command above into a terminal to run it manually."]);
    throw err;
  }

  moveTag();
  report(["", `Tag \`${TAG}\` moved to \`${git(["rev-parse", "HEAD"])}\`.`]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
