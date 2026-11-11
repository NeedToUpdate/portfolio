"use client";

import { useReducedMotion } from "@/lib/use-reduced-motion";

interface VideoFigureProps {
  /** The WebM clip. An H.264 .mp4 and a .poster.webp frame sit beside
   *  it under the same name (tests/content.test.ts checks they exist). */
  src: string;
  /** Describes the clip for screen readers. */
  label: string;
  caption?: string;
  /** Repeats once started, the way a GIF would. Never autoplays, and
   *  plays once for readers who ask for reduced motion. */
  loop?: boolean;
  /** Narrows the figure on desktop, as a Tailwind class. */
  widthClass?: string;
}

/** The MP4 fallback and poster frame that sit beside a WebM clip. */
export function videoCompanions(src: string) {
  const base = src.replace(/\.webm$/, "");
  return { mp4: `${base}.mp4`, poster: `${base}.poster.webp` };
}

/**
 * A locally hosted clip inside an MDX article. The reader starts it:
 * nothing plays on its own. WebM comes first; the MP4 covers Safari on
 * iOS before 17.4, which can't play WebM.
 */
export default function VideoFigure({
  src,
  label,
  caption,
  loop = false,
  widthClass = "",
}: VideoFigureProps) {
  const reducedMotion = useReducedMotion();
  const { mp4, poster } = videoCompanions(src);
  return (
    <figure className={`my-4 w-full ${widthClass}`}>
      <video
        aria-label={label}
        poster={poster}
        controls
        muted
        playsInline
        loop={loop && !reducedMotion}
        preload="metadata"
        className="h-auto w-full rounded-lg border border-line/60"
      >
        <source src={src} type="video/webm" />
        <source src={mp4} type="video/mp4" />
      </video>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
