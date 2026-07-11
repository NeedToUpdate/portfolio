import type { Metadata } from "next";
import { site } from "./site";
import { CaseStudy, InsightMeta } from "./types";

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
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
      name: site.name,
      url: site.url,
    },
  };
}

export function articleSchema(insight: InsightMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: insight.title,
    description: insight.description,
    datePublished: insight.date,
    inLanguage: "en-CA",
    image: insight.previewImage
      ? new URL(insight.previewImage, site.url).toString()
      : `${site.url}/opengraph-image`,
    author: {
      "@type": "Person",
      name: site.name,
      url: site.url,
    },
    mainEntityOfPage: `${site.url}/insights/${insight.slug}`,
  };
}

export function caseStudySchema(caseStudy: CaseStudy) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: caseStudy.title,
    description: caseStudy.impact,
    url: `${site.url}/work/${caseStudy.slug}`,
    inLanguage: "en-CA",
    author: {
      "@type": "Person",
      name: site.name,
      url: site.url,
    },
    keywords: caseStudy.techs.join(", "),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${site.url}${item.path}`,
    })),
  };
}
