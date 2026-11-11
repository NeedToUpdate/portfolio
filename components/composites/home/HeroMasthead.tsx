import { site } from "@/lib/site";

interface HeroMastheadProps {
  className: string;
}

/** The rule masthead over the hero: first name, a hairline, the city. */
export default function HeroMasthead({ className }: HeroMastheadProps) {
  return (
    <div className={className}>
      <span className="font-display font-semibold text-ink">
        {site.name.split(" ")[0]}
      </span>
      <span aria-hidden className="h-px flex-1 bg-line/60" />
      <span>{site.location}</span>
    </div>
  );
}
