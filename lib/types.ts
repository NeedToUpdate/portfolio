/** Typed frontmatter schemas for every content collection. */

/** A professional case study. Source: content/work/*.md */
export interface CaseStudy {
  slug: string;
  title: string;
  impact: string;
  techs: string[];
  category: string;
  /** Lower number = higher prominence. 1 is the flagship. */
  priority: number;
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
}

/** Blog post metadata. Source: content/writing/*.mdx frontmatter */
export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  /** ISO date string, e.g. "2026-07-05" */
  date: string;
  tags: string[];
  readingTimeMinutes: number;
}

/** A full blog post: metadata plus raw MDX source. */
export interface Post extends PostMeta {
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
  capabilities: Capability[];
}
