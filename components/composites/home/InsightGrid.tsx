import Link from "next/link";
import Section from "@/components/composites/Section";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import ArrowLink from "@/components/ui/ArrowLink";
import { InsightMeta } from "@/lib/types";
import InsightCardMeta from "./InsightCardMeta";

interface InsightGridProps {
  insights: InsightMeta[];
}

/** Desktop "More insights": the reads after the one in the fold. */
export default function InsightGrid({ insights }: InsightGridProps) {
  return (
    <Section
      eyebrow="More insights"
      title="More notes on systems and decisions"
      id="home-insights"
      variant="flow"
      action={
        <ArrowLink
          href="/insights"
          label="All insights"
          nebulaShape="article"
        />
      }
    >
      {/* Card grid, not divided rows — the below-fold picks up the
          same fresh-article treatment (accent footer bar) as the
          fold insight and the mobile rail. */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => (
          <Link
            key={insight.slug}
            href={`/insights/${insight.slug}`}
            className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-glass/60 shadow-2xl shadow-black/30 ring-1 ring-white/5"
          >
            <div className="flex flex-1 flex-col p-6">
              <InsightCardMeta insight={insight} />
              <Heading size="item" className="mt-3">
                {insight.title}
              </Heading>
              <Text
                variant="muted"
                className="mt-2 min-w-0 text-sm line-clamp-2 wrap-anywhere"
              >
                {insight.description}
              </Text>
            </div>
            <span
              data-nebula-shape="article"
              className="flex items-center justify-between gap-1.5 border-t border-accent/25 bg-accent/10 px-6 py-3.5 text-sm font-medium text-accent transition-colors group-hover:bg-accent group-hover:text-accent-ink"
            >
              Read the write-up <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
