import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import SectionHeading from "@/components/composites/SectionHeading";
import CapabilityList from "@/components/composites/CapabilityList";
import DividedList from "@/components/composites/DividedList";
import CaseStudyListItem from "@/components/composites/CaseStudyListItem";
import Text from "@/components/ui/Text";
import { getCaseStudies, getWorkIntro } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Case studies from enterprise modernization work: data platforms, payment systems, enrollment pipelines, and delivery automation.",
};

export default function WorkPage() {
  const caseStudies = getCaseStudies();
  const intro = getWorkIntro();

  return (
    <PageShell>
      <div className="max-w-prose">
        <SectionHeading eyebrow="Case studies" title={intro.title} asPageTitle />
        <Text variant="muted" className="mt-5">
          {intro.sentence}
        </Text>
        <Text variant="small" className="mt-4">
          {intro.description}
        </Text>
      </div>

      {intro.capabilities.length > 0 && (
        <CapabilityList
          capabilities={intro.capabilities}
          columnsClass="sm:grid-cols-2 lg:grid-cols-5 mt-14"
        />
      )}

      <DividedList borderTop className="mt-14">
        {caseStudies.map((caseStudy) => (
          <CaseStudyListItem key={caseStudy.slug} caseStudy={caseStudy} />
        ))}
      </DividedList>
    </PageShell>
  );
}
