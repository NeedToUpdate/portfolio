"use client";

import Image from "next/image";
import { KeyboardEvent, PointerEvent, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";

/** One screenshot: its path, its name, and optionally the group it
 *  belongs to ("Classroom game"), shown above the name. */
export type Slide = [src: string, label: string, group?: string];

interface ProjectSlideshowProps {
  slides: Slide[];
  /** The project's name, for the carousel's accessible label. */
  title: string;
  /** Corner radius, to nest inside the card that holds it. */
  className?: string;
}

/**
 * Screenshots of a project that can no longer be visited, one at a
 * time in a 16:9 frame. Each carries its name in a tag in the corner.
 * Arrow buttons, the arrow keys, and a swipe move between them; only
 * the current slide and its two neighbours load.
 */
export default function ProjectSlideshow({
  slides,
  title,
  className = "rounded-2xl",
}: ProjectSlideshowProps) {
  const [index, setIndex] = useState(0);
  const swipeStart = useRef<number | null>(null);
  const count = slides.length;
  const go = (step: number) => setIndex((i) => (i + step + count) % count);
  const isNear = (i: number) =>
    i === index || i === (index + 1) % count || i === (index - 1 + count) % count;
  const current = slides[index];
  if (!current) return null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
    else return;
    e.preventDefault();
  };
  const onPointerDown = (e: PointerEvent) => {
    swipeStart.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  const button =
    "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line/70 bg-glass/70 text-ink backdrop-blur-sm transition-colors hover:border-accent/70 hover:text-accent";

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`${title} screenshots`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={`relative aspect-video touch-pan-y select-none overflow-hidden border border-line/60 bg-glass ${className}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {slides.map(([src, label, group], i) =>
        isNear(i) ? (
          <div
            key={src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${label}`}
            aria-hidden={i !== index}
            className={`absolute inset-0 motion-safe:transition-opacity motion-safe:duration-300 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={src}
              alt={group ? `${group}: ${label}` : label}
              fill
              sizes="(max-width: 768px) 100vw, 48rem"
              draggable={false}
              className="object-contain"
            />
          </div>
        ) : null,
      )}

      {/* The name tag in the corner. */}
      <div
        aria-hidden
        className="absolute bottom-3 left-3 z-10 flex items-center gap-2.5 rounded-xl border border-line/70 bg-glass/80 py-1.5 pl-2.5 pr-3.5 shadow-lg backdrop-blur-md"
      >
        <span className="h-6 w-1 rounded-full bg-accent" />
        <span className="flex flex-col leading-tight">
          {current[2] && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
              {current[2]}
            </span>
          )}
          <span className="font-display text-sm font-semibold text-ink">{current[1]}</span>
        </span>
      </div>
      <span
        aria-hidden
        className="absolute right-3 top-3 z-10 rounded-full border border-line/70 bg-glass/70 px-2.5 py-0.5 text-xs tabular-nums text-muted backdrop-blur-sm"
      >
        {index + 1} / {count}
      </span>
      <p aria-live="polite" className="sr-only">
        {`${index + 1} of ${count}: ${current[1]}`}
      </p>

      <button type="button" onClick={() => go(-1)} aria-label="Previous screenshot" className={`${button} left-3`}>
        <Icon name="chevron" className="rotate-180" strokeWidth={2} />
      </button>
      <button type="button" onClick={() => go(1)} aria-label="Next screenshot" className={`${button} right-3`}>
        <Icon name="chevron" strokeWidth={2} />
      </button>
    </section>
  );
}
