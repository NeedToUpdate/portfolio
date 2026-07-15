"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import { routeArrowClass, routeNodeClass } from "@/lib/routeDiagram";
import InteractiveFigure from "./InteractiveFigure";

type RequestKind = "page" | "api" | "asset" | "repeat";

interface PathSpec {
  label: string;
  /** Node ids the request touches, in order. */
  path: string[];
  explanation: string;
}

const REQUESTS: Record<RequestKind, PathSpec> = {
  page: {
    label: "A page",
    path: ["browser", "cloudfront", "lambda"],
    explanation:
      "CloudFront forwards the request to the Lambda, where Next.js renders the HTML on demand.",
  },
  api: {
    label: "An API request",
    path: ["browser", "cloudfront", "lambda"],
    explanation:
      "CloudFront forwards API requests to the same Lambda. Next.js routes them to the matching API handler.",
  },
  asset: {
    label: "A static asset",
    path: ["browser", "cloudfront", "s3"],
    explanation:
      "Scripts, styles, and images come from S3 with immutable cache headers. The Lambda never sees them.",
  },
  repeat: {
    label: "A repeat visit",
    path: ["browser", "cloudfront"],
    explanation:
      "CloudFront already holds the response at the edge. Neither origin gets a request.",
  },
};

const NODES: { id: string; label: string }[] = [
  { id: "browser", label: "Browser" },
  { id: "cloudfront", label: "CloudFront" },
  { id: "lambda", label: "Lambda (pages + API)" },
  { id: "s3", label: "S3 (static)" },
];

/** Click a request type and watch which origin serves it. */
export default function RequestPathExplorer() {
  const [kind, setKind] = useState<RequestKind>("page");
  const spec = REQUESTS[kind];
  const active = (id: string) => spec.path.includes(id);

  return (
    <InteractiveFigure prompt="pick a request" caption="One CloudFront distribution, two origins. The request type picks the path.">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(REQUESTS) as RequestKind[]).map((key) => (
            <Button
              key={key}
              variant={key === kind ? "solid" : "outline"}
              shape="pill"
              onClick={() => setKind(key)}
              aria-pressed={key === kind}
            >
              {REQUESTS[key].label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span data-testid="node-browser" className={routeNodeClass(active("browser"))}>
            {NODES[0].label}
          </span>
          <span aria-hidden className={routeArrowClass(active("cloudfront"))}>
            →
          </span>
          <span data-testid="node-cloudfront" className={routeNodeClass(active("cloudfront"))}>
            {NODES[1].label}
          </span>
          <span aria-hidden className={routeArrowClass(active("lambda") || active("s3"))}>
            →
          </span>
          <span className="flex flex-col gap-2">
            <span data-testid="node-lambda" className={routeNodeClass(active("lambda"))}>
              {NODES[2].label}
            </span>
            <span data-testid="node-s3" className={routeNodeClass(active("s3"))}>
              {NODES[3].label}
            </span>
          </span>
        </div>

        <Text variant="small" data-testid="path-explanation" as="p">
          {spec.explanation}
        </Text>
      </div>
    </InteractiveFigure>
  );
}
