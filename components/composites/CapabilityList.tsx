import Text from "@/components/ui/Text";
import { Capability } from "@/lib/types";

interface CapabilityListProps {
  capabilities: Capability[];
  /** Grid column classes for the surrounding layout. */
  columnsClass?: string;
}

/**
 * Named capabilities as a definition grid. Uppercase terms with a gold
 * tick, no hairlines: these must read as principles, not as the case
 * study links they sit near on the work page.
 */
export default function CapabilityList({
  capabilities,
  columnsClass = "sm:grid-cols-2",
}: CapabilityListProps) {
  return (
    <dl className={`grid gap-x-8 gap-y-7 ${columnsClass}`}>
      {capabilities.map((capability) => (
        <div key={capability.term} className="min-w-0">
          <dt className="flex items-center gap-2.5 text-xs uppercase tracking-[0.18em] text-ink">
            <span aria-hidden className="h-px w-4 shrink-0 bg-accent/70" />
            {capability.term}
          </dt>
          <Text variant="small" as="dd" className="mt-2">
            {capability.description}
          </Text>
        </div>
      ))}
    </dl>
  );
}
