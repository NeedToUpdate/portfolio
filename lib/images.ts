import path from "path";
import { contentHash, hashedName } from "./fingerprint.mjs";

const hashCache = new Map<string, string>();

/**
 * Resolves a canonical `/images/foo.svg` frontmatter path to its
 * content-hashed served URL, `/images/foo.<hash>.svg`. The hash comes
 * from the source file's bytes, so editing the file changes the URL
 * and busts the browser/CloudFront/S3 caches on its own — nothing to
 * invalidate by hand. `scripts/build-image-assets.mjs` places a copy at
 * that hashed path; both name it through lib/fingerprint.mjs.
 */
export function fingerprintedPath(publicPath: string): string {
  const cached = hashCache.get(publicPath);
  if (cached) return cached;

  const rel = publicPath.replace(/^\//, "");
  const hashed = `/${hashedName(rel, contentHash(path.join(process.cwd(), "public", rel)))}`;
  hashCache.set(publicPath, hashed);
  return hashed;
}
