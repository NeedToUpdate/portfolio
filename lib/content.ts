import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fingerprintedPath } from "./images";
import {
  AgentGuide,
  AgentNudge,
  CareerEntry,
  CaseStudy,
  Engagement,
  Insight,
  InsightMeta,
  Project,
  RelatedContent,
  SkillDomain,
  StreamView,
  WorkIntro,
} from "./types";

/**
 * Content loaders. Every page reads content through these functions,
 * never from the filesystem directly. Server-side only.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content");

const WORDS_PER_MINUTE = 200;

interface ContentEntry {
  slug: string;
  /** "work/payment-rebuild", for error messages. */
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

function requireCaseComments(entry: ContentEntry): CaseStudy["comments"] {
  const comments = entry.data.comments as Partial<CaseStudy["comments"][number]>[] | undefined;
  if (!Array.isArray(comments) || comments.length < 1) {
    throw new Error(`content/${entry.source}: "comments" must contain at least one entry`);
  }
  for (const comment of comments) {
    if (!comment.question?.trim() || !comment.answer?.trim()) {
      throw new Error(
        `content/${entry.source}: every comment needs a question and answer`
      );
    }
  }
  return comments as CaseStudy["comments"];
}

/** Validates a nested { title, org, points } block, e.g. career.merged. */
function requireStreamView(entry: ContentEntry, field: string): StreamView {
  const value = entry.data[field] as Partial<StreamView> | undefined;
  if (!value || typeof value.title !== "string" || typeof value.org !== "string") {
    throw new Error(
      `content/${entry.source}: "${field}" must have a "title" and "org" string`
    );
  }
  return { title: value.title, org: value.org, points: value.points ?? [] };
}

/** Same shape, but the field is optional (career's tech/lead streams). */
function optionalStreamView(entry: ContentEntry, field: string): StreamView | undefined {
  return entry.data[field] ? requireStreamView(entry, field) : undefined;
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
      date: requireString(entry, "date"),
      impact: requireString(entry, "impact"),
      techs: (entry.data.techs as string[]) ?? [],
      keywords: (entry.data.keywords as string[]) ?? [],
      category: (entry.data.category as string) ?? "systems",
      priority: (entry.data.priority as number) ?? 99,
      role: entry.data.role as string | undefined,
      context: entry.data.context as CaseStudy["context"],
      diagram: entry.data.diagram
        ? fingerprintedPath(entry.data.diagram as string)
        : undefined,
      diagramAlt: entry.data.diagramAlt as string | undefined,
      related: (entry.data.related as string[]) ?? [],
      comments: requireCaseComments(entry),
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
      nebulaShape: entry.data.nebulaShape as string | undefined,
      insightSlug: entry.data.insightSlug as string | undefined,
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
    seoTitle: typeof entry.data.seoTitle === "string" ? entry.data.seoTitle : undefined,
    description: requireString(entry, "description"),
    previewImage: entry.data.previewImage
      ? fingerprintedPath(entry.data.previewImage as string)
      : undefined,
    date: requireString(entry, "date"),
    tags: (entry.data.tags as string[]) ?? [],
    readingTimeMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    related: (entry.data.related as string[]) ?? [],
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
 * The featured card (the one a reader clicks to keep going) always steps to
 * the NEXT entry in the ordered list, wrapping once. That single step is a
 * full cycle: follow it from any page and you visit every entry before
 * repeating, never a 2–3 item loop. Curated `related` links can be
 * reciprocal (A→B, B→A), so they fill only the secondary slots, where they
 * add relevance without trapping the reader.
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

  const selfHref = toRelated(ordered[index]).href;
  // The tour: next entry first, wrapping once, current entry excluded.
  const tour = Array.from({ length: count - 1 }, (_, offset) =>
    toRelated(ordered[(index + offset + 1) % count])
  );

  // Featured (tour[0]) is loop-free; curated relevance and the rest of the
  // tour fill the remaining slots.
  const ordering = [tour[0], ...curated, ...tour.slice(1)];
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

export function getCareerEntries(): CareerEntry[] {
  return readCollection("career")
    .map((entry) => ({
      slug: entry.slug,
      order: (entry.data.order as number) ?? 99,
      period: requireString(entry, "period"),
      merged: requireStreamView(entry, "merged"),
      tech: optionalStreamView(entry, "tech"),
      lead: optionalStreamView(entry, "lead"),
    }))
    .sort((a, b) => a.order - b.order);
}

export function getSkillDomains(): SkillDomain[] {
  return readCollection("skills")
    .map((entry) => ({
      slug: entry.slug,
      order: (entry.data.order as number) ?? 99,
      title: requireString(entry, "title"),
      summary: requireString(entry, "summary"),
      nebulaShape: requireString(entry, "nebulaShape"),
      skills: (entry.data.skills as SkillDomain["skills"]) ?? [],
    }))
    .sort((a, b) => a.order - b.order);
}

export function getAgentGuide(): AgentGuide {
  const raw = fs.readFileSync(path.join(CONTENT_ROOT, "agent.md"), "utf-8");
  const { data } = matter(raw);
  const entry: ContentEntry = { slug: "agent", source: "agent.md", data, content: "" };
  return {
    intro: requireString(entry, "intro"),
    team: requireString(entry, "team"),
    engagementsTitle: requireString(entry, "engagementsTitle"),
    engagementsIntro: requireString(entry, "engagementsIntro"),
    nudges: (data.nudges as AgentNudge[]) ?? [],
    engagements: (data.engagements as Engagement[]) ?? [],
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
