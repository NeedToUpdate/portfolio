import type { MetadataRoute } from "next";
import { getCaseStudies, getInsights, getLegacyArticles } from "@/lib/content";
import { ARTICLE_COLLECTIONS, STANDALONE_PAGES } from "@/lib/collections.mjs";
import { site } from "@/lib/site";

/** Every collection's entries with the date each one carries. */
const entriesOf = {
  work: getCaseStudies,
  insights: getInsights,
  legacy: getLegacyArticles,
} satisfies Record<(typeof ARTICLE_COLLECTIONS)[number]["key"], () => { slug: string; date: string }[]>;

export default function sitemap(): MetadataRoute.Sitemap {
  const home = { url: site.url, changeFrequency: "monthly" as const, priority: 1 };

  const standalone = STANDALONE_PAGES.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const collections = ARTICLE_COLLECTIONS.flatMap((c) => [
    {
      url: `${site.url}${c.route}`,
      changeFrequency: c.indexChangeFrequency,
      priority: c.indexPriority,
    },
    ...entriesOf[c.key]().map(({ slug, date }) => ({
      url: `${site.url}${c.route}/${slug}`,
      lastModified: date,
      changeFrequency: "yearly" as const,
      priority: c.detailPriority,
    })),
  ]);

  return [home, ...standalone, ...collections];
}
