import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import TextLink from "@/components/ui/TextLink";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <PageShell narrow>
      {/* Lost in space: something to look at in the empty corner. */}
      <NebulaBackground variant="mini" corner="bottom-right" miniShape="crab" color="random" />
      <Text variant="small" className="font-mono text-accent">
        404
      </Text>
      <Heading size="page" className="mt-2">
        This page does not exist.
      </Heading>
      <Text variant="muted" className="mt-4">
        The link is stale or the address is wrong.{" "}
        <TextLink href="/" nebulaShape="spark">
          Start from the home page
        </TextLink>
        .
      </Text>
    </PageShell>
  );
}
