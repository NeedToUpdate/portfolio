import Image from "next/image";
import { ReactNode } from "react";

interface MediaRowProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** The text that belongs to this image. */
  children: ReactNode;
  /** Which side the image sits on, from tablet width up. */
  side?: "left" | "right";
  /** "half" splits the row evenly; "third" suits portrait images. */
  size?: "half" | "third";
  /** Float the image and let long text wrap around it, rather than
   *  holding the two in side-by-side columns. */
  wrap?: boolean;
  caption?: string;
  /** Show a "Click to enlarge" tab on the image. For dense images
   *  whose detail is lost at column width. */
  enlargeHint?: boolean;
}

/**
 * An image with its text beside it, for any MDX article:
 * <MediaRow src="..." alt="..." width={1200} height={900} side="right">
 *   text
 * </MediaRow>
 * Short text sits in a column next to the image; with `wrap`, long
 * text flows around it. Stacks image-over-text on phones either way.
 * The image opens full size in a new tab.
 */
export default function MediaRow({
  src,
  alt,
  width,
  height,
  children,
  side = "left",
  size = "half",
  wrap = false,
  caption,
  enlargeHint = false,
}: MediaRowProps) {
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
          width={width}
          height={height}
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
      side === "right" ? "md:float-right md:ml-6" : "md:float-left md:mr-6";
    const widthClass = size === "third" ? "md:w-52" : "md:w-72";
    // flow-root contains the float, so the next section starts below it.
    return (
      <section className="flow-root">
        {figure(`mb-4 w-full md:mb-2 md:mt-1 ${widthClass} ${floatClass}`)}
        <div className="space-y-4">{children}</div>
      </section>
    );
  }

  const columns =
    size === "third"
      ? side === "right"
        ? "md:grid-cols-[minmax(0,1fr)_13rem]"
        : "md:grid-cols-[13rem_minmax(0,1fr)]"
      : "md:grid-cols-2";

  return (
    <section className={`grid items-center gap-4 md:gap-6 ${columns}`}>
      {figure(`w-full ${side === "right" ? "md:order-last" : ""}`)}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
