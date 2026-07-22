import type { Metadata } from "next";
import { site } from "./site";
import { CaseStudy, InsightMeta } from "./types";

/**
 * previewImage/diagram fields point at webp or svg source files —
 * neither is reliable as an og:image/twitter:image across social
 * crawlers (Facebook, Twitter, and LinkedIn have long-standing bugs
 * or outright non-support for both). `scripts/build-image-assets.mjs`
 * pre-renders a JPEG twin of each one at the same hashed path; this
 * just resolves the name (`src` here is already fingerprinted).
 */
export function ogImagePath(src: string): string {
  const ext = src.slice(src.lastIndexOf("."));
  return `${src.slice(0, -ext.length)}.og.jpg`;
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

export function personSchema() {
  return {
    "@context": "https://schema.org",
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

/**
 * Google's documented markup for an "about the person" page: the
 * Person wrapped as the main entity of a ProfilePage. This is what
 * feeds person-entity understanding (and the photo) rather than any
 * visible badge.
 */
export function profilePageSchema() {
  const { ["@context"]: _context, ...person } = personSchema();
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: person,
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

export function articleSchema(insight: InsightMeta) {
  // Frontmatter stores date-only strings; Google wants a full ISO 8601
  // datetime with a timezone. Date-only input parses as UTC midnight.
  const published = new Date(insight.date).toISOString();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    // Same string as headline. Article's own rich-result eligibility
    // reads headline, but Search Console's generic item listing reads
    // the schema.org base "name" property and shows "N/A" without it.
    name: insight.title,
    headline: insight.title,
    description: insight.description,
    datePublished: published,
    dateModified: published,
    inLanguage: "en-CA",
    image: insight.previewImage
      ? new URL(ogImagePath(insight.previewImage), site.url).toString()
      : `${site.url}/opengraph-image`,
    author: {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      url: site.url,
    },
    mainEntityOfPage: `${site.url}/insights/${insight.slug}`,
    keywords: insight.tags.join(", "),
  };
}

/**
 * Article rather than CreativeWork: case studies are long-form
 * write-ups, and Article is the type Google's rich results detect.
 * The date is the project's delivery date from frontmatter.
 */
export function caseStudySchema(caseStudy: CaseStudy) {
  const published = new Date(caseStudy.date).toISOString();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    name: caseStudy.title,
    headline: caseStudy.title,
    description: caseStudy.seoDescription ?? caseStudy.impact,
    datePublished: published,
    dateModified: published,
    inLanguage: "en-CA",
    image: caseStudy.diagram
      ? new URL(ogImagePath(caseStudy.diagram), site.url).toString()
      : `${site.url}/opengraph-image`,
    author: {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      url: site.url,
    },
    mainEntityOfPage: `${site.url}/work/${caseStudy.slug}`,
    keywords: [...(caseStudy.keywords ?? []), ...caseStudy.techs].join(", "),
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
