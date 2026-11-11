import Eyebrow from "@/components/ui/Eyebrow";
import Icon, { categoryIcon } from "@/components/ui/Icon";
import { categoryShape } from "@/lib/nebula/shapes";

interface CaseStudyCategoryProps {
  category: string;
  /** Smaller icon chip for the narrow mobile rail card. */
  compact?: boolean;
}

/**
 * Icon chip + category. Case studies are icon-forward and date-less,
 * unlike the tag + date insight cards.
 */
export default function CaseStudyCategory({ category, compact = false }: CaseStudyCategoryProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={
          compact
            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line/50 bg-white/4 text-muted"
            : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line/50 bg-white/4 text-muted"
        }
      >
        <Icon name={categoryIcon(category)} size={compact ? 16 : 18} />
      </span>
      <Eyebrow nebulaShape={categoryShape(category)}>{category}</Eyebrow>
    </div>
  );
}
