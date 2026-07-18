import {
  getAgentGuide,
  getCareerEntries,
  getCaseStudies,
  getCaseStudy,
  getInsight,
  getInsights,
  getProjects,
  getSkillDomains,
  getWorkIntro,
} from "./content";
import { site, socialChannels } from "./site";
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

/**
 * Insights are MDX with interactive components. Agents get plain
 * markdown: images keep their alt text and caption, notes become
 * blockquotes, and demo components (which only make sense running
 * in a browser) are dropped.
 */
export function mdxToMarkdown(body: string): string {
  return (
    body
      // <FloatImage … /> carries the image and its caption as props.
      .replace(/<FloatImage([\s\S]*?)\/>/g, (_, attrs: string) => {
        const src = attrs.match(/src="([^"]*)"/)?.[1];
        const alt = attrs.match(/alt="([^"]*)"/)?.[1] ?? "";
        const caption = attrs.match(/caption="([^"]*)"/)?.[1];
        if (!src) return "";
        const image = `![${alt}](${abs(src)})`;
        return caption ? `${image}\n\n*${caption}*` : image;
      })
      // <Note> panels read as asides; blockquotes carry that in markdown.
      .replace(/<Note>([\s\S]*?)<\/Note>/g, (_, inner: string) =>
        inner
          .trim()
          .split("\n")
          .map((line) => `> ${line.trim()}`.trimEnd())
          .join("\n"),
      )
      // Remaining self-closing components are interactive demos.
      .replace(/^[ \t]*<[A-Z]\w*[^>]*\/>[ \t]*$/gm, "")
      // Any other paired component: keep the content, drop the wrapper.
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

  const markdown = `# ${c.title}

> ${c.impact}

${facts.join("\n")}
${diagram}
${c.body}
`;

  return { title: c.title, markdown };
}

function insightsIndexPage(): AgentPage {
  const insights = getInsights();
  const markdown = `# Insights — ${site.name}

Write-ups on systems, decisions, and delivery.

${insights.map((i) => `${insightLine(i)} (${i.readingTimeMinutes} min read)`).join("\n")}
`;

  return { title: "Insights", markdown };
}

function insightPage(slug: string): AgentPage | undefined {
  const insight = getInsight(slug);
  if (!insight) return undefined;

  const markdown = `# ${insight.title}

> ${insight.description}

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

Personal projects, past and present.

${projects
  .map((p) => {
    const stack = p.techs.length ? ` (${p.techs.join(", ")})` : "";
    return `- [${p.title}](${p.url}): ${p.description}${stack}`;
  })
  .join("\n")}
`;

  return { title: "Projects", markdown };
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
    case "/about":
      return aboutPage();
    case "/contact":
      return contactPage();
    case "/capabilities":
      return capabilitiesPage();
  }

  const caseStudy = path.match(/^\/work\/([^/]+)$/);
  if (caseStudy) return caseStudyPage(caseStudy[1]);

  const insight = path.match(/^\/insights\/([^/]+)$/);
  if (insight) return insightPage(insight[1]);

  return undefined;
}
