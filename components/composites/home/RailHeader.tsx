import { ReactNode } from "react";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import ArrowLink from "@/components/ui/ArrowLink";

interface RailHeaderProps {
  eyebrow: string;
  /** Running count beside the eyebrow, e.g. "12 written". */
  tally: ReactNode;
  /** Heading id; the section's aria-labelledby and the hero cue point here. */
  id: string;
  title: string;
  blurb: string;
  href: string;
  nebulaShape: string;
}

/** Label, count, title, and "All" link above a mobile rail. */
export default function RailHeader({
  eyebrow,
  tally,
  id,
  title,
  blurb,
  href,
  nebulaShape,
}: RailHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div>
        <div className="flex items-baseline gap-3">
          <Eyebrow>{eyebrow}</Eyebrow>
          {tally}
        </div>
        <Heading size="sub" id={id} className="mt-2">
          {title}
        </Heading>
        <Text variant="small" className="mt-1">
          {blurb}
        </Text>
      </div>
      <ArrowLink href={href} label="All" nebulaShape={nebulaShape} />
    </div>
  );
}
