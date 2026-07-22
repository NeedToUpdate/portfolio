import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import SectionHeading from "@/components/composites/SectionHeading";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import DividedList from "@/components/composites/DividedList";
import InsightListItem from "@/components/composites/InsightListItem";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import ArrowLink from "@/components/ui/ArrowLink";
import JsonLd from "@/components/ui/JsonLd";
import { getInsights } from "@/lib/content";
import { pageMetadata, breadcrumbSchema } from "@/lib/seo";
import { mailtoUrl } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Architecture, AI & engineering write-ups",
  description:
    "Write-ups on architecture, AI, and engineering decisions from real projects: RAG agents, Kubernetes platforms, AI safety, and AI-assisted delivery.",
  path: "/insights",
});

export default function InsightsPage() {
  const insights = getInsights();

  return (
    <PageShell>
      {/* List rows keep their text left; the lower-right corner is calm. */}
      <NebulaBackground
        variant="mini"
        corner="bottom-right"
        miniShape="helix"
        color="aurora"
        size="lg"
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Insights", path: "/insights" },
        ])}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Insights" }]} />

      <SectionHeading
        eyebrow="Insights"
        title="Write-ups from production"
        description="Architecture, AI, and engineering decisions, written from real projects. Some write-ups include working models."
        asPageTitle
      />
      <DividedList borderTop className="mt-10">
        {insights.map((insight) => (
          <InsightListItem key={insight.slug} insight={insight} />
        ))}
      </DividedList>

      <section aria-labelledby="insights-about" className="mt-16 border-t border-line/60 pt-10">
        <Heading size="sub" id="insights-about">
          What you&rsquo;ll find here
        </Heading>
        <Text variant="muted" className="mt-4 max-w-prose">
          These write-ups come from three places. Some explain how I built a
          project. Some break down a decision from client work. Some are ideas I
          gave a client that changed how their business runs. Every one comes
          from a real system.
        </Text>
        <div className="mt-6">
          <ArrowLink
            href={mailtoUrl({
              subject: "A problem I'd like your take on",
              body: "Hi Art,\n\nI read your write-ups. I'm working through ",
            })}
            label="Email me about your business"
            nebulaShape="email"
          />
        </div>
      </section>
    </PageShell>
  );
}
