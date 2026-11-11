import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import ArrowLink from "@/components/ui/ArrowLink";
import Panel from "@/components/ui/Panel";
import PortraitLink from "./PortraitLink";

/** The About card beside the hero in the desktop fold. */
export default function AboutPanel() {
  return (
    <Panel
      as="section"
      variant="glass"
      aria-label="About Art"
      className="grid grid-cols-[minmax(0,1fr)_6rem] items-start gap-5 !backdrop-blur-none sm:grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)] sm:items-center lg:grid-cols-[minmax(0,1fr)_minmax(8rem,10rem)]"
    >
      <div className="min-w-0">
        {/* A plain section label marks About as a permanent fixture
        of the site, not timely content. */}
        <Eyebrow className="mb-3">About</Eyebrow>
        <Text variant="muted">
          I work where systems, teams, and messy production
          constraints meet. I&apos;m always ready to take on the next
          challenge.
        </Text>
        <div className="mt-4">
          <ArrowLink
            href="/about"
            label="About me"
            nebulaShape="profile"
          />
        </div>
      </div>
      {/* Phones get a small square crop so the panel still reads
      as a person; sm+ keeps the taller portrait. */}
      <PortraitLink
        className="relative aspect-square w-full overflow-hidden rounded-xl border border-line/50 sm:aspect-[4/5]"
        sizes="(max-width: 640px) 6rem, (max-width: 1024px) 12rem, 10rem"
      />
    </Panel>
  );
}
