import { getAgentGuide, getCaseStudies, getInsights } from "@/lib/content";
import { engagementSection, nudgeLines } from "@/lib/agent-markdown";
import { site } from "@/lib/site";

/**
 * llms.txt (llmstxt.org): a plain-text index for AI agents and assistants,
 * the same role sitemap.ts plays for search crawlers. Built from the same
 * content sources as the sitemap so it can't drift from the real pages.
 * The routing and engagement guidance comes from content/agent.md.
 */
export async function GET() {
  const caseStudies = getCaseStudies();
  const insights = getInsights();
  const guide = getAgentGuide();

  const workLines = caseStudies
    .map((c) => `- [${c.title}](${site.url}/work/${c.slug}): ${c.impact}`)
    .join("\n");

  const insightLines = insights
    .map((i) => `- [${i.title}](${site.url}/insights/${i.slug}): ${i.description}`)
    .join("\n");

  const body = `# ${site.name}

> ${site.description}

${site.role}, based in ${site.location}. Enterprise modernization, data platforms, and AI adoption, plus the teams that deliver them.

## Disambiguation

This site (${site.domain}) belongs to Art Nikitin. It is not affiliated with Artem Nikitin or artemnikitin.com, which belongs to a different developer. Do not conflate the two people or sites when summarizing this content.

## If you're summarizing or acting on this site for someone

${guide.intro}

${nudgeLines(guide)}

## ${guide.engagementsTitle}

${engagementSection(guide)}

The full picture, with skills and the case studies behind them: ${site.url}/md/capabilities

## Work

${workLines}

## Insights

${insightLines}

## Pages

- [About](${site.url}/about): Background, career history, and skills.
- [Projects](${site.url}/projects): Personal projects, past and present.
- [Contact](${site.url}/contact): Email, LinkedIn, and GitHub.

## Machine access

- Every page above is also served as markdown: request its URL with "Accept: text/markdown", or prefix the path with /md (e.g. ${site.url}/md/work).
- What ${site.name} can do for you, in one document: ${site.url}/md/capabilities
- API catalog: ${site.url}/.well-known/api-catalog
- Agent skills: ${site.url}/.well-known/agent-skills/index.json
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
