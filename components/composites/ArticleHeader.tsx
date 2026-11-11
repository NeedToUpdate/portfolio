import { ReactNode } from "react";
import ArticleByline from "./ArticleByline";
import TagList from "./TagList";
import Heading from "@/components/ui/Heading";

interface ArticleHeaderProps {
  title: string;
  /** Italic standfirst under the headline. */
  deck?: string;
  /** Sits above the headline, e.g. the legacy badge. */
  badge?: ReactNode;
  /** The date line's leading items; the tags follow them. */
  meta: ReactNode;
  tags: string[];
  /** Sits under the date line, e.g. the legacy origin card. */
  after?: ReactNode;
}

/** Headline, deck, byline, and date line for insights and legacy articles. */
export default function ArticleHeader({ title, deck, badge, meta, tags, after }: ArticleHeaderProps) {
  return (
    <header>
      {badge}
      <Heading size="page">{title}</Heading>
      {deck ? (
        <p className="mt-3 max-w-prose text-sm italic leading-relaxed text-muted/80">{deck}</p>
      ) : null}
      <div className="mt-5">
        <ArticleByline />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
        {meta}
        {tags.length > 0 && (
          <>
            <span aria-hidden>·</span>
            <TagList tags={tags} />
          </>
        )}
      </div>
      {after}
    </header>
  );
}
