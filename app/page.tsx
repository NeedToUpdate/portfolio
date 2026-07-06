import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import Section from "@/components/composites/Section";
import DividedList from "@/components/composites/DividedList";
import MetricStat from "@/components/composites/MetricStat";
import CaseStudyListItem from "@/components/composites/CaseStudyListItem";
import PostListItem from "@/components/composites/PostListItem";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import ArrowLink from "@/components/ui/ArrowLink";
import GradientLink from "@/components/ui/GradientLink";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import JsonLd from "@/components/ui/JsonLd";
import { getFeaturedCaseStudies, getPosts } from "@/lib/content";
import { personSchema } from "@/lib/seo";
import { site } from "@/lib/site";

const heroMetrics = [
  { value: "1M+", label: "customers on a billing portal modernized with zero disruption" },
  { value: "99.99%", label: "uptime on a rebuilt enterprise payment integration" },
  { value: "1 day", label: "data delivery that used to take a month" },
  { value: "4 hours", label: "bug to production, down from a week" },
];

export default function HomePage() {
  const featured = getFeaturedCaseStudies(3);
  const posts = getPosts().slice(0, 3);

  return (
    <>
      <JsonLd data={personSchema()} />
      <NebulaBackground />
      <PageShell>
        {/* Hero */}
        <section
          data-nebula-shape="spark"
          className="grid min-h-[40vh] items-center gap-10 py-12 lg:grid-cols-[1fr_minmax(14rem,20rem)]"
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
          className="grid grid-cols-2 gap-x-8 gap-y-10 border-t border-line/60 py-12 lg:grid-cols-4"
        >
          {heroMetrics.map((metric) => (
            <MetricStat key={metric.value} {...metric} />
          ))}
        </section>

        <Section
          eyebrow="Selected work"
          title="Systems that changed how the business runs"
          id="home-work"
          nebulaShape="hex"
          action={<ArrowLink href="/work" label="All work" />}
        >
          <DividedList className="mt-6">
            {featured.map((caseStudy) => (
              <CaseStudyListItem key={caseStudy.slug} caseStudy={caseStudy} />
            ))}
          </DividedList>
        </Section>

        {posts.length > 0 && (
          <Section
            eyebrow="Writing"
            title="Notes on systems and decisions"
            id="home-writing"
            nebulaShape="book"
            action={<ArrowLink href="/writing" label="All writing" />}
          >
            <DividedList className="mt-6">
              {posts.map((post) => (
                <PostListItem key={post.slug} post={post} />
              ))}
            </DividedList>
          </Section>
        )}

        <Section title="I like hard modernization problems." id="home-contact" nebulaShape="plane">
          <Text variant="muted" className="mt-4 max-w-prose">
            If you have one, email{" "}
            <GradientLink href={`mailto:${site.email}`}>{site.email}</GradientLink> or find me on{" "}
            <GradientLink href={site.linkedin}>LinkedIn</GradientLink>. More ways to reach me are on
            the <GradientLink href="/contact">contact page</GradientLink>.
          </Text>
        </Section>
      </PageShell>
    </>
  );
}
