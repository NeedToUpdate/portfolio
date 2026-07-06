import { ReactNode } from "react";

interface ProseProps {
  children: ReactNode;
  className?: string;
}

/** Long-form text wrapper. Styling lives in globals.css under .prose. */
export default function Prose({ children, className = "" }: ProseProps) {
  return <div className={`prose ${className}`}>{children}</div>;
}
