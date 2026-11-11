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
import { getLegacyArticles } from "@/lib/content";
import { pageMetadata, breadcrumbSchema } from "@/lib/seo";
import { formatDate } from "@/lib/format";

/**
 * The legacy archive index. Nothing in the navigation points here:
 * the way in is the "pre-AI" easter egg on the projects page
 * (components/composites/PreAiDoor.tsx), or a legacy article's
 * breadcrumb.
 */

export const metadata: Metadata = pageMetadata({
  title: "The legacy archive",
  description:
    "Project write-ups from before AI code-assist tools existed, first posted on icandoathing.com between 2022 and 2024 and lightly cleaned up.",
  path: "/legacy",
});

export default function LegacyIndexPage() {
  const all = getLegacyArticles();
  // The write-up of the site leads; the posts follow, newest first.
  const articles = [...all.filter((a) => a.kind === "site"), ...all.filter((a) => a.kind !== "site")];

  return (
    <PageShell>
      <NebulaBackground variant="mini" corner="bottom-right" miniShape="orion" color="frost" size="lg" />
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
        eyebrow="You found the archive"
        title="Write-ups from before AI"
        description="I wrote these between 2022 and 2024 and posted them on icandoathing.com. No AI code-assist tools existed when I built most of these projects. The best we had was IntelliSense. The articles are lightly cleaned up and otherwise left as they were."
        asPageTitle
      />

      <DividedList borderTop className="mt-10">
        {articles.map((article) => (
          <Link key={article.slug} href={`/legacy/${article.slug}`} className="group block py-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="shrink-0 text-sm tabular-nums text-muted sm:w-32">
                {article.kind === "site" ? (
                  "The site itself"
                ) : (
                  <time dateTime={article.date}>{formatDate(article.date)}</time>
                )}
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
