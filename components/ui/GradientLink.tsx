import Link from "next/link";
import { ReactNode } from "react";

interface GradientLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * A text link with the site's gradient shimmer. The gradient is static
 * until hover, where it slides across the text. External links get
 * rel and target handling automatically.
 */
export default function GradientLink({ href, children, className = "" }: GradientLinkProps) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const classes = `link-shimmer font-semibold ${className}`;

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
