"use client";

import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import { CareerEntry, StreamView } from "@/lib/career";

interface CareerTimelineProps {
  entries: CareerEntry[];
}

const STAGGER_MS = 90;

function staggerStyle(index: number, total: number, split: boolean): CSSProperties {
  const step = split ? index : total - index - 1;
  return { transitionDelay: `${step * STAGGER_MS}ms` };
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
        className="mt-8 grid transition-all duration-500 ease-out"
      >
        <ol
          aria-hidden={split}
          className={`col-start-1 row-start-1 space-y-8 border-l border-line/70 pl-6 transition-all duration-500 ease-out ${
            split
              ? "pointer-events-none -translate-x-4 opacity-0 blur-sm"
              : "translate-x-0 opacity-100 blur-0"
          }`}
        >
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className={`relative transition-all duration-500 ease-out ${
                split ? "-translate-x-5 opacity-0" : "translate-x-0 opacity-100"
              }`}
              style={staggerStyle(index, entries.length, split)}
            >
              <span
                aria-hidden
                className={`absolute -left-[1.72rem] top-1.5 h-2 w-2 rounded-full bg-accent transition-all duration-500 ease-out ${
                  split ? "scale-50 opacity-0" : "scale-100 opacity-100"
                }`}
                style={staggerStyle(index, entries.length, split)}
              />
              <EntryCard view={entry.merged} period={entry.period} />
            </li>
          ))}
        </ol>

        <div
          aria-hidden={!split}
          className={`col-start-1 row-start-1 transition-all duration-700 ease-out ${
            split
              ? "translate-x-0 opacity-100 blur-0 delay-100"
              : "pointer-events-none translate-x-4 opacity-0 blur-sm"
          }`}
        >
          <div className="mb-6 grid grid-cols-2 gap-6">
            <Eyebrow>Engineering</Eyebrow>
            <Eyebrow className="border-l border-line/70 pl-6">Teaching &amp; leadership</Eyebrow>
          </div>
          <ol className="space-y-10">
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                className={`grid grid-cols-2 gap-6 transition-all duration-500 ease-out ${
                  split ? "translate-x-0 opacity-100" : "translate-x-5 opacity-0"
                }`}
                style={staggerStyle(index, entries.length, split)}
              >
                <div
                  className={`transition-all duration-500 ease-out ${
                    split && entry.tech ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
                  }`}
                  aria-hidden={!entry.tech}
                  style={staggerStyle(index, entries.length, split)}
                >
                  {entry.tech && <EntryCard view={entry.tech} period={entry.period} />}
                </div>
                <div className="relative border-l border-line/70 pl-6 transition-colors duration-700">
                  {entry.lead && (
                    <>
                      <span
                        aria-hidden
                        className={`absolute -left-[0.28rem] top-1.5 h-2 w-2 rounded-full bg-nebula transition-all duration-500 ease-out ${
                          split ? "scale-100 opacity-100" : "scale-50 opacity-0"
                        }`}
                        style={staggerStyle(index, entries.length, split)}
                      />
                      <EntryCard view={entry.lead} period={entry.period} />
                    </>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
