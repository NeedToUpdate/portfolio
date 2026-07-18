import Link from "next/link";
import { ReactNode } from "react";
import { buttonClasses, ButtonVariant, ButtonShape } from "./Button";

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  shape?: ButtonShape;
  className?: string;
  /** Shape key the nebula background condenses into while hovered. */
  nebulaShape?: string;
}

/**
 * An anchor that looks like a Button. Internal paths use Next's Link;
 * external and mailto links get a plain anchor with target/rel handling
 * (mirrors TextLink, since Next's Link doesn't handle the mailto protocol).
 */
export default function ButtonLink({
  href,
  children,
  variant = "solid",
  shape = "rounded",
  className = "",
  nebulaShape,
}: ButtonLinkProps) {
  const classes = buttonClasses(
    variant,
    shape,
    `inline-flex items-center justify-center gap-2 ${className}`,
  );
  const external = href.startsWith("http") || href.startsWith("mailto:");

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        data-nebula-shape={nebulaShape}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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
