// Computes which CloudFront paths need invalidating from the git diff
// since the last successful invalidation, then runs it. See
// CDN_INVALIDATION_PLAN.md for the design and why it's shaped this way.
//
// Usage: node scripts/invalidate-cloudfront.mjs <dev|prod>
// Requires: aws CLI configured, GITHUB_TOKEN + GITHUB_REPOSITORY env vars
// (both already present by default in a GitHub Actions step), a full
// (non-shallow) git checkout with tags.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, appendFileSync } from "node:fs";

const STAGE = process.argv[2];
if (STAGE !== "dev" && STAGE !== "prod") {
  console.error("Usage: node scripts/invalidate-cloudfront.mjs <dev|prod>");
  process.exit(1);
}

const TAG = `cf-invalidated-${STAGE}`;
const STACK_NAME = `portfolio-${STAGE}`;
const SKIP_MARKER = "[skip-invalidate]";

const FIXED_PATHS = [
  "/",
  "/about",
  "/contact",
  "/insights",
  "/projects",
  "/work",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
  "/images/*",
  "/_next/image*",
];

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
    ...FIXED_PATHS,
    ...insightSlugs.map((s) => `/insights/${s}`),
    ...workSlugs.map((s) => `/work/${s}`),
  ];
}

function classify(file) {
  let m;
  if ((m = file.match(/^content\/insights\/([^/]+)\.mdx?$/))) return { bucket: "insight", slug: m[1] };
  if ((m = file.match(/^content\/work\/([^/]+)\.mdx?$/))) return { bucket: "work", slug: m[1] };
  if (file.startsWith("content/projects/")) return { bucket: "projects" };
  if (file.startsWith("content/career/")) return { bucket: "career" };
  if (file.startsWith("content/skills/")) return { bucket: "skills" };
  if (file === "content/home.md") return { bucket: "home" };
  if (file.startsWith("public/images/")) return { bucket: "images" };
  if (file === "app/robots.ts") return { bucket: "robots" };
  if (file === "app/sitemap.ts") return { bucket: "sitemap" };
  if (file === "app/opengraph-image.tsx") return { bucket: "og" };
  return { bucket: "unknown" };
}

function addPathsFor(paths, bucket, slug) {
  switch (bucket) {
    case "insight":
      paths.add(`/insights/${slug}`);
      paths.add("/insights");
      paths.add("/");
      paths.add("/sitemap.xml");
      break;
    case "work":
      paths.add(`/work/${slug}`);
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
    case "images":
      paths.add("/images/*");
      paths.add("/_next/image*");
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
    changed = linesOf(git(["diff", "--name-only", TAG, "HEAD"]));
  } catch (err) {
    return { paths: fullPathList(), matches: [], reason: `git diff ${TAG}..HEAD failed: ${err.message}`, commitRange };
  }

  if (changed.length === 0) {
    return { paths: [], matches: [], reason: null, commitRange };
  }

  const paths = new Set();
  const matches = [];
  const unknownFiles = [];

  for (const file of changed) {
    const { bucket, slug } = classify(file);
    matches.push({ file, bucket, slug });
    if (bucket === "unknown") {
      unknownFiles.push(file);
    } else {
      addPathsFor(paths, bucket, slug);
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
    for (const m of matches) lines.push(`- \`${m.file}\` → ${m.bucket}${m.slug ? ` (${m.slug})` : ""}`);
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
