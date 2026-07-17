// Computes which CloudFront paths need invalidating from the git diff
// since the last successful invalidation, then runs it.
//
// Usage: node scripts/invalidate-cloudfront.mjs <dev|prod> [--dry-run]
// Requires: aws CLI configured, GITHUB_TOKEN + GITHUB_REPOSITORY env vars
// (both already present by default in a GitHub Actions step), a full
// (non-shallow) git checkout with tags. --dry-run computes and prints
// everything but never calls AWS or moves the tag.
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
  fullPathList,
  listSlugs,
  parseNameStatus,
} from "./cache-invalidation/map.mjs";
import { buildAdjacency, invertGraph } from "./cache-invalidation/graph.mjs";

const STAGE = process.argv[2];
const DRY_RUN = process.argv.includes("--dry-run");
if (STAGE !== "dev" && STAGE !== "prod") {
  console.error("Usage: node scripts/invalidate-cloudfront.mjs <dev|prod> [--dry-run]");
  process.exit(1);
}

const TAG = `cf-invalidated-${STAGE}`;
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
  return {
    insightSlugs: listSlugs("content/insights"),
    workSlugs: listSlugs("content/work"),
    fileToPaths: new Map(),
  };
}

async function computeInvalidation() {
  const ctx = makeContext();

  if (!tagExists(TAG)) {
    return {
      paths: fullPathList(ctx),
      matches: [],
      warnings: [],
      reason: `bootstrap: no ${TAG} tag found yet`,
      commitRange: [],
    };
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
    return {
      paths: fullPathList(ctx),
      matches: [],
      warnings: [],
      reason: `git diff ${TAG}..HEAD failed: ${err.message}`,
      commitRange,
    };
  }

  if (changed.length === 0) {
    return { paths: [], matches: [], warnings: [], reason: null, commitRange };
  }

  // The import graph is only needed when source files changed.
  if (changed.some(({ file }) => /^(app|components|lib|styles)\//.test(file))) {
    ctx.fileToPaths = invertGraph(await buildAdjacency(), discoverRoots(ctx));
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

  return { paths: [...paths].sort(), matches, warnings, reason: null, commitRange };
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
  const { paths, matches, warnings, reason, commitRange } = await computeInvalidation();

  const lines = [`## CloudFront invalidation — ${STAGE}${DRY_RUN ? " (dry run)" : ""}`, ""];

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
  if (reason) {
    lines.push(`**Note:** ${reason}`, "");
  }

  if (paths.length === 0) {
    lines.push("Nothing to invalidate.");
    report(lines);
    if (!DRY_RUN) moveTag();
    return;
  }

  const distId = DRY_RUN ? "<distribution-id>" : getDistributionId(STACK_NAME);
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

  if (DRY_RUN) {
    lines.push("Dry run — not calling AWS, not moving the tag.");
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
