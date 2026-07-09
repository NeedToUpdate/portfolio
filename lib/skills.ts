/**
 * Skill domains. One source of truth for every skills rendering on
 * the site (currently the span chart on /about).
 *
 * Domains mirror the resume's technical-experience categories,
 * trimmed to the strongest ~6 per domain so the chart scans fast.
 * "since" years: anchored to the v1 site's years-of-experience data
 * where it existed; everything else is a best estimate against the
 * career timeline (freelance 2014-2020, Georgia English 2018-2022,
 * Eon Media 2022-2023, Fourth Dimension 2023-now). Correct any year
 * here and every rendering follows.
 *
 * Names must render without truncation in the chart's label column;
 * keep them short and put the detail in "context" (the tooltip line).
 */

export interface Skill {
  name: string;
  /** First year used in real work. */
  since: number;
  /** Where it was used, for tooltips. */
  context?: string;
}

export interface SkillDomain {
  id: string;
  title: string;
  /** One sentence: what I do with this domain. TONE.md applies. */
  summary: string;
  skills: Skill[];
}

export const skillDomains: SkillDomain[] = [
  {
    id: "ai",
    title: "AI & GenAI",
    summary: "I put agent workflows, RAG, and LLM operations into production, with the governance to match.",
    skills: [
      { name: "AWS Bedrock", since: 2025, context: "Secure GenAI rollout for a major insurer" },
      { name: "Claude Code", since: 2025, context: "AI-first delivery and mentorship practice" },
      { name: "LangChain", since: 2023 },
      { name: "MCP", since: 2025, context: "Tool integrations for AI agents" },
      { name: "RAG", since: 2023, context: "Embeddings and vector search included" },
      { name: "LLMOps", since: 2024 },
    ],
  },
  {
    id: "cloud",
    title: "Cloud & DevOps",
    summary: "I run AWS-first platforms and automate the path to production.",
    skills: [
      { name: "AWS", since: 2020, context: "Lambda, S3, CloudFront, and the rest" },
      { name: "Azure", since: 2024 },
      { name: "Kubernetes", since: 2022, context: "Runs the homelab" },
      { name: "Docker", since: 2020 },
      { name: "Serverless", since: 2021 },
      { name: "Azure DevOps", since: 2025, context: "CI/CD replacing long manual deployments" },
    ],
  },
  {
    id: "data",
    title: "Data & Analytics",
    summary: "I build warehouses and reporting that finance teams sign off on.",
    skills: [
      { name: "Redshift", since: 2021 },
      { name: "Glue", since: 2024, context: "Governed AWS analytics platform, medallion patterns" },
      { name: "Tableau", since: 2022 },
      { name: "PostgreSQL", since: 2020 },
      { name: "Elasticsearch", since: 2022, context: "Search on the Eon Media platform" },
      { name: "pandas", since: 2020 },
    ],
  },
  {
    id: "software",
    title: "Software Engineering",
    summary: "I still ship code every week.",
    skills: [
      { name: "TypeScript", since: 2015 },
      { name: "Python", since: 2015 },
      { name: "React", since: 2016 },
      { name: "Next.js", since: 2018 },
      { name: "Node.js", since: 2016 },
      { name: "API design", since: 2016, context: "REST, BFF patterns, microservices" },
    ],
  },
  {
    id: "architecture",
    title: "Architecture & Security",
    summary: "I design the enterprise picture: integration, identity, and the governance around it.",
    skills: [
      {
        name: "Enterprise architecture",
        since: 2024,
        context: "Voting member, enterprise design council",
      },
      { name: "Integration design", since: 2024, context: "Legacy on-prem toward cloud-native" },
      { name: "Identity & CIAM", since: 2024 },
      { name: "System design", since: 2018 },
      { name: "Security", since: 2018 },
    ],
  },
];
