import Link from "next/link";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import { tagShape } from "@/lib/nebula/shapes";
import { InsightMeta } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface InsightListItemProps {
  insight: InsightMeta;
}

/**
 * One entry in an insights list: date, title, one-line description.
 * The primary tag and the CTA are small, deliberate nebula triggers,
 * same pattern as the case-study rows.
 */
export default function InsightListItem({ insight }: InsightListItemProps) {
  const [primaryTag] = insight.tags;

  return (
    <Link href={`/insights/${insight.slug}`} className="group block py-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
        <time dateTime={insight.date} className="shrink-0 text-sm tabular-nums text-muted sm:w-32">
          {formatDate(insight.date)}
        </time>
        <div className="min-w-0">
          {primaryTag && (
            <Eyebrow pill nebulaShape={tagShape(primaryTag)} className="mb-2">
              {primaryTag}
            </Eyebrow>
          )}
          <Heading size="item" className="transition-colors group-hover:text-accent">
            {insight.title}
          </Heading>
          <Text variant="muted" className="mt-1.5 max-w-prose">
            {insight.description}
          </Text>
        </div>
      </div>
      {/* sm:pl matches the date column (w-32) plus its gap (gap-6),
          so the CTA lines up under the title/description, not the date. */}
      <div className="mt-2 flex justify-end sm:pl-[9.5rem]">
        <span
          data-nebula-shape="book"
          className="inline-flex items-center gap-1.5 text-sm text-accent"
        >
          Read the write-up
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
