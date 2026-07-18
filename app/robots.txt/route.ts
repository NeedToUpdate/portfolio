import { site } from "@/lib/site";

/**
 * robots.txt as a route handler rather than Next's metadata route:
 * the metadata API cannot emit Content-Signal lines. Same output as
 * before, built from lib/site, plus the content signals.
 *
 * Content Signals (contentsignals.org) declare how automated systems
 * may use the content. This site exists to be found and understood,
 * so all three signals are opt-in: search (indexing), ai-input
 * (answering questions from this content), and ai-train (training).
 */
export function GET() {
  const body = `User-Agent: *
Allow: /
Content-Signal: search=yes, ai-input=yes, ai-train=yes

Sitemap: ${site.url}/sitemap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
