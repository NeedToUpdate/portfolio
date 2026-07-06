import Text from "@/components/ui/Text";

interface MetricStatProps {
  value: string;
  label: string;
}

/** A single quantified proof point. Used in strips of three or four. */
export default function MetricStat({ value, label }: MetricStatProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-display text-3xl font-semibold tracking-tight text-ink">{value}</span>
      <Text variant="small" as="span" className="leading-snug">
        {label}
      </Text>
    </div>
  );
}
