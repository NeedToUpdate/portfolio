import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";

interface AdjacentLink {
  href: string;
  title: string;
  /** Small caption above the title, e.g. "Next case study". */
  hint: string;
}

interface AdjacentNavProps {
  previous?: AdjacentLink;
  next?: AdjacentLink;
}

/**
 * Previous/next footer navigation for detail pages. Shared by case
 * studies and insight write-ups so readers keep moving through the
 * proof instead of dead-ending.
 */
export default function AdjacentNav({ previous, next }: AdjacentNavProps) {
  if (!previous && !next) return null;
  return (
    <nav
      aria-label="More in this section"
      className="mt-14 grid gap-6 border-t border-line/60 pt-8 sm:grid-cols-2"
    >
      <div className="min-w-0">
        {previous && (
          <Link href={previous.href} className="group block">
            <Eyebrow>← {previous.hint}</Eyebrow>
            <span className="mt-1.5 block font-display text-sm font-semibold text-ink transition-colors group-hover:text-accent">
              {previous.title}
            </span>
          </Link>
        )}
      </div>
      <div className="min-w-0 sm:text-right">
        {next && (
          <Link href={next.href} className="group block">
            <Eyebrow className="sm:justify-end">{next.hint} →</Eyebrow>
            <span className="mt-1.5 block font-display text-sm font-semibold text-ink transition-colors group-hover:text-accent">
              {next.title}
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
