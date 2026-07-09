import { ReactNode } from "react";
import Panel from "@/components/ui/Panel";
import SectionHeading from "./SectionHeading";

type SectionVariant = "flow" | "card";

interface SectionProps {
  title: string;
  eyebrow?: string;
  description?: string;
  id: string;
  /** Extra classes for page-specific layout treatments. */
  className?: string;
  /** Optional element rendered opposite the heading, e.g. an ArrowLink. */
  action?: ReactNode;
  /** "flow" is a bordered in-page section; "card" is a glass panel. */
  variant?: SectionVariant;
  children: ReactNode;
}

/** A page section: heading row plus content, as a bordered block or a card. */
export default function Section({
  title,
  eyebrow,
  description,
  id,
  className = "",
  action,
  variant = "flow",
  children,
}: SectionProps) {
  const header = (
    <div className="flex flex-wrap items-baseline justify-between gap-4">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} id={id} />
      {action}
    </div>
  );

  if (variant === "card") {
    return (
      <Panel as="section" variant="glass" aria-labelledby={id} className={className}>
        {header}
        {children}
      </Panel>
    );
  }

  return (
    <section aria-labelledby={id} className={`border-t border-line/60 py-16 ${className}`}>
      {header}
      {children}
    </section>
  );
}
