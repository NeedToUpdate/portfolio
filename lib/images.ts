import crypto from "crypto";
import fs from "fs";
import path from "path";

const HASH_LENGTH = 8;
const hashCache = new Map<string, string>();

function hashOf(publicPath: string): string {
  const cached = hashCache.get(publicPath);
  if (cached) return cached;

  const rel = publicPath.replace(/^\//, "");
  const abs = path.join(process.cwd(), "public", rel);
  const hash = crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex").slice(0, HASH_LENGTH);

  hashCache.set(publicPath, hash);
  return hash;
}

/**
 * Resolves a canonical `/images/foo.svg` frontmatter path to its
 * content-hashed served URL, `/images/foo.<hash>.svg`. The hash comes
 * from the source file's bytes, so editing the file changes the URL
 * and busts the browser/CloudFront/S3 caches on its own — nothing to
 * invalidate by hand. `scripts/build-image-assets.mjs` is what places
 * a copy at that hashed path before deploy; it must agree with this
 * function on the naming scheme (same hash algorithm, same length).
 */
export function fingerprintedPath(publicPath: string): string {
  const rel = publicPath.replace(/^\//, "");
  const ext = path.extname(rel);
  return `/${rel.slice(0, -ext.length)}.${hashOf(publicPath)}${ext}`;
}
