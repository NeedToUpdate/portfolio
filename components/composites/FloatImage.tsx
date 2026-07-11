import Image from "next/image";

interface FloatImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
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
  width,
  height,
  caption,
  side = "right",
  widthClass,
}: FloatImageProps) {
  const floating = side !== "none";
  const floatClass = !floating ? "" : side === "right" ? "md:float-right md:ml-6" : "md:float-left md:mr-6";
  const resolvedWidth = widthClass ?? (floating ? "md:w-64" : "");
  return (
    <figure className={`my-4 w-full ${resolvedWidth} ${floatClass}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={floating ? "(max-width: 768px) 100vw, 20rem" : "(max-width: 768px) 100vw, 48rem"}
        className="h-auto w-full rounded-lg border border-line/60"
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
