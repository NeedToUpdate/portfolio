import Link from "next/link";
import TagList from "@/components/composites/TagList";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Panel from "@/components/ui/Panel";
import { formatDate } from "@/lib/format";
import { InsightMeta } from "@/lib/types";

interface LatestInsightPanelProps {
  insight: InsightMeta;
}

/** The freshest insight, given its own panel in the desktop fold. */
export default function LatestInsightPanel({ insight }: LatestInsightPanelProps) {
  return (
    <Panel
      as="section"
      variant="glass"
      aria-labelledby="home-latest-insight"
      className="flex flex-col justify-between gap-5 overflow-hidden border-l-2 border-l-accent/60 !backdrop-blur-none md:min-h-[18rem] md:gap-8"
    >
      <div className="min-w-0">
        {/* Accent label + edge + date mark this as a fresh, dated
        article — content that changes — versus the permanent
        About section below. */}
        <Text
          variant="muted"
          className="mb-4 text-sm uppercase tracking-wide"
        >
          <span className="text-accent">Latest insight</span> ·{" "}
          {formatDate(insight.date)} ·{" "}
          {insight.readingTimeMinutes} min read
        </Text>
        <Heading
          size="section"
          id="home-latest-insight"
          className="max-w-3xl"
        >
          {insight.title}
        </Heading>
        {/* Phones get a three-line teaser and no tag row; the
        full description and tags live on the write-up. */}
        <Text
          variant="lead"
          className="mt-4 line-clamp-3 max-w-2xl md:mt-5 md:line-clamp-none"
        >
          {insight.description}
        </Text>
        {insight.tags.length > 0 && (
          <TagList
            tags={insight.tags}
            variant="pill"
            className="mt-5 hidden md:flex"
          />
        )}
      </div>
      {/* D3: an article-style footer bar makes the insight read
      as a tappable write-up, echoing the mobile card. */}
      <Link
        href={`/insights/${insight.slug}`}
        data-nebula-shape="article"
        className="-mx-5 -mb-5 flex items-center justify-between border-t border-accent/25 bg-accent/10 px-5 py-4 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-ink md:-mx-8 md:-mb-8 md:px-8"
      >
        Read the write-up <span aria-hidden>→</span>
      </Link>
    </Panel>
  );
}
