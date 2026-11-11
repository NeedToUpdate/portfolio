import Heading from "@/components/ui/Heading";

interface HeroHeadlineProps {
  as?: "p";
  className: string;
}

/** The home page's headline, shared by the mobile and desktop heroes. */
export default function HeroHeadline({ as, className }: HeroHeadlineProps) {
  return (
    <Heading size="hero" as={as} className={className}>
      I design the{" "}
      <span className="text-accent" data-nebula-shape="hex">
        systems
      </span>{" "}
      enterprises run on.
    </Heading>
  );
}
