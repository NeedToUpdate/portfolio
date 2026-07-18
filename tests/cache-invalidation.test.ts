import {
  classifyChange,
  discoverRoots,
  fullPathList,
  fullTextPathList,
  mdMirrorPathList,
  optimizerVariantPaths,
  parseNameStatus,
  staticRoutePath,
  listSlugs,
} from "@/scripts/cache-invalidation/map.mjs";
import { reachableFrom, invertGraph } from "@/scripts/cache-invalidation/graph.mjs";

/** A minimal context; code files are pre-mapped where a test needs them. */
function makeContext(fileToPaths = new Map<string, Set<string>>()) {
  return {
    insightSlugs: ["ziggy", "groundnet"],
    workSlugs: ["payment_rebuild", "tableau"],
    fileToPaths,
  };
}

describe("content classification", () => {
  const ctx = makeContext();

  it("maps an edited insight to its slug, the indexes, their twins, and llms.txt", () => {
    const entry = classifyChange("content/insights/ziggy.mdx", "M", ctx);
    expect(entry.bucket).toBe("insight");
    expect(entry.paths).toEqual([
      "/insights/ziggy",
      "/md/insights/ziggy",
      "/insights",
      "/md/insights",
      "/",
      "/md",
      "/sitemap.xml",
      "/llms.txt",
    ]);
  });

  it("skips the never-cached slug paths for a brand-new insight", () => {
    const entry = classifyChange("content/insights/brand-new.mdx", "A", ctx);
    expect(entry.paths).toEqual([
      "/insights",
      "/md/insights",
      "/",
      "/md",
      "/sitemap.xml",
      "/llms.txt",
    ]);
  });

  it("maps an edited case study to its slug, the indexes, their twins, and llms.txt", () => {
    const entry = classifyChange("content/work/payment_rebuild.md", "M", ctx);
    expect(entry.bucket).toBe("work");
    expect(entry.paths).toEqual([
      "/work/payment_rebuild",
      "/md/work/payment_rebuild",
      "/work",
      "/md/work",
      "/",
      "/md",
      "/md/capabilities",
      "/sitemap.xml",
      "/llms.txt",
    ]);
  });

  it("maps projects, career, skills, and home content to their pages and twins", () => {
    expect(classifyChange("content/projects/ziggy.md", "M", ctx).paths).toEqual([
      "/projects",
      "/md/projects",
      "/sitemap.xml",
    ]);
    expect(classifyChange("content/career/senior.md", "M", ctx).paths).toEqual([
      "/about",
      "/md/about",
    ]);
    expect(classifyChange("content/skills/cloud.md", "M", ctx).paths).toEqual([
      "/about",
      "/md/about",
      "/md/capabilities",
    ]);
    // home.md also feeds the /work intro through getWorkIntro().
    expect(classifyChange("content/home.md", "M", ctx).paths).toEqual([
      "/",
      "/md",
      "/about",
      "/work",
      "/md/work",
    ]);
  });

  it("maps the agent guide to every agent-facing surface", () => {
    const entry = classifyChange("content/agent.md", "M", ctx);
    expect(entry.bucket).toBe("agent-guide");
    expect(entry.paths).toEqual([
      "/llms.txt",
      "/md/capabilities",
      "/.well-known/agent-skills/index.json",
      "/.well-known/agent-skills/using-this-site/SKILL.md",
    ]);
  });

  it("warns on an unmapped content collection instead of purging", () => {
    const entry = classifyChange("content/experiments/thing.md", "A", ctx);
    expect(entry.paths).toEqual([]);
    expect(entry.warn).toBe(true);
  });
});

describe("image and asset classification", () => {
  const ctx = makeContext();

  it("invalidates a changed image's direct path and only its own optimizer variants", () => {
    const entry = classifyChange("public/images/portrait.webp", "M", ctx);
    expect(entry.bucket).toBe("image-direct");
    expect(entry.paths).toEqual([
      "/images/portrait.webp",
      "/_next/image?url=%2Fimages%2Fportrait.webp*",
      "/_next/image?url=/images/portrait.webp*",
    ]);
    // Never the global wildcard — other images stay cached.
    expect(entry.paths).not.toContain("/_next/image*");
    expect(entry.paths).not.toContain("/images/*");
  });

  it("treats a content-hashed twin as self-busting", () => {
    const entry = classifyChange("public/images/ziggy_diagram.bda65046.webp", "A", ctx);
    expect(entry.bucket).toBe("image-hashed");
    expect(entry.paths).toEqual([]);
  });

  it("treats a hand-versioned asset as self-busting", () => {
    expect(classifyChange("public/favicon-v2.svg", "M", ctx).paths).toEqual([]);
  });

  it("invalidates a plain public asset at its own path", () => {
    expect(classifyChange("public/favicon.ico", "M", ctx).paths).toEqual(["/favicon.ico"]);
  });

  it("scopes optimizer variants to the encoded source path", () => {
    expect(optimizerVariantPaths("/icons/react-icon.png")).toEqual([
      "/_next/image?url=%2Ficons%2Freact-icon.png*",
      "/_next/image?url=/icons/react-icon.png*",
    ]);
  });
});

describe("source code classification", () => {
  it("resolves a component through the import graph to its routes", () => {
    const ctx = makeContext(
      new Map([["components/composites/CareerTimeline.tsx", new Set(["/about"])]])
    );
    const entry = classifyChange("components/composites/CareerTimeline.tsx", "M", ctx);
    expect(entry.bucket).toBe("code");
    expect(entry.paths).toEqual(["/about"]);
  });

  it("warns on a source file no route reaches instead of purging", () => {
    const entry = classifyChange("lib/orphan-helper.ts", "M", makeContext());
    expect(entry.bucket).toBe("code-unreached");
    expect(entry.paths).toEqual([]);
    expect(entry.warn).toBe(true);
  });

  it("does not warn about a deleted source file", () => {
    const entry = classifyChange("components/ui/OldButton.tsx", "D", makeContext());
    expect(entry.paths).toEqual([]);
    expect(entry.warn).toBeFalsy();
  });

  it("refreshes only the sitemap for a brand-new page route", () => {
    const entry = classifyChange("app/lab/page.tsx", "A", makeContext());
    expect(entry.bucket).toBe("new-route");
    expect(entry.paths).toEqual(["/sitemap.xml"]);
  });

  it("purges nothing for a brand-new non-page route", () => {
    expect(classifyChange("app/api/ping/route.ts", "A", makeContext()).paths).toEqual([]);
  });

  it("evicts the URL of a deleted route", () => {
    const entry = classifyChange("app/lab/page.tsx", "D", makeContext());
    expect(entry.bucket).toBe("deleted-route");
    expect(entry.paths).toEqual(["/lab", "/sitemap.xml"]);
  });

  it("evicts /robots.txt when the old metadata route is deleted", () => {
    // Its replacement (app/robots.txt/route.ts) arrives as a brand-new
    // route and purges nothing, but the URL itself was already cached.
    const entry = classifyChange("app/robots.ts", "D", makeContext());
    expect(entry.bucket).toBe("deleted-route");
    expect(entry.paths).toEqual(["/robots.txt"]);
  });

  it("refreshes all text routes for broad build config, never images", () => {
    const ctx = makeContext();
    for (const file of [
      "next.config.js",
      "tailwind.config.js",
      "postcss.config.js",
      "package.json",
      "package-lock.json",
      "lib/isr-cache-handler.js",
      "instrumentation-client.ts",
    ]) {
      const entry = classifyChange(file, "M", ctx);
      expect(entry.bucket).toBe("broad-config");
      expect(entry.paths).toEqual(fullTextPathList(ctx));
      expect(entry.paths).not.toContain("/_next/image*");
      expect(entry.paths).not.toContain("/images/*");
    }
  });
});

describe("unknown and tooling files", () => {
  const ctx = makeContext();

  it("invalidates nothing for repo tooling", () => {
    for (const file of [
      ".github/workflows/deploy-prod.yml",
      "scripts/invalidate-cloudfront.mjs",
      "scripts/cache-invalidation/map.mjs",
      "tests/cache-invalidation.test.ts",
      "serverless.yml",
      "serverless.prod.yml",
      "serverless-resources/cloudfront.yml",
      "jest.config.js",
      "README.md",
    ]) {
      const entry = classifyChange(file, "M", ctx);
      expect(entry.paths).toEqual([]);
      expect(entry.warn).toBeFalsy();
    }
  });

  it("warns on a completely unknown file but still purges nothing", () => {
    const entry = classifyChange("mystery/new-thing.xyz", "A", ctx);
    expect(entry.bucket).toBe("unknown");
    expect(entry.paths).toEqual([]);
    expect(entry.warn).toBe(true);
  });
});

describe("import graph reachability", () => {
  //   app/page.tsx       -> Heading, CaseStudyListItem
  //   app/about/page.tsx -> Heading
  //   app/layout.tsx     -> Nav, globals.css
  //   Nav                -> Heading
  //   CaseStudyListItem  -> Heading
  //   lib/orphan.ts      -> imported by nobody
  const adjacency: Record<string, string[]> = {
    "app/page.tsx": ["components/ui/Heading.tsx", "components/composites/CaseStudyListItem.tsx"],
    "app/about/page.tsx": ["components/ui/Heading.tsx"],
    "app/layout.tsx": ["components/composites/Nav.tsx", "styles/globals.css"],
    "components/composites/Nav.tsx": ["components/ui/Heading.tsx"],
    "components/composites/CaseStudyListItem.tsx": ["components/ui/Heading.tsx"],
    "components/ui/Heading.tsx": [],
    "styles/globals.css": [],
    "lib/orphan.ts": [],
  };

  it("includes the start file and everything it transitively imports", () => {
    expect(reachableFrom(adjacency, "app/page.tsx")).toEqual(
      new Set([
        "app/page.tsx",
        "components/ui/Heading.tsx",
        "components/composites/CaseStudyListItem.tsx",
      ])
    );
  });

  it("terminates on cycles", () => {
    expect(reachableFrom({ a: ["b"], b: ["a"] }, "a")).toEqual(new Set(["a", "b"]));
  });

  describe("invertGraph", () => {
    const roots = [
      { file: "app/page.tsx", paths: ["/"] },
      { file: "app/about/page.tsx", paths: ["/about"] },
      { file: "app/layout.tsx", paths: ["/", "/about"] },
    ];
    const fileToPaths = invertGraph(adjacency, roots);

    it("maps a shared component to every route that renders it", () => {
      expect([...fileToPaths.get("components/ui/Heading.tsx")!].sort()).toEqual(["/", "/about"]);
    });

    it("maps a single-page component to just that page", () => {
      expect([...fileToPaths.get("components/composites/CaseStudyListItem.tsx")!]).toEqual(["/"]);
    });

    it("maps a layout-only dependency to all pages the layout wraps", () => {
      expect([...fileToPaths.get("styles/globals.css")!].sort()).toEqual(["/", "/about"]);
    });

    it("leaves an orphan file absent, meaning no purge", () => {
      expect(fileToPaths.has("lib/orphan.ts")).toBe(false);
    });
  });
});

describe("route topology against the real app directory", () => {
  const ctx = makeContext();
  const roots = discoverRoots(ctx);
  const byFile = new Map(roots.map((r) => [r.file, r.paths]));

  it("derives static route paths from route files", () => {
    expect(staticRoutePath("app/page.tsx")).toBe("/");
    expect(staticRoutePath("app/about/page.tsx")).toBe("/about");
    expect(staticRoutePath("app/llms.txt/route.ts")).toBe("/llms.txt");
    expect(staticRoutePath("app/insights/[slug]/page.tsx")).toBeNull();
    expect(staticRoutePath("components/ui/Heading.tsx")).toBeNull();
  });

  it("finds every current page and metadata route as a root", () => {
    expect(byFile.get("app/page.tsx")).toEqual(["/"]);
    expect(byFile.get("app/about/page.tsx")).toEqual(["/about"]);
    expect(byFile.get("app/llms.txt/route.ts")).toEqual(["/llms.txt"]);
    expect(byFile.get("app/sitemap.ts")).toEqual(["/sitemap.xml"]);
    expect(byFile.get("app/robots.txt/route.ts")).toEqual(["/robots.txt"]);
    expect(byFile.get("app/opengraph-image.tsx")).toEqual(["/opengraph-image"]);
    expect(byFile.get("app/.well-known/api-catalog/route.ts")).toEqual([
      "/.well-known/api-catalog",
    ]);
  });

  it("expands the markdown mirror to every twin plus /md/capabilities", () => {
    const paths = byFile.get("app/md/[[...slug]]/route.ts")!;
    expect(paths).toEqual(mdMirrorPathList(ctx));
    expect(paths).toContain("/md");
    expect(paths).toContain("/md/capabilities");
    expect(paths).toContain("/md/insights/ziggy");
    expect(paths).toContain("/md/work/tableau");
  });

  it("expands dynamic templates with the content slugs", () => {
    expect(byFile.get("app/insights/[slug]/page.tsx")).toEqual([
      "/insights/ziggy",
      "/insights/groundnet",
      "/insights",
      "/",
      "/sitemap.xml",
    ]);
    expect(byFile.get("app/work/[slug]/page.tsx")).toContain("/work/payment_rebuild");
  });

  it("treats the root layout and not-found as owning every text route", () => {
    expect(byFile.get("app/layout.tsx")).toEqual(fullTextPathList(ctx));
    expect(byFile.get("app/not-found.tsx")).toEqual(fullTextPathList(ctx));
  });
});

describe("path lists and diff parsing", () => {
  const ctx = makeContext();

  it("keeps image wildcards out of the text path list", () => {
    const text = fullTextPathList(ctx);
    expect(text).toContain("/insights/ziggy");
    expect(text).toContain("/work/tableau");
    expect(text).toContain("/llms.txt");
    expect(text).toContain("/md/insights/ziggy");
    expect(text).toContain("/md/work/tableau");
    expect(text).toContain("/.well-known/api-catalog");
    expect(text).not.toContain("/images/*");
    expect(text).not.toContain("/_next/image*");
  });

  it("includes image wildcards only in the bootstrap list", () => {
    expect(fullPathList(ctx)).toEqual([...fullTextPathList(ctx), "/images/*", "/_next/image*"]);
  });

  it("expands renames into a delete plus an add", () => {
    expect(
      parseNameStatus(
        "M\tcontent/home.md\nR100\tcontent/insights/old.mdx\tcontent/insights/new.mdx\nD\tpublic/favicon.ico"
      )
    ).toEqual([
      { file: "content/home.md", status: "M" },
      { file: "content/insights/old.mdx", status: "D" },
      { file: "content/insights/new.mdx", status: "A" },
      { file: "public/favicon.ico", status: "D" },
    ]);
  });

  it("reads real content slugs off disk", () => {
    const insights = listSlugs("content/insights");
    expect(insights).toContain("how-this-site-works");
    expect(insights.every((slug) => !/\.mdx?$/.test(slug))).toBe(true);
  });
});
