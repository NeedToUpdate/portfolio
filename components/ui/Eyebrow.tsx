import { ReactNode } from "react";
import Icon, { IconName } from "./Icon";

interface EyebrowProps {
  children: ReactNode;
  /** Optional leading icon, e.g. a category glyph. */
  icon?: IconName;
  /** Render as a bordered badge instead of a bare label. */
  pill?: boolean;
  /** Shape key the nebula background condenses into while hovered. */
  nebulaShape?: string;
  className?: string;
}

/** The small uppercase label above headings and on category markers. */
export default function Eyebrow({
  children,
  icon,
  pill = false,
  nebulaShape,
  className = "",
}: EyebrowProps) {
  return (
    <p
      data-nebula-shape={nebulaShape}
      className={`flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted ${
        pill ? "w-fit rounded-full border border-line/70 px-3 py-1" : ""
      } ${className}`}
    >
      {icon && <Icon name={icon} size={15} className="icon-glow" />}
      {children}
    </p>
  );
}
