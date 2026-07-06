/**
 * Builds a distance field texture from an SVG path.
 *
 * The path is rasterized to a binary mask on an offscreen canvas, then a
 * two-pass chamfer distance transform converts it to "distance to the
 * shape" per pixel. The shader reads 0 inside the shape and 1 far away.
 */

const CHAMFER_STRAIGHT = 3;
const CHAMFER_DIAGONAL = 4;

/**
 * Two-pass chamfer (3-4) distance transform.
 * `mask[i] > 0` means inside the shape. Returns distances in pseudo-pixels
 * (divide by CHAMFER_STRAIGHT for pixel units). Pure function, testable.
 */
export function chamferDistance(mask: Uint8Array, width: number, height: number): Float32Array {
  const INF = 1e9;
  const dist = new Float32Array(width * height);
  for (let i = 0; i < mask.length; i++) {
    dist[i] = mask[i] > 0 ? 0 : INF;
  }

  // Forward pass: top-left to bottom-right.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (dist[i] === 0) continue;
      let d = dist[i];
      if (x > 0) d = Math.min(d, dist[i - 1] + CHAMFER_STRAIGHT);
      if (y > 0) {
        d = Math.min(d, dist[i - width] + CHAMFER_STRAIGHT);
        if (x > 0) d = Math.min(d, dist[i - width - 1] + CHAMFER_DIAGONAL);
        if (x < width - 1) d = Math.min(d, dist[i - width + 1] + CHAMFER_DIAGONAL);
      }
      dist[i] = d;
    }
  }

  // Backward pass: bottom-right to top-left.
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      if (dist[i] === 0) continue;
      let d = dist[i];
      if (x < width - 1) d = Math.min(d, dist[i + 1] + CHAMFER_STRAIGHT);
      if (y < height - 1) {
        d = Math.min(d, dist[i + width] + CHAMFER_STRAIGHT);
        if (x < width - 1) d = Math.min(d, dist[i + width + 1] + CHAMFER_DIAGONAL);
        if (x > 0) d = Math.min(d, dist[i + width - 1] + CHAMFER_DIAGONAL);
      }
      dist[i] = d;
    }
  }

  return dist;
}

/** Normalizes chamfer distances to 0..255 bytes for a luminance texture. */
export function distancesToBytes(
  dist: Float32Array,
  width: number,
  height: number
): Uint8Array {
  // Normalize against a fraction of the texture size so falloff is
  // consistent regardless of shape size.
  const maxDist = (Math.min(width, height) / 2.2) * CHAMFER_STRAIGHT;
  const out = new Uint8Array(dist.length);
  for (let i = 0; i < dist.length; i++) {
    out[i] = Math.min(255, Math.round((dist[i] / maxDist) * 255));
  }
  return out;
}

/**
 * Rasterizes an SVG path (0..100 viewBox) into a binary mask, flipped
 * vertically to match WebGL's texture orientation. Browser only.
 */
export function rasterizePathToMask(pathData: string, size: number): Uint8Array {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8Array(size * size);

  // Fit the 0..100 path into the texture with padding, y flipped for GL.
  const pad = size * 0.14;
  const scale = (size - pad * 2) / 100;
  ctx.translate(pad, size - pad);
  ctx.scale(scale, -scale);
  ctx.fillStyle = "#fff";
  ctx.fill(new Path2D(pathData));

  const pixels = ctx.getImageData(0, 0, size, size).data;
  const mask = new Uint8Array(size * size);
  for (let i = 0; i < mask.length; i++) {
    mask[i] = pixels[i * 4 + 3] > 127 ? 1 : 0;
  }
  return mask;
}

/** Full pipeline: SVG path to distance field bytes ready for upload. */
export function buildShapeField(pathData: string, size: number): Uint8Array {
  const mask = rasterizePathToMask(pathData, size);
  const dist = chamferDistance(mask, size, size);
  return distancesToBytes(dist, size, size);
}

/** A field with no shape anywhere: every texel reads "far away". */
export function emptyField(size: number): Uint8Array {
  return new Uint8Array(size * size).fill(255);
}
