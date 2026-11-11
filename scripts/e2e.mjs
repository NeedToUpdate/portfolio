// End-to-end check of a deployed stage, run by the deploy workflow after
// the deploy and the CloudFront invalidation, before IndexNow.
//
// Usage: node scripts/e2e.mjs <host>     e.g. dev.artnikitin.dev
// Dev sits behind basic auth: set BASIC_AUTH_USERNAME and
// BASIC_AUTH_PASSWORD. Prod needs neither.
//
// Three requests through CloudFront to the live Lambda: the home page,
// the first insight the sitemap lists, and the home page's markdown twin
// (the Accept-header negotiation the CloudFront function performs).

const host = process.argv[2];
if (!host) {
  console.error("Usage: node scripts/e2e.mjs <host>");
  process.exit(1);
}

const base = `https://${host}`;
const { BASIC_AUTH_USERNAME: user, BASIC_AUTH_PASSWORD: pass } = process.env;
const auth = user && pass ? { Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}` } : {};

/** Fetches a path, retrying while a cold Lambda warms up. */
async function get(path, accept = "text/html") {
  let last;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(`${base}${path}`, { headers: { ...auth, Accept: accept } });
      if (res.ok) return { type: res.headers.get("content-type") ?? "", body: await res.text() };
      last = `HTTP ${res.status}`;
    } catch (err) {
      last = err.message;
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`${path} (${accept}): ${last}`);
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const home = await get("/");
  expect(home.type.includes("text/html"), `/ served ${home.type}, not HTML`);
  expect(/<title>[^<]+<\/title>/.test(home.body), "/ has no <title>");
  console.log("ok  /");

  const sitemap = await get("/sitemap.xml", "application/xml");
  const insight = sitemap.body.match(/<loc>https?:\/\/[^/<]+(\/insights\/[^<]+)<\/loc>/)?.[1];
  expect(insight, "the sitemap lists no insight");
  const article = await get(insight);
  expect(/<h1[\s>]/.test(article.body), `${insight} has no <h1>`);
  console.log(`ok  ${insight}`);

  const twin = await get("/", "text/markdown");
  expect(twin.type.includes("text/markdown"), `/ as markdown served ${twin.type}`);
  console.log("ok  / as markdown");
}

main().catch((err) => {
  console.error(`End-to-end check failed: ${err.message}`);
  process.exit(1);
});
