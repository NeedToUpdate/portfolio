import { HTMLAttributes } from "react";

type PanelVariant = "surface" | "glass";

interface PanelProps extends HTMLAttributes<HTMLElement> {
  variant?: PanelVariant;
  /** Semantic tag; sections that label themselves pass "section". */
  as?: "div" | "section";
}

const variantClasses: Record<PanelVariant, string> = {
  /** The raised surface. Interactive figures, notes, and asides sit on one. */
  surface: "rounded-xl border border-line/50 bg-surface p-5",
  /** The translucent card that floats over the nebula background. */
  glass:
    "rounded-lg border border-white/10 bg-black/45 p-6 shadow-2xl shadow-black/30 backdrop-blur-md ring-1 ring-white/5 md:p-8",
};

export default function Panel({
  children,
  variant = "surface",
  as = "div",
  className = "",
  ...rest
}: PanelProps) {
  const Tag = as;
  return (
    <Tag className={`${variantClasses[variant]} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
