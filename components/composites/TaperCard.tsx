import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

interface TaperCardProps {
  /** Thumbnail on the left; its inner edge tapers into the card. */
  image: string;
  /** Small uppercase label, e.g. "Legacy article" or "Try it out". */
  eyebrow: string;
  children: ReactNode;
  /** The action line under the text. Omit on a card that goes nowhere. */
  cta?: string;
  /** Omit for a static card. */
  href?: string;
  /** Opens in a new tab and shows an outbound arrow. */
  external?: boolean;
  /** Greys the card out: for something that no longer exists. */
  muted?: boolean;
  className?: string;
}

/**
 * The small wide card with a tapered thumbnail. One shape, three uses:
 * a link inside the site, a link out of it, or a static card with no
 * destination. LegacyOriginCard and ProjectLink are both built on it.
 */
export default function TaperCard({
  image,
  eyebrow,
  children,
  cta,
  href,
  external = false,
  muted = false,
  className = "",
}: TaperCardProps) {
  const content = (
    <>
      {/* The taper: the thumbnail's right edge runs on a diagonal. */}
      <span className="relative w-32 shrink-0 self-stretch overflow-hidden bg-raised [clip-path:polygon(0_0,100%_0,calc(100%_-_2.25rem)_100%,0_100%)] sm:w-52">
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 640px) 208px, 128px"
          className={`object-cover object-left-top transition duration-500 ${
            muted ? "opacity-40 grayscale" : "opacity-85 group-hover:opacity-100"
          }`}
        />
      </span>
      <span className="flex min-w-0 flex-col justify-center gap-1 py-3 pr-4">
        <span
          className={`text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${
            muted ? "text-muted" : "text-accent"
          }`}
        >
          {eyebrow}
        </span>
        <span className={`text-sm leading-snug ${muted ? "text-muted" : "text-ink/90"}`}>
          {children}
        </span>
        {cta && (
          <span className="text-xs text-muted transition-colors group-hover:text-accent">
            {cta}{" "}
            <span
              aria-hidden
              className={`inline-block transition-transform ${
                external
                  ? "group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  : "group-hover:translate-x-1"
              }`}
            >
              {external ? "↗" : "→"}
            </span>
          </span>
        )}
      </span>
    </>
  );

  const base = `flex min-h-24 items-stretch gap-1 overflow-hidden rounded-xl border bg-surface ${className}`;
  if (!href) {
    return <div className={`${base} border-dashed border-line/60`}>{content}</div>;
  }
  const linked = `group ${base} border-line/60 transition-colors hover:border-accent/50`;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linked}>
      {content}
    </a>
  ) : (
    <Link href={href} className={linked}>
      {content}
    </Link>
  );
}
