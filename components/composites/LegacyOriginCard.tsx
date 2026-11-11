import TaperCard from "./TaperCard";
import { LegacyArticleMeta } from "@/lib/types";

interface LegacyOriginCardProps {
  article: LegacyArticleMeta;
}

/** Path of the write-up about icandoathing.com itself. */
const SITE_WRITEUP = "/legacy/icandoathing";

/**
 * The card on every legacy page that says where the article came
 * from. The thumbnail is a screenshot of the original page.
 */
export default function LegacyOriginCard({ article }: LegacyOriginCardProps) {
  const isSite = article.kind === "site";
  return (
    <aside aria-label="About this legacy article" data-nosnippet className="mt-8">
      {isSite ? (
        <TaperCard
          image={article.screenshot}
          eyebrow="Legacy project"
          cta="Visit icandoathing.com"
          href={article.originalUrl}
          external
        >
          This is a write-up of icandoathing.com, the site my legacy articles were first posted on.
        </TaperCard>
      ) : (
        <TaperCard
          image={article.screenshot}
          eyebrow="Legacy article"
          cta="Read about icandoathing.com"
          href={SITE_WRITEUP}
        >
          This is a rewrite of the original page that was on icandoathing.com.
        </TaperCard>
      )}
    </aside>
  );
}
