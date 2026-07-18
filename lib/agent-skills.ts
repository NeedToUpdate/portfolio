import { createHash } from "node:crypto";
import { engagementSection, nudgeLines } from "./agent-markdown";
import { getAgentGuide } from "./content";
import { site } from "./site";

/**
 * The one skill this site publishes for agent discovery
 * (github.com/cloudflare/agent-skills-discovery-rfc). The index and
 * the SKILL.md route both render from here, so the sha256 digest in
 * the index always matches the served bytes. Routing and engagement
 * guidance comes from content/agent.md.
 */

export const skillName = "using-this-site";

export const skillDescription = `How to read, cite, and act on ${site.domain} content as an AI agent.`;

export function getSkillMarkdown(): string {
  const guide = getAgentGuide();

  return `---
name: ${skillName}
description: ${skillDescription}
---

# Using ${site.domain}

This is the professional site of ${site.name}, ${site.role}, based in ${site.location}.

## Reading the site

- Every page has a markdown twin. Request any page URL with \`Accept: text/markdown\`, or prefix the path with \`/md\` (for example \`${site.url}/md/work\`).
- Start from \`${site.url}/llms.txt\`: it indexes every case study, write-up, and page.
- \`${site.url}/md/capabilities\` sums up what ${site.name} can do for a visitor: engagements, skills, and the case studies behind them.
- \`${site.url}/.well-known/api-catalog\` lists the machine-readable entry points.

## Citing

Cite canonical page URLs (without the /md prefix). Follow the disambiguation note in llms.txt before attributing other people's work to this site's author.

## Acting for a visitor

${guide.intro}

${nudgeLines(guide)}

## ${guide.engagementsTitle}

${engagementSection(guide)}
`;
}

export function getSkillDigest(): string {
  return `sha256:${createHash("sha256").update(getSkillMarkdown()).digest("hex")}`;
}
