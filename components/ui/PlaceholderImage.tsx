import Icon, { IconName } from "./Icon";

interface PlaceholderImageProps {
  /** What will eventually live here, e.g. "Architecture diagram". */
  label: string;
  icon?: IconName;
  /** Tailwind aspect class, e.g. "aspect-video" or "aspect-square". */
  aspectClass?: string;
  className?: string;
}

/**
 * A reserved image slot. Marks where real assets go without shipping
 * broken image tags. Swap for an actual image when the asset exists.
 */
export default function PlaceholderImage({
  label,
  icon = "systems",
  aspectClass = "aspect-video",
  className = "",
}: PlaceholderImageProps) {
  return (
    <div
      role="img"
      aria-label={`Placeholder: ${label}`}
      className={`flex ${aspectClass} w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line/70 bg-surface/60 p-4 text-center ${className}`}
    >
      <Icon name={icon} size={28} className="text-muted/70" />
      <span className="max-w-full break-words text-xs tracking-wide text-muted/80">{label}</span>
    </div>
  );
}
