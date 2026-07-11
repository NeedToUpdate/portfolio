import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import MdxContent from "@/components/composites/MdxContent";
import AdjacentNav from "@/components/composites/AdjacentNav";
import TagList from "@/components/composites/TagList";
import Heading from "@/components/ui/Heading";
import JsonLd from "@/components/ui/JsonLd";
import { getInsight, getInsights } from "@/lib/content";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";
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
    title: insight.title,
    description: insight.description,
    alternates: { canonical: `/insights/${slug}` },
    openGraph: {
      title: insight.title,
      description: insight.description,
      url: `/insights/${slug}`,
      type: "article",
      publishedTime: new Date(insight.date).toISOString(),
      images: insight.previewImage ? [insight.previewImage] : undefined,
      locale: "en_CA",
    },
    twitter: {
      card: "summary_large_image",
      title: insight.title,
      description: insight.description,
      images: insight.previewImage ? [insight.previewImage] : undefined,
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
  // Keep the reading path alive at the end of the archive by looping
  // back to the newest piece (unless this is the only insight).
  const recommendations =
    index >= 0
      ? Array.from({ length: Math.min(3, all.length - 1) }, (_, offset) =>
          all[(index + offset + 1) % all.length]
        )
      : [];

  return (
    <PageShell narrow>
      {/* Narrow centered article: the lower-left margin is open. */}
      <NebulaBackground variant="mini" corner="bottom-left" miniShape="orion" color="aurora" />
      <JsonLd data={articleSchema(insight)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Insights", path: "/insights" },
          { name: insight.title, path: `/insights/${slug}` },
        ])}
      />
      <Breadcrumbs items={[{ label: "Insights", href: "/insights" }, { label: insight.title }]} />

      <header>
        <Heading size="page">{insight.title}</Heading>
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

      <AdjacentNav
        previous={
          newer && { href: `/insights/${newer.slug}`, title: newer.title, hint: "Previous" }
        }
        recommendations={recommendations.map((recommended, recommendationIndex) => ({
          href: `/insights/${recommended.slug}`,
          title: recommended.title,
          hint: recommendationIndex === 0 ? "Suggested next" : "Also worth reading",
          description: recommended.description,
          image: recommended.previewImage,
        }))}
      />
    </PageShell>
  );
}
