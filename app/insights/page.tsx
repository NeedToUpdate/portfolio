import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
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
