import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { ReactNode } from "react";
import MediaRow from "./MediaRow";

interface NowWithAIProps {
  /** The section's heading, e.g. "Update 6". */
  title: string;
  children: ReactNode;
  /** Optional screenshot of the project as it is today. */
  image?: string;
  imageAlt?: string;
  width?: number;
  height?: number;
  /** Optional link to the current write-up, with its button text. */
  href?: string;
  cta?: string;
}

/**
 * The "where it is today" section of an older article: what a pre-AI
 * project became once AI joined the toolchain. It reads as one more
 * update, with the same heading as the ones before it; a "Now with AI"
 * tag and a rule to the heading's right say this part was written
 * later.
 *
 * <NowWithAI title="Update 6" image="/images/..."
 *            imageAlt="..." href="/insights/k3s-homelab" cta="Read the write-up">
 *   text
 * </NowWithAI>
 */
export default function NowWithAI({
  title,
  children,
  image,
  imageAlt = "",
  width,
  height,
  href,
  cta = "Read the write-up",
}: NowWithAIProps) {
  return (
    // Inline margins: the unlayered .prose rules outrank utilities. The
    // section takes the space a prose h2 leaves above itself, and the
    // h2 gives its own up, since margins do not collapse in a flex row.
    <section style={{ marginTop: "3.375rem" }}>
      <div className="flex items-baseline gap-3">
        <h2 style={{ marginTop: 0 }} className="shrink-0">
          {title}
        </h2>
        <span className="flex min-w-0 flex-1 -translate-y-0.5 items-center gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase leading-none tracking-wider text-accent-ink">
            <Icon name="sparkle" size={13} />
            Now with AI
          </span>
          <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
        </span>
      </div>

      <div className="mt-5">
        {image ? (
          <MediaRow src={image} alt={imageAlt} width={width} height={height} side="right">
            {children}
          </MediaRow>
        ) : (
          <div className="space-y-4">{children}</div>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="unstyled-link group mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
        >
          {cta}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      )}
    </section>
  );
}
