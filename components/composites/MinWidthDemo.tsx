"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import InteractiveFigure from "./InteractiveFigure";

const LONG_TOKEN =
  "cloudfront-e2xyzexample8675309.cloudfront.net/_next/static/chunks/main-app-4f3ba48d6568.js";

/**
 * The min-width bug from the write-up, live. A flex child refuses to
 * shrink below its content until min-width: 0 says it can.
 */
export default function MinWidthDemo() {
  const [fixed, setFixed] = useState(false);

  return (
    <InteractiveFigure prompt="toggle the fix" caption="A flex child's default min-width is its content size. Long unbroken strings blow the row open until min-width: 0 lets it shrink.">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setFixed((f) => !f)} aria-pressed={fixed}>
            {fixed ? "Remove the fix" : "Apply min-width: 0"}
          </Button>
          <code className="rounded bg-raised px-2 py-1 font-mono text-xs text-muted">
            {fixed ? "min-width: 0" : "min-width: auto (default)"}
          </code>
        </div>

        {/* The stage clips the blowout so the bug cannot escape the demo. */}
        <div className="overflow-hidden rounded-md border border-dashed border-line/70 p-3">
          <div className="flex w-full items-center gap-3 rounded-md border border-accent/40 p-3">
            <span className="shrink-0 rounded bg-raised px-2 py-1 font-mono text-xs text-muted">
              sidebar
            </span>
            {/* span, not p: the global overflow-wrap rule on p would
                quietly rescue the broken state. */}
            <span
              data-testid="minwidth-content"
              className={`rounded bg-raised px-2 py-1 font-mono text-xs text-ink ${
                fixed ? "min-w-0 truncate" : "whitespace-nowrap"
              }`}
            >
              {LONG_TOKEN}
            </span>
          </div>
        </div>

        <Text variant="small" data-testid="minwidth-explanation">
          {fixed
            ? "The child may now shrink below its content, so the row fits and the URL truncates."
            : "The URL cannot wrap, the child cannot shrink, and the row runs off the edge. The dashed border is the clip saving this page."}
        </Text>
      </div>
    </InteractiveFigure>
  );
}
