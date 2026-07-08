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

function readCollection(dir: string): { slug: string; data: Record<string, unknown>; content: string }[] {
  const fullDir = path.join(CONTENT_ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];
  return fs
    .readdirSync(fullDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((fileName) => {
      const raw = fs.readFileSync(path.join(fullDir, fileName), "utf-8");
      const { data, content } = matter(raw);
      return {
        slug: fileName.replace(/\.mdx?$/, ""),
        data,
        content,
      };
    });
}

export function getCaseStudies(): CaseStudy[] {
  return readCollection("work")
    .map(({ slug, data, content }) => ({
      slug,
      title: data.title as string,
      impact: data.impact as string,
      techs: (data.techs as string[]) ?? [],
      category: (data.category as string) ?? "systems",
      priority: (data.priority as number) ?? 99,
      body: content.trim(),
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
    .map(({ slug, data }) => ({
      slug,
      title: data.title as string,
      description: data.description as string,
      thumbnail: data.thumbnail as string | undefined,
      techs: (data.techs as string[]) ?? [],
      url: data.url as string,
      priority: (data.priority as number) ?? 0,
      brightImage: Boolean(data.brightImage),
      // Existing archive files carry no era field; they all predate AI tooling.
      era: (data.era as Project["era"]) ?? "pre-ai",
    }))
    .sort((a, b) => b.priority - a.priority);
}

export function getProjectsByEra(era: Project["era"]): Project[] {
  return getProjects().filter((p) => p.era === era);
}

function toInsightMeta(slug: string, data: Record<string, unknown>, content: string): InsightMeta {
  const words = content.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    tags: (data.tags as string[]) ?? [],
    readingTimeMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
}

export function getInsights(): InsightMeta[] {
  return readCollection("insights")
    .map(({ slug, data, content }) => toInsightMeta(slug, data, content))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getInsight(slug: string): Insight | undefined {
  const entry = readCollection("insights").find((e) => e.slug === slug);
  if (!entry) return undefined;
  return {
    ...toInsightMeta(entry.slug, entry.data, entry.content),
    body: entry.content,
  };
}

export function getWorkIntro(): WorkIntro {
  const raw = fs.readFileSync(path.join(CONTENT_ROOT, "home.md"), "utf-8");
  const { data } = matter(raw);
  return {
    title: data.title as string,
    sentence: data.sentence as string,
    description: data.description as string,
    capabilities: data.capabilities ?? [],
  };
}
