import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import SectionHeading from "@/components/composites/SectionHeading";
import CapabilityList from "@/components/composites/CapabilityList";
import DividedList from "@/components/composites/DividedList";
import CaseStudyListItem from "@/components/composites/CaseStudyListItem";
import Heading from "@/components/ui/Heading";
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
      {/* The intro is capped at prose width, leaving the upper-right open. */}
      <NebulaBackground variant="mini" corner="top-right" miniShape="orion" color="solar" />
      <div className="max-w-prose">
        <SectionHeading eyebrow="Case studies" title={intro.title} asPageTitle />
        <Text variant="muted" className="mt-5">
          {intro.sentence}
        </Text>
        <Text variant="small" className="mt-4">
          {intro.description}
        </Text>
      </div>

      {/* Proof first: the case studies are the page. */}
      <Text variant="caption" className="mt-14">
        {intro.caseStudiesHint}
      </Text>
      <DividedList borderTop className="mt-3">
        {caseStudies.map((caseStudy) => (
          <CaseStudyListItem key={caseStudy.slug} caseStudy={caseStudy} cta={intro.caseStudyCta} />
        ))}
      </DividedList>

      {intro.capabilities.length > 0 && (
        <section aria-labelledby="work-capabilities" className="mt-20 border-t border-line/60 pt-10">
          <Heading size="sub" id="work-capabilities">
            {intro.capabilitiesTitle}
          </Heading>
          <CapabilityList
            capabilities={intro.capabilities}
            columnsClass="sm:grid-cols-2 lg:grid-cols-3 mt-8"
          />
        </section>
      )}
    </PageShell>
  );
}
