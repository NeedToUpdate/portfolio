import Image from "next/image";
import Link from "next/link";
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
import JsonLd from "@/components/ui/JsonLd";
import {
  getFeaturedCaseStudies,
  getInsights,
  getWorkIntro,
} from "@/lib/content";
import { formatDate } from "@/lib/format";
import { personSchema, websiteSchema } from "@/lib/seo";
import { site } from "@/lib/site";

export default function HomePage() {
  const featured = getFeaturedCaseStudies(3);
  const { caseStudyCta } = getWorkIntro();
  const [latestInsight, ...moreInsights] = getInsights();
  const insights = moreInsights.slice(0, 3);

  return (
    <>
      <JsonLd data={personSchema()} />
      <JsonLd data={websiteSchema()} />
      <NebulaBackground />
      <PageShell>
        <div className="space-y-6 md:space-y-8">
          {/* Mobile min-heights and spacing stay tight: the fold on a
              phone has to fit the hero plus most of the insight card. */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] lg:grid-rows-[auto_auto] md:gap-8">
            {/* Hero */}
            <Panel
              as="section"
              variant="glass"
              className="grid items-center !backdrop-blur-none md:min-h-[22rem] lg:row-span-2 lg:min-h-[34rem]"
            >
              <div className="min-w-0">
                <Eyebrow nebulaShape="spark" className="mb-4 md:mb-5">
                  {site.name} · {site.location}
                </Eyebrow>
                <Heading size="hero" className="max-w-3xl">
                  I design the systems enterprises run on.
                </Heading>
                <Text variant="emphasis" className="mt-5 md:mt-7">
                  I lead the architecture and the teams that ship it.
                </Text>
                {/* Cut on phones: the About card below covers the same
                    ground, and every line here pushes the insight card
                    further below the fold. */}
                <Text variant="muted" className="mt-3 hidden max-w-2xl md:block">
                  I take modernization from the first whiteboard session through
                  production: architecture, teams, and delivery.
                </Text>
              </div>
            </Panel>

            {latestInsight && (
              <Panel
                as="section"
                variant="glass"
                aria-labelledby="home-latest-insight"
                className="flex flex-col justify-between gap-5 !backdrop-blur-none md:min-h-[18rem] md:gap-8"
              >
                <div className="min-w-0">
                  <Text
                    variant="muted"
                    className="mb-4 text-sm uppercase tracking-wide"
                  >
                    Latest insight · {formatDate(latestInsight.date)} ·{" "}
                    {latestInsight.readingTimeMinutes} min read
                  </Text>
                  <Heading
                    size="section"
                    id="home-latest-insight"
                    className="max-w-3xl"
                  >
                    {latestInsight.title}
                  </Heading>
                  {/* Phones get a three-line teaser and no tag row; the
                      full description and tags live on the write-up. */}
                  <Text
                    variant="lead"
                    className="mt-4 line-clamp-3 max-w-2xl md:mt-5 md:line-clamp-none"
                  >
                    {latestInsight.description}
                  </Text>
                  {latestInsight.tags.length > 0 && (
                    <TagList
                      tags={latestInsight.tags}
                      variant="pill"
                      className="mt-5 hidden md:flex"
                    />
                  )}
                </div>
                <ArrowLink
                  href={`/insights/${latestInsight.slug}`}
                  label="Read the write-up"
                  nebulaShape="article"
                />
              </Panel>
            )}

            <Panel
              as="section"
              variant="glass"
              aria-label="About Art"
              className="grid grid-cols-[minmax(0,1fr)_6rem] items-start gap-5 !backdrop-blur-none sm:grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)] sm:items-center lg:grid-cols-[minmax(0,1fr)_minmax(8rem,10rem)]"
            >
              <div className="min-w-0">
                <Text variant="muted">
                  I work where systems, teams, and messy production constraints
                  meet. Based in Toronto.
                </Text>
                <div className="mt-4">
                  <ArrowLink
                    href="/about"
                    label="About me"
                    nebulaShape="profile"
                  />
                </div>
              </div>
              {/* Phones get a small square crop so the panel still reads
                  as a person; sm+ keeps the taller portrait. */}
              <Link
                href="/about"
                aria-label="About Art"
                className="relative aspect-square w-full overflow-hidden rounded-xl border border-line/50 sm:aspect-[4/5]"
              >
                <Image
                  src="/images/portrait.webp"
                  alt={site.name}
                  width={800}
                  height={1000}
                  loading="eager"
                  sizes="(max-width: 640px) 6rem, (max-width: 1024px) 12rem, 10rem"
                  className="h-full w-full object-cover"
                />
              </Link>
            </Panel>
          </div>

          {insights.length > 0 && (
            <Section
              eyebrow="More insights"
              title="More notes on systems and decisions"
              id="home-insights"
              variant="card"
              className="!backdrop-blur-none"
              action={
                <ArrowLink
                  href="/insights"
                  label="All insights"
                  nebulaShape="article"
                />
              }
            >
              <DividedList className="mt-6">
                {insights.map((insight) => (
                  <InsightListItem key={insight.slug} insight={insight} />
                ))}
              </DividedList>
            </Section>
          )}

          <Section
            eyebrow="Case studies"
            title="Systems that changed how the business runs"
            id="home-work"
            variant="card"
            className="!backdrop-blur-none"
            action={
              <ArrowLink
                href="/work"
                label="All case studies"
                nebulaShape="hex"
              />
            }
          >
            <DividedList className="mt-6">
              {featured.map((caseStudy) => (
                <CaseStudyListItem
                  key={caseStudy.slug}
                  caseStudy={caseStudy}
                  cta={caseStudyCta}
                />
              ))}
            </DividedList>
          </Section>

          <Section
            title="Bring me a messy problem."
            id="home-contact"
            variant="card"
            className="!backdrop-blur-none"
          >
            <Text variant="muted" className="mt-4 max-w-prose">
              Email{" "}
              <TextLink href={`mailto:${site.email}`} nebulaShape="email">
                {site.email}
              </TextLink>{" "}
              or find me on{" "}
              <TextLink href={site.linkedin} nebulaShape="linkedin">
                LinkedIn
              </TextLink>
              . More ways to reach me are on the{" "}
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
