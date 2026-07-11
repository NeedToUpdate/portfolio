import { ReactNode } from "react";

type HeadingLevel = "h1" | "h2" | "h3";
type HeadingSize = "hero" | "page" | "section" | "sub" | "item" | "small";

interface HeadingProps {
  children: ReactNode;
  /** Semantic tag. Defaults follow size: hero/page → h1, section/sub → h2, item/small → h3. */
  as?: HeadingLevel;
  size: HeadingSize;
  id?: string;
  className?: string;
}

const defaultTag: Record<HeadingSize, HeadingLevel> = {
  hero: "h1",
  page: "h1",
  section: "h2",
  sub: "h2",
  item: "h3",
  small: "h3",
};

// Display sizes scale fluidly with the viewport via clamp() instead of
// jumping at one breakpoint. Bounds match the old text-4xl/6xl pairs.
// Body-adjacent sizes stay on the rem scale for zoom accessibility.
// Hero runs a steeper slope so phones land near 1.8rem (the old curve
// held 2.25rem+ there and pushed the second card below the fold) while
// large screens still reach the same 3.75rem cap.
const sizeClasses: Record<HeadingSize, string> = {
  hero: "text-[clamp(1.75rem,0.65rem+4.9vw,3.75rem)] font-semibold leading-[1.1] tracking-tight",
  page: "text-[clamp(1.875rem,1.55rem+1.4vw,2.25rem)] font-semibold tracking-tight",
  section: "text-[clamp(1.5rem,1.25rem+1.1vw,1.875rem)] font-semibold leading-snug tracking-tight",
  sub: "text-xl font-semibold tracking-tight",
  item: "text-lg font-semibold tracking-tight",
  small: "text-base font-semibold",
};

/** The heading. Every title and subtitle on the site is one of these. */
export default function Heading({ children, as, size, id, className = "" }: HeadingProps) {
  const Tag = as ?? defaultTag[size];
  return (
    <Tag id={id} className={`font-display text-ink ${sizeClasses[size]} ${className}`}>
      {children}
    </Tag>
  );
}
