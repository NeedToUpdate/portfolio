import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/composites/PageShell";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import MdxContent from "@/components/composites/MdxContent";
import TagList from "@/components/composites/TagList";
import Heading from "@/components/ui/Heading";
import JsonLd from "@/components/ui/JsonLd";
import { getPost, getPosts } from "@/lib/content";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";
import { formatDate } from "@/lib/format";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/writing/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/writing/${slug}`,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <PageShell narrow>
      <JsonLd data={articleSchema(post)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Writing", path: "/writing" },
          { name: post.title, path: `/writing/${slug}` },
        ])}
      />
      <Breadcrumbs items={[{ label: "Writing", href: "/writing" }, { label: post.title }]} />

      <header>
        <Heading size="page">{post.title}</Heading>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingTimeMinutes} min read</span>
          {post.tags.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <TagList tags={post.tags} />
            </>
          )}
        </div>
      </header>

      <article className="mt-10">
        <MdxContent source={post.body} />
      </article>
    </PageShell>
  );
}
