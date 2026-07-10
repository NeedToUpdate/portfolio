import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import Markdown from "@/components/composites/Markdown";
import AdjacentNav from "@/components/composites/AdjacentNav";
import CaseScorecard from "@/components/composites/CaseScorecard";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import TextLink from "@/components/ui/TextLink";
import Exhibit from "@/components/ui/Exhibit";
import { categoryIcon } from "@/components/ui/Icon";
import { categoryShape } from "@/lib/nebula/shapes";
import JsonLd from "@/components/ui/JsonLd";
import { getCaseStudies, getCaseStudy } from "@/lib/content";
import { splitAtHeading } from "@/lib/format";
import { breadcrumbSchema } from "@/lib/seo";
import { site } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getCaseStudies().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseStudy(slug);
  if (!caseStudy) return {};
  return {
    title: caseStudy.title,
    description: caseStudy.impact,
    alternates: { canonical: `/work/${slug}` },
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.impact,
      url: `/work/${slug}`,
      type: "article",
    },
  };
}

export default async function CaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const caseStudy = getCaseStudy(slug);
  if (!caseStudy) notFound();

  // Priority order, same as the /work list, so prev/next walk the
  // same sequence the reader arrived through.
  const all = getCaseStudies();
  const index = all.findIndex((c) => c.slug === slug);
  const previous = index > 0 ? all[index - 1] : undefined;
  const recommendations =
    index >= 0
      ? Array.from({ length: Math.min(3, all.length - 1) }, (_, offset) =>
          all[(index + offset + 1) % all.length]
        )
      : [];

  // The exhibit belongs to the solution: problem, then solution, then
  // the diagram it just described, then the result.
  const { before: problemAndSolution, after: result } = splitAtHeading(
    caseStudy.body,
    "## The result"
  );

  return (
    <PageShell narrow>
      {/* Narrow centered article: the upper-right margin is open. */}
      <NebulaBackground variant="mini" corner="top-right" miniShape="helix" color="frost" />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Work", path: "/work" },
          { name: caseStudy.title, path: `/work/${slug}` },
        ])}
      />
      <Breadcrumbs
        items={[{ label: "Work", href: "/work" }, { label: caseStudy.title }]}
      />

      <header>
        <Eyebrow
          icon={categoryIcon(caseStudy.category)}
          pill
          nebulaShape={categoryShape(caseStudy.category)}
        >
          {caseStudy.category}
        </Eyebrow>
        <Heading size="page" className="mt-4">
          {caseStudy.title}
        </Heading>
        <Text variant="emphasis" className="mt-5 max-w-prose">
          {caseStudy.impact}
        </Text>

        <CaseScorecard
          entries={caseStudy.context ?? []}
          techs={caseStudy.techs}
          role={caseStudy.role}
        />
      </header>

      <div className="mt-10">
        <Markdown>{problemAndSolution}</Markdown>
      </div>

      {/* Every study gets a diagram; the slot stands reserved until
          each one is drawn. */}
      <Exhibit
        src={caseStudy.diagram}
        alt={caseStudy.diagramAlt ?? `Solution architecture — ${caseStudy.title}`}
        label={`Architecture diagram — ${caseStudy.title}`}
        icon={categoryIcon(caseStudy.category)}
        caption={caseStudy.diagram ? "Exhibit: solution architecture." : undefined}
      />

      {result && (
        <div className="mt-10">
          <Markdown>{result}</Markdown>
        </div>
      )}

      <div className="mt-14 border-t border-line/60 pt-8">
        <Text variant="small">
          Exact names, figures, and details are confidential. I can walk through the
          technical decisions in a conversation. Email{" "}
          <TextLink href={`mailto:${site.email}`} nebulaShape="plane">
            {site.email}
          </TextLink>
          .
        </Text>
      </div>

      <AdjacentNav
        previous={
          previous && {
            href: `/work/${previous.slug}`,
            title: previous.title,
            hint: "Previous",
          }
        }
        recommendations={recommendations.map((recommended, recommendationIndex) => ({
          href: `/work/${recommended.slug}`,
          title: recommended.title,
          hint:
            recommendationIndex === 0
              ? "Suggested next case study"
              : "Another case study",
          description: recommended.impact,
          image: recommended.diagram,
        }))}
      />
    </PageShell>
  );
}
