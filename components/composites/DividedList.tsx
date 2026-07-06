import { ReactNode } from "react";

interface DividedListProps {
  children: ReactNode;
  /** Draw a top border above the first item. */
  borderTop?: boolean;
  className?: string;
}

/** Stacked list entries separated by hairlines. The editorial list pattern. */
export default function DividedList({ children, borderTop = false, className = "" }: DividedListProps) {
  return (
    <div
      className={`divide-y divide-line/50 ${borderTop ? "border-t border-line/60" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
