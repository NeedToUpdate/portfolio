import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import SectionHeading from "@/components/composites/SectionHeading";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import DividedList from "@/components/composites/DividedList";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import JsonLd from "@/components/ui/JsonLd";
import { getLegacyArticles, getPageCopy } from "@/lib/content";
import { pageMetadata, breadcrumbSchema } from "@/lib/seo";
import { formatMonth } from "@/lib/format";

/**
 * The legacy archive index. Nothing in the navigation points here:
 * the way in is the "pre-AI" easter egg on the projects page
 * (components/composites/PreAiDoor.tsx), or a legacy article's
 * breadcrumb.
 */

const copy = getPageCopy("legacy");

export const metadata: Metadata = pageMetadata({
  title: copy.seoTitle,
  description: copy.seoDescription,
  path: "/legacy",
});

export default function LegacyIndexPage() {
  // Most recently built project first. The write-up of the site sorts
  // with the rest, by the month the site was built.
  const articles = getLegacyArticles();

  return (
    <PageShell>
      {/* Violet arcs on the right edge: a colour and a position no
          other page uses. The scrim dims it on phones, where the list
          runs through the gas. */}
      <NebulaBackground
        variant="mini"
        corner="mid-right"
        miniShape="orion"
        color="amethyst"
        size="lg"
        scrim
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
          { name: "Legacy", path: "/legacy" },
        ])}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: "Legacy" },
        ]}
      />

      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        asPageTitle
      />

      <DividedList borderTop className="mt-10">
        {articles.map((article) => (
          <Link key={article.slug} href={`/legacy/${article.slug}`} className="group block py-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="shrink-0 text-sm tabular-nums text-muted sm:w-32">
                <time dateTime={article.built}>{formatMonth(article.built)}</time>
              </span>
              <div className="min-w-0">
                <Heading size="item" className="transition-colors group-hover:text-accent">
                  {article.title}
                </Heading>
                <Text variant="muted" className="mt-1.5 max-w-prose">
                  {article.description}
                </Text>
              </div>
            </div>
          </Link>
        ))}
      </DividedList>
    </PageShell>
  );
}
