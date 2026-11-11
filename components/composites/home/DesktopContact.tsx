import Section from "@/components/composites/Section";
import Text from "@/components/ui/Text";
import TextLink from "@/components/ui/TextLink";
import ContactLinks from "./ContactLinks";

/** Closing contact card on desktop. */
export default function DesktopContact() {
  return (
    <Section
      title="Bring me a messy problem."
      id="home-contact"
      variant="card"
      className="!backdrop-blur-none"
    >
      <Text variant="muted" className="mt-4 max-w-prose">
        <ContactLinks />. More ways to reach me are on the{" "}
        <TextLink href="/contact" nebulaShape="plane">
          contact page
        </TextLink>
        .
      </Text>
    </Section>
  );
}
