import TaperCard from "./TaperCard";
import { LegacyArticleMeta } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface LegacyOriginCardProps {
  article: LegacyArticleMeta;
}

/** Path of the write-up about icandoathing.com itself. */
const SITE_WRITEUP = "/legacy/icandoathing";

/**
 * The card on every legacy page that says where the article came
 * from, and when it was first posted. The article's own date line shows
 * when the project was built, so the post date lives here. The
 * thumbnail is a screenshot of the original page.
 */
export default function LegacyOriginCard({ article }: LegacyOriginCardProps) {
  const isSite = article.kind === "site";
  const posted = <time dateTime={article.date}>{formatDate(article.date)}</time>;
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
          I wrote it on {posted}.
        </TaperCard>
      ) : (
        <TaperCard
          image={article.screenshot}
          eyebrow="Legacy article"
          cta="Read about icandoathing.com"
          href={SITE_WRITEUP}
        >
          This is a rewrite of the original page that was on icandoathing.com. I first posted it
          on {posted}.
        </TaperCard>
      )}
    </aside>
  );
}
