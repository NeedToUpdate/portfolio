// Fingerprints every previewImage/diagram referenced from content
// frontmatter, and generates a JPEG twin of each for use as
// og:image/twitter:image (webp and svg are both unreliable across
// social crawlers, even though browsers and Googlebot handle them
// fine). Both live at the *hashed* path, so editing the source image
// changes its served URL and busts the browser/CloudFront/S3 caches
// on its own — nothing to invalidate by hand.
//
// lib/images.ts resolves the same canonical path to the same hashed URL
// at render time; both name files through lib/fingerprint.mjs. Which
// frontmatter field holds each collection's image comes from the
// registry in lib/collections.mjs.
//
// Re-run via `npm run images` (or automatically on `npm run build`)
// after adding or changing a previewImage/diagram/screenshot field.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import sharp from "sharp";
import { ARTICLE_COLLECTIONS } from "../lib/collections.mjs";
import { HASHED_IMAGE_RE, contentHash, hashedName, ogTwinName } from "../lib/fingerprint.mjs";

const root = process.cwd();
const publicDir = path.join(root, "public");

const contentDirs = ARTICLE_COLLECTIONS.map((c) => ({
  dir: path.join(root, "content", c.key),
  field: c.imageField,
}));

function discoverSources() {
  const sources = new Set();
  for (const { dir, field } of contentDirs) {
    for (const file of fs.readdirSync(dir)) {
      if (!/\.(mdx|md)$/.test(file)) continue;
      const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      const src = data[field];
      if (typeof src === "string" && src.trim()) sources.add(src.replace(/^\//, ""));
    }
  }
  return sources;
}

async function processOne(relSrc, keep) {
  const absSrc = path.join(publicDir, relSrc);
  const hashedRel = hashedName(relSrc, contentHash(absSrc));
  const ogRel = ogTwinName(hashedRel);
  keep.add(hashedRel);
  keep.add(ogRel);

  const hashedAbs = path.join(publicDir, hashedRel);
  if (!fs.existsSync(hashedAbs)) {
    fs.copyFileSync(absSrc, hashedAbs);
    console.log(`wrote  ${hashedRel}`);
  }

  const ogAbs = path.join(publicDir, ogRel);
  if (!fs.existsSync(ogAbs)) {
    await sharp(absSrc)
      .resize(1200, 630, { fit: "cover" })
      .flatten({ background: "#0a0c0e" })
      .jpeg({ quality: 85 })
      .toFile(ogAbs);
    console.log(`wrote  ${ogRel}`);
  }
}

// Removes stale hashed variants (and their .og.jpg twins) left behind
// when a source file's content changes and its hash moves on. Only
// touches files whose base name is a currently-tracked source, so
// unrelated hashed-looking files are never at risk.
function cleanupOrphans(sources, keep) {
  const bases = new Set([...sources].map((rel) => rel.slice(0, -path.extname(rel).length)));
  // Sources can sit in subfolders (images/legacy/<slug>/), so sweep
  // every folder that holds one.
  const dirs = new Set([...sources].map((rel) => path.posix.dirname(rel)));

  for (const dir of dirs) {
    for (const file of fs.readdirSync(path.join(publicDir, dir))) {
      const match = file.match(HASHED_IMAGE_RE);
      if (!match) continue;
      if (!bases.has(`${dir}/${file.slice(0, match.index)}`)) continue;

      const relFile = `${dir}/${file}`;
      if (!keep.has(relFile)) {
        fs.unlinkSync(path.join(publicDir, relFile));
        console.log(`removed ${relFile} (stale)`);
      }
    }
  }
}

const sources = discoverSources();
const keep = new Set();
for (const src of sources) await processOne(src, keep);
cleanupOrphans(sources, keep);
