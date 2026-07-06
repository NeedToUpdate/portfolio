"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import { CareerEntry, StreamView } from "@/lib/career";

interface CareerTimelineProps {
  entries: CareerEntry[];
}

function EntryCard({ view, period }: { view: StreamView; period: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm tabular-nums text-muted">{period}</p>
      <Heading size="small" className="mt-1">
        {view.title} · {view.org}
      </Heading>
      <ul className="mt-2 space-y-1.5">
        {view.points.map((point) => (
          <Text key={point} variant="small" as="li">
            {point}
          </Text>
        ))}
      </ul>
    </div>
  );
}

/**
 * One timeline, two careers. Merged, it reads as a single track.
 * Split (hover on desktop, button everywhere), it separates into an
 * engineering stream and a teaching-and-leadership stream, with the
 * psychology degree rooting the leadership side.
 */
export default function CareerTimeline({ entries }: CareerTimelineProps) {
  const [split, setSplit] = useState(false);
  // Hover splitting only applies where hover exists; the button covers touch.
  const canHover = useRef<boolean | null>(null);

  const hoverAllowed = () => {
    if (canHover.current === null) {
      canHover.current =
        typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
    }
    return canHover.current;
  };

  return (
    <section aria-labelledby="history">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading size="sub" id="history">
          Where I have worked
        </Heading>
        <Button variant="outline" shape="pill" onClick={() => setSplit((s) => !s)} aria-pressed={split}>
          {split ? "Merge the streams" : "Split the streams"}
        </Button>
      </div>
      <Text variant="small" className="mt-2">
        {split
          ? "Two tracks, one career: engineering on the left, teaching and leadership on the right."
          : "One timeline, two skill sets. Hover or use the button to split it."}
      </Text>

      <div
        onMouseEnter={() => hoverAllowed() && setSplit(true)}
        onMouseLeave={() => hoverAllowed() && setSplit(false)}
        className="mt-8"
      >
        {!split ? (
          <ol className="animate-fade-in space-y-8 border-l border-line/70 pl-6">
            {entries.map((entry) => (
              <li key={entry.id} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[1.72rem] top-1.5 h-2 w-2 rounded-full bg-accent"
                />
                <EntryCard view={entry.merged} period={entry.period} />
              </li>
            ))}
          </ol>
        ) : (
          <div className="animate-fade-in">
            <div className="mb-6 grid grid-cols-2 gap-6">
              <Eyebrow>Engineering</Eyebrow>
              <Eyebrow className="border-l border-line/70 pl-6">Teaching &amp; leadership</Eyebrow>
            </div>
            <ol className="space-y-10">
              {entries.map((entry) => (
                <li key={entry.id} className="grid grid-cols-2 gap-6">
                  <div className={entry.tech ? "" : "opacity-0"} aria-hidden={!entry.tech}>
                    {entry.tech && <EntryCard view={entry.tech} period={entry.period} />}
                  </div>
                  <div className="relative border-l border-line/70 pl-6">
                    {entry.lead && (
                      <>
                        <span
                          aria-hidden
                          className="absolute -left-[0.28rem] top-1.5 h-2 w-2 rounded-full bg-nebula"
                        />
                        <EntryCard view={entry.lead} period={entry.period} />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
