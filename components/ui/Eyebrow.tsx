import { ReactNode } from "react";
import Icon, { IconName } from "./Icon";

interface EyebrowProps {
  children: ReactNode;
  /** Optional leading icon, e.g. a category glyph. */
  icon?: IconName;
  className?: string;
}

/** The small uppercase label above headings and on category markers. */
export default function Eyebrow({ children, icon, className = "" }: EyebrowProps) {
  return (
    <p
      className={`flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted ${className}`}
    >
      {icon && <Icon name={icon} size={15} className="icon-glow" />}
      {children}
    </p>
  );
}
