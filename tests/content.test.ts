import {
  getCaseStudies,
  getCaseStudy,
  getInsight,
  getInsights,
  getProjectsByEra,
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
    const insight = getInsight("why-one-plus-one-equals-two");
    expect(insight).toBeDefined();
    expect(insight?.body).toContain("Peano");
  });

  it("loads the work intro with capabilities", () => {
    const intro = getWorkIntro();
    expect(intro.title).toBeTruthy();
    expect(intro.capabilities.length).toBeGreaterThan(0);
  });
});
