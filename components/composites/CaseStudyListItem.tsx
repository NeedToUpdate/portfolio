import Link from "next/link";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import TagList from "./TagList";
import { categoryIcon } from "@/components/ui/Icon";
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
      <Eyebrow
        icon={categoryIcon(caseStudy.category)}
        pill
        nebulaShape={categoryShape(caseStudy.category)}
      >
        {caseStudy.category}
      </Eyebrow>
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
        <span
          data-nebula-shape={categoryShape(caseStudy.category)}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-sm text-accent"
        >
          {cta}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
