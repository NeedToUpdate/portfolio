"use client";

import { ReactNode, useId, useState } from "react";
import Icon from "@/components/ui/Icon";
import ProjectSlideshow, { type Slide } from "@/components/composites/ProjectSlideshow";

interface OfflineShowcaseProps {
  /** The bar's thumbnail, title and note, rendered by ProjectLink. */
  info: ReactNode;
  slides: Slide[];
  title: string;
  /** The button's text. */
  label?: string;
}

/**
 * ProjectLink's offline bar when the project has screenshots. The
 * project can't be visited, so the bar's button opens it instead: the
 * pill grows into a card with the slideshow inside. The slideshow only
 * mounts, and its images only load, once the reader opens it.
 */
export default function OfflineShowcase({ info, slides, title, label }: OfflineShowcaseProps) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const panelId = useId();

  const toggle = () => {
    setOpen((o) => !o);
    setOpened(true);
  };

  return (
    <div
      role="group"
      aria-label={`${title}: offline`}
      // The same corner radius open and closed: a pill that grows into a
      // card, rather than a shape that snaps from one to the other.
      className="unstyled-link my-8 rounded-2xl border border-dashed border-line/60 bg-surface/60 p-2 sm:rounded-[2.5rem]"
    >
      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4 sm:pr-1">
        {info}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/60 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-ink"
        >
          {open ? "Hide screenshots" : (label ?? "See what it had")}
          <Icon
            name="chevron"
            size={16}
            strokeWidth={2}
            className={`motion-safe:transition-transform ${open ? "-rotate-90" : "rotate-90"}`}
          />
        </button>
      </div>

      <div
        id={panelId}
        className={`grid motion-safe:transition-[grid-template-rows] motion-safe:duration-300 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        inert={!open}
      >
        <div className="overflow-hidden">
          {opened && (
            <div className="pt-2">
              <ProjectSlideshow
                slides={slides}
                title={title}
                className="rounded-lg sm:rounded-[2rem]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
