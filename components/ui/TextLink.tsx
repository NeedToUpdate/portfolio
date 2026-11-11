import Link from "next/link";
import { ReactNode } from "react";
import { isExternal, newTabProps } from "@/lib/links";

type TextLinkVariant = "accent" | "quiet";

interface TextLinkProps {
  href: string;
  children: ReactNode;
  variant?: TextLinkVariant;
  className?: string;
  /** Shape key the nebula background condenses into while hovered. */
  nebulaShape?: string;
}

const variantClasses: Record<TextLinkVariant, string> = {
  accent:
    "text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent",
  quiet: "text-muted transition-colors hover:text-accent",
};

/**
 * The inline text link. Internal paths use Next's Link;
 * external and mailto links get target and rel handling.
 */
export default function TextLink({
  href,
  children,
  variant = "accent",
  className = "",
  nebulaShape,
}: TextLinkProps) {
  const classes = `${variantClasses[variant]} ${className}`;
  const external = isExternal(href);

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        data-nebula-shape={nebulaShape}
        {...newTabProps(href)}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} data-nebula-shape={nebulaShape}>
      {children}
    </Link>
  );
}
