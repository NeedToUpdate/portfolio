/**
 * Pure helpers for the Peano arithmetic components.
 * Kept separate from the React components so they can be unit tested.
 */

/** Writes n in successor notation: 3 → "S(S(S(0)))". */
export function peanoOf(n: number): string {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error("Peano numerals are defined for whole numbers only.");
  }
  let out = "0";
  for (let i = 0; i < n; i++) {
    out = `S(${out})`;
  }
  return out;
}

export interface AdditionStep {
  expression: string;
  rule: string;
}

/**
 * Produces every rewriting step for a + b under the two addition rules:
 *   a + 0 = a
 *   a + S(b) = S(a + b)
 */
export function additionSteps(a: number, b: number): AdditionStep[] {
  const wrap = (inner: string, depth: number): string => {
    let out = inner;
    for (let i = 0; i < depth; i++) {
      out = `S(${out})`;
    }
    return out;
  };

  const steps: AdditionStep[] = [
    { expression: `${a} + ${b}`, rule: "Start with ordinary numerals." },
  ];

  if (b === 0) {
    steps.push({ expression: `${a}`, rule: "a + 0 = a" });
    return steps;
  }

  steps.push({
    expression: wrap(`${a} + ${peanoOf(b)}`, 0),
    rule: `Write ${b} in successor form.`,
  });

  // Peel one successor off b per step: a + S(x) becomes S(a + x).
  for (let peeled = 1; peeled <= b; peeled++) {
    const remaining = b - peeled;
    steps.push({
      expression: wrap(`${a} + ${peanoOf(remaining)}`, peeled),
      rule: "a + S(b) = S(a + b)",
    });
  }

  steps.push({
    expression: wrap(`${a}`, b),
    rule: "a + 0 = a",
  });

  steps.push({
    expression: `${a + b}`,
    rule: `${b} successor${b === 1 ? "" : "s"} of ${a} is ${a + b}.`,
  });

  return steps;
}
