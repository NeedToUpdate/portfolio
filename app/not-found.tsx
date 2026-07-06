import PageShell from "@/components/composites/PageShell";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import TextLink from "@/components/ui/TextLink";

export default function NotFound() {
  return (
    <PageShell narrow>
      <Text variant="small" className="font-mono text-accent">
        404
      </Text>
      <Heading size="page" className="mt-2">
        This page does not exist.
      </Heading>
      <Text variant="muted" className="mt-4">
        The link is stale or the address is wrong.{" "}
        <TextLink href="/">Start from the home page</TextLink>.
      </Text>
    </PageShell>
  );
}
