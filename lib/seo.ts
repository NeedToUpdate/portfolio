import type { Metadata } from "next";
import { ogTwinName } from "./fingerprint.mjs";
import { site } from "./site";
import { CaseStudy, InsightMeta, LegacyArticleMeta } from "./types";

/**
 * previewImage/diagram fields point at webp or svg source files —
 * neither is reliable as an og:image/twitter:image across social
 * crawlers (Facebook, Twitter, and LinkedIn have long-standing bugs
 * or outright non-support for both). `scripts/build-image-assets.mjs`
 * pre-renders a JPEG twin of each one at the same hashed path; this
 * just resolves the name (`src` here is already fingerprinted).
 */
export function ogImagePath(src: string): string {
  return ogTwinName(src);
}

export function pageMetadata({
  title,
  description,
  path,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title,
      description,
      url: path,
      siteName: site.name,
      locale: "en_CA",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * JSON-LD builders. Each returns a plain object ready for
 * <script type="application/ld+json">.
 */

/** The Person entity, without @context, for nesting inside other schemas. */
function personEntity() {
  return {
    "@type": "Person",
    "@id": `${site.url}/#person`,
    name: site.name,
    url: site.url,
    // JPEG rather than the webp used on-page: search engines and
    // scrapers are less consistent about webp.
    image: `${site.url}/images/portrait.jpg`,
    email: `mailto:${site.email}`,
    jobTitle: site.role,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Toronto",
      addressCountry: "CA",
    },
    sameAs: [site.github, site.linkedin],
    // Mirrors the about page's own words; entity signals must match
    // visible content or Google discounts them.
    knowsAbout: [
      "Enterprise modernization",
      "Data platforms",
      "AI adoption",
      "Cloud architecture",
      "Engineering leadership",
    ],
  };
}

export function personSchema() {
  return { "@context": "https://schema.org", ...personEntity() };
}

/**
 * Google's documented markup for an "about the person" page: the
 * Person wrapped as the main entity of a ProfilePage. This is what
 * feeds person-entity understanding (and the photo) rather than any
 * visible badge.
 */
export function profilePageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: personEntity(),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: "en-CA",
    author: {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      url: site.url,
    },
  };
}

/** What an article page tells search engines and social cards. */
export interface ArticleSeo {
  title: string;
  /** Shorter <title> when the headline runs long; OG keeps the headline. */
  seoTitle?: string;
  description: string;
  /** Site path of the page, e.g. "/insights/branching-strategy". */
  path: string;
  /** YYYY-MM-DD. Insights: published; case studies: delivered; legacy: first posted. */
  date: string;
  /** Fingerprinted preview image; its JPEG twin becomes the social card. */
  image?: string;
  keywords: string[];
}

/** Metadata for an article page: canonical, Open Graph, and Twitter card. */
export function articleMetadata(article: ArticleSeo): Metadata {
  const images = article.image ? [ogImagePath(article.image)] : undefined;
  return {
    title: article.seoTitle ?? article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: article.path },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: article.path,
      siteName: site.name,
      publishedTime: new Date(article.date).toISOString(),
      images,
      locale: "en_CA",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images,
    },
  };
}

/**
 * Article JSON-LD for insights, case studies, and legacy articles.
 * Article rather than CreativeWork: it is the type Google's rich results
 * detect, and all three are long-form write-ups.
 */
export function articleSchema(article: ArticleSeo) {
  // Frontmatter stores date-only strings; Google wants a full ISO 8601
  // datetime with a timezone. Date-only input parses as UTC midnight.
  const published = new Date(article.date).toISOString();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    // Same string as headline. Article's own rich-result eligibility
    // reads headline, but Search Console's generic item listing reads
    // the schema.org base "name" property and shows "N/A" without it.
    name: article.title,
    headline: article.title,
    description: article.description,
    datePublished: published,
    dateModified: published,
    inLanguage: "en-CA",
    image: article.image
      ? new URL(ogImagePath(article.image), site.url).toString()
      : `${site.url}/opengraph-image`,
    author: {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      url: site.url,
    },
    mainEntityOfPage: `${site.url}${article.path}`,
    keywords: article.keywords.join(", "),
  };
}

export function insightSeo(insight: InsightMeta): ArticleSeo {
  return {
    title: insight.title,
    seoTitle: insight.seoTitle,
    description: insight.description,
    path: `/insights/${insight.slug}`,
    date: insight.date,
    image: insight.previewImage,
    keywords: insight.tags,
  };
}

/** The meta description falls back to the impact line when no override exists. */
export function caseStudySeo(caseStudy: CaseStudy): ArticleSeo {
  return {
    title: caseStudy.title,
    description: caseStudy.seoDescription ?? caseStudy.impact,
    path: `/work/${caseStudy.slug}`,
    date: caseStudy.date,
    image: caseStudy.diagram,
    keywords: [...(caseStudy.keywords ?? []), ...caseStudy.techs],
  };
}

/** A legacy article keeps its original publication date. */
export function legacySeo(article: LegacyArticleMeta): ArticleSeo {
  return {
    title: article.title,
    description: article.description,
    path: `/legacy/${article.slug}`,
    date: article.date,
    image: article.screenshot,
    keywords: article.tags,
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    // Each ListItem already carries its own name; this is the trail's
    // own name as a BreadcrumbList entity, which Search Console's item
    // listing reads separately and shows "N/A" for without it.
    name: items[items.length - 1]?.name,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${site.url}${item.path}`,
    })),
  };
}
