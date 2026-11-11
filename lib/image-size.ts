import path from "path";
import sharp from "sharp";

export interface ImageSize {
  width: number;
  height: number;
}

const sizes = new Map<string, Promise<ImageSize>>();

/**
 * The intrinsic size of an image under public/, read from the file
 * itself. MDX media components use it so articles never hand-write a
 * width and height that can drift from the real file. Server-only;
 * public/ ships with the Lambda bundle (scripts/zip_standalone.py).
 */
export function imageSize(publicPath: string): Promise<ImageSize> {
  let size = sizes.get(publicPath);
  if (!size) {
    const file = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
    size = sharp(file)
      .metadata()
      .then(({ width, height }) => {
        if (!width || !height) throw new Error(`No dimensions in ${publicPath}`);
        return { width, height };
      });
    sizes.set(publicPath, size);
  }
  return size;
}
