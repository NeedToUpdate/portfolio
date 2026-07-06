/**
 * Career timeline data. Each entry has up to three views:
 * - merged: the single-timeline version, mixing tech and leadership
 * - tech: the engineering side of the same period
 * - lead: the teaching and leadership side of the same period
 * Entries with only one side appear on one stream when split.
 */

export interface StreamView {
  title: string;
  org: string;
  points: string[];
}

export interface CareerEntry {
  id: string;
  period: string;
  merged: StreamView;
  tech?: StreamView;
  lead?: StreamView;
}

export const careerEntries: CareerEntry[] = [
  {
    id: "director",
    period: "2025 — now",
    merged: {
      title: "Engineering Director",
      org: "Fourth Dimension",
      points: [
        "Run an internal innovation lab and a mentorship-driven delivery model.",
        "Directed a billing portal migration serving more than a million customers, with no disruption.",
        "Sit on the enterprise design council; stay hands-on in reviews and proofs of concept.",
      ],
    },
    tech: {
      title: "Hands-on Architect",
      org: "Fourth Dimension",
      points: [
        "Directed the phased migration of a legacy billing portal to Next.js.",
        "Defined future-state integration architecture and cloud migration paths.",
        "Built proofs of concept and led complex delivery support.",
      ],
    },
    lead: {
      title: "Engineering Director",
      org: "Fourth Dimension",
      points: [
        "Built an innovation lab focused on developing juniors into AI-native seniors.",
        "Voting member of the enterprise design council.",
        "Partner with senior leadership on modernization strategy.",
      ],
    },
  },
  {
    id: "principal",
    period: "2025",
    merged: {
      title: "Principal Architect & Engineering Lead",
      org: "Fourth Dimension",
      points: [
        "Championed secure GenAI adoption for a major insurance client through AWS Bedrock.",
        "Led distributed Canada and India engineering teams.",
        "Replaced week-long manual deployments with automated CI/CD.",
      ],
    },
    tech: {
      title: "Principal Architect",
      org: "Fourth Dimension",
      points: [
        "Defined GenAI governance and delivery patterns on AWS Bedrock.",
        "Delivered IFRS 17 reporting pipelines across AWS data platforms.",
        "Automated deployments with Azure DevOps CI/CD.",
      ],
    },
    lead: {
      title: "Engineering Lead",
      org: "Fourth Dimension",
      points: [
        "Set technical direction for distributed teams across two continents.",
        "Converted executive priorities into roadmaps and delivery milestones.",
        "Mentored senior engineers and unblocked delivery risks early.",
      ],
    },
  },
  {
    id: "lead",
    period: "2024",
    merged: {
      title: "Engineering Lead",
      org: "Fourth Dimension",
      points: [
        "Led architecture and delivery of a governed AWS analytics platform.",
        "Built major parts of it myself: ETL, validation flows, Tableau integration.",
        "Established a coaching culture through pairing and shadow leadership.",
      ],
    },
    tech: {
      title: "Platform Engineer",
      org: "Fourth Dimension",
      points: [
        "Built a governed analytics platform on Glue and Redshift.",
        "Applied medallion data patterns across ingestion, validation, and gold marts.",
        "Wired Tableau to the warehouse for self-service reporting.",
      ],
    },
    lead: {
      title: "Team Coach",
      org: "Fourth Dimension",
      points: [
        "Ran pair programming, architecture walkthroughs, and knowledge sharing.",
        "Shaped reporting and analytics strategy with senior business leadership.",
      ],
    },
  },
  {
    id: "senior",
    period: "2023 — 2024",
    merged: {
      title: "Senior Full Stack Lead Engineer",
      org: "Fourth Dimension",
      points: [
        "Delivered AWS-native enrollment pipelines supporting more than a million members.",
        "Expanded from implementation into solution design and stakeholder advisory.",
      ],
    },
    tech: {
      title: "Senior Full Stack Engineer",
      org: "Fourth Dimension",
      points: [
        "Built serverless APIs and React frontends served through CloudFront.",
        "Delivered enrollment pipelines for Extended Health and PPR insurance.",
      ],
    },
    lead: {
      title: "Mentor & Advisor",
      org: "Fourth Dimension",
      points: [
        "Trained and mentored developers across project teams.",
        "Helped secure engagements by aligning solutions with client goals.",
      ],
    },
  },
  {
    id: "eon",
    period: "2022 — 2023",
    merged: {
      title: "Senior Full Stack Lead Engineer",
      org: "Eon Media",
      points: [
        "Took the keystone product from unfinished to soft-launch-ready.",
        "Advised the CEO on product direction and technical recovery.",
      ],
    },
    tech: {
      title: "Senior Full Stack Engineer",
      org: "Eon Media",
      points: [
        "Stabilized a React, MongoDB, and Elasticsearch product.",
        "Built a recovery plan for performance, scalability, and data issues.",
      ],
    },
    lead: {
      title: "Technical Advisor",
      org: "Eon Media",
      points: [
        "Earned a direct advisory line to the CEO within the first month.",
        "Trained junior and intern developers to write maintainable code.",
      ],
    },
  },
  {
    id: "georgia",
    period: "2018 — 2022",
    merged: {
      title: "Head Teacher & Lead Developer",
      org: "Georgia English",
      points: [
        "Taught, trained new teachers, and built the software the school ran on.",
        "Python tools, web applications, and learning games for real classrooms.",
      ],
    },
    tech: {
      title: "Lead Developer",
      org: "Georgia English",
      points: [
        "Built Python tools, web apps, and games that ran daily operations.",
        "Shipped software for non-technical users and supported it in person.",
      ],
    },
    lead: {
      title: "Head Teacher",
      org: "Georgia English",
      points: [
        "Trained new teachers and ran onboarding.",
        "Designed curriculum and improved consistency across staff.",
      ],
    },
  },
  {
    id: "freelance",
    period: "2014 — 2020",
    merged: {
      title: "Freelance Developer",
      org: "Independent",
      points: [
        "Built websites for friends, family, and small businesses.",
        "Learned to ship for real people with real deadlines.",
      ],
    },
    tech: {
      title: "Freelance Developer",
      org: "Independent",
      points: [
        "Built and maintained sites end to end: design, code, hosting, support.",
      ],
    },
  },
  {
    id: "degree",
    period: "McMaster University",
    merged: {
      title: "B.Sc. Psychology, Neuroscience and Behaviour",
      org: "McMaster University",
      points: [
        "How people learn, decide, and communicate. I use it every day.",
      ],
    },
    lead: {
      title: "B.Sc. Psychology, Neuroscience and Behaviour",
      org: "McMaster University",
      points: [
        "The foundation of the teaching and leadership stream.",
      ],
    },
  },
];
