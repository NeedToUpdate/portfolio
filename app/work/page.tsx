import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import SectionHeading from "@/components/composites/SectionHeading";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import CapabilityList from "@/components/composites/CapabilityList";
import DividedList from "@/components/composites/DividedList";
import CaseStudyListItem from "@/components/composites/CaseStudyListItem";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import ArrowLink from "@/components/ui/ArrowLink";
import JsonLd from "@/components/ui/JsonLd";
import { getCaseStudies, getWorkIntro } from "@/lib/content";
import { pageMetadata, breadcrumbSchema } from "@/lib/seo";
import { mailtoUrl } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Enterprise modernization case studies",
  description:
    "Case studies from enterprise modernization work: data platforms, payment systems, enrollment pipelines, and delivery automation.",
  path: "/work",
});

export default function WorkPage() {
  const caseStudies = getCaseStudies();
  const intro = getWorkIntro();

  return (
    <PageShell>
      {/* The intro is capped at prose width, leaving the upper-right open. */}
      <NebulaBackground variant="mini" corner="top-right" miniShape="orion" color="solar" />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
        ])}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Work" }]} />

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

      <section aria-labelledby="work-reading" className="mt-20 border-t border-line/60 pt-10">
        <Heading size="sub" id="work-reading">
          How to read these
        </Heading>
        <Text variant="muted" className="mt-4 max-w-prose">
          Each case study is work I led and helped build. The clients are
          confidential, so identifying details stay out. The decisions and
          results are real. If one maps to a problem you have, I can walk you
          through it, or build something similar for you.
        </Text>
        <div className="mt-6">
          <ArrowLink
            href={mailtoUrl({
              subject: "A system I'd like to talk through",
              body: "Hi Art,\n\nI read your case studies. I'm working through ",
            })}
            label="Email me about your system"
            nebulaShape="email"
          />
        </div>
      </section>
    </PageShell>
  );
}
