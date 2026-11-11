interface LegacyVideoProps {
  src: string;
  /** Describes the clip for screen readers. */
  label: string;
  caption?: string;
  /** Repeats once started, the way the original GIF did. Never autoplays. */
  loop?: boolean;
  /** Narrows the figure on desktop, as a Tailwind class. */
  widthClass?: string;
}

/**
 * A locally hosted clip inside a legacy article. The originals were
 * GIFs and short MP4s embedded from Imgur; a WebM re-encode ships
 * instead. The reader starts it: nothing plays on its own.
 */
export default function LegacyVideo({
  src,
  label,
  caption,
  loop = false,
  widthClass = "",
}: LegacyVideoProps) {
  return (
    <figure className={`my-4 w-full ${widthClass}`}>
      <video
        src={src}
        aria-label={label}
        controls
        muted
        playsInline
        loop={loop}
        preload="metadata"
        className="h-auto w-full rounded-lg border border-line/60"
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
