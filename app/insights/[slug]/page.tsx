import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import MdxContent from "@/components/composites/MdxContent";
import ShareButton from "@/components/composites/ShareButton";
import AdjacentNav from "@/components/composites/AdjacentNav";
import ArticleByline from "@/components/composites/ArticleByline";
import TagList from "@/components/composites/TagList";
import Heading from "@/components/ui/Heading";
import JsonLd from "@/components/ui/JsonLd";
import { buildRecommendations, getInsight, getInsights, getRelatedContent } from "@/lib/content";
import { articleSchema, breadcrumbSchema, ogImagePath } from "@/lib/seo";
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
  if (!insight) return {};
  return {
    // seoTitle keeps the <title> tag under the length search engines
    // truncate; the punchy headline stays as the OG/on-page title.
    title: insight.seoTitle ?? insight.title,
    description: insight.description,
    keywords: insight.tags,
    alternates: { canonical: `/insights/${slug}` },
    openGraph: {
      title: insight.title,
      description: insight.description,
      url: `/insights/${slug}`,
      type: "article",
      publishedTime: new Date(insight.date).toISOString(),
      images: insight.previewImage ? [ogImagePath(insight.previewImage)] : undefined,
      locale: "en_CA",
    },
    twitter: {
      card: "summary_large_image",
      title: insight.title,
      description: insight.description,
      images: insight.previewImage ? [ogImagePath(insight.previewImage)] : undefined,
    },
  };
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
    <PageShell narrow>
      {/* Narrow centered article: the lower-left margin is open. */}
      <NebulaBackground variant="mini" corner="bottom-left" miniShape="orion" color="aurora" />
      <JsonLd data={articleSchema(insight)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Insights", path: "/insights" },
          { name: insight.title, path: `/insights/${slug}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Insights", href: "/insights" },
          { label: insight.title },
        ]}
      />

      <header>
        <Heading size="page">{insight.title}</Heading>
        <div className="mt-5">
          <ArticleByline />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
          <time dateTime={insight.date}>{formatDate(insight.date)}</time>
          <span aria-hidden>·</span>
          <span>{insight.readingTimeMinutes} min read</span>
          {insight.tags.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <TagList tags={insight.tags} />
            </>
          )}
        </div>
      </header>

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
    </PageShell>
  );
}
