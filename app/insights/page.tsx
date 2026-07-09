import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import SectionHeading from "@/components/composites/SectionHeading";
import DividedList from "@/components/composites/DividedList";
import InsightListItem from "@/components/composites/InsightListItem";
import { getInsights } from "@/lib/content";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Essays on architecture, AI, and engineering decisions, written from real projects.",
};

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
      <SectionHeading
        eyebrow="Insights"
        title="Essays from production"
        description="Architecture, AI, and engineering decisions, written from real projects. Some essays include working models."
        asPageTitle
      />
      <DividedList borderTop className="mt-10">
        {insights.map((insight) => (
          <InsightListItem key={insight.slug} insight={insight} />
        ))}
      </DividedList>
    </PageShell>
  );
}
