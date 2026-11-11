import Link from "next/link";
import Section from "@/components/composites/Section";
import TagList from "@/components/composites/TagList";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import ArrowLink from "@/components/ui/ArrowLink";
import { categoryShape } from "@/lib/nebula/shapes";
import { CaseStudy } from "@/lib/types";
import CaseStudyCategory from "./CaseStudyCategory";

interface CaseStudyGridProps {
  caseStudies: CaseStudy[];
  caseStudyCta: string;
}

/** Desktop featured case studies. */
export default function CaseStudyGrid({ caseStudies, caseStudyCta }: CaseStudyGridProps) {
  return (
    <Section
      eyebrow="Case studies"
      title="Systems that changed how the business runs"
      id="home-work"
      variant="flow"
      action={
        <ArrowLink
          href="/work"
          label="All case studies"
          nebulaShape="hex"
        />
      }
    >
      {/* Delivered-work cards: prominent category icon chip + tech
          chips + a neutral read-bar, distinct from the fresh-article
          insight cards (tag + date + accent bar). */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {caseStudies.map((caseStudy) => (
          <Link
            key={caseStudy.slug}
            href={`/work/${caseStudy.slug}`}
            className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d0a08]/60 shadow-2xl shadow-black/30 ring-1 ring-white/5"
          >
            <div className="flex flex-1 flex-col p-6">
              <CaseStudyCategory category={caseStudy.category} />
              <Heading size="item" className="mt-3">
                {caseStudy.title}
              </Heading>
              <Text
                variant="muted"
                className="mt-2 min-w-0 text-sm line-clamp-2 wrap-anywhere"
              >
                {caseStudy.impact}
              </Text>
              <div className="mt-auto pt-4">
                <TagList tags={caseStudy.techs} limit={3} />
              </div>
            </div>
            {/* Neutral read-bar, distinct from the accent insight bar. */}
            <span
              data-nebula-shape={categoryShape(caseStudy.category)}
              className="flex items-center justify-between gap-1.5 border-t border-line/50 bg-white/3 px-6 py-3.5 text-sm font-medium text-ink transition-colors group-hover:bg-white/6"
            >
              {caseStudyCta}{" "}
              <span aria-hidden className="text-accent">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
