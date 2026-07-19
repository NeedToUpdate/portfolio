import Link from "next/link";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import TagList from "./TagList";
import Icon, { categoryIcon } from "@/components/ui/Icon";
import { categoryShape } from "@/lib/nebula/shapes";
import { CaseStudy } from "@/lib/types";

interface CaseStudyListItemProps {
  caseStudy: CaseStudy;
  /** Link label, e.g. "Read the case study". Source: content/home.md */
  cta: string;
}

/**
 * One entry in a work list. The category badge, tech tags, and CTA
 * mark it as a link, so the rows read as navigation rather than prose.
 */
export default function CaseStudyListItem({ caseStudy, cta }: CaseStudyListItemProps) {
  return (
    <Link href={`/work/${caseStudy.slug}`} className="group block py-7">
      {/* Nebula triggers stay small and deliberate: the badge and the
          CTA, never the whole row. */}
      {/* Icon chip + category — case studies read as delivered work
          (neutral + icon), distinct from the accent insight rows. */}
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line/50 bg-white/4 text-muted"
        >
          <Icon name={categoryIcon(caseStudy.category)} size={16} />
        </span>
        <Eyebrow nebulaShape={categoryShape(caseStudy.category)}>
          {caseStudy.category}
        </Eyebrow>
      </div>
      <Heading size="item" className="mt-3 transition-colors group-hover:text-accent">
        {caseStudy.title}
      </Heading>
      <Text variant="muted" className="mt-2 max-w-prose">
        {caseStudy.impact}
      </Text>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <TagList tags={caseStudy.techs} limit={4} />
        {/* ml-auto keeps the CTA right-aligned even when long tag rows
            wrap it onto its own line. */}
        {/* Neutral CTA (ink + accent arrow), not the insight's all-accent. */}
        <span
          data-nebula-shape={categoryShape(caseStudy.category)}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-ink"
        >
          {cta}
          <span
            aria-hidden
            className="text-accent transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
