// @ts-check
import crypto from "crypto";
import fs from "fs";
import path from "path";

/**
 * Content-hash naming for images, shared by lib/images.ts (which links
 * to the hashed URL at render time) and scripts/build-image-assets.mjs
 * (which writes the file at that URL before deploy). One implementation,
 * so the two can never disagree on the name.
 */

const HASH_LENGTH = 8;

/** The first 8 hex characters of the file's sha256. */
export function contentHash(/** @type {string} */ absPath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(absPath))
    .digest("hex")
    .slice(0, HASH_LENGTH);
}

/** "images/foo.svg" + "1a2b3c4d" -> "images/foo.1a2b3c4d.svg". */
export function hashedName(/** @type {string} */ relPath, /** @type {string} */ hash) {
  const ext = path.extname(relPath);
  return `${relPath.slice(0, -ext.length)}.${hash}${ext}`;
}

/** The social-card JPEG twin of a hashed image: foo.1a2b3c4d.og.jpg. */
export function ogTwinName(/** @type {string} */ hashedPath) {
  const ext = path.extname(hashedPath);
  return `${hashedPath.slice(0, -ext.length)}.og.jpg`;
}

/** Matches a hashed image or its OG twin, e.g. foo.1a2b3c4d.og.jpg. */
export const HASHED_IMAGE_RE = /\.[0-9a-f]{8}(\.og)?\.[a-z0-9]+$/i;
