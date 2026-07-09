import {
  getCareerEntries,
  getCaseStudies,
  getCaseStudy,
  getInsight,
  getInsights,
  getProjectsByEra,
  getSkillDomains,
  getWorkIntro,
} from "@/lib/content";

describe("content loaders", () => {
  it("loads case studies sorted by priority", () => {
    const studies = getCaseStudies();
    expect(studies.length).toBeGreaterThan(0);
    const priorities = studies.map((s) => s.priority);
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
  });

  it("finds a case study by slug", () => {
    const first = getCaseStudies()[0];
    expect(getCaseStudy(first.slug)?.title).toBe(first.title);
  });

  it("splits projects by era", () => {
    const preAi = getProjectsByEra("pre-ai");
    const postAi = getProjectsByEra("post-ai");
    expect(preAi.length).toBeGreaterThan(0);
    expect(postAi.length).toBeGreaterThan(0);
    expect(preAi.every((p) => p.era === "pre-ai")).toBe(true);
  });

  it("loads insights with computed reading time", () => {
    const insights = getInsights();
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });

  it("loads a full insight body by slug", () => {
    const insight = getInsight("how-this-site-works");
    expect(insight).toBeDefined();
    expect(insight?.body).toContain("Lambda");
  });

  it("loads the work intro with capabilities", () => {
    const intro = getWorkIntro();
    expect(intro.title).toBeTruthy();
    expect(intro.capabilities.length).toBeGreaterThan(0);
  });

  it("loads career entries sorted newest first, with a merged view each", () => {
    const entries = getCareerEntries();
    expect(entries.length).toBeGreaterThan(0);
    const orders = entries.map((e) => e.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(entries.every((e) => e.merged.title && e.merged.points.length > 0)).toBe(true);
  });

  it("loads skill domains with a nebula shape and at least one skill each", () => {
    const domains = getSkillDomains();
    expect(domains.length).toBeGreaterThan(0);
    expect(domains.every((d) => d.nebulaShape && d.skills.length > 0)).toBe(true);
  });
});
