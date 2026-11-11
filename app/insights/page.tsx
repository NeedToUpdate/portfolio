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
import { getInsights, getPageCopy, sectionCopy } from "@/lib/content";
import { pageMetadata, breadcrumbSchema } from "@/lib/seo";
import { mailtoUrl } from "@/lib/site";

const copy = getPageCopy("insights");

export const metadata: Metadata = pageMetadata({
  title: copy.seoTitle,
  description: copy.seoDescription,
  path: "/insights",
});

export default function InsightsPage() {
  const insights = getInsights();
  const about = sectionCopy(copy, "about");

  return (
    <PageShell>
      {/* List rows keep their text left; the lower-right corner is calm. */}
      <NebulaBackground
        variant="mini"
        corner="bottom-right"
        miniShape="helix"
        color="aurora"
        size="lg"
        // Dims the cloud on phones, where the list runs through the gas.
        scrim
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Insights", path: "/insights" },
        ])}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Insights" }]} />

      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        asPageTitle
      />
      <DividedList borderTop className="mt-10">
        {insights.map((insight) => (
          <InsightListItem key={insight.slug} insight={insight} />
        ))}
      </DividedList>

      <section aria-labelledby="insights-about" className="mt-16 border-t border-line/60 pt-10">
        <Heading size="sub" id="insights-about">
          {about.title}
        </Heading>
        <Text variant="muted" className="mt-4 max-w-prose">
          {about.description}
        </Text>
        <div className="mt-6">
          <ArrowLink
            href={mailtoUrl({
              subject: "A problem I'd like your take on",
              body: "Hi Art,\n\nI read your write-ups. I'm working through ",
            })}
            label={about.cta ?? "Email me"}
            nebulaShape="email"
          />
        </div>
      </section>
    </PageShell>
  );
}
