import { InsightMeta } from "@/lib/types";
import DesktopHero from "./DesktopHero";
import LatestInsightPanel from "./LatestInsightPanel";
import AboutPanel from "./AboutPanel";
import ScrollCue from "./ScrollCue";

interface DesktopFoldProps {
  latestInsight?: InsightMeta;
}

/**
 * FOLD: on desktop the bento fills the viewport (min-h in dvh, a minimum
 * not a fixed height, so short/landscape screens still scroll) with a
 * scroll cue pinned to the bottom — the same deliberate fold the phone
 * gets.
 */
export default function DesktopFold({ latestInsight }: DesktopFoldProps) {
  return (
    <div className="lg:flex lg:min-h-[calc(100dvh-9rem)] lg:flex-col">
      {/* Center the bento vertically so tall/large screens get
          balanced breathing room instead of a gap under the hero. */}
      <div className="lg:flex lg:flex-1 lg:items-center">
        <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] lg:grid-rows-[auto_auto] md:gap-8">
          <DesktopHero />
          {latestInsight && <LatestInsightPanel insight={latestInsight} />}
          <AboutPanel />
        </div>
      </div>
      {/* Scroll cue at the fold bottom (desktop only). */}
      <ScrollCue
        className="mt-10 hidden items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted lg:flex"
        insightsId="home-insights"
        workId="home-work"
      />
    </div>
  );
}
