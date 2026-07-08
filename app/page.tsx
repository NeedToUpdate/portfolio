import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import Section from "@/components/composites/Section";
import DividedList from "@/components/composites/DividedList";
import MetricStat from "@/components/composites/MetricStat";
import CaseStudyListItem from "@/components/composites/CaseStudyListItem";
import InsightListItem from "@/components/composites/InsightListItem";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import ArrowLink from "@/components/ui/ArrowLink";
import TextLink from "@/components/ui/TextLink";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import JsonLd from "@/components/ui/JsonLd";
import { getFeaturedCaseStudies, getInsights } from "@/lib/content";
import { personSchema } from "@/lib/seo";
import { site } from "@/lib/site";

const heroMetrics = [
  { value: "1M+", label: "customers on a billing portal modernized with zero disruption" },
  { value: "99.99%", label: "uptime on a rebuilt enterprise payment integration" },
  { value: "1 day", label: "data delivery that used to take a month" },
  { value: "4 hours", label: "bug to production, down from a week" },
];

const homeCardClass =
  "rounded-lg border border-white/10 bg-black/45 p-6 shadow-2xl shadow-black/30 backdrop-blur-md ring-1 ring-white/5 md:p-8";

export default function HomePage() {
  const featured = getFeaturedCaseStudies(3);
  const insights = getInsights().slice(0, 3);

  return (
    <>
      <JsonLd data={personSchema()} />
      <NebulaBackground />
      <PageShell>
        <div className="space-y-6 md:space-y-8">
          {/* Hero */}
          <section
            data-nebula-shape="spark"
            className={`grid min-h-[40vh] items-center gap-10 lg:grid-cols-[1fr_minmax(14rem,20rem)] ${homeCardClass}`}
          >
            <div className="min-w-0">
              <Text variant="muted" className="mb-5">
                {site.name} · {site.location}
              </Text>
              <Heading size="hero" className="max-w-3xl">
                I design the systems enterprises run on.
              </Heading>
              <Text variant="lead" className="mt-7 max-w-2xl">
                Engineering director and hands-on architect. I take modernization from the first
                whiteboard session through production: architecture, teams, and delivery.
              </Text>
            </div>
            <div className="hidden lg:block">
              <PlaceholderImage label="Portrait" icon="systems" aspectClass="aspect-[4/5]" />
            </div>
          </section>

          {/* Proof points */}
          <section
            aria-label="Results"
            data-nebula-shape="bars"
            className={`grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4 ${homeCardClass}`}
          >
            {heroMetrics.map((metric) => (
              <MetricStat key={metric.value} {...metric} />
            ))}
          </section>

          <Section
            eyebrow="Case studies"
            title="Systems that changed how the business runs"
            id="home-work"
            nebulaShape="hex"
            className={homeCardClass}
            action={<ArrowLink href="/work" label="All case studies" />}
          >
            <DividedList className="mt-6">
              {featured.map((caseStudy) => (
                <CaseStudyListItem key={caseStudy.slug} caseStudy={caseStudy} />
              ))}
            </DividedList>
          </Section>

          {insights.length > 0 && (
            <Section
              eyebrow="Insights"
              title="Notes on systems and decisions"
              id="home-insights"
              nebulaShape="book"
              className={homeCardClass}
              action={<ArrowLink href="/insights" label="All insights" />}
            >
              <DividedList className="mt-6">
                {insights.map((insight) => (
                  <InsightListItem key={insight.slug} insight={insight} />
                ))}
              </DividedList>
            </Section>
          )}

          <Section
            title="I like hard modernization problems."
            id="home-contact"
            nebulaShape="plane"
            className={homeCardClass}
          >
            <Text variant="muted" className="mt-4 max-w-prose">
              If you have one, email{" "}
              <TextLink href={`mailto:${site.email}`}>{site.email}</TextLink> or find me on{" "}
              <TextLink href={site.linkedin}>LinkedIn</TextLink>. More ways to reach me are on the{" "}
              <TextLink href="/contact">contact page</TextLink>.
            </Text>
          </Section>
        </div>
      </PageShell>
    </>
  );
}
