import fs from "fs";
import path from "path";
import { imageSize as readImageSize } from "image-size";

export interface ImageSize {
  width: number;
  height: number;
}

const sizes = new Map<string, ImageSize>();

/**
 * The intrinsic size of an image under public/, read from the file's
 * header. MDX media components use it so articles never hand-write a
 * width and height that can drift from the real file. Server-only;
 * public/ ships with the Lambda bundle (scripts/zip_standalone.py).
 *
 * Pure JS on purpose: loading the repo's sharp into the server bundle
 * puts a second libvips beside the one Next bundles, and the two clash.
 */
export function imageSize(publicPath: string): ImageSize {
  const cached = sizes.get(publicPath);
  if (cached) return cached;

  const file = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  const { width, height } = readImageSize(fs.readFileSync(file));
  if (!width || !height) throw new Error(`No dimensions in ${publicPath}`);
  const size = { width, height };
  sizes.set(publicPath, size);
  return size;
}
