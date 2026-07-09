import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { CaseStudy, Insight, InsightMeta, Project, WorkIntro } from "./types";

/**
 * Content loaders. Every page reads content through these functions,
 * never from the filesystem directly. Server-side only.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content");

const WORDS_PER_MINUTE = 200;

interface ContentEntry {
  slug: string;
  /** "work/payment_rebuild", for error messages. */
  source: string;
  data: Record<string, unknown>;
  content: string;
}

/**
 * Missing frontmatter fails the build with the file name, instead of
 * rendering "undefined" on the page.
 */
function requireString(entry: ContentEntry, field: string): string {
  const value = entry.data[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`content/${entry.source}: missing required frontmatter field "${field}"`);
  }
  return value;
}

// Collections are immutable at runtime in production; in dev they are
// re-read every call so content edits show without a restart.
const collectionCache = new Map<string, ContentEntry[]>();

function readCollection(dir: string): ContentEntry[] {
  const cached = collectionCache.get(dir);
  if (cached) return cached;

  const fullDir = path.join(CONTENT_ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];
  const entries = fs
    .readdirSync(fullDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((fileName) => {
      const raw = fs.readFileSync(path.join(fullDir, fileName), "utf-8");
      const { data, content } = matter(raw);
      const slug = fileName.replace(/\.mdx?$/, "");
      return {
        slug,
        source: `${dir}/${fileName}`,
        data,
        content,
      };
    });

  if (process.env.NODE_ENV === "production") collectionCache.set(dir, entries);
  return entries;
}

export function getCaseStudies(): CaseStudy[] {
  return readCollection("work")
    .map((entry) => ({
      slug: entry.slug,
      title: requireString(entry, "title"),
      impact: requireString(entry, "impact"),
      techs: (entry.data.techs as string[]) ?? [],
      category: (entry.data.category as string) ?? "systems",
      priority: (entry.data.priority as number) ?? 99,
      body: entry.content.trim(),
    }))
    .sort((a, b) => a.priority - b.priority);
}

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return getCaseStudies().find((c) => c.slug === slug);
}

export function getFeaturedCaseStudies(count = 3): CaseStudy[] {
  return getCaseStudies().slice(0, count);
}

export function getProjects(): Project[] {
  return readCollection("projects")
    .map((entry) => ({
      slug: entry.slug,
      title: requireString(entry, "title"),
      description: requireString(entry, "description"),
      thumbnail: entry.data.thumbnail as string | undefined,
      techs: (entry.data.techs as string[]) ?? [],
      url: requireString(entry, "url"),
      priority: (entry.data.priority as number) ?? 0,
      brightImage: Boolean(entry.data.brightImage),
      // Existing archive files carry no era field; they all predate AI tooling.
      era: (entry.data.era as Project["era"]) ?? "pre-ai",
    }))
    .sort((a, b) => b.priority - a.priority);
}

export function getProjectsByEra(era: Project["era"]): Project[] {
  return getProjects().filter((p) => p.era === era);
}

function toInsightMeta(entry: ContentEntry): InsightMeta {
  const words = entry.content.split(/\s+/).filter(Boolean).length;
  return {
    slug: entry.slug,
    title: requireString(entry, "title"),
    description: requireString(entry, "description"),
    date: requireString(entry, "date"),
    tags: (entry.data.tags as string[]) ?? [],
    readingTimeMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
}

export function getInsights(): InsightMeta[] {
  return readCollection("insights")
    .map(toInsightMeta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getInsight(slug: string): Insight | undefined {
  const entry = readCollection("insights").find((e) => e.slug === slug);
  if (!entry) return undefined;
  return {
    ...toInsightMeta(entry),
    body: entry.content,
  };
}

export function getWorkIntro(): WorkIntro {
  const raw = fs.readFileSync(path.join(CONTENT_ROOT, "home.md"), "utf-8");
  const { data, content } = matter(raw);
  const entry: ContentEntry = { slug: "home", source: "home.md", data, content };
  return {
    title: requireString(entry, "title"),
    sentence: requireString(entry, "sentence"),
    description: requireString(entry, "description"),
    caseStudiesHint: requireString(entry, "caseStudiesHint"),
    caseStudyCta: requireString(entry, "caseStudyCta"),
    capabilitiesTitle: requireString(entry, "capabilitiesTitle"),
    capabilities: data.capabilities ?? [],
  };
}
