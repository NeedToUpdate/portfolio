import Link from "next/link";
import Icon from "@/components/ui/Icon";

interface ArticleBylineProps {
  label?: string;
}

/** Visible authorship shared by insights and case studies. */
export default function ArticleByline({ label = "By" }: ArticleBylineProps) {
  return (
    <Link
      href="/about"
      data-nebula-shape="nodes"
      className="group inline-flex items-center gap-2 rounded-full border border-line/70 bg-panel/45 px-3 py-1.5 text-sm text-muted transition hover:border-accent/50 hover:bg-panel/70 hover:text-ink"
      aria-label="About Art"
    >
      <Icon name="systems" size={15} className="text-accent icon-glow" />
      <span>{label}</span>
      <span className="font-medium text-ink transition-colors group-hover:text-accent">
        Art
      </span>
    </Link>
  );
}
