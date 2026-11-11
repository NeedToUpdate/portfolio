import type { MetadataRoute } from "next";
import { getCaseStudies, getInsights, getLegacyArticles } from "@/lib/content";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/work", "/insights", "/projects", "/about", "/contact"].map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const workRoutes = getCaseStudies().map(({ slug }) => ({
    url: `${site.url}/work/${slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }));

  const insightRoutes = getInsights().map(({ slug, date }) => ({
    url: `${site.url}/insights/${slug}`,
    lastModified: date,
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }));

  // Legacy articles are reachable from project cards only, so the
  // sitemap is how crawlers find them. Lower priority than current work.
  const legacyRoutes = getLegacyArticles().map(({ slug }) => ({
    url: `${site.url}/legacy/${slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.4,
  }));

  const legacyIndex = {
    url: `${site.url}/legacy`,
    changeFrequency: "yearly" as const,
    priority: 0.4,
  };

  return [...staticRoutes, ...workRoutes, ...insightRoutes, legacyIndex, ...legacyRoutes];
}
