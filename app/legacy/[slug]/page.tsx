import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NebulaBackground from "@/components/composites/NebulaBackground";
import ArticleLayout from "@/components/composites/ArticleLayout";
import ArticleHeader from "@/components/composites/ArticleHeader";
import MdxContent from "@/components/composites/MdxContent";
import LegacyOriginCard from "@/components/composites/LegacyOriginCard";
import ShareButton from "@/components/composites/ShareButton";
import TextLink from "@/components/ui/TextLink";
import { getLegacyArticle, getLegacyArticles } from "@/lib/content";
import { articleMetadata, legacySeo } from "@/lib/seo";
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
  return article ? articleMetadata(legacySeo(article)) : {};
}

export default async function LegacyArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getLegacyArticle(slug);
  if (!article) notFound();

  const isSite = article.kind === "site";

  return (
    <ArticleLayout
      seo={legacySeo(article)}
      trail={[
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: "Legacy", href: "/legacy" },
      ]}
      narrow
      nebula={
        <NebulaBackground
          variant="mini"
          corner="bottom-left"
          miniShape="orion"
          color="frost"
          size="phone-xl"
          scrim
        />
      }
    >
      <ArticleHeader
        title={article.title}
        deck={article.deck}
        tags={article.tags}
        badge={
          <p className="mb-4 w-fit rounded-full border border-accent/40 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
            {isSite ? "Legacy project" : "Legacy article"}
          </p>
        }
        meta={
          <span>
            {isSite ? "Written " : "First posted on icandoathing.com, "}
            <time dateTime={article.date}>{formatDate(article.date)}</time>
          </span>
        }
        after={<LegacyOriginCard article={article} />}
      />

      <article className="mt-10">
        <MdxContent source={article.body} />
      </article>

      <ShareButton title={article.title} path={`/legacy/${slug}`} contentType="legacy" />

      <nav aria-label="Back to the legacy archive" className="mt-16 border-t border-line/60 pt-9 text-sm">
        <TextLink href="/legacy" variant="quiet">
          ← The legacy archive
        </TextLink>
      </nav>
    </ArticleLayout>
  );
}
