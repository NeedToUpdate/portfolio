import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { mdxComponents } from "@/components/composites/mdx-components";
import { markdownForms, mdxToMarkdown } from "@/lib/agent-markdown";
import { videoCompanions } from "@/components/composites/VideoFigure";

/** Compiles every MDX file in a child process; see scripts/check-mdx.mjs. */
function compileAll(): Record<string, { components?: string[]; error?: string }> {
  const out = execFileSync(process.execPath, ["scripts/check-mdx.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return JSON.parse(out);
}

const registered = new Set(Object.keys(mdxComponents));

describe("MDX content", () => {
  const report = compileAll();

  it("finds the MDX files", () => {
    expect(Object.keys(report).length).toBeGreaterThan(10);
  });

  it("compiles every file", () => {
    const failures = Object.entries(report)
      .filter(([, result]) => result.error)
      .map(([file, result]) => `${file}: ${result.error}`);
    expect(failures).toEqual([]);
  });

  it("uses only registered components", () => {
    const unknown = Object.entries(report).flatMap(([file, result]) =>
      (result.components ?? [])
        // Lowercase names are plain HTML elements.
        .filter((name) => /^[A-Z]/.test(name) && !registered.has(name))
        .map((name) => `${file}: <${name}>`),
    );
    expect(unknown).toEqual([]);
  });

  it("ships an MP4 fallback and a poster beside every clip", () => {
    const missing: string[] = [];
    for (const file of Object.keys(report)) {
      const source = fs.readFileSync(file, "utf8");
      for (const [, src] of source.matchAll(/<VideoFigure[\s\S]*?src="([^"]+)"/g)) {
        const { mp4, poster } = videoCompanions(src);
        for (const asset of [src, mp4, poster]) {
          if (!fs.existsSync(path.join("public", asset))) missing.push(`${file}: ${asset}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("markdown twins of MDX components", () => {
  it("gives every registered component a markdown form", () => {
    const withForms = Object.keys(markdownForms).sort();
    const components = [...registered].filter((name) => name !== "a").sort();
    expect(withForms).toEqual(components);
  });

  it("keeps a standalone image with its caption", () => {
    expect(
      mdxToMarkdown('<MediaRow\n  src="/images/a.webp"\n  alt="A chart"\n  caption="It went up."\n/>'),
    ).toBe("![A chart](https://artnikitin.dev/images/a.webp)\n\n*It went up.*");
  });

  it("converts nested components innermost first", () => {
    const md = mdxToMarkdown('<Note>\nSee this.\n\n<MediaRow src="/images/a.webp" alt="A">\nText.\n</MediaRow>\n</Note>');
    expect(md).toContain("> ![A](https://artnikitin.dev/images/a.webp)");
    expect(md).not.toMatch(/<[A-Z]/);
  });

  it("replaces a described demo with its description and drops the rest", () => {
    expect(mdxToMarkdown('<TeamGame description="Five devs work tickets." />')).toBe(
      "> Interactive figure: Five devs work tickets.",
    );
    expect(mdxToMarkdown("Before.\n\n<StarfieldDemo />\n\nAfter.")).toBe("Before.\n\nAfter.");
  });
});
