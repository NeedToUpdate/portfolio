import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import Markdown from "@/components/composites/Markdown";
import TagList from "@/components/composites/TagList";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import TextLink from "@/components/ui/TextLink";
import { categoryIcon } from "@/components/ui/Icon";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import JsonLd from "@/components/ui/JsonLd";
import { getCaseStudies, getCaseStudy } from "@/lib/content";
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

      <Eyebrow icon={categoryIcon(caseStudy.category)} className="mb-3">
        {caseStudy.category}
      </Eyebrow>
      <Heading size="page">{caseStudy.title}</Heading>
      <p className="mt-6 border-l-2 border-line pl-5 text-lg leading-relaxed text-ink/90">
        {caseStudy.impact}
      </p>
      <TagList tags={caseStudy.techs} className="mt-5" />

      <div className="mt-8">
        <PlaceholderImage
          label={`Architecture diagram — ${caseStudy.title}`}
          icon={categoryIcon(caseStudy.category)}
        />
      </div>

      <div className="mt-10">
        <Markdown>{caseStudy.body}</Markdown>
      </div>

      <div className="mt-14 border-t border-line/60 pt-8">
        <Text variant="small">
          The details behind this work are confidential. I can walk through the technical
          decisions in a conversation. Email{" "}
          <TextLink href={`mailto:${site.email}`} nebulaShape="plane">
            {site.email}
          </TextLink>
          .
        </Text>
      </div>
    </PageShell>
  );
}
