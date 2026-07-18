/** Typed frontmatter schemas for every content collection. */

/** One row of a case study's context scorecard, e.g. Client / Scale. */
export interface ScorecardEntry {
  term: string;
  value: string;
}

/** A professional case study. Source: content/work/*.md */
export interface CaseStudy {
  slug: string;
  title: string;
  /** When the project delivered (YYYY-MM-DD, month precision).
   *  Feeds structured data; not shown on the page. */
  date: string;
  impact: string;
  techs: string[];
  /** Search-intent phrases for this case study, e.g. "data warehouse". Feeds meta keywords and JSON-LD, distinct from techs. */
  keywords?: string[];
  category: string;
  /** Lower number = higher prominence. 1 is the flagship. */
  priority: number;
  /** My span of influence, one line, e.g. "Led architecture and delivery". */
  role?: string;
  /** Context scorecard rows: client, scale, environment. Facts only. */
  context?: ScorecardEntry[];
  /** Path to an architecture diagram image, once one exists. */
  diagram?: string;
  /** Equivalent text for the architecture diagram's important flow and components. */
  diagramAlt?: string;
  body: string;
}

export type ProjectEra = "pre-ai" | "post-ai";

/** A portfolio project. Source: content/projects/*.md */
export interface Project {
  slug: string;
  title: string;
  description: string;
  thumbnail?: string;
  techs: string[];
  url: string;
  priority: number;
  brightImage?: boolean;
  /** Whether the project was built before or with AI in the toolchain. */
  era: ProjectEra;
  /** Glyph the nebula condenses into on hover. Defaults to "spark". */
  nebulaShape?: string;
  /** Slug of an insight write-up about this project, if one exists. */
  insightSlug?: string;
}

/** Insight metadata. Source: content/insights/*.mdx frontmatter */
export interface InsightMeta {
  slug: string;
  title: string;
  description: string;
  /** Editorial image used by insight lists, recommendations, and social previews. */
  previewImage?: string;
  /** ISO date string, e.g. "2026-07-05" */
  date: string;
  tags: string[];
  readingTimeMinutes: number;
}

/** A full insight: metadata plus raw MDX source. */
export interface Insight extends InsightMeta {
  body: string;
}

/** A named capability shown on the work index and about page. */
export interface Capability {
  term: string;
  description: string;
}

/** Editorial copy for the work section. Source: content/home.md */
export interface WorkIntro {
  title: string;
  sentence: string;
  description: string;
  /** One line above the case-study list saying what a write-up contains. */
  caseStudiesHint: string;
  /** Per-row link label, e.g. "Read the case study". */
  caseStudyCta: string;
  /** Heading for the capabilities strip on the work page. */
  capabilitiesTitle: string;
  capabilities: Capability[];
}

/** A named consulting engagement agents can suggest. Source: content/agent.md */
export interface Engagement {
  name: string;
  description: string;
}

/** One visitor intent and the suggestion an agent should make for it. */
export interface AgentNudge {
  reason: string;
  suggest: string;
  /** Which contact channel closes the loop. */
  channel: "email" | "linkedin" | "either";
}

/**
 * Guidance for AI agents summarizing or acting on the site.
 * Source: content/agent.md. TONE.md applies; written in third person.
 */
export interface AgentGuide {
  intro: string;
  /** One line: Art can staff delivery, not just advise. */
  team: string;
  engagementsTitle: string;
  engagementsIntro: string;
  nudges: AgentNudge[];
  engagements: Engagement[];
}

/** One column of a career entry: a job title, org, and its bullet points. */
export interface StreamView {
  title: string;
  org: string;
  points: string[];
}

/**
 * One period on the career timeline. Source: content/career/*.md
 *
 * `merged` is the single-timeline version, mixing tech and leadership.
 * `tech` and `lead` are the same period split into the engineering
 * side and the teaching/leadership side; an entry with only one side
 * appears on just that stream when split.
 */
export interface CareerEntry {
  slug: string;
  /** Lower number = later on the timeline (sorts newest first). */
  order: number;
  period: string;
  merged: StreamView;
  tech?: StreamView;
  lead?: StreamView;
}

/** One tool or practice inside a skill domain. */
export interface Skill {
  name: string;
  /** First year used in real work. */
  since: number;
  /** Where it was used, for tooltips. */
  context?: string;
}

/**
 * One category on the skills chart. Source: content/skills/*.md
 * Names must render without truncation in the chart's label column;
 * keep them short and put the detail in a skill's "context" field.
 */
export interface SkillDomain {
  slug: string;
  /** Lower number = higher on the chart's legend. */
  order: number;
  title: string;
  /** One sentence: what I do with this domain. TONE.md applies. */
  summary: string;
  /** Nebula glyph the domain's legend entry condenses into on hover. */
  nebulaShape: string;
  skills: Skill[];
}
