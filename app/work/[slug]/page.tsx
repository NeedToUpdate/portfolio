import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import Markdown from "@/components/composites/Markdown";
import ShareButton from "@/components/composites/ShareButton";
import AdjacentNav from "@/components/composites/AdjacentNav";
import ArticleByline from "@/components/composites/ArticleByline";
import CaseScorecard from "@/components/composites/CaseScorecard";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import ButtonLink from "@/components/ui/ButtonLink";
import Exhibit from "@/components/ui/Exhibit";
import { categoryIcon } from "@/components/ui/Icon";
import { categoryShape } from "@/lib/nebula/shapes";
import JsonLd from "@/components/ui/JsonLd";
import { getCaseStudies, getCaseStudy, getRelatedContent } from "@/lib/content";
import { splitAtHeading } from "@/lib/format";
import { breadcrumbSchema, caseStudySchema, ogImagePath } from "@/lib/seo";
import { mailtoUrl } from "@/lib/site";

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
    keywords: [...(caseStudy.keywords ?? []), ...caseStudy.techs],
    alternates: { canonical: `/work/${slug}` },
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.impact,
      url: `/work/${slug}`,
      type: "article",
      publishedTime: new Date(caseStudy.date).toISOString(),
      images: caseStudy.diagram ? [ogImagePath(caseStudy.diagram)] : undefined,
      locale: "en_CA",
    },
    twitter: {
      card: "summary_large_image",
      title: caseStudy.title,
      description: caseStudy.impact,
      images: caseStudy.diagram ? [ogImagePath(caseStudy.diagram)] : undefined,
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
  const recommendations = getRelatedContent(caseStudy.related);

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
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
          { name: caseStudy.title, path: `/work/${slug}` },
        ])}
      />
      <JsonLd data={caseStudySchema(caseStudy)} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Work", href: "/work" },
          { label: caseStudy.title },
        ]}
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
        <div className="mt-5">
          <ArticleByline label="Case study by" />
        </div>

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
          Exact names, figures, and details are confidential. I can walk
          through the technical decisions in a conversation.
        </Text>
      </div>

      <section
        aria-labelledby="work-cta"
        className="mt-12 border-t border-line/60 pt-8"
      >
        <Heading size="sub" id="work-cta">
          Facing something like this?
        </Heading>
        <Text variant="muted" className="mt-3 max-w-prose">
          If your team is up against a problem like this, I can help. Tell me
          what you are working on and I will show you how I would approach it.
        </Text>
        <div className="mt-6">
          <ButtonLink
            href={mailtoUrl({
              subject: "A system I'd like to talk through",
              body: `Hi Art,\n\nI read your case study "${caseStudy.title}". I'm working through `,
            })}
            variant="solid"
            shape="pill"
            nebulaShape="email"
          >
            Reach out now
            <span aria-hidden>→</span>
          </ButtonLink>
        </div>
      </section>

      <ShareButton
        title={caseStudy.title}
        path={`/work/${slug}`}
        contentType="case-study"
        className="mt-8"
      />

      <AdjacentNav
        previous={
          previous && {
            href: `/work/${previous.slug}`,
            title: previous.title,
            hint: "Previous",
          }
        }
        recommendations={recommendations.map((recommended, recommendationIndex) => ({
          href: recommended.href,
          title: recommended.title,
          hint: recommendationIndex === 0 ? recommended.kind : "Also worth reading",
          description: recommended.description,
          image: recommended.image,
        }))}
      />
    </PageShell>
  );
}
