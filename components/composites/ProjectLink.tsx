import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import OfflineShowcase from "@/components/composites/OfflineShowcase";
import type { Slide } from "@/components/composites/ProjectSlideshow";

interface ProjectLinkProps {
  /**
   * "external": the project lives on another site; opens a new tab.
   * "internal": the project runs inside this portfolio; stays on the site.
   * "offline":  the project is gone; the bar links nowhere.
   */
  mode?: "external" | "internal" | "offline";
  /** Where it goes. Not used when offline. */
  href?: string;
  /** What the thing is called, e.g. "Rock Paper Scissors Battle Royale". */
  title: string;
  /** One line under the title. */
  note?: string;
  /** Thumbnail, a path under /public. */
  image: string;
  /** The detail to centre in the thumbnail, as a CSS position ("70% 25%").
   *  A whole screenshot is unreadable at 64px; frame one part of it. */
  focus?: string;
  /** How far to zoom in on the focus point; 1 shows the whole image. */
  zoom?: number;
  /** Overrides the button text, e.g. "View the code". */
  label?: string;
  /** Offline only: screenshots the bar opens to show, one at a time,
   *  each named in a corner tag. [src, name] or [src, name, group].
   *  `label` then names the button that opens them. */
  slides?: Slide[];
}

/**
 * The "go and use it" bar for a project, usable in any MDX article:
 * <ProjectLink mode="external" href="https://..." title="..." image="/images/..." />
 *
 * It reads as a button: a square thumbnail, the project's name, and a
 * solid accent pill that carries the action. Offline projects keep the
 * bar but lose the pill's colour and the link.
 */
export default function ProjectLink({
  mode = "external",
  href,
  title,
  note,
  image,
  label,
  focus = "50% 50%",
  zoom = 1,
  slides,
}: ProjectLinkProps) {
  const offline = mode === "offline" || !href;
  const external = mode === "external";
  const action = label ?? (offline ? "Offline" : external ? "Try it out" : "Open it here");

  const info: ReactNode = (
    <>
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line/60 bg-raised sm:h-16 sm:w-16 sm:rounded-full">
        <Image
          src={image}
          alt=""
          fill
          // Asks for far more pixels than the 64px circle shows, scaled
          // by the zoom: the framed detail stays crisp at any density.
          sizes={`${Math.round(256 * zoom)}px`}
          style={{
            objectPosition: focus,
            transform: zoom === 1 ? undefined : `scale(${zoom})`,
            transformOrigin: focus,
          }}
          className={`object-cover ${offline ? "opacity-40 grayscale" : ""}`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate font-display text-base font-semibold ${
            offline ? "text-muted" : "text-ink"
          }`}
        >
          {title}
        </span>
        {note && <span className="mt-0.5 block text-sm leading-snug text-muted">{note}</span>}
      </span>
    </>
  );

  // An offline project with screenshots: the bar opens to show them.
  if (offline && slides && slides.length > 0) {
    return <OfflineShowcase info={info} slides={slides} title={title} label={label} />;
  }

  const content: ReactNode = (
    <>
      {info}
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${
          offline
            ? "border border-line/70 text-muted"
            : "bg-accent text-accent-ink transition-transform group-hover:translate-x-0.5"
        }`}
      >
        {action}
        {!offline && <span aria-hidden>{external ? "↗" : "→"}</span>}
      </span>
    </>
  );

  // "unstyled-link" opts out of the prose link colour and underline.
  const bar =
    "unstyled-link my-8 flex flex-wrap items-center gap-3 rounded-2xl border p-2 sm:flex-nowrap sm:gap-4 sm:rounded-full sm:pr-3";

  if (offline) {
    return (
      <div className={`${bar} border-dashed border-line/60 bg-surface/60`} role="note" aria-label={`${title}: offline`}>
        {content}
      </div>
    );
  }
  const live = `group ${bar} border-line/70 bg-raised/60 transition-colors hover:border-accent/60`;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={live}>
      {content}
    </a>
  ) : (
    <Link href={href!} className={live}>
      {content}
    </Link>
  );
}
