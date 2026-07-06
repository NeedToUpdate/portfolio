import { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

/** The raised surface. Interactive figures, notes, and asides sit on one. */
export default function Panel({ children, className = "" }: PanelProps) {
  return (
    <div className={`rounded-xl border border-line/50 bg-surface p-5 ${className}`}>{children}</div>
  );
}
