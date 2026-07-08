import Link from "next/link";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import { InsightMeta } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface InsightListItemProps {
  insight: InsightMeta;
}

/** One entry in an insights list: date, title, one-line description. */
export default function InsightListItem({ insight }: InsightListItemProps) {
  return (
    <Link href={`/insights/${insight.slug}`} className="group block py-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
        <time dateTime={insight.date} className="shrink-0 text-sm tabular-nums text-muted sm:w-32">
          {formatDate(insight.date)}
        </time>
        <div className="min-w-0">
          <Heading size="item" className="transition-colors group-hover:text-accent">
            {insight.title}
          </Heading>
          <Text variant="muted" className="mt-1.5 max-w-prose">
            {insight.description}
          </Text>
        </div>
      </div>
    </Link>
  );
}
