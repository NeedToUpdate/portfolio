"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import { routeArrowClass, routeNodeClass } from "@/lib/routeDiagram";
import InteractiveFigure from "./InteractiveFigure";

type CortexId = "motor" | "hippocampus" | "cerebellum";

interface Message {
  label: string;
  cortex: CortexId;
  explanation: string;
}

const MESSAGES: Message[] = [
  {
    label: '"Turn off the living room lights"',
    cortex: "motor",
    explanation: "A device command. The motor cortex calls the light's FastMCP tool directly.",
  },
  {
    label: '"What did I tell you about the dentist?"',
    cortex: "hippocampus",
    explanation:
      "A memory query. The hippocampus searches the Neo4j graph for that thread and returns it.",
  },
  {
    label: '"Remind me to buy milk in an hour"',
    cortex: "cerebellum",
    explanation: "A scheduled action. The cerebellum registers a cron job on the MCP scheduler.",
  },
];

const CORTICES: { id: CortexId; label: string }[] = [
  { id: "motor", label: "Motor cortex" },
  { id: "hippocampus", label: "Hippocampus" },
  { id: "cerebellum", label: "Cerebellum" },
];

/** Pick a sample message and watch the prefrontal lobe route it. */
export default function BrainRouterDemo() {
  const [index, setIndex] = useState(0);
  const message = MESSAGES[index];

  return (
    <InteractiveFigure caption="Every message passes through one router before it reaches a specialized cortex.">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-3">
          {MESSAGES.map((m, i) => (
            <Button
              key={m.label}
              variant={i === index ? "solid" : "outline"}
              shape="pill"
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
            >
              {m.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span data-testid="node-user" className={routeNodeClass(true)}>
            You
          </span>
          <span aria-hidden className={routeArrowClass(true)}>
            →
          </span>
          <span data-testid="node-prefrontal" className={routeNodeClass(true)}>
            Prefrontal lobe
          </span>
          <span aria-hidden className={routeArrowClass(true)}>
            →
          </span>
          <span className="flex flex-col gap-2">
            {CORTICES.map((cortex) => (
              <span
                key={cortex.id}
                data-testid={`node-${cortex.id}`}
                className={routeNodeClass(cortex.id === message.cortex)}
              >
                {cortex.label}
              </span>
            ))}
          </span>
        </div>

        <Text variant="small" data-testid="cortex-explanation" as="p">
          {message.explanation}
        </Text>
      </div>
    </InteractiveFigure>
  );
}
