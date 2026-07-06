import Text from "@/components/ui/Text";
import { Capability } from "@/lib/types";

interface CapabilityListProps {
  capabilities: Capability[];
  /** Grid column classes for the surrounding layout. */
  columnsClass?: string;
}

/** Named capabilities as a definition grid. Used on the work index and about page. */
export default function CapabilityList({
  capabilities,
  columnsClass = "sm:grid-cols-2",
}: CapabilityListProps) {
  return (
    <dl className={`grid gap-x-8 gap-y-6 ${columnsClass}`}>
      {capabilities.map((capability) => (
        <div key={capability.term} className="min-w-0 border-t border-line/60 pt-4">
          <dt className="font-display text-sm font-semibold text-ink">{capability.term}</dt>
          <Text variant="small" as="dd" className="mt-2">
            {capability.description}
          </Text>
        </div>
      ))}
    </dl>
  );
}
