import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import TextLink from "@/components/ui/TextLink";
import PortraitLink from "./PortraitLink";
import ContactLinks from "./ContactLinks";

/** About + contact: a single grounded strip after the mobile rails. */
export default function MobileAboutContact() {
  return (
    <section className="mt-10 border-t border-line/40 pt-8">
      <div className="flex items-center gap-4">
        <PortraitLink
          className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-full border border-line/50"
          sizes="4rem"
        />
        <Text variant="muted" className="text-sm">
          I work where systems, teams, and messy production constraints
          meet.{" "}
          <TextLink href="/about" nebulaShape="profile">
            About me
          </TextLink>
          .
        </Text>
      </div>
      <Heading size="section" className="mt-8">
        Bring me a messy problem.
      </Heading>
      <Text variant="muted" className="mt-3">
        <ContactLinks />.
      </Text>
    </section>
  );
}
