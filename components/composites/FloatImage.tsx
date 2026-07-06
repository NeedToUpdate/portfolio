interface FloatImageProps {
  src: string;
  alt: string;
  caption?: string;
  /** Which side the text wraps around on desktop. Stacks on mobile. */
  side?: "left" | "right";
  /** Width of the floated figure on desktop, as a Tailwind width class. */
  widthClass?: string;
}

/**
 * An image the surrounding text wraps around.
 * Used inside MDX posts: <FloatImage src="..." alt="..." side="right" />
 */
export default function FloatImage({
  src,
  alt,
  caption,
  side = "right",
  widthClass = "md:w-64",
}: FloatImageProps) {
  const floatClass = side === "right" ? "md:float-right md:ml-6" : "md:float-left md:mr-6";
  return (
    <figure className={`my-4 w-full ${widthClass} ${floatClass}`}>
      {/* Plain img: MDX authors pass arbitrary local or remote paths. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full rounded-lg border border-line/60" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
