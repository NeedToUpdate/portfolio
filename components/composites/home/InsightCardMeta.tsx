import Eyebrow from "@/components/ui/Eyebrow";
import { tagShape } from "@/lib/nebula/shapes";
import { formatDate } from "@/lib/format";
import { InsightMeta } from "@/lib/types";

interface InsightCardMetaProps {
  insight: InsightMeta;
  /** Shrinks the pill and date to fit the narrow mobile rail card. */
  compact?: boolean;
}

/**
 * Tag left, date/read-time small and right-aligned. The row wraps rather
 * than clipping on narrow cards.
 */
export default function InsightCardMeta({ insight, compact = false }: InsightCardMetaProps) {
  const [primaryTag] = insight.tags;
  return (
    <div
      className={
        compact
          ? "flex flex-wrap items-center gap-x-2 gap-y-1"
          : "flex flex-wrap items-center gap-x-3 gap-y-1"
      }
    >
      {primaryTag && (
        <Eyebrow
          pill
          nebulaShape={tagShape(primaryTag)}
          className={
            compact ? "!px-2.5 !py-0.5 !text-[0.625rem] !tracking-[0.1em]" : undefined
          }
        >
          {primaryTag}
        </Eyebrow>
      )}
      <span
        className={
          compact
            ? "ml-auto shrink-0 text-[0.625rem] uppercase tracking-wide tabular-nums text-muted"
            : "ml-auto shrink-0 text-[0.7rem] uppercase tracking-wide tabular-nums text-muted"
        }
      >
        {formatDate(insight.date)} ·{" "}
        {insight.readingTimeMinutes} min
      </span>
    </div>
  );
}
