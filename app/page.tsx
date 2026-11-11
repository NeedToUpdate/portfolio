import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import JsonLd from "@/components/ui/JsonLd";
import MobileHero from "@/components/composites/home/MobileHero";
import InsightRail from "@/components/composites/home/InsightRail";
import CaseStudyRail from "@/components/composites/home/CaseStudyRail";
import MobileAboutContact from "@/components/composites/home/MobileAboutContact";
import DesktopFold from "@/components/composites/home/DesktopFold";
import InsightGrid from "@/components/composites/home/InsightGrid";
import CaseStudyGrid from "@/components/composites/home/CaseStudyGrid";
import DesktopContact from "@/components/composites/home/DesktopContact";
import {
  getCaseStudies,
  getFeaturedCaseStudies,
  getInsights,
  getWorkIntro,
} from "@/lib/content";
import { personSchema, websiteSchema } from "@/lib/seo";
import { site } from "@/lib/site";

// The layout's default description is the ~75-character brand line; search
// snippets fill 120–160. This names what the site delivers without touching
// the on-page hero. The <title> stays on the layout default.
const homeDescription =
  "I design the systems enterprises run on. Case studies and write-ups on enterprise modernization, data platforms, AI adoption, and engineering leadership.";

export const metadata: Metadata = {
  description: homeDescription,
  openGraph: {
    type: "website",
    siteName: site.name,
    url: site.url,
    title: `${site.name} · ${site.tagline}`,
    description: homeDescription,
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} · ${site.tagline}`,
    description: homeDescription,
  },
};

export default function HomePage() {
  const featured = getFeaturedCaseStudies(3);
  const { caseStudyCta } = getWorkIntro();
  const allInsights = getInsights();
  const [latestInsight, ...moreInsights] = allInsights;
  const insights = moreInsights.slice(0, 3);
  // The rail leads with the freshest read, then the rest.
  const railInsights = [latestInsight, ...insights].filter((insight) => insight !== undefined);
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
          <MobileHero />
          {railInsights.length > 0 && (
            <InsightRail insights={railInsights} insightCount={insightCount} />
          )}
          <CaseStudyRail
            caseStudies={featured}
            caseCount={caseCount}
            caseStudyCta={caseStudyCta}
          />
          <MobileAboutContact />
        </div>

        {/* ------------------------------------------------------------------
            DESKTOP (md+): unchanged card bento.
        ------------------------------------------------------------------ */}
        <div className="hidden md:block">
          <div className="space-y-6 md:space-y-8">
            <DesktopFold latestInsight={latestInsight} />
            {insights.length > 0 && <InsightGrid insights={insights} />}
            <CaseStudyGrid caseStudies={featured} caseStudyCta={caseStudyCta} />
            <DesktopContact />
          </div>
        </div>
      </PageShell>
    </>
  );
}
