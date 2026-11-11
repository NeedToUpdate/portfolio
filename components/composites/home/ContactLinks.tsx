import TextLink from "@/components/ui/TextLink";
import { site } from "@/lib/site";

/**
 * The "Email … or find me on LinkedIn" run of the home page's contact
 * line. Callers close the sentence, so the desktop card can keep going.
 */
export default function ContactLinks() {
  return (
    <>
      Email{" "}
      <TextLink href={`mailto:${site.email}`} nebulaShape="email">
        {site.email}
      </TextLink>{" "}
      or find me on{" "}
      <TextLink href={site.linkedin} nebulaShape="linkedin">
        LinkedIn
      </TextLink>
    </>
  );
}
