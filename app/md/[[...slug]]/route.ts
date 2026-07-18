import { renderAgentMarkdown } from "@/lib/agent-markdown";
import { site } from "@/lib/site";

/**
 * Markdown mirror of every page, for AI agents. Reachable two ways:
 * directly at /md/<path>, or by requesting the canonical page with
 * "Accept: text/markdown" (proxy.ts and the CloudFront viewer-request
 * function rewrite those requests here).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const path = `/${(slug ?? []).join("/")}`;
  const page = renderAgentMarkdown(path);

  if (!page) {
    return new Response(`No page at ${path}. Start from ${site.url}/md.`, {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const headers = new Headers({
    "Content-Type": "text/markdown; charset=utf-8",
    // Rough estimate (~4 characters per token), per the Markdown for
    // Agents convention, so agents can budget context before reading.
    "x-markdown-tokens": String(Math.ceil(page.markdown.length / 4)),
    // The canonical URL serves HTML or markdown depending on Accept.
    Vary: "Accept",
  });
  // Documents without an HTML twin have no canonical URL to point at.
  if (!page.mdOnly) {
    headers.set("Link", `<${site.url}${path === "/" ? "" : path}>; rel="canonical"`);
  }

  return new Response(page.markdown, { headers });
}
