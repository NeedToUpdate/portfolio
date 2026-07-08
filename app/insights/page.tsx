import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import SectionHeading from "@/components/composites/SectionHeading";
import DividedList from "@/components/composites/DividedList";
import InsightListItem from "@/components/composites/InsightListItem";
import { getInsights } from "@/lib/content";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Essays and deep dives on systems, architecture, and engineering decisions. Some of them interactive.",
};

export default function InsightsPage() {
  const insights = getInsights();

  return (
    <PageShell>
      <SectionHeading
        eyebrow="Insights"
        title="Notes on systems and decisions"
        description="Essays on systems, architecture, and decisions. Some include working models."
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
