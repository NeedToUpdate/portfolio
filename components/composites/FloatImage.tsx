interface FloatImageProps {
  src: string;
  alt: string;
  caption?: string;
  /** Which side the text wraps around on desktop. "none" spans full
   *  width, unfloated. Stacks on mobile regardless. */
  side?: "left" | "right" | "none";
  /** Width of the floated figure on desktop, as a Tailwind width class. */
  widthClass?: string;
}

/**
 * An image the surrounding text wraps around, or a full-width figure
 * when side="none". Used inside MDX insights:
 * <FloatImage src="..." alt="..." side="right" />
 */
export default function FloatImage({
  src,
  alt,
  caption,
  side = "right",
  widthClass,
}: FloatImageProps) {
  const floating = side !== "none";
  const floatClass = !floating ? "" : side === "right" ? "md:float-right md:ml-6" : "md:float-left md:mr-6";
  const resolvedWidth = widthClass ?? (floating ? "md:w-64" : "");
  return (
    <figure className={`my-4 w-full ${resolvedWidth} ${floatClass}`}>
      {/* Plain img: MDX authors pass arbitrary local or remote paths. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full rounded-lg border border-line/60" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
