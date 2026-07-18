import {
  getCareerEntries,
  getCaseStudies,
  getCaseStudy,
  getInsight,
  getInsights,
  getProjects,
  getProjectsByEra,
  getRelatedContent,
  getSkillDomains,
  getWorkIntro,
} from "@/lib/content";
import { articleSchema, caseStudySchema, personSchema, websiteSchema } from "@/lib/seo";

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

  it("loads a role and a context scorecard for every case study", () => {
    const studies = getCaseStudies();
    for (const study of studies) {
      expect(study.role).toBeTruthy();
      expect(study.context?.length).toBeGreaterThanOrEqual(2);
      expect(study.context?.every((row) => row.term && row.value)).toBe(true);
    }
  });

  it("gives every case study a result section for the exhibit split", () => {
    // The detail page slots the architecture exhibit before this
    // heading; a study without it would render the exhibit last.
    for (const study of getCaseStudies()) {
      expect(study.body).toContain("## The result");
    }
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

  it("resolves every manually selected related-content path", () => {
    const entries = [...getInsights(), ...getCaseStudies()];
    const linked = entries.filter((entry) => entry.related?.length);
    expect(linked.length).toBeGreaterThan(0);
    for (const entry of linked) {
      expect(getRelatedContent(entry.related)).toHaveLength(entry.related!.length);
    }
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

  it("resolves every project's insightSlug to a real insight", () => {
    const insightSlugs = new Set(getInsights().map((i) => i.slug));
    const linked = getProjects().filter((p) => p.insightSlug);
    expect(linked.length).toBeGreaterThan(0);
    expect(linked.every((p) => insightSlugs.has(p.insightSlug!))).toBe(true);
  });
});

describe("structured identity", () => {
  it("reuses one stable Person id across page schemas", () => {
    const personId = personSchema()["@id"];
    expect(personId).toBe("https://artnikitin.dev/#person");
    expect(websiteSchema().author["@id"]).toBe(personId);
    expect(articleSchema(getInsights()[0]).author["@id"]).toBe(personId);
    expect(caseStudySchema(getCaseStudies()[0]).author["@id"]).toBe(personId);
  });
});
