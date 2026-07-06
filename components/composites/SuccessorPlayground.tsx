"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import InteractiveFigure from "./InteractiveFigure";
import { peanoOf } from "@/lib/peano";

const MAX_N = 7;

/**
 * Interactive builder for Peano numerals. The reader applies the
 * successor function one press at a time and watches numbers appear.
 */
export default function SuccessorPlayground() {
  const [n, setN] = useState(0);

  return (
    <InteractiveFigure caption="Every whole number is some count of successor applications to zero.">
      <div className="flex flex-col gap-4">
        <div className="min-h-[3.5rem] overflow-x-auto">
          <p className="font-mono text-sm text-muted">This expression:</p>
          <p className="font-mono text-lg text-ink" data-testid="peano-expression">
            {peanoOf(n)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-mono text-sm text-muted">names the number:</p>
          <p className="font-display text-3xl font-semibold text-accent" data-testid="peano-value">
            {n}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setN((v) => Math.min(v + 1, MAX_N))} disabled={n >= MAX_N}>
            Apply S( )
          </Button>
          <Button variant="outline" onClick={() => setN(0)} disabled={n === 0}>
            Reset to 0
          </Button>
        </div>
      </div>
    </InteractiveFigure>
  );
}
