// Pings IndexNow (Bing, Yandex, Seznam, Naver, Yep) with the indexable
// pages that changed since the last successful notification.
//
// Usage: node scripts/notify-indexnow.mjs [--dry-run]
//
// Runs in the prod deploy after the CloudFront invalidation step. It keys
// off its OWN git tag (indexnow-submitted-prod), independent of the
// CloudFront invalidation tag, so the two never interfere and can run in
// any order. --dry-run computes and prints everything but never calls
// IndexNow or moves the tag.
//
// The route-mapping and import-graph logic is shared with the CloudFront
// invalidator via scripts/cache-invalidation/ (map.mjs + graph.mjs). This
// file adds only two things on top: the filter that keeps just indexable
// HTML pages (dropping the /md agent mirror, llms.txt, sitemap.xml,
// opengraph-image, .well-known, images, _next, and any wildcard path),
// and the IndexNow POST itself.
//
// The key is PUBLIC by design, not a secret: IndexNow proves domain
// ownership by fetching KEY_LOCATION and checking it returns KEY. So there
// is nothing to configure — public/<key>.txt is committed and served, and
// this script reads the key from that same value. Keep the constant below
// and the committed file in sync (a mismatch makes IndexNow return 403).

import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";

import {
  classifyChange,
  discoverRoots,
  fullTextPathList,
  listSlugs,
  parseNameStatus,
} from "./cache-invalidation/map.mjs";
import { buildAdjacency, invertGraph } from "./cache-invalidation/graph.mjs";

const DRY_RUN = process.argv.includes("--dry-run");

const SITE_URL = (process.env.SITE_URL || "https://artnikitin.dev").replace(/\/$/, "");
const HOST = new URL(SITE_URL).host;

const KEY = "950cf158cba84d758af4d097c77153c8";
const KEY_FILE = `public/${KEY}.txt`;
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;

// Any participating endpoint forwards the submission to all the others, so
// one POST reaches every IndexNow search engine at once.
const ENDPOINT = "https://api.indexnow.org/indexnow";

const TAG = "indexnow-submitted-prod";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function tagExists(tag) {
  try {
    git(["rev-parse", "-q", "--verify", `refs/tags/${tag}`]);
    return true;
  } catch {
    return false;
  }
}

// The only paths a search engine should be told to index: the fixed
// marketing routes and the per-insight / per-case-study pages. Everything
// else the invalidator tracks is either an agent/asset surface or a
// wildcard, none of which are submittable page URLs.
const FIXED_PAGE_RE = /^\/(?:about|contact|insights|projects|work)$/;
const DETAIL_PAGE_RE = /^\/(?:insights|work)\/[a-z0-9-]+$/;
function isIndexablePage(path) {
  if (path.includes("*") || path.includes("?")) return false;
  return path === "/" || FIXED_PAGE_RE.test(path) || DETAIL_PAGE_RE.test(path);
}

function makeContext() {
  return {
    insightSlugs: listSlugs("content/insights"),
    workSlugs: listSlugs("content/work"),
    fileToPaths: new Map(),
  };
}

async function computePaths() {
  const ctx = makeContext();

  if (!tagExists(TAG)) {
    // First run: no watermark yet, so announce every current page.
    return { paths: fullTextPathList(ctx), reason: `bootstrap: no ${TAG} tag yet` };
  }

  let changed;
  try {
    changed = parseNameStatus(git(["diff", "--name-status", TAG, "HEAD"]));
  } catch (err) {
    return { paths: fullTextPathList(ctx), reason: `git diff ${TAG}..HEAD failed: ${err.message}` };
  }
  if (changed.length === 0) return { paths: [], reason: null };

  // The import graph is only needed when source (not content) files changed.
  if (changed.some(({ file }) => /^(app|components|lib|styles)\//.test(file))) {
    ctx.fileToPaths = invertGraph(await buildAdjacency(), discoverRoots(ctx));
  }

  const paths = new Set();
  for (const { file, status } of changed) {
    for (const p of classifyChange(file, status, ctx).paths) paths.add(p);
  }
  return { paths: [...paths], reason: null };
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
  // Preflight: the committed key file must exist and match KEY, or every
  // submission 403s. Fail loudly here instead of silently downstream.
  if (!existsSync(KEY_FILE)) {
    console.error(`Missing ${KEY_FILE} — create it containing the key "${KEY}".`);
    process.exit(1);
  }
  if (readFileSync(KEY_FILE, "utf8").trim() !== KEY) {
    console.error(`${KEY_FILE} does not contain the key "${KEY}".`);
    process.exit(1);
  }

  const { paths, reason } = await computePaths();
  const urlList = [...new Set(paths.filter(isIndexablePage))]
    .sort()
    .map((p) => SITE_URL + p);

  const lines = [`## IndexNow — prod${DRY_RUN ? " (dry run)" : ""}`, ""];
  if (reason) lines.push(`**Note:** ${reason}`, "");

  if (urlList.length === 0) {
    lines.push("No indexable pages changed. Nothing to submit.");
    report(lines);
    if (!DRY_RUN) moveTag();
    return;
  }

  lines.push(`**Submitting ${urlList.length} URL(s) to ${HOST}:**`);
  for (const u of urlList) lines.push(`- ${u}`);
  lines.push("");

  if (DRY_RUN) {
    lines.push("Dry run — not calling IndexNow, not moving the tag.");
    report(lines);
    return;
  }

  const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // Best-effort: a failed ping must not fail the deploy. Leaving the tag
    // put means these URLs roll into the next deploy's submission.
    lines.push(`**IndexNow request could not be sent:** ${err.message}`, "Tag not moved; will retry next deploy.");
    report(lines);
    return;
  }

  // 200 OK and 202 Accepted both mean the submission was taken.
  if (res.status === 200 || res.status === 202) {
    lines.push(`**IndexNow accepted the submission (${res.status}).**`);
    report(lines);
    moveTag();
    report([`Tag \`${TAG}\` moved to \`${git(["rev-parse", "HEAD"])}\`.`]);
    return;
  }

  const detail = await res.text().catch(() => "");
  lines.push(
    `**IndexNow rejected the submission (${res.status} ${res.statusText}).**`,
    detail ? `Response: ${detail}` : "",
    "Tag not moved; will retry next deploy.",
  );
  report(lines);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
