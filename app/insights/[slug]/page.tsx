import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/composites/PageShell";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import MdxContent from "@/components/composites/MdxContent";
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
      publishedTime: insight.date,
    },
  };
}

export default async function InsightPage({ params }: PageProps) {
  const { slug } = await params;
  const insight = getInsight(slug);
  if (!insight) notFound();

  return (
    <PageShell narrow>
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
    </PageShell>
  );
}
