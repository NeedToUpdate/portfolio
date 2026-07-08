import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import Section from "@/components/composites/Section";
import DividedList from "@/components/composites/DividedList";
import CaseStudyListItem from "@/components/composites/CaseStudyListItem";
import InsightListItem from "@/components/composites/InsightListItem";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import ArrowLink from "@/components/ui/ArrowLink";
import TextLink from "@/components/ui/TextLink";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import JsonLd from "@/components/ui/JsonLd";
import { getFeaturedCaseStudies, getInsights } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { personSchema } from "@/lib/seo";
import { site } from "@/lib/site";

const homeCardClass =
  "rounded-lg border border-white/10 bg-black/45 p-6 shadow-2xl shadow-black/30 backdrop-blur-md ring-1 ring-white/5 md:p-8";

export default function HomePage() {
  const featured = getFeaturedCaseStudies(3);
  const [latestInsight, ...moreInsights] = getInsights();
  const insights = moreInsights.slice(0, 3);

  return (
    <>
      <JsonLd data={personSchema()} />
      <NebulaBackground />
      <PageShell>
        <div className="space-y-6 md:space-y-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] lg:grid-rows-[auto_auto] md:gap-8">
            {/* Hero */}
            <section
              data-nebula-shape="spark"
              className={`grid min-h-[20rem] items-center md:min-h-[22rem] lg:row-span-2 lg:min-h-[34rem] ${homeCardClass}`}
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
            </section>

            {latestInsight && (
              <section
                aria-labelledby="home-latest-insight"
                data-nebula-shape="book"
                className={`flex min-h-[18rem] flex-col justify-between gap-8 ${homeCardClass}`}
              >
                <div className="min-w-0">
                  <Text variant="muted" className="mb-4 text-sm uppercase tracking-wide">
                    Latest insight · {formatDate(latestInsight.date)} ·{" "}
                    {latestInsight.readingTimeMinutes} min read
                  </Text>
                  <Heading size="section" id="home-latest-insight" className="max-w-3xl">
                    {latestInsight.title}
                  </Heading>
                  <Text variant="lead" className="mt-5 max-w-2xl">
                    {latestInsight.description}
                  </Text>
                  {latestInsight.tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {latestInsight.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs tracking-wide text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ArrowLink href={`/insights/${latestInsight.slug}`} label="Read the essay" />
              </section>
            )}

            <section
              aria-label="About Art"
              data-nebula-shape="plane"
              className={`grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)] sm:items-center lg:grid-cols-[minmax(0,1fr)_minmax(8rem,10rem)] ${homeCardClass}`}
            >
              <div className="min-w-0">
                <Text variant="muted">
                  I am an engineering director and hands-on architect in Toronto, usually working
                  where systems, teams, and messy production constraints meet.
                </Text>
                <div className="mt-4">
                  <ArrowLink href="/about" label="About me" />
                </div>
              </div>
              <div className="hidden sm:block">
                <PlaceholderImage label="Portrait" icon="systems" aspectClass="aspect-[4/5]" />
              </div>
            </section>
          </div>

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
              eyebrow="More insights"
              title="More notes on systems and decisions"
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
