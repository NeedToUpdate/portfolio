import { ReactNode } from "react";
import PageShell from "./PageShell";
import Breadcrumbs, { Crumb } from "./Breadcrumbs";
import JsonLd from "@/components/ui/JsonLd";
import { articleSchema, breadcrumbSchema, type ArticleSeo } from "@/lib/seo";

interface ArticleLayoutProps {
  /** The page's SEO record; feeds the Article JSON-LD and the last crumb's URL. */
  seo: ArticleSeo;
  /** Every crumb before the current page, which comes from seo.title. */
  trail: Required<Crumb>[];
  /** The page's nebula. Each article type picks its own corner and colour. */
  nebula: ReactNode;
  narrow?: boolean;
  children: ReactNode;
}

/**
 * The shell every article page shares: page width, nebula, Article and
 * BreadcrumbList structured data, and the visible breadcrumb trail.
 * Insights, case studies, and legacy articles each render their own
 * header and body inside it.
 */
export default function ArticleLayout({ seo, trail, nebula, narrow, children }: ArticleLayoutProps) {
  return (
    <PageShell narrow={narrow}>
      {nebula}
      <JsonLd data={articleSchema(seo)} />
      <JsonLd
        data={breadcrumbSchema([
          ...trail.map((crumb) => ({ name: crumb.label, path: crumb.href })),
          { name: seo.title, path: seo.path },
        ])}
      />
      <Breadcrumbs items={[...trail, { label: seo.title }]} />
      {children}
    </PageShell>
  );
}
