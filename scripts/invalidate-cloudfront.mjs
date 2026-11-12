// Computes which CloudFront paths need invalidating from the git diff
// since the last successful invalidation, then runs it.
//
// Usage: node scripts/invalidate-cloudfront.mjs <dev|prod> [--dry-run]
// Requires: aws CLI configured, GITHUB_TOKEN + GITHUB_REPOSITORY env vars
// (both already present by default in a GitHub Actions step), a full
// (non-shallow) git checkout with tags. --dry-run computes and prints
// everything but never calls AWS or moves the tag.
//
// On a pull request, the Tests workflow runs a dry run against the merge
// commit as a preview. PR_NUMBER and PR_TITLE name the PR, and
// INVALIDATION_REPORT_FILE collects the report for the PR comment.
//
// Mapping logic lives in scripts/cache-invalidation/: map.mjs holds the
// content/asset rules and route topology, graph.mjs resolves changed
// source files to the routes that render them via the import graph.
// Unrecognized files invalidate nothing (they're reported loudly);
// image changes invalidate only their own optimizer variants.

import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

import {
  SKIP_MARKER,
  classifyChange,
  discoverRoots,
  newPagePaths,
  batchInvalidationPaths,
  parseNameStatus,
  rscPrefetchPaths,
  slugsFromDisk,
} from "./cache-invalidation/map.mjs";
import { buildAdjacency, invertGraph, scopeMdxComponents } from "./cache-invalidation/graph.mjs";

const STAGE = process.argv[2];
const DRY_RUN = process.argv.includes("--dry-run");
if (STAGE !== "dev" && STAGE !== "prod") {
  console.error("Usage: node scripts/invalidate-cloudfront.mjs <dev|prod> [--dry-run]");
  process.exit(1);
}

const TAG = `cf-invalidated-${STAGE}`;
const PR_NUMBER = process.env.PR_NUMBER;
const PR_TITLE = process.env.PR_TITLE;
const PREVIEW = DRY_RUN && Boolean(PR_NUMBER);
const STACK_NAME = `portfolio-${STAGE}`;

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

function makeContext() {
  return { slugs: slugsFromDisk(), fileToPaths: new Map() };
}

// Without a diff there is no way to know what changed, and guessing means
// a blanket purge that evicts every cached image. Fail the step instead;
// the deploy itself has already gone out.
async function computeInvalidation() {
  const ctx = makeContext();

  if (!tagExists(TAG)) {
    throw new Error(
      `No ${TAG} tag, so there is no diff to invalidate from. Nothing was invalidated. ` +
        `Tag the commit whose deploy was last invalidated, then rerun: ` +
        `git tag ${TAG} <sha> && git push origin refs/tags/${TAG}`,
    );
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
    throw new Error(`git diff ${TAG}..HEAD failed, so nothing was invalidated: ${err.message}`);
  }

  if (changed.length === 0) {
    return { paths: [], matches: [], warnings: [], commitRange };
  }

  // The import graph is only needed when source files changed.
  if (changed.some(({ file }) => /^(app|components|lib|styles)\//.test(file))) {
    const mdxScope = scopeMdxComponents(await buildAdjacency());
    ctx.fileToPaths = invertGraph(mdxScope.adjacency, [
      ...discoverRoots(ctx),
      ...mdxScope.roots,
    ]);
  }

  const paths = new Set();
  const matches = [];
  const warnings = [];

  for (const { file, status } of changed) {
    const entry = classifyChange(file, status, ctx);
    matches.push({ file, status, bucket: entry.bucket, slug: entry.slug });
    for (const p of entry.paths) paths.add(p);
    if (entry.warn) warnings.push(`\`${file}\` (${entry.bucket}) matched no rule — invalidating nothing for it`);
  }

  // A changed shared component reaches new pages too; they were never cached.
  for (const p of newPagePaths(changed, ctx)) paths.delete(p);

  // Each purged page's prefetch payloads ("<page>?_rsc=...") are cached
  // under their own keys; "<page>?*" purges them with the page.
  for (const p of rscPrefetchPaths([...paths])) paths.add(p);

  return { paths: [...paths].sort(), matches, warnings, commitRange };
}

async function findSkipMarker(shas) {
  // A preview's own PR is not merged yet, so the API can't find it from
  // a commit. Its title is checked directly.
  if (PREVIEW && PR_TITLE?.includes(SKIP_MARKER)) {
    return { prNumber: PR_NUMBER, prTitle: PR_TITLE };
  }
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
  for (const file of [process.env.GITHUB_STEP_SUMMARY, process.env.INVALIDATION_REPORT_FILE]) {
    if (file) appendFileSync(file, text);
  }
}

async function main() {
  const { paths, matches, warnings, commitRange } = await computeInvalidation();

  const lines = PREVIEW
    ? [
        `## CloudFront invalidation preview: ${STAGE}`,
        "",
        `What the ${STAGE} deploy will invalidate once this PR merges: the diff from \`${TAG}\` to this PR's merge commit. It updates on every push.`,
        "",
      ]
    : [`## CloudFront invalidation — ${STAGE}${DRY_RUN ? " (dry run)" : ""}`, ""];

  if (matches.length > 0) {
    lines.push("**Matched files:**");
    for (const m of matches) lines.push(`- \`${m.status ?? "?"} ${m.file}\` → ${m.bucket}${m.slug ? ` (${m.slug})` : ""}`);
    lines.push("");
  }
  if (warnings.length > 0) {
    lines.push("**Warnings:**");
    for (const w of warnings) lines.push(`- ⚠️ ${w}`);
    lines.push("");
  }

  if (paths.length === 0) {
    lines.push("Nothing to invalidate.");
    report(lines);
    if (!DRY_RUN) moveTag();
    return;
  }

  const distId = DRY_RUN ? "<distribution-id>" : getDistributionId(STACK_NAME);
  const batches = batchInvalidationPaths(paths);
  const commands = batches.map(
    (batch) =>
      `aws cloudfront create-invalidation --distribution-id ${distId} --paths ${batch.map((p) => `"${p}"`).join(" ")}`,
  );

  lines.push("**Paths:**");
  for (const p of paths) lines.push(`- \`${p}\``);
  lines.push(
    "",
    batches.length === 1
      ? "**Command:**"
      : `**Commands** (${batches.length} requests, each waiting for the last to finish: CloudFront allows 15 wildcard paths in progress at once):`,
    "```",
    ...commands,
    "```",
    "",
  );

  const skip = await findSkipMarker(commitRange);
  if (skip) {
    lines.push(
      `**Skipped** — PR #${skip.prNumber} ("${skip.prTitle}") in this range is marked \`${SKIP_MARKER}\`. Not running the commands above; the tag stays put so these paths roll into the next invalidation that does run.`
    );
    report(lines);
    return;
  }

  if (DRY_RUN) {
    lines.push(PREVIEW ? "Preview only. Nothing is invalidated until the deploy runs." : "Dry run — not calling AWS, not moving the tag.");
    report(lines);
    return;
  }

  report(lines);

  for (const [i, batch] of batches.entries()) {
    try {
      const id = execFileSync(
        "aws",
        ["cloudfront", "create-invalidation", "--distribution-id", distId, "--paths", ...batch,
          "--query", "Invalidation.Id", "--output", "text"],
        { encoding: "utf8" },
      ).trim();
      report([`Request ${i + 1} of ${batches.length}: ${batch.length} paths, invalidation \`${id}\`.`]);
      // The next request's wildcards only fit once this one is done.
      if (i < batches.length - 1) {
        execFileSync("aws", ["cloudfront", "wait", "invalidation-completed", "--distribution-id", distId, "--id", id], {
          stdio: "inherit",
        });
      }
    } catch (err) {
      report([
        "",
        `**Invalidation request ${i + 1} of ${batches.length} failed.** Run the remaining commands above by hand, in order, each after the last completes. The tag stays put, so the next deploy invalidates these paths again.`,
      ]);
      throw err;
    }
  }

  moveTag();
  report(["", `Tag \`${TAG}\` moved to \`${git(["rev-parse", "HEAD"])}\`.`]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
