"use client";

import { useEffect } from "react";
import PageShell from "@/components/composites/PageShell";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import TextLink from "@/components/ui/TextLink";

/**
 * Catches a render error in any page below the root layout, so the nav
 * and footer stay up and the reader gets a way forward instead of
 * Next's bare fallback. The digest ties this view to the server log.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell narrow>
      <Text variant="small" className="font-mono text-accent">
        Error{error.digest ? ` · ${error.digest}` : ""}
      </Text>
      <Heading size="page" className="mt-2">
        This page failed to load.
      </Heading>
      <Text variant="muted" className="mt-4">
        Try it again. If it still fails,{" "}
        <TextLink href="/" nebulaShape="spark">
          start from the home page
        </TextLink>
        .
      </Text>
      <div className="mt-6">
        <Button variant="outline" shape="pill" onClick={reset}>
          Try again
        </Button>
      </div>
    </PageShell>
  );
}
