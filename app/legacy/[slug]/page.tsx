import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import MdxContent from "@/components/composites/MdxContent";
import ArticleByline from "@/components/composites/ArticleByline";
import LegacyOriginCard from "@/components/composites/LegacyOriginCard";
import TagList from "@/components/composites/TagList";
import Heading from "@/components/ui/Heading";
import JsonLd from "@/components/ui/JsonLd";
import TextLink from "@/components/ui/TextLink";
import { getLegacyArticle, getLegacyArticles } from "@/lib/content";
import ShareButton from "@/components/composites/ShareButton";
import { breadcrumbSchema, legacyArticleSchema, ogImagePath } from "@/lib/seo";
import { formatDate } from "@/lib/format";

/**
 * A legacy article: a post ported from icandoathing.com, or the
 * write-up of that site. Linked from project cards and the /legacy
 * index; nothing on the home page points here.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getLegacyArticles().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getLegacyArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    keywords: article.tags,
    alternates: { canonical: `/legacy/${slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `/legacy/${slug}`,
      type: "article",
      publishedTime: new Date(article.date).toISOString(),
      images: [ogImagePath(article.screenshot)],
      locale: "en_CA",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [ogImagePath(article.screenshot)],
    },
  };
}

export default async function LegacyArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getLegacyArticle(slug);
  if (!article) notFound();

  const isSite = article.kind === "site";

  return (
    <PageShell narrow>
      <NebulaBackground
        variant="mini"
        corner="bottom-left"
        miniShape="orion"
        color="frost"
        size="phone-xl"
        scrim
      />
      <JsonLd data={legacyArticleSchema(article)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
          { name: "Legacy", path: "/legacy" },
          { name: article.title, path: `/legacy/${slug}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: "Legacy", href: "/legacy" },
          { label: article.title },
        ]}
      />

      <header>
        <p className="mb-4 w-fit rounded-full border border-accent/40 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
          {isSite ? "Legacy project" : "Legacy article"}
        </p>
        <Heading size="page">{article.title}</Heading>
        {article.deck ? (
          <p className="mt-3 max-w-prose text-sm italic leading-relaxed text-muted/80">
            {article.deck}
          </p>
        ) : null}
        <div className="mt-5">
          <ArticleByline />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>
            {isSite ? "Written " : "First posted on icandoathing.com, "}
            <time dateTime={article.date}>{formatDate(article.date)}</time>
          </span>
          {article.tags.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <TagList tags={article.tags} />
            </>
          )}
        </div>
        <LegacyOriginCard article={article} />
      </header>

      <article className="mt-10">
        <MdxContent source={article.body} />
      </article>

      <ShareButton title={article.title} path={`/legacy/${slug}`} contentType="legacy" />

      <nav aria-label="Back to the legacy archive" className="mt-16 border-t border-line/60 pt-9 text-sm">
        <TextLink href="/legacy" variant="quiet">
          ← The legacy archive
        </TextLink>
      </nav>
    </PageShell>
  );
}
