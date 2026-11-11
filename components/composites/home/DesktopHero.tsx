import Text from "@/components/ui/Text";
import HeroMasthead from "./HeroMasthead";
import HeroHeadline from "./HeroHeadline";

/**
 * Borderless editorial hero (borrowed from the winning desktop), keeping
 * the rule-masthead identity.
 */
export default function DesktopHero() {
  return (
    <section className="grid items-center md:min-h-[22rem] lg:row-span-2 lg:min-h-[34rem]">
      <div className="min-w-0 [text-shadow:0_1px_16px_rgba(3,5,10,0.6)]">
        {/* Rule-masthead hero identity, matching the mobile rails. */}
        <HeroMasthead className="mb-5 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-muted" />
        {/* Rendered as <p>, not <h1>: this desktop hero is a
            responsive duplicate of the mobile hero above, which
            owns the page's single <h1>. Emitting a second <h1>
            here would put two in the page source (both are always
            in the DOM, only one visible per breakpoint). */}
        <HeroHeadline as="p" className="max-w-3xl" />
        <Text variant="emphasis" className="mt-5 md:mt-7">
          I lead the architecture and the teams that build it.
        </Text>
        {/* Cut on phones: the About card below covers the same
            ground, and every line here pushes the insight card
            further below the fold. */}
        <Text variant="muted" className="mt-3 hidden max-w-2xl md:block">
          I take modernization from the first whiteboard session
          through production: architecture, teams, and delivery.
        </Text>
      </div>
    </section>
  );
}
