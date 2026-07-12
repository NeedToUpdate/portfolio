import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import SectionHeading from "@/components/composites/SectionHeading";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import JsonLd from "@/components/ui/JsonLd";
import CareerTimeline from "@/components/composites/CareerTimeline";
import CapabilityList from "@/components/composites/CapabilityList";
import SkillSpans from "@/components/composites/SkillSpans";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Panel from "@/components/ui/Panel";
import { getCareerEntries, getSkillDomains, getWorkIntro } from "@/lib/content";
import { pageMetadata, profilePageSchema, breadcrumbSchema } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: "Engineering director and hands-on architect in Toronto. Enterprise modernization, data platforms, AI adoption, and the teams that deliver them.",
  path: "/about",
});

export default function AboutPage() {
  const { capabilities } = getWorkIntro();
  const careerEntries = getCareerEntries();
  const skillDomains = getSkillDomains();

  return (
    <PageShell narrow>
      {/* The prose column is centered, so the lower-left corner is open. */}
      <NebulaBackground
        variant="mini"
        corner="bottom-left"
        miniShape="orion"
        color="aurora"
      />
      <JsonLd data={profilePageSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />

      <div className="flex flex-col-reverse gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <SectionHeading
            eyebrow="About"
            title="I turn ambiguous problems into running systems."
            asPageTitle
          />
        </div>
        <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-xl border border-line/50 sm:w-40">
          <Image
            src="/images/portrait.webp"
            alt={site.name}
            width={800}
            height={800}
            sizes="10rem"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="prose mt-8">
        <p>
          I am an engineering director and hands-on architect based in{" "}
          {site.location}. My work covers enterprise modernization, data
          platforms, AI adoption, and the teams that deliver them. I have sat in
          enough executive briefings and engineering reviews to translate
          between the two without losing anything on the way.
        </p>
        <p>
          I studied psychology, neuroscience, and behaviour before I moved into
          tech. My first work was in education. That background still shapes how
          I lead technical work: I pay attention to incentives, decision-making,
          and the gaps between what people ask for and what they need.
        </p>
        <p>
          I stay hands-on. Architecture reviews, proofs of concept,
          implementation planning, and production support are part of the job,
          not beneath it.
        </p>
      </div>

      <Link href="/work" className="group mt-8 block">
        <Panel className="transition-colors group-hover:border-line">
          <Text
            variant="muted"
            className="mb-2 text-sm uppercase tracking-wide"
          >
            Case studies
          </Text>
          <Heading
            size="small"
            className="transition-colors group-hover:text-accent"
          >
            Systems that changed how the business runs
          </Heading>
          <Text variant="small" className="mt-2 max-w-prose">
            My favourite work across modernization, data platforms, delivery
            systems, and production architecture.
          </Text>
          <span
            data-nebula-shape="hex"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent"
          >
            View case studies
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </span>
        </Panel>
      </Link>

      <section aria-labelledby="principles" className="mt-14">
        <Heading size="sub" id="principles">
          Operating principles
        </Heading>
        <CapabilityList
          capabilities={capabilities}
          columnsClass="sm:grid-cols-2 mt-6"
        />
      </section>

      <section aria-labelledby="skill-spans" className="mt-14">
        <Heading size="sub" id="skill-spans">
          What I work with
        </Heading>
        <Text variant="small" className="mt-2">
          Every skill, from first real use to today. Hover a row.
        </Text>
        <SkillSpans domains={skillDomains} className="mt-6" />
      </section>

      <div className="mt-14">
        <CareerTimeline entries={careerEntries} />
      </div>

      {/* No wrap: the badge stays beside the title on phones instead of
          dropping to its own row when the title breaks across lines. */}
      <section
        aria-labelledby="credentials"
        className="mt-14 flex items-center justify-between gap-6 border-t border-line/60 pt-8"
      >
        <div className="min-w-0">
          <Heading size="small" as="h2" id="credentials">
            AWS Certified Solutions Architect — Associate
          </Heading>
          <Text variant="small" className="mt-1">
            Certified on the platform most of my work runs on.
          </Text>
        </div>
        <Image
          src="/images/aws_saa_cert.png"
          alt="AWS Certified Solutions Architect Associate badge"
          width={72}
          height={72}
          data-nebula-shape="hex"
          className="shrink-0 icon-glow"
        />
      </section>
    </PageShell>
  );
}
