import { site } from "@/lib/site";

/**
 * API catalog (RFC 9727), served as an RFC 9264 linkset. This site's
 * machine interface is content rather than compute, so the catalog
 * points agents at the markdown mirror, the llms.txt guide, and the
 * sitemap instead of an OpenAPI service. Relations are honest: no
 * service-desc is listed because there is no API schema to describe.
 */
export function GET() {
  const catalog = {
    linkset: [
      {
        anchor: `${site.url}/`,
        "service-doc": [
          {
            href: `${site.url}/llms.txt`,
            type: "text/plain",
            title: "Site guide for AI agents (llms.txt)",
          },
        ],
        alternate: [
          {
            href: `${site.url}/md`,
            type: "text/markdown",
            title:
              "Markdown mirror of every page; also served from canonical URLs via Accept: text/markdown",
          },
        ],
        describedby: [
          {
            href: `${site.url}/sitemap.xml`,
            type: "application/xml",
            title: "Sitemap",
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: { "Content-Type": "application/linkset+json; charset=utf-8" },
  });
}
