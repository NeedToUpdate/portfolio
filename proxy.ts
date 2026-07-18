import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Origin proxy: basic auth for the dev environment, plus the
 * agent-facing content negotiation and discovery headers.
 */

/**
 * Pages that have a markdown twin under /md. Keep in sync with the
 * MarkdownNegotiationFunction in serverless-resources/cloudfront.yml,
 * which applies the same rewrite at the CloudFront edge so each
 * variant caches under its own URL and the Accept header never has
 * to join the cache key.
 */
const AGENT_PAGE_PATTERN =
  /^\/(?:(?:work|insights)\/[^/]+|work|insights|projects|about|contact)?$/;

/**
 * Discovery headers for AI agents (RFC 8288). Every page response
 * advertises the API catalog, the llms.txt guide, and its own
 * markdown twin, so an agent landing anywhere finds the machine
 * surface without guessing well-known paths.
 */
function discoveryLinkHeader(pathname: string): string {
  const mdPath = pathname === "/" ? "/md" : `/md${pathname}`;
  return [
    '</.well-known/api-catalog>; rel="api-catalog"',
    '</llms.txt>; rel="describedby"; type="text/plain"',
    `<${mdPath}>; rel="alternate"; type="text/markdown"`,
  ].join(", ");
}

function isAuthorized(
  request: NextRequest,
  username: string,
  password: string,
): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) return false;
  const [user, pwd] = atob(encoded).split(":");
  return user === username && pwd === password;
}

export default function proxy(request: NextRequest) {
  // Basic auth gate for the dev environment. Active only when
  // BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD are set on the
  // Lambda. Prod sets neither, so every request passes through.
  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;
  const authActive = Boolean(username && password);

  if (authActive && !isAuthorized(request, username!, password!)) {
    return new Response("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Dev Site"',
      },
    });
  }

  const { pathname } = request.nextUrl;
  const isAgentPage = AGENT_PAGE_PATTERN.test(pathname);

  // Markdown for Agents: a page request that accepts text/markdown is
  // served the page's markdown twin instead of HTML. In production the
  // CloudFront function has already rewritten the URI before it gets
  // here; this covers dev, next start, and direct-to-origin requests.
  const wantsMarkdown = (request.headers.get("accept") ?? "").includes(
    "text/markdown",
  );

  let response: NextResponse;
  if (isAgentPage && wantsMarkdown) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/md" : `/md${pathname}`;
    response = NextResponse.rewrite(url);
  } else {
    response = NextResponse.next();
    if (isAgentPage) {
      // HTML responses only: the markdown twin sets its own Link
      // (rel="canonical"), which a set() here would clobber.
      response.headers.set("Link", discoveryLinkHeader(pathname));
    }
  }

  if (authActive) {
    // Keep the protected environment out of search indexes.
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  // Public assets are also fetched internally by Next's image optimizer.
  // Keeping /images behind this gate would turn that internal fetch into a
  // 401 response without an image Content-Type.
  matcher: "/((?!_next/static|_next/image|images/|favicon.ico|site.webmanifest).*)",
};
