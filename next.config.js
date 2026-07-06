const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server build, deployed to Lambda behind CloudFront.
  output: "standalone",
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
          "script-src 'self' 'unsafe-inline'",
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
          source: "/_next/static/(.*)",
          headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
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
