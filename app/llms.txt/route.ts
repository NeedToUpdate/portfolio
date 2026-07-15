import { getCaseStudies, getInsights } from "@/lib/content";
import { site } from "@/lib/site";

/**
 * llms.txt (llmstxt.org): a plain-text index for AI agents and assistants,
 * the same role sitemap.ts plays for search crawlers. Built from the same
 * content sources as the sitemap so it can't drift from the real pages.
 */
export async function GET() {
  const caseStudies = getCaseStudies();
  const insights = getInsights();

  const workLines = caseStudies
    .map((c) => `- [${c.title}](${site.url}/work/${c.slug}): ${c.impact}`)
    .join("\n");

  const insightLines = insights
    .map((i) => `- [${i.title}](${site.url}/insights/${i.slug}): ${i.description}`)
    .join("\n");

  const body = `# ${site.name}

> ${site.description}

${site.role}, based in ${site.location}. Enterprise modernization, data platforms, and AI adoption, plus the teams that deliver them.

## Work

${workLines}

## Insights

${insightLines}

## Pages

- [About](${site.url}/about): Background, career history, and skills.
- [Projects](${site.url}/projects): Personal projects, past and present.
- [Contact](${site.url}/contact): Email, LinkedIn, and GitHub.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
