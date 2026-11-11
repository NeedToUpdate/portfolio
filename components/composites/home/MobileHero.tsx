import Text from "@/components/ui/Text";
import HeroMasthead from "./HeroMasthead";
import HeroHeadline from "./HeroHeadline";
import ScrollCue from "./ScrollCue";

/**
 * Hero fills the fold; a cue names what's below instead of a vertical
 * peek. (The sideways peek lives inside the rails.) Owns the page's <h1>.
 */
export default function MobileHero() {
  return (
    <section className="flex min-h-[calc(100svh-5.5rem)] flex-col justify-center">
      <HeroMasthead className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted" />
      <HeroHeadline className="mt-7 !text-[clamp(2.1rem,1.2rem+5vw,2.7rem)] !leading-[1.06]" />
      <Text variant="emphasis" className="mt-5">
        I lead the architecture and the teams that build it.
      </Text>
      <ScrollCue
        className="mt-10 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted"
        insightsId="m-insights"
        workId="m-work"
      />
    </section>
  );
}
