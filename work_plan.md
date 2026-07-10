# Portfolio Work Plan

## Goal

Transform artnikitin.dev from a standard developer portfolio into an executive-grade knowledge base that signals systems thinking, organizational leverage, and reusable judgment. Reference INSPO.md for full benchmark context.

Currently this is a single page nextjs site, but needs to be a professional portfolio that also has a SEO blog with interactive elements.End goal, a SPA amazing beutiful fully woring protfolio with all my current work. There is a resume attached at Art Nikitin - Resume - v2.docx. one thing it leaves out, is the freelance dev work i was doing from 2014-2020 when i got the dev job in georgia. I mostly built sites for friends and family.

# Portfolio Work Plan

## Goal

Transform artnikitin.dev from a standard developer portfolio into an executive-grade knowledge base that signals systems thinking, organizational leverage, and reusable judgment. Reference INSPO.md for full benchmark context.

Currently this is a single page nextjs site, but needs to be a professional portfolio that also has a SEO blog with interactive elements.End goal, a SPA amazing beutiful fully woring protfolio with all my current work. There is a resume attached at Art Nikitin - Resume - v2.docx. one thing it leaves out, is the freelance dev work i was doing from 2014-2020 when i got the dev job in georgia. I mostly built sites for friends and family.

BY the end, i want a site that has 3 ways to run, npm run dev, which locally starts it
then we have the dev deploy and the prod deploy.

all through ISR on lambdas, all CI/CD on github actions. main -> prod dev -> dev

when writing any text, always refer back to TONE.md. i is VITAL that you do so.

For design, keep it in a way that if i later ask to change it, it is really easy. make sure all colors/styles are in the tsconfigs. keep the presentation layer separate from the business logic.

for the blog, add a dummy blog post about how 1+=2 and make some calculations to show how axioms work. but a blog post should be a s simple as an md file, with text, wraparaound images, images, paragraphs, and interactive elements. it shoul dbe very very easy to write a new blog post and import the elements.

DO NOT USE BELOW THIS AS GOSPEL.

majority of this document is ai slop, and is not very good.

feel free to copy or move docuyment elsewhere to create new files.

The current list of projects needs to go to a pre-AI section. See site map below.

## Target stack (Portfolio 2.0)

|                | Prod                       | Dev (nonprod)                   |
| -------------- | -------------------------- | ------------------------------- |
| Domain         | artnikitin.dev             | dev.artnikitin.dev              |
| Branch         | `main`                     | `dev`                           |
| Auth           | Public                     | Basic auth (Next.js middleware) |
| Next.js output | `standalone`               | `standalone`                    |
| Lambda         | `portfolio-prod` function  | `portfolio-dev` function        |
| Static assets  | S3 `portfolio-prod` bucket | S3 `portfolio-dev` bucket       |
| CloudFront     | Prod distribution          | Dev distribution                |
| Deploy trigger | Push to `main`             | Push to `dev`                   |

**Reference implementation:** `C:\Users\1337\Documents\Programming\Web\lakeshore_harmony_dentistry`

### How it works

Next.js builds with `output: 'standalone'`, producing a self-contained Node server. That server is zipped and deployed as a Lambda function. The Lambda runs via the **Lambda Web Adapter** layer (`arn:aws:lambda:us-east-1:753240598075:layer:LambdaAdapterLayerX86:20`) — it proxies HTTP to the Next.js process on port 8080, no Express wrapper needed.

CloudFront sits in front with two origins:

- Default behavior → Lambda function URL (SSR, API routes, `next/image`)
- `/_next/static/*` and public assets → S3 bucket (immutable, long cache)

Basic auth on dev is handled by **Next.js middleware** (`middleware.ts`), checking `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` env vars set on the Lambda. Prod Lambda has no such vars — middleware is a no-op. No Lambda@Edge needed.

No ISR or revalidation queue. The portfolio has no CMS. Content is MDX files in the repo; pages rebuild on each deploy.

### Secrets required (GitHub Actions)

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
PROD_CERTIFICATE_ARN        # ACM cert for artnikitin.dev (must be in us-east-1)
DEV_CERTIFICATE_ARN         # ACM cert for dev.artnikitin.dev (must be in us-east-1)
DEV_BASIC_AUTH_USERNAME
DEV_BASIC_AUTH_PASSWORD
```

---

1. **Project:** Portfolio 2.0 — artnikitin.dev. A personal portfolio SPA with blog. Built with Next.js 15 App Router, MDX, Tailwind, deployed to AWS via Serverless Framework.
2. **Tone:** All copy MUST MUST MUST follow `TONE.md` (repo root memory). William Zinsser's _On Writing Well_ applied to professional context. Short declarative sentences. No hedging. No em dashes for drama. No "it's not X, it's Y". Confident without performing confidence. Read TONE.md before writing or reviewing any text.
3. **Design direction:** Reference `INSPO.md` (repo root) for visual and structural benchmarks. The goal is an executive knowledge base, not a developer portfolio gallery. Clarity with taste. Systems over adjectives.
4. **Infrastructure:** Two environments: prod (`main` branch → artnikitin.dev) and dev (`dev` branch → dev.artnikitin.dev, Basic Auth). AWS Lambda + CloudFront + S3 via Serverless Framework. Reference implementation at `C:\Users\1337\Documents\Programming\Web\lakeshore_harmony_dentistry`.
5. **Code standards:** DRY. SOLID principles. Reusable components. No premature abstractions — but shared UI elements (cards, headings, diagrams, metadata) must be components, not copy-pasted markup.
6. **End goal:** `npm run dev` → local. `npm run deploy:dev` → dev environment. `npm run deploy:prod` → prod environment. CI also deploys on merge to `dev` or `main`.

---

## Phase 1 — Infrastructure setup (Portfolio 2.0 foundation)

### 1.0 npm scripts (developer experience contract)

The root `package.json` must expose these commands before any other work begins:

```
npm run dev            → next dev (local, no auth)
npm run build          → next build (standalone output)
npm run deploy:dev     → build + zip + serverless deploy --stage dev
npm run deploy:prod    → build + zip + serverless deploy --stage prod
```

CI mirrors the same: push to `dev` triggers `deploy:dev`, push to `main` triggers `deploy:prod`.

- [ ] Wire up all four scripts in `package.json`

### 1.1 Next.js config changes

- [ ] Change `output` from `"export"` to `"standalone"` in `next.config.js`
- [ ] Add `middleware.ts` at the repo root — reads `BASIC_AUTH_USERNAME` / `BASIC_AUTH_PASSWORD`; if both are set, enforces HTTP Basic Auth on all routes. On prod these vars are absent so it passes through.
- [ ] Switch to Next.js 15 App Router (MDX support is cleaner there)
- [ ] Add `@next/mdx` or `next-mdx-remote` for blog/content pages

### 1.2 Serverless Framework configuration

Modeled on LHD's `serverless.yml` but stripped down (no Sanity, no ISR, no revalidation queue).

Each stage provisions:

- Lambda function (standalone zip) + Lambda Web Adapter layer
- Lambda function URL
- S3 bucket for static assets (private, OAC-protected)
- CloudFront distribution: Lambda URL as default origin, S3 as static origin
- Cache behaviors: `/_next/static/*` → S3 (immutable); everything else → Lambda
- CloudFront invalidation on deploy via `serverless-cloudfront-invalidate`

Dev stage sets `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` on the Lambda environment. Prod does not.

- [ ] Create `serverless.yml` (base config)
- [ ] Create `serverless.dev.yml` (dev overrides: domain, cert ARN, basic auth vars)
- [ ] Create `serverless.prod.yml` (prod overrides: domain, cert ARN)
- [ ] Add Python zip script to package the standalone build (adapt from LHD's `scripts/zip_standalone.py`)
- [ ] Test `serverless deploy --stage dev` locally
- [ ] Test `serverless deploy --stage prod` locally
- [ ] Confirm `dev.artnikitin.dev` prompts for Basic Auth
- [ ] Confirm `artnikitin.dev` is public

### 1.3 GitHub Actions workflows

Replace the current `build.yml` with two workflow files.

**`.github/workflows/deploy-prod.yml`** — triggers on push to `main`

```
1. Checkout
2. Setup Node 20 + Python
3. npm install
4. next build (standalone output)
5. python scripts/zip_standalone.py
6. serverless deploy --stage prod
```

**`.github/workflows/deploy-dev.yml`** — triggers on push to `dev`

```
1. Checkout
2. Setup Node 20 + Python
3. npm install
4. next build (standalone output)
5. python scripts/zip_standalone.py
6. serverless deploy --stage dev
```

- [ ] Write `deploy-prod.yml`
- [ ] Write `deploy-dev.yml`
- [ ] Remove or archive old `build.yml`
- [ ] Add all required secrets to GitHub repo settings
- [ ] Confirm both pipelines pass end-to-end

---

## Phase 2 — Site architecture and navigation

### 2.0 Site map

```
/                    Home — impact statement, metrics strip, selected work preview
/work                Selected Work — new case studies, written fresh, no pre-AI content
/work/[slug]         Individual case study
/writing             Blog — MDX posts, tagged by type (essay, deep dive, note)
/writing/[slug]      Individual post
/projects            Archive — all pre-AI work (current _projects/ content, lightly reformatted)
/projects/[slug]     Individual project
/about               Operating identity — principles, focus, problems you solve
/now                 Current focus, maintained monthly
```

**Phase 3+ (post-launch):**

```
/frameworks          Named models and decision tools
/frameworks/[slug]   Individual framework
/research            Interactive deep dives and architecture analyses
/research/[slug]     Individual deep dive
/speaking            Talks, podcasts, demos
```

**Content split:**

- `/work` — new, post-AI case studies written from scratch. None of the existing `_projects/` content belongs here.
- `/projects` — all 11 existing projects (breadboard CPU, coffee maker, server case, IoT devices, neural network, classroom game, rock paper scissors, icandoathing, whatstheword, image tools, invoice). These are pre-AI work. Displayed as an archive, not a showcase.
- `/writing` — net-new blog content. MDX files in `/content/writing/`.

### 2.1 Restructure navigation

Nav links at launch: Home, Work, Writing, Projects, About, Now.

- [ ] Update nav component to reflect new structure
- [ ] Create stub pages for each route so the skeleton is navigable before content is written

### 2.2 Homepage rewrite

Lead with impact, not title. Replace current hero.

- [ ] Rewrite hero copy (lead with what you enable, not your job title)
- [ ] Add a metrics strip (concrete numbers only — defensible and public-safe)
- [ ] Add 3 selected work preview cards linking to `/work`

---

## Phase 3 — Core content pages

### 3.1 `/work` — Selected Work (highest priority)

Three flagship case studies. Each structured as:

1. Business context
2. Your role and span of influence
3. Decision points and tradeoffs
4. Architecture or process diagram
5. Before/after outcome with metrics
6. Reusable lesson or principle

Target case studies (pick 3):

- Scheduling Platform
- Insurance Data Platform
- Enterprise AI Rollout
- CI/CD Transformation
- Kubernetes Homelab

- [ ] Create `/work` index page
- [ ] Create `/work/[slug]` template
- [ ] Write case study 1 (highest business impact first)
- [ ] Write case study 2
- [ ] Write case study 3
- [ ] Add one architecture diagram per case study

### 3.2 `/about` — Operating identity page

Not a bio. Include: what you do and for whom, operating principles (3–5 named), current focus, problems you solve, headshot.

- [ ] Write and publish `/about`

### 3.3 `/now` — Current focus page

Simple, maintained. Current priorities (3 max), what you are not doing, where to engage, last updated date.

- [ ] Create `/now` and commit to updating monthly

---

## Phase 4 — Authority-building pages

### 4.1 `/frameworks` — Named models

One framework to start. Give it a name. Structure: thesis, visual model, definitions, examples from your work, failure modes, linkable reference.

Candidates: Enterprise Architecture decision model, AI Governance framework, Migration playbook, Engineering Scorecard.

- [ ] Pick the first framework, create page, publish

### 4.2 `/research` — Interactive deep dives

Not blog posts. Interactive, decision-oriented pieces that engineering directors share.

Target topics:

- "How We Reduced P99 Latency from 120s to 20s"
- "Should Enterprises Rewrite Legacy Systems? An Interactive Cost Model"
- "The Economics of AI Coding Assistants"
- "Buying vs Building Internal AI Platforms"

Each: problem framing → live model/diagram → annotations → source links → takeaway.

- [ ] Build interactive deep dive 1

### 4.3 `/speaking` — Talks and media hub

Start thin. Internal talks, demos, meetups count.

- [ ] Create page, add all existing appearances

---

## Phase 5 — Polish and SEO

- [ ] Add `Person`, `Article`, `BreadcrumbList` JSON-LD schema
- [ ] Add canonical URLs and `og:` social cards to all pages
- [ ] Add reading time and published date to all writing/research pages
- [ ] Set homepage `<title>` to a role-based statement, not just the name
- [ ] Add `next-sitemap`
- [ ] Diagram library: consistent visual style across all case studies and frameworks
- [ ] Add 1–2 testimonials that speak to judgment or leverage

---

## Code standards

These apply to every file in the repo, not just new work.

**DRY.** If a UI pattern appears more than once, it is a component. Cards, section headers, metadata blocks, diagram wrappers, tag lists — all components with props, not copy-pasted JSX.

**SOLID.**

- Single responsibility: each component renders one thing. Data fetching, layout, and display do not share a file.
- Open/closed: components accept props and `children` for extension; they do not branch on magic strings to change behavior.
- Dependency inversion: pages depend on interfaces (typed props, content schema), not on specific data shapes.

**Component library structure:**

```
components/
  ui/          ← primitives (Button, Tag, Card, Heading, etc.)
  layout/      ← Shell, Nav, Footer, PageWrapper
  content/     ← CaseStudyCard, FrameworkBlock, WritingEntry, DiagramFigure
  interactive/ ← charts, calculators, interactive deep dive tools
```

**Content schema.** Every MDX content type has a typed frontmatter interface. Case studies, writing posts, framework pages, and speaking entries all have defined shapes. No `any`.

**No inline styles.** Tailwind classes only. Exceptions require a comment explaining why.

**Tone check.** Before any copy ships, read it against TONE.md. If a sentence hedges, performs, or stacks adjectives — rewrite it.

---

## Phase 6 — Responsive layout, defensive CSS, accessibility, and UX quality

This phase is a release requirement. Do not treat responsiveness, edge cases, accessibility, or interaction behavior as final polish.

### 6.0 Research before implementation

Before building or materially changing a page or reusable component:

- [ ] Read the relevant examples on https://defensivecss.dev/tips
- [ ] Search Google for current examples of the same pattern, using queries such as `responsive portfolio case study layout`, `accessible responsive navigation pattern`, `CSS grid card layout long content`, or the specific component name plus `UX best practices`
- [ ] Prefer primary or research-backed sources: MDN, web.dev, W3C/WAI, Nielsen Norman Group, GOV.UK Design System, USWDS, and established platform design systems
- [ ] Record non-obvious decisions in the PR description with the source URL and one sentence explaining the decision
- [ ] Do not copy a pattern because it looks attractive. Confirm that it survives narrow widths, zoom, long content, keyboard use, touch input, reduced motion, missing images, slow loading, and JavaScript failure

The model implementing this plan must use web search whenever a pattern is uncertain or the current best practice may have changed. It must not rely only on remembered CSS conventions.

### 6.1 Responsive implementation principles

Reference material:

- Responsive design overview: https://web.dev/articles/responsive-web-design-basics
- MDN responsive design: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design
- Flexbox: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout
- Grid: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout
- Container queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
- Fluid sizing with `clamp()`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/clamp
- Viewport units: https://developer.mozilla.org/en-US/docs/Web/CSS/length#relative_length_units_based_on_viewport

Implementation rules:

- [ ] Build mobile-first. Base styles must work at narrow widths. Add complexity only when space permits.
- [ ] Do not design around named devices. Add breakpoints where the content or component stops working.
- [ ] Use CSS Grid for two-dimensional page and card layouts. Use Flexbox for one-dimensional alignment and distribution.
- [ ] Use intrinsic layouts before media-query-heavy layouts: `flex-wrap`, `grid-template-columns: repeat(auto-fit, minmax(...))`, `min()`, `max()`, `clamp()`, `fit-content()`, and container queries.
- [ ] Use container queries for reusable cards, metadata blocks, diagrams, and MDX components whose layout depends on their own available width rather than the viewport.
- [ ] Use `gap` for layout spacing. Do not create brittle sibling-margin systems.
- [ ] Use `align-items`, `justify-content`, `place-items`, and `place-content` deliberately. Do not depend on Flexbox or Grid defaults when those defaults can stretch or misalign content.
- [ ] Prefer `min-height` over fixed `height` for content sections. Reserve fixed heights for intentionally cropped media or bounded interactive canvases.
- [ ] Prefer `min-width`, `max-width`, and content-driven padding over fixed widths for buttons, labels, cards, navigation items, and text containers.
- [ ] Set readable line lengths with `max-inline-size`, usually around `60ch` to `75ch` for article text. Wider visual sections may contain a narrower reading column.
- [ ] Use `rem`, `em`, `%`, `ch`, `fr`, and container units where they match the relationship being expressed.
- [ ] Use `vmin` and `vmax` only where scaling against the smaller or larger viewport dimension is intentional. Do not use viewport units alone for body text.
- [ ] Use `clamp()` for bounded fluid typography and spacing, for example `clamp(1rem, 0.9rem + 0.5vw, 1.35rem)`.
- [ ] Combine viewport-relative typography with a `rem` component so browser zoom and user font preferences still affect the result.
- [ ] Use modern viewport units (`svh`, `lvh`, `dvh`) for viewport-height sections. Avoid relying on `100vh` for mobile layouts with dynamic browser chrome.
- [ ] Ensure every image and video has explicit dimensions or an `aspect-ratio` so loading does not shift surrounding content.
- [ ] Use responsive images through `next/image`, `sizes`, and suitable source dimensions. Do not send desktop-sized media to small screens without reason.
- [ ] Set `max-width: 100%` on embedded media and code examples. Nothing may force page-level horizontal scrolling.
- [ ] Test at widths between breakpoints, not only at standard presets.
- [ ] Test portrait and landscape layouts, short desktop windows, browser zoom at 200%, and text-only zoom where supported.

Responsive acceptance matrix:

- [ ] 320px wide viewport
- [ ] 375px and 390px mobile widths
- [ ] 768px tablet width
- [ ] 1024px narrow desktop width
- [ ] 1440px desktop width
- [ ] 1920px and wider display
- [ ] Short viewport around 600px high
- [ ] 200% browser zoom without loss of content or controls
- [ ] Keyboard-only navigation at every tested width
- [ ] Touch input without hover-dependent functionality

### 6.2 Defensive CSS requirements

Primary reference: https://defensivecss.dev/tips

Every reusable component must be checked against each relevant case below. Add focused component tests or Storybook-style fixtures for the failure modes that can recur.

#### Flexbox wrapping

Reference: https://defensivecss.dev/tip/flexbox-wrapping/

- [ ] Flex rows containing tags, actions, metadata, filters, or navigation must use `flex-wrap: wrap` unless horizontal scrolling is the explicit design.
- [ ] Wrapped rows must retain deliberate row and column gaps.
- [ ] No action may disappear outside the viewport when labels become longer.

#### Image distortion

Reference: https://defensivecss.dev/tip/image-distortion/

- [ ] Images with bounded frames must use an explicit `aspect-ratio` and the intended `object-fit` value.
- [ ] Use `object-fit: cover` only when cropping is acceptable. Use `contain` when the whole image carries meaning.
- [ ] Test portrait, landscape, square, very wide, very tall, low-resolution, transparent, and missing images.
- [ ] Do not stretch media to match a sibling's content height.

#### Long content

Reference: https://defensivecss.dev/tip/long-content/

- [ ] Test every title, tag, URL, code token, company name, and metadata value with unusually long content.
- [ ] Use `overflow-wrap: anywhere` or an appropriate breaking rule where full content should remain visible.
- [ ] Use ellipsis only when the hidden value can be recovered through a detail view, accessible label, tooltip, or expansion control.
- [ ] Never truncate core case-study meaning merely to preserve a card height.

#### Component spacing

Reference: https://defensivecss.dev/tip/spacing/

- [ ] Components must preserve spacing when labels wrap or grow.
- [ ] Titles and actions must have explicit `gap` or padding between them.
- [ ] Do not rely on the current text length to create visual separation.

#### Auto-fit versus auto-fill

Reference: https://defensivecss.dev/tip/auto-fit-fill/

- [ ] Choose `auto-fit` only when remaining items should stretch into unused tracks.
- [ ] Choose `auto-fill` when cards should retain a stable maximum width and empty tracks should remain reserved.
- [ ] Test grids with one item, two items, and incomplete final rows.

#### Background repeat

Reference: https://defensivecss.dev/tip/background-repeat/

- [ ] Every decorative background image must declare repeat, size, and position behavior.
- [ ] Large visual backgrounds must be checked on displays wider than the source image.
- [ ] Decorative backgrounds must not carry information unavailable to assistive technology.

#### Fixed values in CSS Grid

Reference: https://defensivecss.dev/tip/css-grid-fixed-values/

- [ ] Avoid track definitions that can exceed the container at intermediate widths.
- [ ] Use `minmax()`, flexible tracks, and intrinsic sizing instead of unexplained fixed columns.
- [ ] Sidebars must collapse, wrap, or move below content before they cause overflow.

#### CSS variable fallback

Reference: https://defensivecss.dev/tip/css-variable-fallback/

- [ ] CSS custom properties supplied by JavaScript, MDX props, themes, or runtime state must include safe fallbacks.
- [ ] Theme tokens must have root defaults.
- [ ] A missing custom property must not invalidate a full `calc()` expression or hide content.

#### Fixed sizes

Reference: https://defensivecss.dev/tip/fixed-sizes/

- [ ] Replace fixed content heights with `min-height` unless clipping is deliberate.
- [ ] Replace fixed button widths with `min-width` plus horizontal padding.
- [ ] Fixed dimensions require a code comment explaining why the content cannot vary.

#### Minimum content size in Flexbox

Reference: https://defensivecss.dev/tip/flexbox-min-content-size/

- [ ] Add `min-width: 0` to flex children that contain wrapping or truncating text.
- [ ] Add `min-height: 0` to vertical flex children that must scroll within a bounded area.
- [ ] Test cards with long unbroken strings and wide embedded content.

#### Minimum content size in Grid

Reference: https://defensivecss.dev/tip/grid-min-content-size/

- [ ] Prefer `minmax(0, 1fr)` over bare `1fr` where a track contains carousels, code, diagrams, tables, or other wide content.
- [ ] Apply `min-width: 0` to grid children that must shrink.
- [ ] Do not hide overflow as the first fix. Preserve access to content.

#### Grouping vendor selectors

Reference: https://defensivecss.dev/tip/grouping-selectors/

- [ ] Do not group selectors when one unsupported vendor selector would invalidate the whole selector list.
- [ ] Keep browser-specific pseudo-elements in separate rules.
- [ ] Use Autoprefixer through the build rather than hand-maintaining normal property prefixes.

#### Image maximum width

Reference: https://defensivecss.dev/tip/image-max-width/

- [ ] Global prose media must use `max-inline-size: 100%` and `block-size: auto`.
- [ ] MDX authors must not be able to create page-level overflow by inserting an oversized image.

#### Sticky positioning inside Grid

Reference: https://defensivecss.dev/tip/position-sticky-grid/

- [ ] Sticky grid children must use `align-self: start` or a deliberate equivalent.
- [ ] Sticky elements must be tested in short viewports and with content taller than the viewport.
- [ ] Do not make the main navigation, table of contents, and another panel sticky when they compete for the same viewport space.

#### Scroll chaining

Reference: https://defensivecss.dev/tip/scroll-chaining/

- [ ] Scrollable overlays, code panels, mobile menus, and dialogs must use appropriate `overscroll-behavior`.
- [ ] Locking background scroll must not trap keyboard or screen-reader users.

#### Scrollbar gutter

Reference: https://defensivecss.dev/tip/scrollbar-gutter/

- [ ] Use `scrollbar-gutter: stable` where conditional scrollbars would shift centered or aligned content.
- [ ] Do not force permanent scrollbars on small content areas merely to avoid shift.

#### Scrollbars on demand

Reference: https://defensivecss.dev/tip/scrollbar-on-demand/

- [ ] Use `overflow: auto` rather than `scroll` unless an always-visible scrollbar communicates an intentional affordance.
- [ ] Horizontal scrolling regions must be visibly discoverable and keyboard accessible.

#### `justify-content: space-between`

Reference: https://defensivecss.dev/tip/space-between/

- [ ] Do not use `space-between` as the sole spacing mechanism when items may wrap.
- [ ] Use `gap` and explicit alignment so incomplete rows do not create extreme spacing.
- [ ] Test one-item and two-item states.

#### Text over images

Reference: https://defensivecss.dev/tip/text-over-image/

- [ ] Text over media requires a predictable contrast layer, not a hope that the selected image is dark enough.
- [ ] Verify contrast against the lightest and busiest allowed images.
- [ ] Prefer separating essential article text from photography when contrast cannot be guaranteed.

#### Vertical media queries

Reference: https://defensivecss.dev/tip/vertical-media-query/

- [ ] Add height-based breakpoints for stacked sticky elements, fullscreen hero layouts, mobile menus, and tall dialogs.
- [ ] Short viewports must retain access to navigation and primary actions.

#### Accidental hover on mobile

Reference: https://defensivecss.dev/tip/hover-media/

- [ ] Place hover-only visual enhancements inside `@media (hover: hover) and (pointer: fine)`.
- [ ] Information and actions must never depend on hover.
- [ ] Touch devices must not retain confusing stuck hover states.

#### Image inner border

Reference: https://defensivecss.dev/tip/image-inner-border/

- [ ] Add an inset border or suitable surface treatment where light images can disappear into the page background.
- [ ] The treatment must work with rounded corners and transparent assets.

#### Default Flexbox stretching

Reference: https://defensivecss.dev/tip/default-flexbox-stretching/

- [ ] Override default cross-axis stretching for thumbnails, badges, controls, and media that should keep intrinsic dimensions.
- [ ] Use `align-self: start` or set the container's `align-items` deliberately.

#### Input zoom on iOS Safari

Reference: https://defensivecss.dev/tip/input-zoom-safari/

- [ ] Form controls must use a computed font size of at least 16px on mobile Safari.
- [ ] Do not disable pinch zoom to conceal input zoom.

#### Button minimum width

Reference: https://defensivecss.dev/tip/button-min-width/

- [ ] Buttons must use content-driven padding and a sensible `min-width`, not a fixed width.
- [ ] Test translated or deliberately expanded labels.
- [ ] Loading indicators must not cause the button to jump unless the width change is intentional.

### 6.3 Defensive content and component test fixtures

For every shared component, create fixtures for the states that apply:

- [ ] Empty title, description, list, metadata, and image
- [ ] One item and many items
- [ ] Very short and very long text
- [ ] Long unbroken URL or token
- [ ] Multiline button and navigation labels
- [ ] Missing, broken, transparent, portrait, landscape, and extreme-ratio images
- [ ] Slow-loading media with a reserved layout box
- [ ] Narrow container embedded inside a wide page
- [ ] Wide component embedded inside a narrow prose column
- [ ] Touch, mouse, keyboard, and reduced-motion input modes
- [ ] Loading, success, empty, error, and partial-data states for interactive elements

A component is not complete until its failure fixtures remain usable and visually intentional.

### 6.4 UX patterns and interaction rules

Primary references:

- Nielsen Norman Group usability heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- GOV.UK Design System: https://design-system.service.gov.uk/
- US Web Design System components: https://designsystem.digital.gov/components/overview/
- WAI-ARIA Authoring Practices patterns: https://www.w3.org/WAI/ARIA/apg/patterns/
- WCAG 2.2 quick reference: https://www.w3.org/WAI/WCAG22/quickref/
- Target size guidance: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Web Content Accessibility Guidelines: https://www.w3.org/TR/WCAG22/

#### Navigation and information architecture

- [ ] Keep primary navigation stable across pages. Use the same labels, order, and interaction model.
- [ ] Use plain labels: Work, Writing, Projects, About, Now. Do not replace known destinations with clever language.
- [ ] Indicate the current section visually and programmatically with `aria-current="page"`.
- [ ] The logo or site name links to Home.
- [ ] Mobile navigation opens through a real button, exposes expanded state, traps no focus, closes with Escape, and returns focus to the trigger.
- [ ] Use breadcrumbs on deep content where they improve orientation, especially `/work/[slug]`, `/writing/[slug]`, and future framework or research pages.
- [ ] Do not hide the only route to important content behind hover, animation, or an unlabeled icon.

#### Links, buttons, and affordances

- [ ] Use links for navigation and buttons for actions.
- [ ] Link text must describe the destination without relying on nearby text. Avoid repeated `Learn more` labels unless each has an accessible name.
- [ ] External links may indicate that they leave the site, but do not clutter every link with an icon.
- [ ] All controls need visible hover, active, focus-visible, disabled, and loading states where applicable.
- [ ] Do not remove focus outlines. Style `:focus-visible` to match the design system.
- [ ] Interactive targets must meet at least WCAG 2.2's 24×24 CSS-pixel minimum or provide sufficient spacing; primary controls should normally be larger.

#### Feedback and system status

- [ ] Interactive charts, calculators, copy buttons, filters, and forms must provide immediate visible feedback.
- [ ] Loading states must preserve layout and identify what is loading.
- [ ] Errors must explain what happened and what the user can do next.
- [ ] Success messages must be announced to assistive technology when they are not otherwise obvious.
- [ ] Do not show fake progress or animations that delay content without purpose.

#### Recognition over recall

- [ ] Keep labels visible. Do not use placeholder text as the only label.
- [ ] Keep article metadata, tags, and navigation terminology consistent across index cards and detail pages.
- [ ] Interactive posts must explain controls beside the control. Do not require readers to remember instructions from an earlier section.
- [ ] Preserve useful state in the URL for filters or interactive research tools when sharing that state matters.

#### Progressive disclosure

- [ ] Present the decision, outcome, and key evidence before implementation detail in case studies.
- [ ] Use expandable detail only for genuinely secondary material.
- [ ] Disclosure controls must be buttons with `aria-expanded` and `aria-controls`.
- [ ] Do not hide content solely to make a page appear shorter.

#### Motion and animation

Reference: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html

- [ ] Animation must clarify hierarchy, state, or spatial relationships.
- [ ] Respect `prefers-reduced-motion: reduce` and remove nonessential movement.
- [ ] Do not make text wait for entrance animation before it becomes readable.
- [ ] Avoid scroll-jacking, forced horizontal storytelling, cursor replacement, and continuous decorative motion over reading content.
- [ ] Keep duration and easing tokens centralized in the design system.

#### Reading and content UX

- [ ] Article pages need a clear title, summary, date, reading time, and content type.
- [ ] Heading levels must form a logical outline. Do not select headings for visual size.
- [ ] Add a table of contents only when the article is long enough to need one.
- [ ] Anchor links must account for sticky navigation through `scroll-margin-top`.
- [ ] Footnotes, citations, code, tables, diagrams, and callouts need consistent reusable MDX components.
- [ ] Code blocks need wrapping or deliberate horizontal scrolling, copy support where useful, and visible language labels.
- [ ] Wide tables need a responsive wrapper, a compact alternative, or a transformed small-screen presentation. Never shrink table text until it becomes unreadable.

#### Forms and contact interactions

- [ ] Every field has a persistent `<label>`.
- [ ] Group related controls with `fieldset` and `legend` where appropriate.
- [ ] Validation runs at a useful point, not on every keystroke unless the feedback is genuinely helpful.
- [ ] Error summaries link to the fields with errors.
- [ ] Preserve entered values after validation failure.
- [ ] Use appropriate `autocomplete`, `inputmode`, and semantic input types.
- [ ] Contact methods should remain available without JavaScript.

#### Empty, loading, error, and offline states

- [ ] Every data-dependent interactive component has an intentional loading state.
- [ ] Empty states explain whether no content exists, no content matches a filter, or content failed to load.
- [ ] Error states retain surrounding context and provide retry or recovery where useful.
- [ ] Static article content must remain readable if client JavaScript fails.

### 6.5 Accessibility baseline

- [ ] Meet WCAG 2.2 AA for public pages.
- [ ] Use semantic HTML before ARIA.
- [ ] Include a skip link to main content.
- [ ] Maintain one primary `<main>` landmark and meaningful `header`, `nav`, `aside`, and `footer` landmarks.
- [ ] Provide text alternatives for informative images. Use empty alt text for decorative images.
- [ ] Diagrams require a concise alternative description and, when complex, an adjacent textual explanation.
- [ ] Color cannot be the only way to communicate status, category, or selection.
- [ ] Check text, icon, focus, and control contrast in every theme.
- [ ] Support keyboard operation without traps.
- [ ] Announce dynamic state changes when visual feedback alone is insufficient.
- [ ] Preserve zoom and text resizing. Never set `user-scalable=no`.
- [ ] Test with at least VoiceOver on macOS/iOS or NVDA on Windows before launch.

### 6.6 Design tokens and maintainability

- [ ] Put colors, type scales, spacing, radii, shadows, content widths, breakpoints, animation timing, and z-index layers in named tokens.
- [ ] Keep semantic tokens separate from raw palette tokens: `surface`, `text-muted`, `border-subtle`, `action-primary`, not only color names.
- [ ] Do not put runtime theme or design values in `tsconfig`. Use Tailwind configuration, CSS custom properties, or a dedicated typed theme module. `tsconfig` is for TypeScript compiler behavior.
- [ ] Components consume semantic tokens. Pages must not introduce one-off hex values or unexplained spacing values.
- [ ] Maintain a small documented z-index scale. Do not solve layering bugs by adding larger arbitrary numbers.
- [ ] Keep responsive and state variants beside the component they affect.

### 6.7 Quality gates and automated checks

- [ ] ESLint and TypeScript must pass with no ignored new errors.
- [ ] Add Stylelint if custom CSS grows beyond a small token and reset layer.
- [ ] Run Lighthouse against representative pages in prod mode.
- [ ] Add axe accessibility checks to component or end-to-end tests.
- [ ] Add Playwright tests for navigation, mobile menu, keyboard focus, MDX rendering, and critical interactive posts.
- [ ] Add visual regression snapshots for narrow, medium, and wide layouts.
- [ ] Set performance budgets for JavaScript, images, fonts, and third-party scripts.
- [ ] Check Core Web Vitals using field data after launch and lab data before launch.
- [ ] Do not ship a layout with known horizontal overflow, inaccessible controls, missing focus states, or content hidden at 200% zoom.

### 6.8 Definition of done for each page

A page is complete only when:

- [ ] Its purpose is obvious from the title and opening content.
- [ ] The primary action or next route is clear.
- [ ] It works without client JavaScript unless the feature inherently requires it.
- [ ] It passes the responsive acceptance matrix.
- [ ] It has been checked against every relevant Defensive CSS case.
- [ ] It has correct landmarks, heading order, keyboard behavior, focus states, and text alternatives.
- [ ] Its loading, empty, and error states are implemented where applicable.
- [ ] Its metadata, canonical URL, Open Graph data, and structured data are correct.
- [ ] Its copy has been checked against `TONE.md`.
- [ ] The PR includes screenshots at narrow and wide widths plus links to any UX or CSS evidence used for non-obvious decisions.

## Deployment reference

Primary reference: `C:\Users\1337\Documents\Programming\Web\lakeshore_harmony_dentistry`

Key files to adapt:

- `serverless.yml` — strip out Sanity/ISR/SQS, keep Lambda + S3 + CloudFront shape
- `serverless-resources/cloudfront.yml` — use the OAC pattern (not the older OAI)
- `scripts/zip_standalone.py` — packages the `.next/standalone` directory for Lambda
- `next_frontend/next.config.ts` — `output: 'standalone'`, Lambda Web Adapter compatible

Basic auth middleware pattern (simpler than LHD which does it at the app layer):

```ts
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USERNAME;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const auth = req.headers.get("authorization");
  const expected = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  if (auth !== expected) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="dev"' },
    });
  }
  return NextResponse.next();
}
```

BY the end, i want a site that has 3 ways to run, npm run dev, which locally starts it
then we have the dev deploy and the prod deploy.

all through ISR on lambdas, all CI/CD on github actions. main -> prod dev -> dev

when writing any text, always refer back to TONE.md. i is VITAL that you do so.

For design, keep it in a way that if i later ask to change it, it is really easy. make sure all colors/styles are in the tsconfigs. keep the presentation layer separate from the business logic.

for the blog, add a dummy blog post about how 1+=2 and make some calculations to show how axioms work. but a blog post should be a s simple as an md file, with text, wraparaound images, images, paragraphs, and interactive elements. it shoul dbe very very easy to write a new blog post and import the elements.

DO NOT USE BELOW THIS AS GOSPEL.

majority of this document is ai slop, and is not very good.

feel free to copy or move docuyment elsewhere to create new files.

The current list of projects needs to go to a pre-AI section. See site map below.

## Target stack (Portfolio 2.0)

|                | Prod                       | Dev (nonprod)                   |
| -------------- | -------------------------- | ------------------------------- |
| Domain         | artnikitin.dev             | dev.artnikitin.dev              |
| Branch         | `main`                     | `dev`                           |
| Auth           | Public                     | Basic auth (Next.js middleware) |
| Next.js output | `standalone`               | `standalone`                    |
| Lambda         | `portfolio-prod` function  | `portfolio-dev` function        |
| Static assets  | S3 `portfolio-prod` bucket | S3 `portfolio-dev` bucket       |
| CloudFront     | Prod distribution          | Dev distribution                |
| Deploy trigger | Push to `main`             | Push to `dev`                   |

**Reference implementation:** `C:\Users\1337\Documents\Programming\Web\lakeshore_harmony_dentistry`

### How it works

Next.js builds with `output: 'standalone'`, producing a self-contained Node server. That server is zipped and deployed as a Lambda function. The Lambda runs via the **Lambda Web Adapter** layer (`arn:aws:lambda:us-east-1:753240598075:layer:LambdaAdapterLayerX86:20`) — it proxies HTTP to the Next.js process on port 8080, no Express wrapper needed.

CloudFront sits in front with two origins:

- Default behavior → Lambda function URL (SSR, API routes, `next/image`)
- `/_next/static/*` and public assets → S3 bucket (immutable, long cache)

Basic auth on dev is handled by **Next.js middleware** (`middleware.ts`), checking `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` env vars set on the Lambda. Prod Lambda has no such vars — middleware is a no-op. No Lambda@Edge needed.

No ISR or revalidation queue. The portfolio has no CMS. Content is MDX files in the repo; pages rebuild on each deploy.

### Secrets required (GitHub Actions)

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
PROD_CERTIFICATE_ARN        # ACM cert for artnikitin.dev (must be in us-east-1)
DEV_CERTIFICATE_ARN         # ACM cert for dev.artnikitin.dev (must be in us-east-1)
DEV_BASIC_AUTH_USERNAME
DEV_BASIC_AUTH_PASSWORD
```

---

1. **Project:** Portfolio 2.0 — artnikitin.dev. A personal portfolio SPA with blog. Built with Next.js 15 App Router, MDX, Tailwind, deployed to AWS via Serverless Framework.
2. **Tone:** All copy MUST MUST MUST follow `TONE.md` (repo root memory). William Zinsser's _On Writing Well_ applied to professional context. Short declarative sentences. No hedging. No em dashes for drama. No "it's not X, it's Y". Confident without performing confidence. Read TONE.md before writing or reviewing any text.
3. **Design direction:** Reference `INSPO.md` (repo root) for visual and structural benchmarks. The goal is an executive knowledge base, not a developer portfolio gallery. Clarity with taste. Systems over adjectives.
4. **Infrastructure:** Two environments: prod (`main` branch → artnikitin.dev) and dev (`dev` branch → dev.artnikitin.dev, Basic Auth). AWS Lambda + CloudFront + S3 via Serverless Framework. Reference implementation at `C:\Users\1337\Documents\Programming\Web\lakeshore_harmony_dentistry`.
5. **Code standards:** DRY. SOLID principles. Reusable components. No premature abstractions — but shared UI elements (cards, headings, diagrams, metadata) must be components, not copy-pasted markup.
6. **End goal:** `npm run dev` → local. `npm run deploy:dev` → dev environment. `npm run deploy:prod` → prod environment. CI also deploys on merge to `dev` or `main`.

---

## Phase 1 — Infrastructure setup (Portfolio 2.0 foundation)

### 1.0 npm scripts (developer experience contract)

The root `package.json` must expose these commands before any other work begins:

```
npm run dev            → next dev (local, no auth)
npm run build          → next build (standalone output)
npm run deploy:dev     → build + zip + serverless deploy --stage dev
npm run deploy:prod    → build + zip + serverless deploy --stage prod
```

CI mirrors the same: push to `dev` triggers `deploy:dev`, push to `main` triggers `deploy:prod`.

- [ ] Wire up all four scripts in `package.json`

### 1.1 Next.js config changes

- [ ] Change `output` from `"export"` to `"standalone"` in `next.config.js`
- [ ] Add `middleware.ts` at the repo root — reads `BASIC_AUTH_USERNAME` / `BASIC_AUTH_PASSWORD`; if both are set, enforces HTTP Basic Auth on all routes. On prod these vars are absent so it passes through.
- [ ] Switch to Next.js 15 App Router (MDX support is cleaner there)
- [ ] Add `@next/mdx` or `next-mdx-remote` for blog/content pages

### 1.2 Serverless Framework configuration

Modeled on LHD's `serverless.yml` but stripped down (no Sanity, no ISR, no revalidation queue).

Each stage provisions:

- Lambda function (standalone zip) + Lambda Web Adapter layer
- Lambda function URL
- S3 bucket for static assets (private, OAC-protected)
- CloudFront distribution: Lambda URL as default origin, S3 as static origin
- Cache behaviors: `/_next/static/*` → S3 (immutable); everything else → Lambda
- CloudFront invalidation on deploy via `serverless-cloudfront-invalidate`

Dev stage sets `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` on the Lambda environment. Prod does not.

- [ ] Create `serverless.yml` (base config)
- [ ] Create `serverless.dev.yml` (dev overrides: domain, cert ARN, basic auth vars)
- [ ] Create `serverless.prod.yml` (prod overrides: domain, cert ARN)
- [ ] Add Python zip script to package the standalone build (adapt from LHD's `scripts/zip_standalone.py`)
- [ ] Test `serverless deploy --stage dev` locally
- [ ] Test `serverless deploy --stage prod` locally
- [ ] Confirm `dev.artnikitin.dev` prompts for Basic Auth
- [ ] Confirm `artnikitin.dev` is public

### 1.3 GitHub Actions workflows

Replace the current `build.yml` with two workflow files.

**`.github/workflows/deploy-prod.yml`** — triggers on push to `main`

```
1. Checkout
2. Setup Node 20 + Python
3. npm install
4. next build (standalone output)
5. python scripts/zip_standalone.py
6. serverless deploy --stage prod
```

**`.github/workflows/deploy-dev.yml`** — triggers on push to `dev`

```
1. Checkout
2. Setup Node 20 + Python
3. npm install
4. next build (standalone output)
5. python scripts/zip_standalone.py
6. serverless deploy --stage dev
```

- [ ] Write `deploy-prod.yml`
- [ ] Write `deploy-dev.yml`
- [ ] Remove or archive old `build.yml`
- [ ] Add all required secrets to GitHub repo settings
- [ ] Confirm both pipelines pass end-to-end

---

## Phase 2 — Site architecture and navigation

### 2.0 Site map

```
/                    Home — impact statement, metrics strip, selected work preview
/work                Selected Work — new case studies, written fresh, no pre-AI content
/work/[slug]         Individual case study
/writing             Blog — MDX posts, tagged by type (essay, deep dive, note)
/writing/[slug]      Individual post
/projects            Archive — all pre-AI work (current _projects/ content, lightly reformatted)
/projects/[slug]     Individual project
/about               Operating identity — principles, focus, problems you solve
/now                 Current focus, maintained monthly
```

**Phase 3+ (post-launch):**

```
/frameworks          Named models and decision tools
/frameworks/[slug]   Individual framework
/research            Interactive deep dives and architecture analyses
/research/[slug]     Individual deep dive
/speaking            Talks, podcasts, demos
```

**Content split:**

- `/work` — new, post-AI case studies written from scratch. None of the existing `_projects/` content belongs here.
- `/projects` — all 11 existing projects (breadboard CPU, coffee maker, server case, IoT devices, neural network, classroom game, rock paper scissors, icandoathing, whatstheword, image tools, invoice). These are pre-AI work. Displayed as an archive, not a showcase.
- `/writing` — net-new blog content. MDX files in `/content/writing/`.

### 2.1 Restructure navigation

Nav links at launch: Home, Work, Writing, Projects, About, Now.

- [ ] Update nav component to reflect new structure
- [ ] Create stub pages for each route so the skeleton is navigable before content is written

### 2.2 Homepage rewrite

Lead with impact, not title. Replace current hero.

- [ ] Rewrite hero copy (lead with what you enable, not your job title)
- [ ] Add a metrics strip (concrete numbers only — defensible and public-safe)
- [ ] Add 3 selected work preview cards linking to `/work`

---

## Phase 3 — Core content pages

### 3.1 `/work` — Selected Work (highest priority)

Three flagship case studies. Each structured as:

1. Business context
2. Your role and span of influence
3. Decision points and tradeoffs
4. Architecture or process diagram
5. Before/after outcome with metrics
6. Reusable lesson or principle

Target case studies (pick 3):

- Scheduling Platform
- Insurance Data Platform
- Enterprise AI Rollout
- CI/CD Transformation
- Kubernetes Homelab

- [ ] Create `/work` index page
- [ ] Create `/work/[slug]` template
- [ ] Write case study 1 (highest business impact first)
- [ ] Write case study 2
- [ ] Write case study 3
- [ ] Add one architecture diagram per case study

### 3.2 `/about` — Operating identity page

Not a bio. Include: what you do and for whom, operating principles (3–5 named), current focus, problems you solve, headshot.

- [ ] Write and publish `/about`

### 3.3 `/now` — Current focus page

Simple, maintained. Current priorities (3 max), what you are not doing, where to engage, last updated date.

- [ ] Create `/now` and commit to updating monthly

---

## Phase 4 — Authority-building pages

### 4.1 `/frameworks` — Named models

One framework to start. Give it a name. Structure: thesis, visual model, definitions, examples from your work, failure modes, linkable reference.

Candidates: Enterprise Architecture decision model, AI Governance framework, Migration playbook, Engineering Scorecard.

- [ ] Pick the first framework, create page, publish

### 4.2 `/research` — Interactive deep dives

Not blog posts. Interactive, decision-oriented pieces that engineering directors share.

Target topics:

- "How We Reduced P99 Latency from 120s to 20s"
- "Should Enterprises Rewrite Legacy Systems? An Interactive Cost Model"
- "The Economics of AI Coding Assistants"
- "Buying vs Building Internal AI Platforms"

Each: problem framing → live model/diagram → annotations → source links → takeaway.

- [ ] Build interactive deep dive 1

### 4.3 `/speaking` — Talks and media hub

Start thin. Internal talks, demos, meetups count.

- [ ] Create page, add all existing appearances

---

## Phase 5 — Polish and SEO

- [ ] Add `Person`, `Article`, `BreadcrumbList` JSON-LD schema
- [ ] Add canonical URLs and `og:` social cards to all pages
- [ ] Add reading time and published date to all writing/research pages
- [ ] Set homepage `<title>` to a role-based statement, not just the name
- [ ] Add `next-sitemap`
- [ ] Diagram library: consistent visual style across all case studies and frameworks
- [ ] Add 1–2 testimonials that speak to judgment or leverage

---

## Code standards

These apply to every file in the repo, not just new work.

**DRY.** If a UI pattern appears more than once, it is a component. Cards, section headers, metadata blocks, diagram wrappers, tag lists — all components with props, not copy-pasted JSX.

**SOLID.**

- Single responsibility: each component renders one thing. Data fetching, layout, and display do not share a file.
- Open/closed: components accept props and `children` for extension; they do not branch on magic strings to change behavior.
- Dependency inversion: pages depend on interfaces (typed props, content schema), not on specific data shapes.

**Component library structure:**

```
components/
  ui/          ← primitives (Button, Tag, Card, Heading, etc.)
  layout/      ← Shell, Nav, Footer, PageWrapper
  content/     ← CaseStudyCard, FrameworkBlock, WritingEntry, DiagramFigure
  interactive/ ← charts, calculators, interactive deep dive tools
```

**Content schema.** Every MDX content type has a typed frontmatter interface. Case studies, writing posts, framework pages, and speaking entries all have defined shapes. No `any`.

**No inline styles.** Tailwind classes only. Exceptions require a comment explaining why.

**Tone check.** Before any copy ships, read it against TONE.md. If a sentence hedges, performs, or stacks adjectives — rewrite it.

---

## Deployment reference

Primary reference: `C:\Users\1337\Documents\Programming\Web\lakeshore_harmony_dentistry`

Key files to adapt:

- `serverless.yml` — strip out Sanity/ISR/SQS, keep Lambda + S3 + CloudFront shape
- `serverless-resources/cloudfront.yml` — use the OAC pattern (not the older OAI)
- `scripts/zip_standalone.py` — packages the `.next/standalone` directory for Lambda
- `next_frontend/next.config.ts` — `output: 'standalone'`, Lambda Web Adapter compatible

Basic auth middleware pattern (simpler than LHD which does it at the app layer):

```ts
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USERNAME;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const auth = req.headers.get("authorization");
  const expected = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  if (auth !== expected) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="dev"' },
    });
  }
  return NextResponse.next();
}
```
