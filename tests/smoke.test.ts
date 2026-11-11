/**
 * @jest-environment node
 */
// The deploy runs only this file (npm run test:smoke); pull requests run
// the whole suite. Each check is fast and guards something a deploy
// depends on that the build itself would not catch.
import fs from "fs";
import path from "path";
import { ARTICLE_COLLECTIONS, FIXED_PAGES, agentPagePatternSource } from "@/lib/collections.mjs";
import { renderAgentMarkdown } from "@/lib/agent-markdown";
import { getCaseStudies, getInsights, getLegacyArticles, getProjects } from "@/lib/content";

describe("smoke", () => {
  it("loads every collection", () => {
    expect(getCaseStudies().length).toBeGreaterThan(0);
    expect(getInsights().length).toBeGreaterThan(0);
    expect(getLegacyArticles().length).toBeGreaterThan(0);
    expect(getProjects().length).toBeGreaterThan(0);
  });

  it("keeps the CloudFront function's page pattern in step with the registry", () => {
    const yml = fs.readFileSync(path.join(process.cwd(), "serverless-resources/cloudfront.yml"), "utf8");
    expect(yml.match(/var pages = \/(.+)\/;/)?.[1]).toBe(agentPagePatternSource());
  });

  it("renders a markdown twin for every fixed page and one page per collection", () => {
    const firstSlug: Record<string, string | undefined> = {
      work: getCaseStudies()[0]?.slug,
      insights: getInsights()[0]?.slug,
      legacy: getLegacyArticles()[0]?.slug,
    };
    const pages = [
      ...FIXED_PAGES,
      ...ARTICLE_COLLECTIONS.map((c) => `${c.route}/${firstSlug[c.key]}`),
    ];
    const missing = pages.filter((page) => !renderAgentMarkdown(page)?.markdown);
    expect(missing).toEqual([]);
  });
});
