import { ReactNode } from "react";
import SectionHeading from "./SectionHeading";

interface SectionProps {
  title: string;
  eyebrow?: string;
  description?: string;
  id: string;
  /** Extra classes for page-specific layout treatments. */
  className?: string;
  /** Optional element rendered opposite the heading, e.g. an ArrowLink. */
  action?: ReactNode;
  children: ReactNode;
}

/** A bordered page section: heading row plus content. */
export default function Section({
  title,
  eyebrow,
  description,
  id,
  className = "",
  action,
  children,
}: SectionProps) {
  return (
    <section
      aria-labelledby={id}
      className={`border-t border-line/60 py-16 ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} id={id} />
        {action}
      </div>
      {children}
    </section>
  );
}
