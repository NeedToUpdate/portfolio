import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { z } from "zod";
import { fingerprintedPath } from "./images";
import { collection } from "./collections.mjs";
import {
  agentGuideSchema,
  careerSchema,
  caseStudySchema,
  insightSchema,
  legacySchema,
  pageCopySchema,
  parseFrontmatter,
  type PageCopy,
  projectSchema,
  skillDomainSchema,
  workIntroSchema,
} from "./content-schema";
import {
  AgentGuide,
  CareerEntry,
  CaseStudy,
  Insight,
  InsightMeta,
  LegacyArticle,
  LegacyArticleMeta,
  Project,
  RelatedContent,
  SkillDomain,
  WorkIntro,
} from "./types";

/**
 * Content loaders. Every page reads content through these functions,
 * never from the filesystem directly. Server-side only. Frontmatter is
 * validated against lib/content-schema.ts, so a bad file fails the
 * build with its name and the offending field.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content");

const WORDS_PER_MINUTE = 200;

interface ContentEntry<T> {
  slug: string;
  data: T;
  content: string;
}

// Collections are immutable at runtime in production; in dev they are
// re-read every call so content edits show without a restart.
const collectionCache = new Map<string, ContentEntry<unknown>[]>();

function readCollection<S extends z.ZodType>(dir: string, schema: S): ContentEntry<z.output<S>>[] {
  const cached = collectionCache.get(dir);
  if (cached) return cached as ContentEntry<z.output<S>>[];

  const fullDir = path.join(CONTENT_ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];
  const entries = fs
    .readdirSync(fullDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((fileName) => {
      const raw = fs.readFileSync(path.join(fullDir, fileName), "utf-8");
      const { data, content } = matter(raw);
      return {
        slug: fileName.replace(/\.mdx?$/, ""),
        data: parseFrontmatter(schema, data, `${dir}/${fileName}`),
        content,
      };
    });

  if (process.env.NODE_ENV === "production") collectionCache.set(dir, entries);
  return entries;
}

/** A single-file document such as content/home.md. */
function readDocument<S extends z.ZodType>(fileName: string, schema: S): z.output<S> {
  const raw = fs.readFileSync(path.join(CONTENT_ROOT, fileName), "utf-8");
  return parseFrontmatter(schema, matter(raw).data, fileName);
}

export function getCaseStudies(): CaseStudy[] {
  return readCollection(collection("work").key, caseStudySchema)
    .map(({ slug, data, content }) => ({
      ...data,
      slug,
      diagram: data.diagram ? fingerprintedPath(data.diagram) : undefined,
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
  const projects = readCollection("projects", projectSchema).map(({ slug, data }) => ({
    ...data,
    slug,
  }));

  // Ties would sort by whatever order the filesystem returns.
  const seen = new Map<number, string>();
  for (const project of projects) {
    const clash = seen.get(project.order);
    if (clash) {
      throw new Error(
        `content/projects: ${clash} and ${project.slug} share order ${project.order}; give each a distinct value`,
      );
    }
    seen.set(project.order, project.slug);
  }

  return projects.sort((a, b) => a.order - b.order);
}

export function getProjectsByEra(era: Project["era"]): Project[] {
  return getProjects().filter((p) => p.era === era);
}

function toInsightMeta({ slug, data, content }: ContentEntry<z.output<typeof insightSchema>>): InsightMeta {
  const words = content.split(/\s+/).filter(Boolean).length;
  return {
    ...data,
    slug,
    previewImage: data.previewImage ? fingerprintedPath(data.previewImage) : undefined,
    readingTimeMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
}

/** Resolve explicit editorial paths and fail loudly when frontmatter goes stale. */
export function getRelatedContent(paths: string[] = []): RelatedContent[] {
  const insights = new Map(getInsights().map((item) => [`/insights/${item.slug}`, item]));
  const studies = new Map(getCaseStudies().map((item) => [`/work/${item.slug}`, item]));

  return paths.map((href) => {
    const insight = insights.get(href);
    if (insight) return {
      href,
      title: insight.title,
      description: insight.description,
      image: insight.previewImage,
      kind: "Insight" as const,
    };

    const study = studies.get(href);
    if (study) return {
      href,
      title: study.title,
      description: study.impact,
      image: study.diagram,
      kind: "Case study" as const,
      category: study.category,
    };

    throw new Error(`Related content path does not resolve: ${href}`);
  });
}

/**
 * Build the "Keep exploring" list for a detail page.
 *
 * Curated `related` links lead — they are the most relevant next reads. The
 * catch: curated links are often reciprocal (A→B, B→A), so following the top
 * card alone can trap a reader in a 2–3 item loop. As a guaranteed escape,
 * the sequential next entry — which, followed on its own, tours every item
 * before repeating — rides in the next open slot (2nd or 3rd). So any list
 * with fewer than `limit` curated links always carries one loop-free
 * "break". When curated links fill every slot, that is fine: the reader
 * still escapes through the cross-links elsewhere in the loop.
 */
export function buildRecommendations<T>(options: {
  /** The full same-type collection, in the order the reader walks it. */
  ordered: T[];
  currentSlug: string;
  slugOf: (item: T) => string;
  /** Map a same-type entry to its recommendation card. */
  toRelated: (item: T) => RelatedContent;
  /** Resolved editorial `related` links; may point across types. */
  curated?: RelatedContent[];
  limit?: number;
}): RelatedContent[] {
  const { ordered, currentSlug, slugOf, toRelated, curated = [], limit = 3 } = options;
  const count = ordered.length;
  const index = ordered.findIndex((item) => slugOf(item) === currentSlug);
  if (index === -1 || count <= 1) return [];

  const selfHref = toRelated(ordered[index]!).href;
  // The tour: next entry first, wrapping once, current entry excluded.
  const tour = Array.from({ length: count - 1 }, (_, offset) =>
    toRelated(ordered[(index + offset + 1) % count]!)
  );

  // Curated links lead; the sequential next (tour[0]) follows as a loop-free
  // "break", then the rest of the tour fills any slot still open.
  const ordering = [...curated, ...tour];
  const seen = new Set<string>();
  const recommendations: RelatedContent[] = [];
  for (const item of ordering) {
    if (item.href === selfHref || seen.has(item.href)) continue;
    seen.add(item.href);
    recommendations.push(item);
    if (recommendations.length >= limit) break;
  }
  return recommendations;
}

export function getInsights(): InsightMeta[] {
  return readCollection(collection("insights").key, insightSchema)
    .map(toInsightMeta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getInsight(slug: string): Insight | undefined {
  const entry = readCollection(collection("insights").key, insightSchema).find((e) => e.slug === slug);
  if (!entry) return undefined;
  return { ...toInsightMeta(entry), body: entry.content };
}

function toLegacyMeta({ slug, data }: ContentEntry<z.output<typeof legacySchema>>): LegacyArticleMeta {
  return { ...data, slug, screenshot: fingerprintedPath(data.screenshot) };
}

/** Legacy articles, newest original first. */
export function getLegacyArticles(): LegacyArticleMeta[] {
  return readCollection(collection("legacy").key, legacySchema)
    .map(toLegacyMeta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getLegacyArticle(slug: string): LegacyArticle | undefined {
  const entry = readCollection(collection("legacy").key, legacySchema).find((e) => e.slug === slug);
  if (!entry) return undefined;
  return { ...toLegacyMeta(entry), body: entry.content };
}

export function getCareerEntries(): CareerEntry[] {
  return readCollection("career", careerSchema)
    .map(({ slug, data }) => ({ ...data, slug }))
    .sort((a, b) => a.order - b.order);
}

export function getSkillDomains(): SkillDomain[] {
  return readCollection("skills", skillDomainSchema)
    .map(({ slug, data }) => ({ ...data, slug }))
    .sort((a, b) => a.order - b.order);
}

export function getAgentGuide(): AgentGuide {
  return readDocument("agent.md", agentGuideSchema);
}

export function getWorkIntro(): WorkIntro {
  return readDocument("home.md", workIntroSchema);
}

/** Heading copy for an index page, from content/pages/<page>.md. */
export function getPageCopy(page: "projects" | "insights" | "legacy"): PageCopy {
  return readDocument(`pages/${page}.md`, pageCopySchema);
}

/** One named section of a page's copy; throws when the file lacks it. */
export function sectionCopy(copy: PageCopy, name: string): PageCopy["sections"][string] {
  const section = copy.sections[name];
  if (!section) throw new Error(`Page copy has no "${name}" section`);
  return section;
}
