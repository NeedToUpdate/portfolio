import { ReactNode } from "react";

type TextVariant = "lead" | "muted" | "small" | "caption";
type TextTag = "p" | "span" | "div" | "dd" | "li" | "figcaption";

interface TextProps {
  children: ReactNode;
  variant?: TextVariant;
  as?: TextTag;
  className?: string;
}

const variantClasses: Record<TextVariant, string> = {
  lead: "text-lg leading-relaxed text-muted",
  muted: "leading-relaxed text-muted",
  small: "text-sm leading-relaxed text-muted",
  caption: "text-xs tracking-wide text-muted",
};

/** Supporting text. Every subtitle, description, and caption is one of these. */
export default function Text({ children, variant = "muted", as = "p", className = "" }: TextProps) {
  const Tag = as;
  return <Tag className={`${variantClasses[variant]} ${className}`}>{children}</Tag>;
}
