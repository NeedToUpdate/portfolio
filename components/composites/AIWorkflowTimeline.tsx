"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import InteractiveFigure from "./InteractiveFigure";

interface Stage {
  id: string;
  tool: string;
  title: string;
  detail: string;
}

const STAGES: Stage[] = [
  {
    id: "frame",
    tool: "ChatGPT",
    title: "1. Frame the problem",
    detail:
      "Seven or eight long conversations before any research began, working out what a site like this actually needs to prove, who it needs to convince, and what to go verify before assuming any of it. The output was a research brief, not a design.",
  },
  {
    id: "research",
    tool: "ChatGPT deep research",
    title: "2. Gather the facts",
    detail:
      "A dedicated research pass against that brief: patterns worth learning from, what made them credible, and where the comparison stopped making sense. This produced findings, not decisions.",
  },
  {
    id: "plan",
    tool: "Claude",
    title: "3. Turn findings into specs",
    detail:
      "The findings became documents: a phased build plan, a layout guide for every component, its user flows and use cases, and a full specification for the background system, precise enough to render without guesswork.",
  },
  {
    id: "build",
    tool: "Fable, in Claude Code",
    title: "4. Build from the spec",
    detail:
      "Fable built the first pass of the entire site against those documents in one long session: pages, components, content structure, and the procedural background. The documents left little to invent.",
  },
  {
    id: "polish",
    tool: "Sonnet, in Claude Code",
    title: "5. Review and fix",
    detail:
      "Sonnet took the second pass: reading every diff, catching the layout bugs no specification can predict, and running the round of UI and UX fixes the first pass missed.",
  },
];

/** Click a stage of the pipeline to see what it actually involved. */
export default function AIWorkflowTimeline() {
  const [index, setIndex] = useState(0);
  const stage = STAGES[index];

  return (
    <InteractiveFigure caption="Five stages, four models, one site. Click a stage for what it actually involved.">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-3">
          {STAGES.map((s, i) => (
            <Button
              key={s.id}
              variant={i === index ? "solid" : "outline"}
              shape="pill"
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
              data-testid={`stage-${s.id}`}
            >
              {s.title}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="w-fit rounded bg-raised px-2 py-1 font-mono text-xs text-muted">
            {stage.tool}
          </span>
          <Text variant="small" data-testid="stage-detail" as="p">
            {stage.detail}
          </Text>
        </div>
      </div>
    </InteractiveFigure>
  );
}
