import Image from "next/image";
import { ReactNode } from "react";
import { imageSize } from "@/lib/image-size";

interface MediaRowProps {
  src: string;
  alt: string;
  /** Read from the file when omitted; only set them to override. */
  width?: number;
  height?: number;
  /** The text that belongs to this image. Without it, the image is a
   *  standalone figure. */
  children?: ReactNode;
  /** With text: which side the image sits on, from tablet width up.
   *  Standalone: "left" or "right" floats it so the following text wraps
   *  around it, "none" spans the full width. */
  side?: "left" | "right" | "none";
  /** "half" splits the row evenly; "third" suits portrait images. */
  size?: "half" | "third";
  /** Float the image and let long text wrap around it, rather than
   *  holding the two in side-by-side columns. */
  wrap?: boolean;
  caption?: string;
  /** Show a "Click to enlarge" tab on the image. For dense images
   *  whose detail is lost at column width. */
  enlargeHint?: boolean;
  /** Standalone floated figure width on desktop, as a Tailwind class. */
  widthClass?: string;
}

/**
 * An image in an MDX article, with or without its own text.
 *
 * With children, the text sits in a column beside the image, or with
 * `wrap` flows around it; it stacks image-over-text on phones, and the
 * image opens full size in a new tab:
 *   <MediaRow src="..." alt="..." side="right">text</MediaRow>
 *
 * Without children it is a standalone figure: full width with
 * side="none", or floated left/right so the paragraphs after it wrap:
 *   <MediaRow src="..." alt="..." side="none" caption="..." />
 */
export default function MediaRow({
  src,
  alt,
  width,
  height,
  children,
  side,
  size = "half",
  wrap = false,
  caption,
  enlargeHint = false,
  widthClass,
}: MediaRowProps) {
  const intrinsic = width && height ? { width, height } : imageSize(src);
  // The optimizer rejects SVG by default; vector diagrams ship as-is.
  const unoptimized = src.endsWith(".svg");

  if (children === undefined) {
    const placement = side ?? "none";
    const floating = placement !== "none";
    const floatClass = !floating
      ? ""
      : placement === "right"
        ? "md:float-right md:ml-6"
        : "md:float-left md:mr-6";
    const resolvedWidth = widthClass ?? (floating ? "md:w-64" : "");
    return (
      <figure className={`my-4 w-full ${resolvedWidth} ${floatClass}`}>
        <Image
          src={src}
          alt={alt}
          width={intrinsic.width}
          height={intrinsic.height}
          unoptimized={unoptimized}
          sizes={floating ? "(max-width: 768px) 100vw, 20rem" : "(max-width: 768px) 100vw, 48rem"}
          className="h-auto w-full rounded-lg border border-line/60"
        />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }

  const placement = side === "right" ? "right" : "left";
  const figure = (className: string) => (
    <figure className={className}>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open full image: ${alt}`}
        className="unstyled-link relative block"
      >
        <Image
          src={src}
          alt={alt}
          width={intrinsic.width}
          height={intrinsic.height}
          unoptimized={unoptimized}
          sizes="(max-width: 768px) 100vw, 22rem"
          className="h-auto w-full rounded-lg border border-line/60"
        />
        {/* Same accent tab the interactive figures carry. */}
        {enlargeHint && (
          <span
            data-nosnippet
            className="absolute bottom-2 right-2 rounded-md bg-accent px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-accent-ink shadow-md"
          >
            Click to enlarge
          </span>
        )}
      </a>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );

  if (wrap) {
    const floatClass =
      placement === "right" ? "md:float-right md:ml-6" : "md:float-left md:mr-6";
    const floatWidth = size === "third" ? "md:w-52" : "md:w-72";
    // flow-root contains the float, so the next section starts below it.
    return (
      <section className="flow-root">
        {figure(`mb-4 w-full md:mb-2 md:mt-1 ${floatWidth} ${floatClass}`)}
        <div className="space-y-4">{children}</div>
      </section>
    );
  }

  const columns =
    size === "third"
      ? placement === "right"
        ? "md:grid-cols-[minmax(0,1fr)_13rem]"
        : "md:grid-cols-[13rem_minmax(0,1fr)]"
      : "md:grid-cols-2";

  return (
    <section className={`grid items-center gap-4 md:gap-6 ${columns}`}>
      {figure(`w-full ${placement === "right" ? "md:order-last" : ""}`)}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
