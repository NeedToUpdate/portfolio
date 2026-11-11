// @ts-check

/**
 * The site's page registry: every content collection that owns detail
 * pages, and every fixed page. The content loaders, sitemap, llms.txt,
 * markdown mirror, proxy.ts, image build, CloudFront invalidator, and
 * IndexNow all read it, so a new collection starts as one entry here.
 *
 * Plain .mjs with JSDoc types, so the build scripts can import it
 * without a compiler and the TypeScript side still gets checked types.
 */

/**
 * @typedef {object} ArticleCollection
 * @property {"work" | "insights" | "legacy"} key Folder under content/, and the loaders' name for it.
 * @property {string} route URL of the index page; detail pages live at route/<slug>.
 * @property {string} imageField Frontmatter field holding the entry's preview image. The image build fingerprints it and renders a social-card JPEG twin.
 * @property {string[]} listedOn Other pages that list this collection's entries. A change to an entry refreshes them and their markdown twins.
 * @property {string[]} agentDocs Agent-only markdown documents built from this collection.
 * @property {"monthly" | "yearly"} indexChangeFrequency How often the index page changes, for the sitemap.
 * @property {number} indexPriority Sitemap priority of the index page.
 * @property {number} detailPriority Sitemap priority of each detail page.
 */

/** @type {readonly ArticleCollection[]} */
export const ARTICLE_COLLECTIONS = [
  {
    key: "work",
    route: "/work",
    imageField: "diagram",
    listedOn: ["/"],
    agentDocs: ["/md/capabilities"],
    indexChangeFrequency: "monthly",
    indexPriority: 0.7,
    detailPriority: 0.8,
  },
  {
    key: "insights",
    route: "/insights",
    imageField: "previewImage",
    listedOn: ["/"],
    agentDocs: [],
    indexChangeFrequency: "monthly",
    indexPriority: 0.7,
    detailPriority: 0.8,
  },
  // Legacy articles are reachable from project cards only, so the
  // sitemap is how crawlers find them. Lower priority than current work.
  {
    key: "legacy",
    route: "/legacy",
    imageField: "screenshot",
    listedOn: [],
    agentDocs: [],
    indexChangeFrequency: "yearly",
    indexPriority: 0.4,
    detailPriority: 0.4,
  },
];

/** Fixed pages that belong to no collection. */
export const STANDALONE_PAGES = ["/projects", "/about", "/contact"];

/** Every fixed page with an HTML view and a markdown twin. */
export const FIXED_PAGES = [
  "/",
  ...ARTICLE_COLLECTIONS.map((c) => c.route),
  ...STANDALONE_PAGES,
];

/** Markdown documents with no HTML page (lib/agent-markdown.ts). */
export const AGENT_ONLY_DOCS = ["/md/capabilities"];

/** The markdown twin of a page path. */
export function mdTwin(/** @type {string} */ path) {
  return path === "/" ? "/md" : `/md${path}`;
}

/** Looks a collection up by key; throws on an unknown key. */
export function collection(/** @type {ArticleCollection["key"]} */ key) {
  const found = ARTICLE_COLLECTIONS.find((c) => c.key === key);
  if (!found) throw new Error(`Unknown collection: ${key}`);
  return found;
}

/**
 * Regex source matching every page that has a markdown twin: the fixed
 * pages and each collection's detail pages. proxy.ts compiles it; the
 * CloudFront function in serverless-resources/cloudfront.yml carries a
 * literal copy, which tests/collections.test.ts holds to this string.
 */
export function agentPagePatternSource() {
  const prefixes = ARTICLE_COLLECTIONS.map((c) => c.route.slice(1)).join("|");
  const pages = FIXED_PAGES.filter((p) => p !== "/")
    .map((p) => p.slice(1))
    .join("|");
  return `^\\/(?:(?:${prefixes})\\/[^\\/]+|${pages})?$`;
}
