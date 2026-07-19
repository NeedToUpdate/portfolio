"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import InteractiveFigure from "./InteractiveFigure";

interface Stage {
  id: string;
  owner: string;
  title: string;
  shortTitle: string;
  detail: string;
}

const STAGES: Stage[] = [
  {
    id: "idea",
    owner: "ChatGPT",
    title: "Expand the idea",
    shortTitle: "Idea",
    detail:
      "Start with the rough idea. Ask ChatGPT to expand it, challenge it, and provide links to relevant material. The output is not a specification; it is a map of what I do not know yet.",
  },
  {
    id: "sources",
    owner: "Art",
    title: "Read the sources",
    shortTitle: "Sources",
    detail:
      "Open the links and do the research. Compare the sources, follow their references, and learn the subject myself. AI can expose a research path, but it cannot replace understanding what is on it.",
  },
  {
    id: "expand",
    owner: "Art + ChatGPT",
    title: "Expand what I learned",
    shortTitle: "Expand",
    detail:
      "Bring the research back into the conversation. Correct the original assumptions, add what the sources revealed, and use the stronger idea to uncover the next set of questions.",
  },
  {
    id: "refine",
    owner: "Art + ChatGPT",
    title: "Refine the boundaries",
    shortTitle: "Refine",
    detail:
      "Iterate until the goals, constraints, trade-offs, and unresolved decisions are explicit. Deep Research receives this refined brief, not the vague idea that started the process.",
  },
  {
    id: "deep-research",
    owner: "ChatGPT Deep Research",
    title: "Research the refined idea",
    shortTitle: "Deep research",
    detail:
      "Run a dedicated research pass against the refined brief. Because the question is now specific, the findings can resolve real decisions instead of returning a broad information dump.",
  },
  {
    id: "spec",
    owner: "Art + ChatGPT",
    title: "Build the foundation",
    shortTitle: "Foundation",
    detail:
      "Combine the research with my own engineering, content, and design judgment. Define the structure, constraints, authoritative sources, and quality bar. ChatGPT can add detail inside that foundation without deciding the direction for me.",
  },
  {
    id: "build",
    owner: "Fable, then Art + Sonnet",
    title: "Build, inspect, and correct",
    shortTitle: "Build",
    detail:
      "Give the prepared foundation to Fable for the first build. Then inspect the result against the research and agreed constraints, name the failure classes myself, and use Sonnet for focused corrections.",
  },
];

/** The human-led preparation path from a rough idea to reviewed software. */
export default function AIWorkflowTimeline() {
  const [index, setIndex] = useState(0);
  const stage = STAGES[index];

  return (
    <InteractiveFigure
      prompt="trace the idea"
      caption="Seven stages from an idea to a build. AI expands and executes; the human researches, understands, and decides."
    >
      <div className="not-prose flex flex-col gap-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Preparation stages">
          {STAGES.map((item, itemIndex) => (
            <Button
              key={item.id}
              variant={itemIndex === index ? "solid" : "outline"}
              shape="pill"
              onClick={() => setIndex(itemIndex)}
              aria-pressed={itemIndex === index}
              data-testid={`stage-${item.id}`}
            >
              {item.shortTitle}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-2" aria-live="polite">
          <span className="w-fit rounded bg-raised px-2 py-1 font-mono text-xs text-muted">
            {stage.owner}
          </span>
          <h3 className="font-display text-lg font-semibold text-ink">{stage.title}</h3>
          <Text variant="small" data-testid="stage-detail" as="p">
            {stage.detail}
          </Text>
        </div>
      </div>
    </InteractiveFigure>
  );
}
