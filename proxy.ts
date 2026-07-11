import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Basic auth gate for the dev environment.
 * Active only when BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD are set
 * on the Lambda. Prod sets neither, so every request passes through.
 */
export default function proxy(request: NextRequest) {
  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const [user, pwd] = atob(encoded).split(":");
      if (user === username && pwd === password) {
        const response = NextResponse.next();
        // Keep the protected environment out of search indexes.
        response.headers.set("X-Robots-Tag", "noindex, nofollow");
        return response;
      }
    }
  }

  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Dev Site"',
    },
  });
}

export const config = {
  // Public assets are also fetched internally by Next's image optimizer.
  // Keeping /images behind this gate would turn that internal fetch into a
  // 401 response without an image Content-Type.
  matcher: "/((?!_next/static|_next/image|images/|favicon.ico|site.webmanifest).*)",
};
