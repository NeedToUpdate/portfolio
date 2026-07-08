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
    "Essays and interactive models about systems, assumptions, architecture, and engineering judgment.",
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
        title="Essays on the assumptions systems run on"
        description="Writing about architecture, reliability, decision-making, and the hidden premises that shape production software. Some essays include working models."
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
