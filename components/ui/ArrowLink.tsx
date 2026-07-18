import Link from "next/link";

interface ArrowLinkProps {
  href: string;
  label: string;
  /** Shape key the nebula background condenses into while hovered. */
  nebulaShape?: string;
}

/** Small forward link, e.g. "All case studies" at the end of a section.
 *  Muted-until-hover only works where hover exists; touch screens get
 *  full ink so the link reads as tappable instead of disabled. */
export default function ArrowLink({ href, label, nebulaShape }: ArrowLinkProps) {
  const className =
    "group inline-flex items-center gap-1.5 text-sm text-ink transition-colors [@media(hover:hover)]:text-muted [@media(hover:hover)]:hover:text-accent";
  const inner = (
    <>
      {label}
      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </>
  );

  // mailto/external links get a plain anchor; Next's Link is for
  // in-app routes and doesn't handle the mailto protocol.
  const external = href.startsWith("http") || href.startsWith("mailto:");
  if (external) {
    return (
      <a
        href={href}
        data-nebula-shape={nebulaShape}
        className={className}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} data-nebula-shape={nebulaShape} className={className}>
      {inner}
    </Link>
  );
}
