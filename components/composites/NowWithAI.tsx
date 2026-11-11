import Image from "next/image";
import { imageSize } from "@/lib/image-size";
import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { ReactNode } from "react";
import Heading from "@/components/ui/Heading";

interface NowWithAIProps {
  /** The panel's heading, e.g. "Update 6". */
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
 * The "where it is today" panel for an older article: what a pre-AI
 * project became once AI joined the toolchain. It sits apart from the
 * article around it, with the site's flair colours behind it, so a
 * reader sees at a glance that this part was written later.
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
  const size = image ? (width && height ? { width, height } : imageSize(image)) : undefined;
  return (
    <section className="relative my-10 overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-[0_18px_55px_rgba(0,0,0,0.25)]">
      {/* Flair wash: plasma from the top-left, nebula from the right. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgb(var(--c-plasma)/0.22),transparent_45%),radial-gradient(circle_at_95%_15%,rgb(var(--c-nebula)/0.2),transparent_42%)]"
      />
      <div className="relative p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-ink">
            <Icon name="sparkle" size={13} />
            Now with AI
          </span>
          <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
        </div>

        {/* A <p> with a heading role: keeps the outline without picking
            up the prose h2 rule and its marker. */}
        <Heading size="sub" as="p" className="mt-4">
          {title}
        </Heading>

        {image && size && (
          <a
            href={image}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open full image: ${imageAlt}`}
            className="unstyled-link mt-4 block"
          >
            <Image
              src={image}
              alt={imageAlt}
              width={size.width}
              height={size.height}
              sizes="(max-width: 768px) 100vw, 40rem"
              className="h-auto w-full rounded-lg border border-line/60"
            />
          </a>
        )}

        <div className="mt-4 space-y-4">{children}</div>

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
      </div>
    </section>
  );
}
