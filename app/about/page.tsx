import type { Metadata } from "next";
import Image from "next/image";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import SectionHeading from "@/components/composites/SectionHeading";
import JsonLd from "@/components/ui/JsonLd";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import CareerTimeline from "@/components/composites/CareerTimeline";
import CapabilityList from "@/components/composites/CapabilityList";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import { getWorkIntro } from "@/lib/content";
import { careerEntries } from "@/lib/career";
import { personSchema } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Engineering director and hands-on architect in Toronto. Enterprise modernization, data platforms, AI adoption, and the teams that deliver them.",
};

export default function AboutPage() {
  const { capabilities } = getWorkIntro();

  return (
    <PageShell narrow>
      {/* The prose column is centered, so the lower-left corner is open. */}
      <NebulaBackground variant="mini" corner="bottom-left" miniShape="orion" color="aurora" />
      <JsonLd data={personSchema()} />

      <div className="flex flex-col-reverse gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <SectionHeading
            eyebrow="About"
            title="I turn ambiguous problems into running systems."
            asPageTitle
          />
        </div>
        <div className="w-32 shrink-0 sm:w-40">
          <PlaceholderImage label="Headshot" icon="systems" aspectClass="aspect-square" />
        </div>
      </div>

      <div className="prose mt-8">
        <p>
          I am an engineering director and hands-on architect based in {site.location}. My work
          covers enterprise modernization, data platforms, AI adoption, and the teams that deliver
          them. I have sat in enough executive briefings and engineering reviews to translate
          between the two without losing anything on the way.
        </p>
        <p>
          My degree is in psychology, neuroscience, and behaviour. Before tech was my job, teaching
          was. Both still shape how I work: systems are built by people, and the hard problems are
          usually on the people side of the diagram.
        </p>
        <p>
          I stay hands-on. Architecture reviews, proofs of concept, implementation planning, and
          production support are part of the job, not beneath it.
        </p>
      </div>

      <section aria-labelledby="principles" className="mt-14">
        <Heading size="sub" id="principles">
          Operating principles
        </Heading>
        <CapabilityList capabilities={capabilities} columnsClass="sm:grid-cols-2 mt-6" />
      </section>

      <div className="mt-14">
        <CareerTimeline entries={careerEntries} />
      </div>

      <section
        aria-labelledby="credentials"
        className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-line/60 pt-8"
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
          className="shrink-0 icon-glow"
        />
      </section>
    </PageShell>
  );
}
