import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import Section from "@/components/composites/Section";
import DividedList from "@/components/composites/DividedList";
import CaseStudyListItem from "@/components/composites/CaseStudyListItem";
import InsightListItem from "@/components/composites/InsightListItem";
import TagList from "@/components/composites/TagList";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import ArrowLink from "@/components/ui/ArrowLink";
import TextLink from "@/components/ui/TextLink";
import Panel from "@/components/ui/Panel";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import JsonLd from "@/components/ui/JsonLd";
import { getFeaturedCaseStudies, getInsights, getWorkIntro } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { personSchema } from "@/lib/seo";
import { site } from "@/lib/site";

export default function HomePage() {
  const featured = getFeaturedCaseStudies(3);
  const { caseStudyCta } = getWorkIntro();
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
            <Panel
              as="section"
              variant="glass"
              className="grid min-h-[20rem] items-center md:min-h-[22rem] lg:row-span-2 lg:min-h-[34rem]"
            >
              <div className="min-w-0">
                <Eyebrow nebulaShape="spark" className="mb-5">
                  {site.name} · {site.location}
                </Eyebrow>
                <Heading size="hero" className="max-w-3xl">
                  I design the systems enterprises run on.
                </Heading>
                <Text variant="emphasis" className="mt-7">
                  Engineering director and hands-on architect.
                </Text>
                <Text variant="muted" className="mt-3 max-w-2xl">
                  I take modernization from the first whiteboard session through production:
                  architecture, teams, and delivery.
                </Text>
              </div>
            </Panel>

            {latestInsight && (
              <Panel
                as="section"
                variant="glass"
                aria-labelledby="home-latest-insight"
                className="flex min-h-[18rem] flex-col justify-between gap-8"
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
                    <TagList tags={latestInsight.tags} variant="pill" className="mt-5" />
                  )}
                </div>
                <ArrowLink
                  href={`/insights/${latestInsight.slug}`}
                  label="Read the write-up"
                  nebulaShape="book"
                />
              </Panel>
            )}

            <Panel
              as="section"
              variant="glass"
              aria-label="About Art"
              className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)] sm:items-center lg:grid-cols-[minmax(0,1fr)_minmax(8rem,10rem)]"
            >
              <div className="min-w-0">
                <Text variant="muted">
                  I am an engineering director and hands-on architect in Toronto, usually working
                  where systems, teams, and messy production constraints meet.
                </Text>
                <div className="mt-4">
                  <ArrowLink href="/about" label="About me" nebulaShape="bars" />
                </div>
              </div>
              <div className="hidden sm:block">
                <PlaceholderImage label="Portrait" icon="systems" aspectClass="aspect-[4/5]" />
              </div>
            </Panel>
          </div>

          <Section
            eyebrow="Case studies"
            title="Systems that changed how the business runs"
            id="home-work"
            variant="card"
            action={<ArrowLink href="/work" label="All case studies" nebulaShape="hex" />}
          >
            <DividedList className="mt-6">
              {featured.map((caseStudy) => (
                <CaseStudyListItem key={caseStudy.slug} caseStudy={caseStudy} cta={caseStudyCta} />
              ))}
            </DividedList>
          </Section>

          {insights.length > 0 && (
            <Section
              eyebrow="More insights"
              title="More notes on systems and decisions"
              id="home-insights"
              variant="card"
              action={<ArrowLink href="/insights" label="All insights" nebulaShape="book" />}
            >
              <DividedList className="mt-6">
                {insights.map((insight) => (
                  <InsightListItem key={insight.slug} insight={insight} />
                ))}
              </DividedList>
            </Section>
          )}

          <Section title="I like hard modernization problems." id="home-contact" variant="card">
            <Text variant="muted" className="mt-4 max-w-prose">
              If you have one, email{" "}
              <TextLink href={`mailto:${site.email}`} nebulaShape="plane">
                {site.email}
              </TextLink>{" "}
              or find me on <TextLink href={site.linkedin}>LinkedIn</TextLink>. More ways to reach
              me are on the{" "}
              <TextLink href="/contact" nebulaShape="plane">
                contact page
              </TextLink>
              .
            </Text>
          </Section>
        </div>
      </PageShell>
    </>
  );
}
