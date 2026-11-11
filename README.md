# artnikitin.dev

Personal portfolio and blog. Next.js App Router, MDX with interactive components, deployed to AWS Lambda behind CloudFront.

## Running it

```bash
npm run dev          # local development at localhost:3000 (builds image assets first)
npm run lint         # ESLint (flat config in eslint.config.mjs)
npm run typecheck    # tsc --noEmit
npm test             # Jest: content, MDX, SEO, cache invalidation, interactive figures
npm run images       # fingerprint preview images and render their social cards
npm run deploy:dev   # build and deploy to dev.artnikitin.dev (basic auth)
npm run deploy:prod  # build and deploy to artnikitin.dev
```

CI does the same: every pull request runs lint, typecheck, tests, and a build; merging to `dev` deploys the dev environment, merging to `main` deploys prod. Both deploys run through one reusable workflow, `.github/workflows/deploy.yml`.

Every environment variable the code reads is listed in `.env.example`. None are needed for `npm run dev`.

### When the dev server serves stale state

Turbopack occasionally holds on to old state. Two cases seen so far: a newly added route 404s every page until its file is saved again, and a stylesheet edit doesn't show. Re-save the file; if that doesn't clear it, restart `npm run dev`.

## Architecture

- **Next.js 16, App Router, `output: standalone`.** The build produces a self-contained Node server.
- **Lambda + Lambda Web Adapter.** The standalone server runs unmodified inside a Lambda function.
- **CloudFront.** Default origin is the Lambda function URL. `/_next/static/*` and `/images/*` come from S3.
- **ISR cache in S3.** `lib/isr-cache-handler.js` stores the cache under `_cache/` in the assets bucket.
- **Basic auth on dev.** `proxy.ts` enforces it when `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` are set. Prod sets neither.
- **Markdown for agents.** Every page has a markdown twin under `/md` (`lib/agent-markdown.ts`), served when a request accepts `text/markdown`. `proxy.ts` rewrites at the origin; a CloudFront function does the same at the edge, and a test keeps its pattern in step with the registry.
- **Targeted cache invalidation.** After a deploy, `scripts/invalidate-cloudfront.mjs` maps the changed files to the URLs they affect through the import graph, and the prod deploy pings IndexNow with the same list.

## Content

Everything renders from files in `content/`. No CMS. Frontmatter is validated by the schemas in `lib/content-schema.ts`: a missing field, a misspelled key, or an unknown nebula shape fails the build with the file name.

| Directory           | What it is                                               | Format                 |
| ------------------- | -------------------------------------------------------- | ---------------------- |
| `content/work/`     | Professional case studies                                | Markdown + frontmatter |
| `content/insights/` | Insights                                                 | MDX + frontmatter      |
| `content/projects/` | Personal projects, split by `era` (`pre-ai` / `post-ai`), sorted by a unique `order` | Markdown + frontmatter |
| `content/legacy/`   | Legacy articles ported from icandoathing.com (`/legacy/<slug>`). Linked from project cards via a project's `url` or `legacySlug` | MDX + frontmatter      |
| `content/pages/`    | Heading copy for the projects, insights, and legacy index pages | Frontmatter only |
| `content/career/`, `content/skills/` | The about page's timeline and skills chart | Frontmatter only |
| `content/home.md`, `content/agent.md` | Work-page copy, and guidance for AI agents | Frontmatter only |

### Collections

`lib/collections.mjs` lists every collection with its own detail pages (`work`, `insights`, `legacy`): route, preview-image field, sitemap priority, and which other pages list it. The loaders, sitemap, markdown twins, proxy, image build, CloudFront invalidation, and IndexNow all read it. A new collection starts as one entry there, plus its schema, loader, and `app/<route>/[slug]/page.tsx`.

### Images

Preview images (`previewImage`, `diagram`, `screenshot`) are served under a content hash, so editing one changes its URL. `npm run images` writes the hashed copies and a JPEG social card beside each source; it runs before `dev` and `build`. The hashed files are build output and are not committed.

### The legacy archive

`/legacy` lists the old icandoathing.com write-ups. Nothing in the navigation links to it. The way in is an easter egg: on `/projects`, the word "pre-AI" in the archive heading is a link (`components/composites/PreAiDoor.tsx`). It looks like plain text until a hover lingers. Legacy articles are also reachable from their project cards and the sitemap.

A legacy article carries two dates. `built` (`YYYY-MM`) is the month the project was made: the archive shows it and sorts by it. `date` is the day the post first went up on icandoathing.com: the origin card and the structured data use it. Without `built`, the post's month stands in.

## MDX components

Insights and legacy articles can use these without importing them (`components/composites/mdx-components.tsx`). Every component must also declare its markdown form in `lib/agent-markdown.ts`; the type and a test enforce it. A test compiles every MDX file and fails on any component name the registry doesn't know.

| Component | Use |
| --------- | --- |
| `MediaRow` | An image. With children, the text sits beside it (`side`, `size`, `wrap` to float long text around it). Without children, a standalone figure: `side="none"` for full width, `left`/`right` to float it. Width and height are read from the file. A click enlarges the image over the page (`ImageLightbox`). |
| `VideoFigure` | A clip the reader starts. Give it the `.webm`; an `.mp4` fallback and a `.poster.webp` frame must sit beside it under the same name. |
| `ProjectLink` | The "go and use it" bar: `mode` external, internal, or offline. `focus` and `zoom` frame a detail of the screenshot in the 64px thumbnail. Offline with `slides`, the bar's button opens it into a slideshow, each screenshot named in a corner tag: `[src, name]` or `[src, name, group]`. |
| `NowWithAI` | An update section whose heading carries a "Now with AI" tag, with an optional image and a link to the newer write-up. |
| `Note`, `Card` | An aside, and a boxed block. |
| `ReleaseTrain`, `TeamGame`, `HumanReviewLab`, and the other demos | Interactive figures. Give each a `description`: it stands in for the figure in the markdown twin. |

```mdx
<MediaRow src="/images/legacy/server-case/03.webp" alt="..." side="right" size="third">
  The text that belongs to the image.
</MediaRow>

<VideoFigure src="/images/legacy/breadboard-cpu/04.webm" label="..." caption="..." />
```

## Deploy prerequisites

One-time setup per environment:

1. An ACM certificate in `us-east-1` for the domain.
2. GitHub Actions secrets: `SERVERLESS_ACCESS_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `PROD_CERTIFICATE_ARN`, `DEV_CERTIFICATE_ARN`, `DEV_BASIC_AUTH_USERNAME`, `DEV_BASIC_AUTH_PASSWORD`, `DEV_POSTHOG_PROJECT_TOKEN`, `PROD_POSTHOG_PROJECT_TOKEN`.
3. After the first deploy, point a DNS CNAME at the CloudFront domain from the stack outputs.

Deploys run on Serverless Framework v4, which refuses to run until it is signed in. CI signs in with `SERVERLESS_ACCESS_KEY`, created on the Access Keys page of the Serverless dashboard. The free tier covers this site.

For local deploys, put the same variables in a `.env` file at the repo root (see `.env.example`), or run `npx serverless login` once in place of the access key.
