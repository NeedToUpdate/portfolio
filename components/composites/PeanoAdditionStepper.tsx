"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import InteractiveFigure from "./InteractiveFigure";
import { additionSteps } from "@/lib/peano";

interface PeanoAdditionStepperProps {
  a?: number;
  b?: number;
}

/**
 * Steps through an addition proof one rewrite at a time,
 * showing which rule justifies each move.
 */
export default function PeanoAdditionStepper({ a = 1, b = 1 }: PeanoAdditionStepperProps) {
  const steps = useMemo(() => additionSteps(a, b), [a, b]);
  const [index, setIndex] = useState(0);

  const step = steps[index];
  const atStart = index === 0;
  const atEnd = index === steps.length - 1;

  return (
    <InteractiveFigure caption="Two rules and nothing else. Each step is mechanical.">
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
            Step {index + 1} of {steps.length}
          </p>
          <p className="font-mono text-xs text-muted">
            computing {a} + {b}
          </p>
        </div>
        <div className="min-h-[3rem] overflow-x-auto rounded bg-raised px-4 py-3">
          <p className="font-mono text-lg text-ink" data-testid="step-expression">
            {step.expression}
          </p>
        </div>
        <p className="text-sm text-muted" data-testid="step-rule">
          {step.rule}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={atStart}>
            Back
          </Button>
          <Button
            onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
            disabled={atEnd}
          >
            {atEnd ? "Done" : "Next step"}
          </Button>
        </div>
      </div>
    </InteractiveFigure>
  );
}
