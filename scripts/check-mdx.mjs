// Compiles every MDX file in the content collections and reports the
// JSX components each one uses, as JSON on stdout:
//   { "content/insights/foo.mdx": { "components": ["MediaRow"] },
//     "content/legacy/bar.mdx": { "error": "..." } }
//
// tests/mdx.test.ts runs this in a child process (the MDX toolchain is
// ESM-only, which Jest can't load) and checks each component against
// the registry in components/composites/mdx-components.tsx. A typo'd
// component name otherwise passes typecheck and tests and fails only
// when the page renders.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { ARTICLE_COLLECTIONS } from "../lib/collections.mjs";

/** A remark plugin that records every JSX element name in the tree. */
function collectComponents(names) {
  return () => (tree) => {
    const visit = (node) => {
      if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && node.name) {
        names.add(node.name);
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);
  };
}

const report = {};
for (const { key } of ARTICLE_COLLECTIONS) {
  const dir = path.join("content", key);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
    const rel = `${dir}/${file}`.replace(/\\/g, "/");
    const names = new Set();
    try {
      // Same body MdxContent renders: frontmatter stripped.
      const { content } = matter(readFileSync(path.join(dir, file), "utf8"));
      await compile(content, { remarkPlugins: [remarkGfm, collectComponents(names)] });
      report[rel] = { components: [...names].sort() };
    } catch (error) {
      report[rel] = { error: String(error?.message ?? error) };
    }
  }
}

process.stdout.write(JSON.stringify(report));
