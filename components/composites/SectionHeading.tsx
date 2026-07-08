import Eyebrow from "@/components/ui/Eyebrow";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";

interface SectionHeadingProps {
  /** Small label above the title, e.g. "Case studies". */
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
  /** Render the title as a page h1 instead of a section h2. */
  asPageTitle?: boolean;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  asPageTitle = false,
}: SectionHeadingProps) {
  return (
    <div className="max-w-prose">
      {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
      <Heading size="section" as={asPageTitle ? "h1" : "h2"} id={id}>
        {title}
      </Heading>
      {description && (
        <Text variant="muted" className="mt-4">
          {description}
        </Text>
      )}
    </div>
  );
}
