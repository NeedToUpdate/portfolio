import { z } from "zod";
import { nebulaShapes } from "./nebula/shapes";

/**
 * Frontmatter schemas for every content file. The loaders in
 * lib/content.ts parse through these, so a missing field, a typo'd key,
 * or a wrong type fails the build with the file name and the field,
 * instead of rendering "undefined" or silently dropping a value.
 *
 * Objects are strict: an unknown key is an error, which catches
 * misspelled field names that would otherwise be ignored.
 */

const text = z.string().trim().min(1);

/** YAML reads an unquoted 2026-07-05 as a Date; the site wants the string. */
const DATE_MESSAGE = "expected a quoted \"YYYY-MM-DD\" date";
const isoDate = z.string({ error: DATE_MESSAGE }).regex(/^\d{4}-\d{2}-\d{2}$/, DATE_MESSAGE);

/** A month with no day, for dates only known roughly. */
const MONTH_MESSAGE = "expected a quoted \"YYYY-MM\" month";
const yearMonth = z.string({ error: MONTH_MESSAGE }).regex(/^\d{4}-(0[1-9]|1[0-2])$/, MONTH_MESSAGE);

const textList = z.array(text).default([]);

/** A glyph the nebula can draw. An unknown key draws nothing. */
const nebulaShape = z.string().refine((key) => key in nebulaShapes, {
  message: `unknown nebula shape; use one of: ${Object.keys(nebulaShapes).join(", ")}`,
});

/** A site path to a public image, e.g. "/images/foo.webp". */
const imagePath = z.string().startsWith("/images/");

export const caseStudySchema = z.strictObject({
  title: text,
  date: isoDate,
  impact: text,
  seoDescription: text.optional(),
  techs: textList,
  keywords: textList,
  category: text.default("systems"),
  priority: z.number().int().default(99),
  role: text.optional(),
  context: z.array(z.strictObject({ term: text, value: text })).optional(),
  diagram: imagePath.optional(),
  diagramAlt: text.optional(),
  related: textList,
  comments: z
    .array(z.strictObject({ question: text, answer: text }))
    .min(1, "needs at least one comment"),
});

export const projectSchema = z.strictObject({
  title: text,
  description: text,
  thumbnail: imagePath.optional(),
  techs: textList,
  url: text,
  /** Position on the projects page; lower comes first. Must be unique. */
  order: z.number().int(),
  brightImage: z.boolean().default(false),
  // Archive files carry no era field; they all predate AI tooling.
  era: z.enum(["pre-ai", "post-ai"]).default("pre-ai"),
  nebulaShape: nebulaShape.optional(),
  insightSlug: text.optional(),
  legacySlug: text.optional(),
});

export const insightSchema = z.strictObject({
  title: text,
  seoTitle: text.optional(),
  deck: text.optional(),
  description: text,
  previewImage: imagePath.optional(),
  date: isoDate,
  tags: textList,
  related: textList,
});

export const legacySchema = z.strictObject({
  title: text,
  description: text,
  deck: text.optional(),
  date: isoDate,
  // When the project was built, which is often years before the post.
  built: yearMonth.optional(),
  originalUrl: z.url(),
  screenshot: imagePath,
  tags: textList,
  kind: z.enum(["post", "site"]).default("post"),
});

const streamView = z.strictObject({ title: text, org: text, points: textList });

export const careerSchema = z.strictObject({
  order: z.number().int().default(99),
  period: text,
  merged: streamView,
  tech: streamView.optional(),
  lead: streamView.optional(),
});

export const skillDomainSchema = z.strictObject({
  order: z.number().int().default(99),
  title: text,
  summary: text,
  nebulaShape,
  skills: z
    .array(z.strictObject({ name: text, since: z.number().int(), context: text.optional() }))
    .default([]),
});

export const agentGuideSchema = z.strictObject({
  intro: text,
  team: text,
  engagementsTitle: text,
  engagementsIntro: text,
  nudges: z
    .array(
      z.strictObject({
        reason: text,
        suggest: text,
        channel: z.enum(["email", "linkedin", "either"]),
      }),
    )
    .default([]),
  engagements: z.array(z.strictObject({ name: text, description: text })).default([]),
});

export const workIntroSchema = z.strictObject({
  title: text,
  sentence: text,
  description: text,
  caseStudiesHint: text,
  caseStudyCta: text,
  capabilitiesTitle: text,
  capabilities: z.array(z.strictObject({ term: text, description: text })).default([]),
});

const sectionCopy = z.strictObject({
  eyebrow: text.optional(),
  title: text,
  description: text,
  /** Link or button label, where the section ends in one. */
  cta: text.optional(),
});

/** Heading copy for an index page. Source: content/pages/<page>.md */
export const pageCopySchema = z.strictObject({
  /** The <title> and social-card title. */
  seoTitle: text,
  /** Meta description; the markdown twin opens with it too. */
  seoDescription: text,
  eyebrow: text,
  title: text,
  description: text,
  sections: z.record(z.string(), sectionCopy).default({}),
});

export type PageCopy = z.output<typeof pageCopySchema>;

/** Parses one file's frontmatter, naming the file and field on failure. */
export function parseFrontmatter<T extends z.ZodType>(
  schema: T,
  data: unknown,
  source: string,
): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`content/${source}: invalid frontmatter\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
