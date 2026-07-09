import { HTMLAttributes } from "react";

type TextVariant = "lead" | "emphasis" | "muted" | "small" | "caption";
type TextTag = "p" | "span" | "div" | "dd" | "li" | "figcaption";

interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  as?: TextTag;
}

const variantClasses: Record<TextVariant, string> = {
  lead: "text-lg leading-relaxed text-muted",
  /** A supporting line that must hold its own against a heading. */
  emphasis: "text-lg leading-relaxed text-ink",
  muted: "leading-relaxed text-muted",
  small: "text-sm leading-relaxed text-muted",
  caption: "text-xs tracking-wide text-muted",
};

/** Supporting text. Every subtitle, description, and caption is one of these. */
export default function Text({
  children,
  variant = "muted",
  as = "p",
  className = "",
  ...rest
}: TextProps) {
  const Tag = as;
  return (
    <Tag className={`${variantClasses[variant]} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
