import { site } from "./site";
import { PostMeta } from "./types";

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
    email: `mailto:${site.email}`,
    jobTitle: site.role,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Toronto",
      addressCountry: "CA",
    },
    sameAs: [site.github, site.linkedin],
  };
}

export function articleSchema(post: PostMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: site.name,
      url: site.url,
    },
    mainEntityOfPage: `${site.url}/writing/${post.slug}`,
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
