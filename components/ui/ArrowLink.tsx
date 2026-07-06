import Link from "next/link";

interface ArrowLinkProps {
  href: string;
  label: string;
}

/** Small forward link, e.g. "All work" at the end of a section. */
export default function ArrowLink({ href, label }: ArrowLinkProps) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
    >
      {label}
      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}
