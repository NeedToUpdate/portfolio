import {
  getAgentGuide,
  getCareerEntries,
  getCaseStudies,
  getCaseStudy,
  getInsight,
  getInsights,
  getLegacyArticle,
  getLegacyArticles,
  getPageCopy,
  getProjects,
  getSkillDomains,
  getWorkIntro,
} from "./content";
import { ARTICLE_COLLECTIONS, type ArticleCollection } from "./collections.mjs";
import { site, socialChannels } from "./site";
import type { MdxComponentName } from "@/components/composites/mdx-components";
import type { AgentGuide, CaseStudy, InsightMeta } from "./types";

/**
 * The agent-facing markdown mirror served at /md/*. Every document is
 * assembled from the same content loaders the HTML pages use, so the
 * two views cannot drift: edit a content file and both follow.
 */

export interface AgentPage {
  title: string;
  markdown: string;
  /** Set on documents with no HTML twin, so no canonical URL exists. */
  mdOnly?: boolean;
}

/** Absolute canonical URL for a site-relative path. */
function abs(path: string): string {
  return `${site.url}${path}`;
}

/** Reads one string prop from a component's raw attribute source. */
type Props = (name: string) => string | undefined;

/**
 * How each MDX component reads in the agent markdown:
 * - a function returns the markdown it becomes (`inner` is its children);
 * - "interactive" is browser-only: its description prop stands in for
 *   it when it has one, otherwise it is dropped;
 * - "unwrap" keeps its children and drops the wrapper.
 * The Record type requires an entry for every registered component, so
 * a new one can't silently vanish from the markdown twin.
 */
type MarkdownForm =
  | ((props: Props, inner: string, attrs: string) => string)
  | "interactive"
  | "unwrap";

/** Site-relative links become absolute; others pass through. */
function link(href: string): string {
  return href.startsWith("/") ? abs(href) : href;
}

export const markdownForms: Record<MdxComponentName, MarkdownForm> = {
  // An image with its caption, then any text that belongs to it.
  MediaRow: (props, inner) => {
    const src = props("src");
    const caption = props("caption");
    return [
      src ? `![${props("alt") ?? ""}](${abs(src)})` : "",
      caption ? `*${caption}*` : "",
      inner.trim(),
    ]
      .filter(Boolean)
      .join("\n\n");
  },
  // Clips become a labelled link to the file.
  VideoFigure: (props) => {
    const src = props("src");
    if (!src) return "";
    const caption = props("caption");
    const video = `[Video: ${props("label") ?? "Video"}](${abs(src)})`;
    return caption ? `${video}\n\n*${caption}*` : video;
  },
  // Note panels read as asides; blockquotes carry that in markdown.
  Note: (_, inner) =>
    inner
      .trim()
      .split("\n")
      .map((line) => `> ${line.trim()}`.trimEnd())
      .join("\n"),
  Card: "unwrap",
  // The "now with AI" panel becomes a headed section: image, text, link.
  NowWithAI: (props, inner) => {
    const image = props("image");
    const href = props("href");
    return [
      `## ${props("title") ?? "Update"} (now with AI)`,
      image ? `![${props("imageAlt") ?? ""}](${abs(image)})` : "",
      inner.trim(),
      href ? `[${props("cta") ?? "Read the write-up"}](${link(href)})` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  },
  // A project link card becomes a plain link, or a status line when offline.
  ProjectLink: (props, _inner, attrs) => {
    const href = props("href");
    const title = props("title") ?? "Project";
    const note = props("note");
    const tail = note ? ` ${note}` : "";
    // slides={[["/images/a.webp", "Name", "Group"], ...]}: list them as links.
    const slides = [...attrs.matchAll(/\[\s*"(\/[^"]+)",\s*"([^"]+)"/g)].map(
      ([, src, label]) => `[${label}](${link(src!)})`,
    );
    const shots = slides.length > 0 ? `\n>\n> Screenshots: ${slides.join(", ")}.` : "";
    if (!href || props("mode") === "offline") return `> ${title} is no longer online.${tail}${shots}`;
    return `> Try it: [${title}](${link(href)}).${tail}${shots}`;
  },
  RequestPathExplorer: "interactive",
  StarfieldDemo: "interactive",
  MinWidthDemo: "interactive",
  BrainRouterDemo: "interactive",
  HomelabDiagram: "interactive",
  ShapeMorphButtons: "interactive",
  AIWorkflowTimeline: "interactive",
  HumanReviewLab: "interactive",
  TeamGame: "interactive",
  ReleaseTrain: "interactive",
};

/** Attribute source: quoted strings and {expressions} may hold > or /. */
const ATTRS = String.raw`((?:"[^"]*"|\{[^{}]*\}|[^"{}>])*)`;

function propsOf(attrs: string): Props {
  return (name) => attrs.match(new RegExp(String.raw`(?:^|\s)${name}="([^"]*)"`))?.[1];
}

function render(form: MarkdownForm, attrs: string, inner: string): string {
  const props = propsOf(attrs);
  if (form === "unwrap") return inner;
  if (form === "interactive") {
    const description = props("description");
    return description ? `> Interactive figure: ${description}` : "";
  }
  return form(props, inner, attrs);
}

/**
 * Insights and legacy articles are MDX with components. Agents get
 * plain markdown, each component converted by its entry in
 * markdownForms. Paired components convert innermost first, so a Note
 * holding a MediaRow sees the converted image, not the raw tag.
 */
export function mdxToMarkdown(body: string): string {
  const forms = Object.entries(markdownForms) as [MdxComponentName, MarkdownForm][];
  let out = body;
  for (let pass = 0; pass < 10; pass += 1) {
    const before = out;
    for (const [name, form] of forms) {
      out = out
        .replace(new RegExp(`<${name}${ATTRS}/>`, "g"), (_, attrs: string) => render(form, attrs, ""))
        .replace(
          new RegExp(String.raw`<${name}${ATTRS}>([\s\S]*?)</${name}>`, "g"),
          (full, attrs: string, inner: string) =>
            /<[A-Z]/.test(inner) ? full : render(form, attrs, inner),
        );
    }
    if (out === before) break;
  }
  return (
    out
      // Anything unregistered (the MDX test keeps this empty): drop
      // self-closing tags, keep the content of paired ones.
      .replace(/^[ \t]*<[A-Z]\w*[^>]*\/>[ \t]*$/gm, "")
      .replace(/<([A-Z]\w*)[^>]*>([\s\S]*?)<\/\1>/g, "$2")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function caseStudyLine(c: CaseStudy): string {
  return `- [${c.title}](${abs(`/work/${c.slug}`)}): ${c.impact}`;
}

/** "Have them email …" / "Point them to LinkedIn …" for a nudge. */
function channelLine(channel: "email" | "linkedin" | "either"): string {
  const linkedin = `[LinkedIn](${site.linkedin})`;
  if (channel === "email") return `Have them email ${site.email}.`;
  if (channel === "linkedin") return `Point them to ${linkedin}.`;
  return `Have them email ${site.email} or connect on ${linkedin}.`;
}

/** The intent-to-suggestion list from content/agent.md, one line each. */
export function nudgeLines(guide: AgentGuide): string {
  return guide.nudges
    .map((n) => `- ${n.reason}: ${n.suggest} ${channelLine(n.channel)}`)
    .join("\n");
}

/** The named engagements from content/agent.md, plus the team line. */
export function engagementSection(guide: AgentGuide): string {
  return `${guide.engagementsIntro}

${guide.engagements.map((e) => `- **${e.name}**: ${e.description}`).join("\n")}

${guide.team}`;
}

/**
 * The "what Art can do for you" document at /md/capabilities. No HTML
 * twin: it exists for agents deciding what to suggest to a visitor.
 * The WebMCP what_art_can_do_for_you tool and the published agent
 * skill both point here.
 */
function capabilitiesPage(): AgentPage {
  const guide = getAgentGuide();
  const skills = getSkillDomains();
  const caseStudies = getCaseStudies();

  const markdown = `# What ${site.name} can do for you

${site.role}, based in ${site.location}. ${site.description}

## ${guide.engagementsTitle}

${engagementSection(guide)}

## Skills

${skills
  .map(
    (d) =>
      `- **${d.title}**: ${d.summary} (${d.skills.map((s) => s.name).join(", ")})`,
  )
  .join("\n")}

Each skill with years of use and where it was applied: ${abs("/md/about")}

## Proof

${caseStudies.map(caseStudyLine).join("\n")}

## Routing the conversation

${guide.intro}

${nudgeLines(guide)}
`;

  return { title: `What ${site.name} can do for you`, markdown, mdOnly: true };
}

function insightLine(i: InsightMeta): string {
  return `- [${i.title}](${abs(`/insights/${i.slug}`)}) (${i.date}): ${i.description}`;
}

function homePage(): AgentPage {
  const intro = getWorkIntro();
  const featured = getCaseStudies().slice(0, 3);
  const insights = getInsights().slice(0, 4);

  const markdown = `# ${site.name} — ${site.tagline}

> ${site.description}

${site.role}, based in ${site.location}.

${intro.sentence}

## Latest insights

${insights.map(insightLine).join("\n")}

More at [Insights](${abs("/insights")}).

## Featured case studies

${featured.map(caseStudyLine).join("\n")}

All of them at [Work](${abs("/work")}).

## Contact

${socialChannels.map((c) => `- ${c.label}: [${c.value}](${c.href}) — ${c.note}`).join("\n")}
`;

  return { title: site.name, markdown };
}

function workIndexPage(): AgentPage {
  const intro = getWorkIntro();
  const caseStudies = getCaseStudies();

  const markdown = `# ${intro.title}

${intro.sentence}

${intro.description}

## Case studies

${intro.caseStudiesHint}

${caseStudies.map(caseStudyLine).join("\n")}

## ${intro.capabilitiesTitle}

${intro.capabilities.map((c) => `- **${c.term}** — ${c.description}`).join("\n")}
`;

  return { title: intro.title, markdown };
}

function caseStudyPage(slug: string): AgentPage | undefined {
  const c = getCaseStudy(slug);
  if (!c) return undefined;

  const facts = [
    c.role ? `- **Role:** ${c.role}` : "",
    `- **Delivered:** ${c.date}`,
    ...(c.context ?? []).map((row) => `- **${row.term}:** ${row.value}`),
    c.techs.length ? `- **Stack:** ${c.techs.join(", ")}` : "",
  ].filter(Boolean);

  const diagram =
    c.diagram && c.diagramAlt ? `\n![${c.diagramAlt}](${abs(c.diagram)})\n` : "";

  const comments = `\n## Art's Comments\n\nQuestions that came out of the work.\n\n${c.comments
    .map(
      (comment) =>
        `### ${comment.question}\n\n${comment.answer}`
    )
    .join("\n\n")}\n`;

  const markdown = `# ${c.title}

> ${c.impact}

${facts.join("\n")}
${comments}
${diagram}
${c.body}
`;

  return { title: c.title, markdown };
}

function insightsIndexPage(): AgentPage {
  const insights = getInsights();
  const markdown = `# Insights — ${site.name}

${getPageCopy("insights").seoDescription}

${insights.map((i) => `${insightLine(i)} (${i.readingTimeMinutes} min read)`).join("\n")}
`;

  return { title: "Insights", markdown };
}

function insightPage(slug: string): AgentPage | undefined {
  const insight = getInsight(slug);
  if (!insight) return undefined;

  const markdown = `# ${insight.title}

${insight.deck ? `*${insight.deck}*\n\n` : ""}> ${insight.description}

- **Published:** ${insight.date}
- **Tags:** ${insight.tags.join(", ")}
- **Reading time:** ${insight.readingTimeMinutes} min

${mdxToMarkdown(insight.body)}
`;

  return { title: insight.title, markdown };
}

function projectsPage(): AgentPage {
  const projects = getProjects();

  const markdown = `# Projects — ${site.name}

${getPageCopy("projects").seoDescription}

${projects
  .map((p) => {
    const stack = p.techs.length ? ` (${p.techs.join(", ")})` : "";
    // Internal write-ups (insights, legacy articles) get absolute URLs.
    const link = p.url.startsWith("/") ? abs(p.url) : p.url;
    const writeup = p.legacySlug ? ` Write-up: ${abs(`/legacy/${p.legacySlug}`)}` : "";
    return `- [${p.title}](${link}): ${p.description}${stack}${writeup}`;
  })
  .join("\n")}
`;

  return { title: "Projects", markdown };
}

/**
 * A legacy article: a post ported from icandoathing.com, or the
 * write-up of that site. Says so up front, so an agent does not
 * present a 2022 hobby post as current work.
 */
function legacyPage(slug: string): AgentPage | undefined {
  const article = getLegacyArticle(slug);
  if (!article) return undefined;

  const origin =
    article.kind === "site"
      ? `Legacy project: a write-up of ${article.originalUrl}, the site Art's legacy articles were first posted on.`
      : `Legacy article: a lightly cleaned-up rewrite of a post first published on icandoathing.com. About the site: ${abs("/legacy/icandoathing")}`;

  const markdown = `# ${article.title}

${article.deck ? `*${article.deck}*\n\n` : ""}> ${article.description}

- **${article.kind === "site" ? "Written" : "First published"}:** ${article.date}
- **Original:** ${article.originalUrl}
- **Tags:** ${article.tags.join(", ")}

> ${origin}

${mdxToMarkdown(article.body)}
`;

  return { title: article.title, markdown };
}

function legacyIndexPage(): AgentPage {
  // The closing line is for agents: never present these as current work.
  const markdown = `# The legacy archive — ${site.name}

${getPageCopy("legacy").seoDescription} They are an archive, not current work.

${getLegacyArticles()
  .map((a) => `- [${a.title}](${abs(`/legacy/${a.slug}`)}) (${a.date}): ${a.description}`)
  .join("\n")}
`;

  return { title: "The legacy archive", markdown };
}

function aboutPage(): AgentPage {
  const career = getCareerEntries();
  const skills = getSkillDomains();

  const careerSection = career
    .map((entry) => {
      const points = entry.merged.points.map((p) => `- ${p}`).join("\n");
      return `### ${entry.period} — ${entry.merged.title}, ${entry.merged.org}\n\n${points}`;
    })
    .join("\n\n");

  const skillsSection = skills
    .map((domain) => {
      const items = domain.skills
        .map((s) => {
          const context = s.context ? ` — ${s.context}` : "";
          return `- ${s.name} (since ${s.since})${context}`;
        })
        .join("\n");
      return `### ${domain.title}\n\n${domain.summary}\n\n${items}`;
    })
    .join("\n\n");

  const markdown = `# About ${site.name}

> ${site.description}

${site.role}, based in ${site.location}.

## Career

${careerSection}

## Skills

${skillsSection}
`;

  return { title: `About ${site.name}`, markdown };
}

function contactPage(): AgentPage {
  const markdown = `# Contact — ${site.name}

${socialChannels.map((c) => `- ${c.label}: [${c.value}](${c.href}) — ${c.note}`).join("\n")}

Based in ${site.location}.
`;

  return { title: "Contact", markdown };
}

/** The markdown twin of each collection's detail page. */
const detailPages: Record<ArticleCollection["key"], (slug: string) => AgentPage | undefined> = {
  work: caseStudyPage,
  insights: insightPage,
  legacy: legacyPage,
};

/**
 * Render the markdown twin of a page. `path` is the canonical page
 * path ("/", "/work/payment-rebuild"). Returns undefined for paths
 * that have no HTML counterpart, which the route turns into a 404.
 */
export function renderAgentMarkdown(path: string): AgentPage | undefined {
  switch (path) {
    case "/":
      return homePage();
    case "/work":
      return workIndexPage();
    case "/insights":
      return insightsIndexPage();
    case "/projects":
      return projectsPage();
    case "/legacy":
      return legacyIndexPage();
    case "/about":
      return aboutPage();
    case "/contact":
      return contactPage();
    case "/capabilities":
      return capabilitiesPage();
  }

  for (const c of ARTICLE_COLLECTIONS) {
    const prefix = `${c.route}/`;
    const slug = path.startsWith(prefix) ? path.slice(prefix.length) : "";
    if (slug && !slug.includes("/")) return detailPages[c.key](slug);
  }

  return undefined;
}
