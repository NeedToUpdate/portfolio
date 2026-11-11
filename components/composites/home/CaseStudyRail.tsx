import Link from "next/link";
import TagList from "@/components/composites/TagList";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Icon from "@/components/ui/Icon";
import { categoryShape } from "@/lib/nebula/shapes";
import { CaseStudy } from "@/lib/types";
import Rail, { railCard } from "./Rail";
import RailHeader from "./RailHeader";
import RailEndCard from "./RailEndCard";
import CaseStudyCategory from "./CaseStudyCategory";

interface CaseStudyRailProps {
  caseStudies: CaseStudy[];
  /** Total published case studies, not just the ones on the rail. */
  caseCount: number;
  caseStudyCta: string;
}

/**
 * Mobile case studies rail, second. Cards lead with a category badge +
 * tech chips: clearly work, not a note.
 */
export default function CaseStudyRail({ caseStudies, caseCount, caseStudyCta }: CaseStudyRailProps) {
  return (
    <section className="pt-9" aria-labelledby="m-work">
      <RailHeader
        eyebrow="Case studies"
        tally={
          <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted">
            <Icon name="check" size={13} className="text-accent" />
            {caseCount} shipped
          </span>
        }
        id="m-work"
        title="Swipe the work"
        blurb="Real work, delivered end to end."
        href="/work"
        nebulaShape="hex"
      />
      <Rail>
        {caseStudies.map((caseStudy) => (
          <Link
            key={caseStudy.slug}
            href={`/work/${caseStudy.slug}`}
            className={`group ${railCard} overflow-hidden`}
          >
            <CaseStudyCategory category={caseStudy.category} compact />
            <Heading size="item" className="mt-3">
              {caseStudy.title}
            </Heading>
            <Text
              variant="muted"
              className="mt-2 min-w-0 text-sm line-clamp-3 wrap-anywhere"
            >
              {caseStudy.impact}
            </Text>
            <div className="mt-auto pt-4">
              <TagList tags={caseStudy.techs} limit={3} />
            </div>
            {/* Neutral read-bar (not the insight's accent bar) marks
                these as delivered work, read separately from writing. */}
            <span
              data-nebula-shape={categoryShape(caseStudy.category)}
              className="-mx-4 -mb-4 mt-4 flex items-center justify-between gap-1.5 border-t border-line/50 bg-white/3 px-4 py-3 text-sm font-medium text-ink transition-colors group-hover:bg-white/6"
            >
              {caseStudyCta}
              <span aria-hidden className="text-accent">
                →
              </span>
            </span>
          </Link>
        ))}
        {/* Trailing "see all" card closes the rail. */}
        <RailEndCard href="/work" title="All case studies" nebulaShape="hex" />
      </Rail>
    </section>
  );
}
