import posthog from "posthog-js";

// Next.js file convention: runs client-side before the app becomes
// interactive. No provider or manual pageview wiring needed — the
// pinned defaults bundle handles SPA route-change pageviews and
// autocapture on its own.
//
// api_host resolves through the CloudFront /relay proxy
// (serverless-resources/cloudfront.yml), not PostHog directly, so
// requests are same-origin and don't get dropped by ad/tracker
// blockers the way a direct posthog.com call would.
if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    // Surveys are unused; skip loading surveys.js (~32KB) at runtime.
    disable_surveys: true,
  });
}
