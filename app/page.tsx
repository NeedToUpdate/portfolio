import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import Section from "@/components/composites/Section";
import TagList from "@/components/composites/TagList";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import ArrowLink from "@/components/ui/ArrowLink";
import TextLink from "@/components/ui/TextLink";
import Panel from "@/components/ui/Panel";
import JsonLd from "@/components/ui/JsonLd";
import Icon, { categoryIcon } from "@/components/ui/Icon";
import { categoryShape, tagShape } from "@/lib/nebula/shapes";
import {
  getCaseStudies,
  getFeaturedCaseStudies,
  getInsights,
  getWorkIntro,
} from "@/lib/content";
import { formatDate } from "@/lib/format";
import { personSchema, websiteSchema } from "@/lib/seo";
import { site } from "@/lib/site";

// Shared glass-card shell for the horizontal rails. A fixed width lets the
// next card peek, which is the whole "swipe me" signal.
const railCard =
  "flex w-[82%] shrink-0 snap-start flex-col rounded-lg border border-white/10 bg-[#0d0a08]/60 p-4 shadow-2xl shadow-black/30 ring-1 ring-white/5";
// Horizontal rail: full-bleed to the screen edges, snap points, no scrollbar.
const rail =
  "mt-5 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 scroll-px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export default function HomePage() {
  const featured = getFeaturedCaseStudies(3);
  const { caseStudyCta } = getWorkIntro();
  const allInsights = getInsights();
  const [latestInsight, ...moreInsights] = allInsights;
  const insights = moreInsights.slice(0, 3);
  // The rail leads with the freshest read, then the rest.
  const railInsights = [latestInsight, ...insights].filter(Boolean);
  const insightCount = allInsights.length;
  const caseCount = getCaseStudies().length;

  return (
    <>
      <JsonLd data={personSchema()} />
      <JsonLd data={websiteSchema()} />
      {/* Right-pinned portrait clouds keep the full-bleed hero copy over
          clean dark sky. Desktop (landscape scene) is unaffected. */}
      <NebulaBackground heroClouds="right" />
      {/* Light scrim + per-glyph text-shadow keep the hero legible where a
          line crosses the right-side gas. The rail cards are glass, so they
          carry their own contrast. Phones only. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[5] bg-gradient-to-b from-base/35 via-base/38 to-base/68 md:hidden"
      />
      <PageShell>
        {/* ------------------------------------------------------------------
            MOBILE (< md): horizontal rails. The page scrolls down through a
            short list of sections, but the content inside each — work,
            insights — is swiped sideways. The fold shows the hero with the
            first rail card peeking up, signalling the sideways motion.
        ------------------------------------------------------------------ */}
        <div className="md:hidden [text-shadow:0_1px_14px_rgba(3,5,10,0.7)]">
          {/* Hero fills the fold; a cue names what's below instead of a
              vertical peek. (The sideways peek lives inside the rails.) */}
          <section className="flex min-h-[calc(100svh-5.5rem)] flex-col justify-center">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted">
              <span className="font-display font-semibold text-ink">
                {site.name.split(" ")[0]}
              </span>
              <span aria-hidden className="h-px flex-1 bg-line/60" />
              <span>{site.location}</span>
            </div>
            <Heading
              size="hero"
              className="mt-7 !text-[clamp(2.1rem,1.2rem+5vw,2.7rem)] !leading-[1.06]"
            >
              I design the{" "}
              <span className="text-accent" data-nebula-shape="hex">
                systems
              </span>{" "}
              enterprises run on.
            </Heading>
            <Text variant="emphasis" className="mt-5">
              I lead the architecture and the teams that ship it.
            </Text>
            <div className="mt-10 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted">
              <span aria-hidden className="animate-bounce text-accent">
                ↓
              </span>
              <a href="#m-insights" className="hover:text-ink">
                Insights
              </a>
              <span aria-hidden>·</span>
              <a href="#m-work" className="hover:text-ink">
                Case studies
              </a>
            </div>
          </section>

          {/* Insights rail, first. Cards lead with a tag + date: the
              writing signature. */}
          {railInsights.length > 0 && (
            <section className="pt-6" aria-labelledby="m-insights">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <Eyebrow>Insights</Eyebrow>
                    <span className="text-xs tabular-nums text-muted">
                      {insightCount} written
                    </span>
                  </div>
                  <Heading size="sub" id="m-insights" className="mt-2">
                    Swipe the notes
                  </Heading>
                  <Text variant="small" className="mt-1">
                    How I think about systems, in writing.
                  </Text>
                </div>
                <ArrowLink href="/insights" label="All" nebulaShape="article" />
              </div>
              <div className={rail}>
                {railInsights.map((insight) => {
                  const [primaryTag] = insight.tags;
                  return (
                    <Link
                      key={insight.slug}
                      href={`/insights/${insight.slug}`}
                      className={`group ${railCard} overflow-hidden`}
                    >
                      {/* Tag left, date/read-time small and right-aligned;
                          both shrunk (pill + date) so the pair fits the narrow
                          rail card, and the row wraps rather than clipping. */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {primaryTag && (
                          <Eyebrow
                            pill
                            nebulaShape={tagShape(primaryTag)}
                            className="!px-2.5 !py-0.5 !text-[0.625rem] !tracking-[0.1em]"
                          >
                            {primaryTag}
                          </Eyebrow>
                        )}
                        <span className="ml-auto shrink-0 text-[0.625rem] uppercase tracking-wide tabular-nums text-muted">
                          {formatDate(insight.date)} ·{" "}
                          {insight.readingTimeMinutes} min
                        </span>
                      </div>
                      <Heading size="item" className="mt-3">
                        {insight.title}
                      </Heading>
                      <Text variant="muted" className="mt-2 mb-5 min-w-0 text-sm line-clamp-3 wrap-anywhere">
                        {insight.description}
                      </Text>
                      {/* C6: a full-width action bar pinned to the card bottom
                          (mt-auto) so footers line up across the stretched rail
                          cards, without a flex-1 fighting the line-clamp. */}
                      <span
                        data-nebula-shape="article"
                        className="-mx-4 -mb-4 mt-auto flex items-center justify-between gap-1.5 border-t border-accent/25 bg-accent/10 px-4 py-3 text-sm font-medium text-accent transition-colors group-hover:bg-accent group-hover:text-accent-ink"
                      >
                        Read the write-up <span aria-hidden>→</span>
                      </span>
                    </Link>
                  );
                })}
                {/* Trailing "see all" card closes the rail, matching work. */}
                <Link
                  href="/insights"
                  className={`${railCard} items-start justify-center !bg-[#0d0a08]/40`}
                >
                  <Heading size="item">All insights</Heading>
                  <span
                    data-nebula-shape="article"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent"
                  >
                    Open the archive <span aria-hidden>→</span>
                  </span>
                </Link>
              </div>
            </section>
          )}

          {/* Case studies rail, second. Cards lead with a category badge +
              tech chips: clearly work, not a note. */}
          <section className="pt-9" aria-labelledby="m-work">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <Eyebrow>Case studies</Eyebrow>
                  <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted">
                    <Icon name="check" size={13} className="text-accent" />
                    {caseCount} shipped
                  </span>
                </div>
                <Heading size="sub" id="m-work" className="mt-2">
                  Swipe the work
                </Heading>
                <Text variant="small" className="mt-1">
                  Real work, delivered end to end.
                </Text>
              </div>
              <ArrowLink href="/work" label="All" nebulaShape="hex" />
            </div>
            <div className={rail}>
              {featured.map((caseStudy) => (
                <Link
                  key={caseStudy.slug}
                  href={`/work/${caseStudy.slug}`}
                  className={`group ${railCard} overflow-hidden`}
                >
                  {/* Icon chip + category. Case studies are icon-forward and
                      date-less, unlike the tag + date insight cards. */}
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line/50 bg-white/4 text-muted"
                    >
                      <Icon name={categoryIcon(caseStudy.category)} size={16} />
                    </span>
                    <Eyebrow nebulaShape={categoryShape(caseStudy.category)}>
                      {caseStudy.category}
                    </Eyebrow>
                  </div>
                  <Heading size="item" className="mt-3">
                    {caseStudy.title}
                  </Heading>
                  <Text variant="muted" className="mt-2 min-w-0 text-sm line-clamp-3 wrap-anywhere">
                    {caseStudy.impact}
                  </Text>
                  <div className="mt-auto pt-4">
                    <TagList tags={caseStudy.techs} limit={3} />
                  </div>
                  {/* Neutral read-bar (not the insight's accent bar) marks
                      these as delivered work, read separately from writing. */}
                  <span
                    data-nebula-shape={categoryShape(caseStudy.category)}
                    className="-mx-4 -mb-4 mt-4 flex items-center justify-between gap-1.5 border-t border-line/50 bg-white/3 px-4 py-3 text-sm font-medium text-ink transition-colors group-hover:bg-white/6"
                  >
                    {caseStudyCta}
                    <span aria-hidden className="text-accent">→</span>
                  </span>
                </Link>
              ))}
              {/* Trailing "see all" card closes the rail. */}
              <Link
                href="/work"
                className={`${railCard} items-start justify-center !bg-[#0d0a08]/40`}
              >
                <Heading size="item">All case studies</Heading>
                <span
                  data-nebula-shape="hex"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent"
                >
                  Open the archive <span aria-hidden>→</span>
                </span>
              </Link>
            </div>
          </section>

          {/* About + contact: a single grounded strip after the rails. */}
          <section className="mt-10 border-t border-line/40 pt-8">
            <div className="flex items-center gap-4">
              <Link
                href="/about"
                aria-label="About Art"
                className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-full border border-line/50"
              >
                <Image
                  src="/images/portrait.webp"
                  alt={site.name}
                  width={800}
                  height={1000}
                  loading="eager"
                  sizes="4rem"
                  className="h-full w-full object-cover"
                />
              </Link>
              <Text variant="muted" className="text-sm">
                I work where systems, teams, and messy production constraints
                meet.{" "}
                <TextLink href="/about" nebulaShape="profile">
                  About me
                </TextLink>
                .
              </Text>
            </div>
            <Heading size="section" className="mt-8">
              Bring me a messy problem.
            </Heading>
            <Text variant="muted" className="mt-3">
              Email{" "}
              <TextLink href={`mailto:${site.email}`} nebulaShape="email">
                {site.email}
              </TextLink>{" "}
              or find me on{" "}
              <TextLink href={site.linkedin} nebulaShape="linkedin">
                LinkedIn
              </TextLink>
              .
            </Text>
          </section>
        </div>

        {/* ------------------------------------------------------------------
            DESKTOP (md+): unchanged card bento.
        ------------------------------------------------------------------ */}
        <div className="hidden md:block">
          <div className="space-y-6 md:space-y-8">
            {/* FOLD: on desktop the bento fills the viewport (min-h in dvh, a
                minimum not a fixed height, so short/landscape screens still
                scroll) with a scroll cue pinned to the bottom — the same
                deliberate fold the phone gets. */}
            <div className="lg:flex lg:min-h-[calc(100dvh-9rem)] lg:flex-col">
              {/* Center the bento vertically so tall/large screens get
                  balanced breathing room instead of a gap under the hero. */}
              <div className="lg:flex lg:flex-1 lg:items-center">
                <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] lg:grid-rows-[auto_auto] md:gap-8">
              {/* Hero */}
              {/* Borderless editorial hero (borrowed from the winning desktop),
                  keeping the rule-masthead identity. */}
              <section className="grid items-center md:min-h-[22rem] lg:row-span-2 lg:min-h-[34rem]">
                <div className="min-w-0 [text-shadow:0_1px_16px_rgba(3,5,10,0.6)]">
                  {/* Rule-masthead hero identity, matching the mobile rails. */}
                  <div className="mb-5 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-muted">
                    <span className="font-display font-semibold text-ink">
                      {site.name.split(" ")[0]}
                    </span>
                    <span aria-hidden className="h-px flex-1 bg-line/60" />
                    <span>{site.location}</span>
                  </div>
                  <Heading size="hero" className="max-w-3xl">
                    I design the{" "}
                    <span className="text-accent" data-nebula-shape="hex">
                      systems
                    </span>{" "}
                    enterprises run on.
                  </Heading>
                  <Text variant="emphasis" className="mt-5 md:mt-7">
                    I lead the architecture and the teams that ship it.
                  </Text>
                  {/* Cut on phones: the About card below covers the same
                      ground, and every line here pushes the insight card
                      further below the fold. */}
                  <Text
                    variant="muted"
                    className="mt-3 hidden max-w-2xl md:block"
                  >
                    I take modernization from the first whiteboard session through
                    production: architecture, teams, and delivery.
                  </Text>
                </div>
              </section>

              {latestInsight && (
                <Panel
                  as="section"
                  variant="glass"
                  aria-labelledby="home-latest-insight"
                  className="flex flex-col justify-between gap-5 overflow-hidden border-l-2 border-l-accent/60 !backdrop-blur-none md:min-h-[18rem] md:gap-8"
                >
                  <div className="min-w-0">
                    {/* Accent label + edge + date mark this as a fresh, dated
                        article — content that changes — versus the permanent
                        About section below. */}
                    <Text
                      variant="muted"
                      className="mb-4 text-sm uppercase tracking-wide"
                    >
                      <span className="text-accent">Latest insight</span> ·{" "}
                      {formatDate(latestInsight.date)} ·{" "}
                      {latestInsight.readingTimeMinutes} min read
                    </Text>
                    <Heading
                      size="section"
                      id="home-latest-insight"
                      className="max-w-3xl"
                    >
                      {latestInsight.title}
                    </Heading>
                    {/* Phones get a three-line teaser and no tag row; the
                        full description and tags live on the write-up. */}
                    <Text
                      variant="lead"
                      className="mt-4 line-clamp-3 max-w-2xl md:mt-5 md:line-clamp-none"
                    >
                      {latestInsight.description}
                    </Text>
                    {latestInsight.tags.length > 0 && (
                      <TagList
                        tags={latestInsight.tags}
                        variant="pill"
                        className="mt-5 hidden md:flex"
                      />
                    )}
                  </div>
                  {/* D3: an article-style footer bar makes the insight read
                      as a tappable write-up, echoing the mobile card. */}
                  <Link
                    href={`/insights/${latestInsight.slug}`}
                    data-nebula-shape="article"
                    className="-mx-5 -mb-5 flex items-center justify-between border-t border-accent/25 bg-accent/10 px-5 py-4 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-ink md:-mx-8 md:-mb-8 md:px-8"
                  >
                    Read the write-up <span aria-hidden>→</span>
                  </Link>
                </Panel>
              )}

              <Panel
                as="section"
                variant="glass"
                aria-label="About Art"
                className="grid grid-cols-[minmax(0,1fr)_6rem] items-start gap-5 !backdrop-blur-none sm:grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)] sm:items-center lg:grid-cols-[minmax(0,1fr)_minmax(8rem,10rem)]"
              >
                <div className="min-w-0">
                  {/* A plain section label marks About as a permanent fixture
                      of the site, not timely content. */}
                  <Eyebrow className="mb-3">About</Eyebrow>
                  <Text variant="muted">
                    I work where systems, teams, and messy production constraints
                    meet. I'm always ready to take on the next challenge.
                  </Text>
                  <div className="mt-4">
                    <ArrowLink
                      href="/about"
                      label="About me"
                      nebulaShape="profile"
                    />
                  </div>
                </div>
                {/* Phones get a small square crop so the panel still reads
                    as a person; sm+ keeps the taller portrait. */}
                <Link
                  href="/about"
                  aria-label="About Art"
                  className="relative aspect-square w-full overflow-hidden rounded-xl border border-line/50 sm:aspect-[4/5]"
                >
                  <Image
                    src="/images/portrait.webp"
                    alt={site.name}
                    width={800}
                    height={1000}
                    loading="eager"
                    sizes="(max-width: 640px) 6rem, (max-width: 1024px) 12rem, 10rem"
                    className="h-full w-full object-cover"
                  />
                </Link>
                </Panel>
                </div>
              </div>
              {/* Scroll cue at the fold bottom (desktop only). */}
              <div className="mt-10 hidden items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted lg:flex">
                <span aria-hidden className="animate-bounce text-accent">
                  ↓
                </span>
                <a href="#home-insights" className="hover:text-ink">
                  Insights
                </a>
                <span aria-hidden>·</span>
                <a href="#home-work" className="hover:text-ink">
                  Case studies
                </a>
              </div>
            </div>

            {insights.length > 0 && (
              <Section
                eyebrow="More insights"
                title="More notes on systems and decisions"
                id="home-insights"
                variant="flow"
                action={
                  <ArrowLink
                    href="/insights"
                    label="All insights"
                    nebulaShape="article"
                  />
                }
              >
                {/* Card grid, not divided rows — the below-fold picks up the
                    same fresh-article treatment (accent footer bar) as the
                    fold insight and the mobile rail. */}
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {insights.map((insight) => {
                    const [primaryTag] = insight.tags;
                    return (
                      <Link
                        key={insight.slug}
                        href={`/insights/${insight.slug}`}
                        className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d0a08]/60 shadow-2xl shadow-black/30 ring-1 ring-white/5"
                      >
                        <div className="flex flex-1 flex-col p-6">
                          {/* Tag left, date/read-time small and right-aligned;
                              wraps rather than clipping on narrow cards. */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            {primaryTag && (
                              <Eyebrow pill nebulaShape={tagShape(primaryTag)}>
                                {primaryTag}
                              </Eyebrow>
                            )}
                            <span className="ml-auto shrink-0 text-[0.7rem] uppercase tracking-wide tabular-nums text-muted">
                              {formatDate(insight.date)} ·{" "}
                              {insight.readingTimeMinutes} min
                            </span>
                          </div>
                          <Heading size="item" className="mt-3">
                            {insight.title}
                          </Heading>
                          <Text
                            variant="muted"
                            className="mt-2 min-w-0 text-sm line-clamp-2 wrap-anywhere"
                          >
                            {insight.description}
                          </Text>
                        </div>
                        <span
                          data-nebula-shape="article"
                          className="flex items-center justify-between gap-1.5 border-t border-accent/25 bg-accent/10 px-6 py-3.5 text-sm font-medium text-accent transition-colors group-hover:bg-accent group-hover:text-accent-ink"
                        >
                          Read the write-up <span aria-hidden>→</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </Section>
            )}

            <Section
              eyebrow="Case studies"
              title="Systems that changed how the business runs"
              id="home-work"
              variant="flow"
              action={
                <ArrowLink
                  href="/work"
                  label="All case studies"
                  nebulaShape="hex"
                />
              }
            >
              {/* Delivered-work cards: prominent category icon chip + tech
                  chips + a neutral read-bar, distinct from the fresh-article
                  insight cards (tag + date + accent bar). */}
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((caseStudy) => (
                  <Link
                    key={caseStudy.slug}
                    href={`/work/${caseStudy.slug}`}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d0a08]/60 shadow-2xl shadow-black/30 ring-1 ring-white/5"
                  >
                    <div className="flex flex-1 flex-col p-6">
                      {/* Icon chip + category — icon-forward, date-less. */}
                      <div className="flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line/50 bg-white/4 text-muted"
                        >
                          <Icon
                            name={categoryIcon(caseStudy.category)}
                            size={18}
                          />
                        </span>
                        <Eyebrow nebulaShape={categoryShape(caseStudy.category)}>
                          {caseStudy.category}
                        </Eyebrow>
                      </div>
                      <Heading size="item" className="mt-3">
                        {caseStudy.title}
                      </Heading>
                      <Text
                        variant="muted"
                        className="mt-2 min-w-0 text-sm line-clamp-2 wrap-anywhere"
                      >
                        {caseStudy.impact}
                      </Text>
                      <div className="mt-auto pt-4">
                        <TagList tags={caseStudy.techs} limit={3} />
                      </div>
                    </div>
                    {/* Neutral read-bar, distinct from the accent insight bar. */}
                    <span
                      data-nebula-shape={categoryShape(caseStudy.category)}
                      className="flex items-center justify-between gap-1.5 border-t border-line/50 bg-white/3 px-6 py-3.5 text-sm font-medium text-ink transition-colors group-hover:bg-white/6"
                    >
                      {caseStudyCta}{" "}
                      <span aria-hidden className="text-accent">
                        →
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </Section>

            <Section
              title="Bring me a messy problem."
              id="home-contact"
              variant="card"
              className="!backdrop-blur-none"
            >
              <Text variant="muted" className="mt-4 max-w-prose">
                Email{" "}
                <TextLink href={`mailto:${site.email}`} nebulaShape="email">
                  {site.email}
                </TextLink>{" "}
                or find me on{" "}
                <TextLink href={site.linkedin} nebulaShape="linkedin">
                  LinkedIn
                </TextLink>
                . More ways to reach me are on the{" "}
                <TextLink href="/contact" nebulaShape="plane">
                  contact page
                </TextLink>
                .
              </Text>
            </Section>
          </div>
        </div>
      </PageShell>
    </>
  );
}
