const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server build, deployed to Lambda behind CloudFront.
  output: "standalone",
  // Dev-only: lets phones/other devices on the Tailscale mesh load the
  // dev server and hot-reload over it. No effect on production builds.
  // Add more addresses here as new devices need to test against dev.
  allowedDevOrigins: ["100.111.95.96", "desktop-1ef2r3n.neon-gamma.ts.net"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "fra1.digitaloceanspaces.com" },
      { protocol: "https", hostname: "icandoathing.fra1.cdn.digitaloceanspaces.com" },
      { protocol: "https", hostname: "media.licdn.com" },
    ],
    // Local assets are small pre-optimized webp files; skip sharp in Lambda.
    unoptimized: true,
  },

  // ISR cache lives in S3. The Lambda filesystem is read-only and
  // instances do not share memory, so the default cache cannot work there.
  // The handler no-ops outside Lambda. Path is posix-joined for the
  // standalone build on Windows.
  cacheHandler: path.posix.join(process.cwd().replace(/\\/g, "/"), "lib/isr-cache-handler.js"),
  cacheMaxMemorySize: 0,

  async redirects() {
    return [
      // The /now page became /contact; keep old links working.
      { source: "/now", destination: "/contact", permanent: true },
    ];
  },

  async headers() {
    const scriptSources = ["'self'", "'unsafe-inline'"];

    // React's development tooling uses eval to reconstruct cross-environment
    // call stacks. Keep that capability out of the production CSP.
    if (process.env.NODE_ENV !== "production") {
      scriptSources.push("'unsafe-eval'");
    }

    const securityHeaders = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          `script-src ${scriptSources.join(" ")}`,
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self' data:",
          "img-src 'self' https: data: blob:",
          "connect-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-ancestors 'self'",
        ].join("; "),
      },
    ];

    const rules = [{ source: "/(.*)", headers: securityHeaders }];

    // Cache rules are for the CDN and hashed production assets only.
    // In dev, Turbopack chunk names are stable; marking them immutable
    // makes browsers cache stale code across edits.
    if (process.env.NODE_ENV === "production") {
      rules.push(
        {
          // Cache pages at the CDN, allow serving stale while refreshing.
          source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
            },
          ],
        },
        {
          source: "/images/(.*)",
          headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
        }
      );
    }

    return rules;
  },
};

module.exports = nextConfig;
