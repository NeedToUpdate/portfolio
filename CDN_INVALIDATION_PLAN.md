# CloudFront invalidation strategy

`scripts/invalidate-cloudfront.mjs` runs after every deploy and decides
which paths need purging from the edge cache. The full logic lives in that
file; this doc is the "why."

## The problem it solves

Every push to `main`/`dev` redeploys the whole site, but almost every
individual change only affects a handful of URLs. CloudFront charges
nothing for the first 1,000 invalidation paths a month and it's still
cheap after that, but a wildcard `/*` on every deploy means every visitor
gets a cache miss on every page for a while after every commit — slower
TTFB for no reason, and it defeats the point of caching at all.

## How it decides

1. A git tag (`cf-invalidated-<stage>`) marks the last commit that was
   successfully invalidated for that stage. The script diffs `TAG..HEAD`
   with `git diff --name-status` to get every changed file plus whether it
   was added, modified, or deleted.
2. Each file is classified into a bucket (see `classify()`): a specific
   route, "affects every text page," "affects one content slug," "an
   image that needs busting," or a few others. Each bucket knows exactly
   which URLs it implies.
3. The buckets are unioned into a path set and invalidated in one batch.
   The tag then moves to `HEAD`.
4. If a changed file doesn't match any known bucket, the script gives up
   and falls back to a full invalidation (see `fullPathList()`) rather
   than guessing wrong and serving something stale. This is meant to be
   the rare case — most of the codebase is mapped explicitly.

## Rules worth knowing about

- **Content-hashed assets never need invalidation.** Case-study
  diagrams/preview images get a sha256-hashed twin (`lib/images.ts`,
  `scripts/build-image-assets.mjs`); editing the source produces a new
  filename, so the old cached copy is simply irrelevant and the new one
  is a guaranteed cache miss. Same idea for hand-versioned static assets
  like `favicon-v2.ico` — bump the suffix, get a new URL, nothing to
  purge. Only images referenced by their literal, unhashed filename
  (`portrait.webp`, thumbnails inline in MDX, etc.) actually need a path
  invalidated when they change.
- **A brand new route needs no invalidation of itself.** If nothing was
  ever cached at a URL, there's nothing stale to purge there — the first
  request is a cache miss regardless. Adding `app/foo/page.tsx` only
  invalidates `/sitemap.xml` (so crawlers see the new URL); adding a new
  insight or case study only touches the listing page, the homepage, and
  the sitemap, not the new slug's own page. Modifying or deleting an
  *existing* route still invalidates that route's path, since real
  visitors may have it cached.
- **Shared layout/UI code invalidates every text route, but never
  images.** `app/layout.tsx`, `lib/site.ts`, `lib/seo.ts`, `Nav`,
  `Footer`, `PageShell`, everything under `components/ui/`, etc. render
  on (or feed metadata to) every page, so a change there is treated as
  "every text route changed." It still excludes `/images/*` and
  `/_next/image*` — those bytes didn't move.
- **Ordinary static routes are derived from the file path, not a
  hardcoded list.** `app/about/page.tsx` → `/about` is computed instead
  of maintained by hand, so adding an ordinary new page doesn't require
  touching this script. Dynamic segments (`[slug]`) are the one case
  that needs explicit handling, since the actual URLs have to be
  enumerated from content — see the `template-insight`/`template-work`
  buckets for the `[slug]/page.tsx` templates themselves.

## Skipping a deploy's invalidation

Give the PR a title containing `[skip-invalidate]`. The script still
computes and logs the paths it would have invalidated, but doesn't call
CloudFront and doesn't move the tag — those paths just roll into whatever
invalidation runs next.
