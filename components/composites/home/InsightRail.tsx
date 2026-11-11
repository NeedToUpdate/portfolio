import Link from "next/link";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import { InsightMeta } from "@/lib/types";
import Rail, { railCard } from "./Rail";
import RailHeader from "./RailHeader";
import RailEndCard from "./RailEndCard";
import InsightCardMeta from "./InsightCardMeta";

interface InsightRailProps {
  insights: InsightMeta[];
  /** Total published insights, not just the ones on the rail. */
  insightCount: number;
}

/**
 * Mobile insights rail, first. Cards lead with a tag + date: the writing
 * signature.
 */
export default function InsightRail({ insights, insightCount }: InsightRailProps) {
  return (
    <section className="pt-6" aria-labelledby="m-insights">
      <RailHeader
        eyebrow="Insights"
        tally={
          <span className="text-xs tabular-nums text-muted">
            {insightCount} written
          </span>
        }
        id="m-insights"
        title="Swipe the notes"
        blurb="How I think about systems, in writing."
        href="/insights"
        nebulaShape="article"
      />
      <Rail>
        {insights.map((insight) => (
          <Link
            key={insight.slug}
            href={`/insights/${insight.slug}`}
            className={`group ${railCard} overflow-hidden`}
          >
            <InsightCardMeta insight={insight} compact />
            <Heading size="item" className="mt-3">
              {insight.title}
            </Heading>
            <Text
              variant="muted"
              className="mt-2 mb-5 min-w-0 text-sm line-clamp-3 wrap-anywhere"
            >
              {insight.description}
            </Text>
            {/* C6: a full-width action bar pinned to the card bottom
                (mt-auto) so footers line up across the stretched rail
                cards, without a flex-1 fighting the line-clamp. */}
            <span
              data-nebula-shape="article"
              className="-mx-4 -mb-4 mt-auto flex items-center justify-between gap-1.5 border-t border-accent/25 bg-accent/10 px-4 py-3 text-sm font-medium text-accent transition-colors group-hover:bg-accent group-hover:text-accent-ink"
            >
              Read the write-up <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
        {/* Trailing "see all" card closes the rail, matching work. */}
        <RailEndCard href="/insights" title="All insights" nebulaShape="article" />
      </Rail>
    </section>
  );
}
