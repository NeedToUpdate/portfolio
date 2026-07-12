// Fingerprints every previewImage/diagram referenced from content
// frontmatter, and generates a JPEG twin of each for use as
// og:image/twitter:image (webp and svg are both unreliable across
// social crawlers, even though browsers and Googlebot handle them
// fine). Both live at the *hashed* path, so editing the source image
// changes its served URL and busts the browser/CloudFront/S3 caches
// on its own — nothing to invalidate by hand.
//
// The hash here must agree with lib/images.ts's fingerprintedPath(),
// which resolves the same canonical path to the same hashed URL at
// render time: same algorithm (sha256 of file bytes), same length.
//
// Re-run via `npm run images` (or automatically on `npm run build`)
// after adding or changing a previewImage/diagram field.

import fs from "fs";
import path from "path";
import crypto from "crypto";
import matter from "gray-matter";
import sharp from "sharp";

const root = process.cwd();
const publicDir = path.join(root, "public");
const HASH_LENGTH = 8;

const contentDirs = [
  { dir: path.join(root, "content", "insights"), field: "previewImage" },
  { dir: path.join(root, "content", "work"), field: "diagram" },
];

function hashOf(absPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex").slice(0, HASH_LENGTH);
}

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
  const ext = path.extname(relSrc);
  const base = relSrc.slice(0, -ext.length);
  const hash = hashOf(absSrc);

  const hashedRel = `${base}.${hash}${ext}`;
  const ogRel = `${base}.${hash}.og.jpg`;
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
  const imagesDir = path.join(publicDir, "images");

  for (const file of fs.readdirSync(imagesDir)) {
    const match = file.match(/^(.+)\.[0-9a-f]{8}(\.og)?\.[a-z0-9]+$/i);
    if (!match) continue;
    const base = `images/${match[1]}`;
    if (!bases.has(base)) continue;

    const relFile = `images/${file}`;
    if (!keep.has(relFile)) {
      fs.unlinkSync(path.join(imagesDir, file));
      console.log(`removed ${relFile} (stale)`);
    }
  }
}

const sources = discoverSources();
const keep = new Set();
for (const src of sources) await processOne(src, keep);
cleanupOrphans(sources, keep);
