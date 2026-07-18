const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cross-origin origins allowed to reach the dev server.
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  reactStrictMode: true,
  // Inline CSS into the HTML so the stylesheet stops blocking first
  // render (App Router native; optimizeCss/beasties is Pages-only).
  experimental: {
    inlineCss: true,
  },
  // Self-contained server build, deployed to Lambda behind CloudFront.
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "fra1.digitaloceanspaces.com" },
      {
        protocol: "https",
        hostname: "icandoathing.fra1.cdn.digitaloceanspaces.com",
      },
      { protocol: "https", hostname: "media.licdn.com" },
    ],
    // Optimized variants are generated once by the Lambda and cached at the
    // CloudFront edge by their source URL, width, quality, and output format.
    minimumCacheTTL: 31536000,
  },

  // ISR cache lives in S3. The Lambda filesystem is read-only and
  // instances do not share memory, so the default cache cannot work there.
  // The handler no-ops outside Lambda. Path is posix-joined for the
  // standalone build on Windows.
  cacheHandler: path.posix.join(
    process.cwd().replace(/\\/g, "/"),
    "lib/isr-cache-handler.js",
  ),
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
          // Icon files are excluded here and cached explicitly below.
          source:
            "/((?!api|_next/static|_next/image|favicon|apple-touch-icon).*)",
          headers: [
            {
              key: "Cache-Control",
              value:
                "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
            },
          ],
        },
        {
          source: "/images/(.*)",
          headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
        },
        {
          // Versioned icon files carry a -v2 suffix that bumps on redesign,
          // so they are safe to cache immutably. The unversioned favicon.ico
          // is intentionally left out — it must stay updatable.
          source:
            "/:icon(favicon-v2\\.svg|favicon-v2\\.ico|favicon-96x96-v2\\.png|apple-touch-icon-v2\\.png)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
      );
    }

    return rules;
  },
};

module.exports = nextConfig;
