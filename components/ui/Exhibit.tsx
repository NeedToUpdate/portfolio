import Icon, { IconName } from "./Icon";

interface ExhibitProps {
  /** The diagram image. Omit while the diagram is still being drawn. */
  src?: string;
  alt: string;
  /** Text inside the reserved slot until the diagram exists. */
  label: string;
  icon?: IconName;
  caption?: string;
}

/**
 * An RFP-style exhibit: renders the diagram when it exists, and a
 * reserved slot until then, so every case study declares that a
 * diagram belongs here.
 */
export default function Exhibit({ src, alt, label, icon = "systems", caption }: ExhibitProps) {
  if (!src) {
    return (
      <figure className="mt-10">
        <div
          role="img"
          aria-label={`Placeholder: ${label}`}
          className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line/70 bg-surface/60 p-4 text-center"
        >
          <Icon name={icon} size={28} className="text-muted/70" />
          <span className="max-w-full break-words text-xs tracking-wide text-muted/80">
            {label}
          </span>
        </div>
      </figure>
    );
  }
  return (
    <figure className="mt-10">
      {/* Plain img: exhibit aspect ratios vary per diagram. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full rounded-xl border border-line/60" />
      {caption && <figcaption className="mt-3 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}
