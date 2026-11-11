import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NebulaBackground from "@/components/composites/NebulaBackground";
import ArticleLayout from "@/components/composites/ArticleLayout";
import ArticleHeader from "@/components/composites/ArticleHeader";
import MdxContent from "@/components/composites/MdxContent";
import ShareButton from "@/components/composites/ShareButton";
import AdjacentNav from "@/components/composites/AdjacentNav";
import { buildRecommendations, getInsight, getInsights, getRelatedContent } from "@/lib/content";
import { articleMetadata, insightSeo } from "@/lib/seo";
import { formatDate } from "@/lib/format";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getInsights().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const insight = getInsight(slug);
  // seoTitle keeps the <title> tag under the length search engines
  // truncate; the punchy headline stays as the OG/on-page title.
  return insight ? articleMetadata(insightSeo(insight)) : {};
}

export default async function InsightPage({ params }: PageProps) {
  const { slug } = await params;
  const insight = getInsight(slug);
  if (!insight) notFound();

  // Date order, newest first, same as the /insights list.
  const all = getInsights();
  const index = all.findIndex((i) => i.slug === slug);
  const newer = index > 0 ? all[index - 1] : undefined;
  const recommendations = buildRecommendations({
    ordered: all,
    currentSlug: slug,
    slugOf: (i) => i.slug,
    toRelated: (i) => ({
      href: `/insights/${i.slug}`,
      title: i.title,
      description: i.description,
      image: i.previewImage,
      kind: "Insight" as const,
    }),
    curated: getRelatedContent(insight.related),
  });

  return (
    <ArticleLayout
      seo={insightSeo(insight)}
      trail={[
        { label: "Home", href: "/" },
        { label: "Insights", href: "/insights" },
      ]}
      narrow
      nebula={
        // Narrow centered article: the lower-left margin is open. On phones
        // the column is full-bleed and scrolls through the gas, so the
        // cloud runs at the phone footprint of the case-study pages and
        // carries a scrim to keep the body copy readable.
        <NebulaBackground
          variant="mini"
          corner="bottom-left"
          miniShape="orion"
          color="aurora"
          size="phone-xl"
          scrim
        />
      }
    >
      <ArticleHeader
        title={insight.title}
        deck={insight.deck}
        tags={insight.tags}
        meta={
          <>
            <time dateTime={insight.date}>{formatDate(insight.date)}</time>
            <span aria-hidden>·</span>
            <span>{insight.readingTimeMinutes} min read</span>
          </>
        }
      />

      <article className="mt-10">
        <MdxContent source={insight.body} />
      </article>

      <ShareButton
        title={insight.title}
        path={`/insights/${slug}`}
        contentType="insight"
      />

      <AdjacentNav
        previous={
          newer && { href: `/insights/${newer.slug}`, title: newer.title, hint: "Previous" }
        }
        recommendations={recommendations}
      />
    </ArticleLayout>
  );
}
