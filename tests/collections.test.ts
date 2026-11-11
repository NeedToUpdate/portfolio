import fs from "fs";
import path from "path";
import {
  ARTICLE_COLLECTIONS,
  FIXED_PAGES,
  agentPagePatternSource,
  mdTwin,
} from "@/lib/collections.mjs";
import { renderAgentMarkdown } from "@/lib/agent-markdown";
import { parseFrontmatter, projectSchema, insightSchema } from "@/lib/content-schema";

const root = process.cwd();

describe("collection registry", () => {
  it("keeps the CloudFront negotiation pattern identical to the registry's", () => {
    // The CloudFront function can't import anything, so it carries a
    // literal copy of the pattern proxy.ts compiles from the registry.
    const yml = fs.readFileSync(path.join(root, "serverless-resources/cloudfront.yml"), "utf8");
    const literal = yml.match(/var pages = \/(.+)\/;/)?.[1];
    expect(literal).toBe(agentPagePatternSource());
  });

  it("matches fixed pages and detail pages, and nothing deeper", () => {
    const pattern = new RegExp(agentPagePatternSource());
    for (const page of FIXED_PAGES) expect(pattern.test(page)).toBe(true);
    for (const c of ARTICLE_COLLECTIONS) {
      expect(pattern.test(`${c.route}/some-slug`)).toBe(true);
      expect(pattern.test(`${c.route}/some-slug/deeper`)).toBe(false);
    }
    expect(pattern.test("/md/work")).toBe(false);
    expect(pattern.test("/images/portrait.webp")).toBe(false);
  });

  it("gives every collection a content folder and a detail route", () => {
    for (const c of ARTICLE_COLLECTIONS) {
      expect(fs.existsSync(path.join(root, "content", c.key))).toBe(true);
      expect(fs.existsSync(path.join(root, "app", c.route.slice(1), "[slug]", "page.tsx"))).toBe(true);
    }
  });

  it("serves a markdown twin for every fixed page", () => {
    const missing = FIXED_PAGES.filter((page) => !renderAgentMarkdown(page));
    expect(missing).toEqual([]);
    expect(mdTwin("/")).toBe("/md");
    expect(mdTwin("/work")).toBe("/md/work");
  });
});

describe("frontmatter schemas", () => {
  const project = {
    title: "A project",
    description: "One line.",
    url: "https://example.com",
    order: 1,
  };

  it("names the file and field when a value is wrong", () => {
    expect(() =>
      parseFrontmatter(projectSchema, { ...project, nebulaShape: "book" }, "projects/x.md"),
    ).toThrow(/content\/projects\/x\.md[\s\S]*nebulaShape/);
  });

  it("rejects misspelled keys instead of ignoring them", () => {
    expect(() =>
      parseFrontmatter(projectSchema, { ...project, nebulashape: "hex" }, "projects/x.md"),
    ).toThrow(/nebulashape/);
  });

  it("rejects a date YAML parsed into a Date object", () => {
    expect(() =>
      parseFrontmatter(
        insightSchema,
        { title: "T", description: "D", date: new Date("2026-07-05") },
        "insights/x.mdx",
      ),
    ).toThrow(/YYYY-MM-DD/);
  });

  it("fills defaults for optional lists and flags", () => {
    const parsed = parseFrontmatter(projectSchema, project, "projects/x.md");
    expect(parsed.techs).toEqual([]);
    expect(parsed.brightImage).toBe(false);
    expect(parsed.era).toBe("pre-ai");
  });
});
