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

const sizeClasses: Record<HeadingSize, string> = {
  hero: "text-4xl md:text-6xl font-semibold leading-[1.1] tracking-tight",
  page: "text-3xl md:text-4xl font-semibold tracking-tight",
  section: "text-2xl md:text-3xl font-semibold tracking-tight",
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
