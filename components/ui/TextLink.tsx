import Link from "next/link";
import { ReactNode } from "react";

type TextLinkVariant = "accent" | "quiet";

interface TextLinkProps {
  href: string;
  children: ReactNode;
  variant?: TextLinkVariant;
  className?: string;
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
}: TextLinkProps) {
  const classes = `${variantClasses[variant]} ${className}`;
  const external = href.startsWith("http") || href.startsWith("mailto:");

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
