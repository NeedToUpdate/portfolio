import { additionSteps, peanoOf } from "@/lib/peano";

describe("peanoOf", () => {
  it("writes zero as 0", () => {
    expect(peanoOf(0)).toBe("0");
  });

  it("writes 1 as S(0)", () => {
    expect(peanoOf(1)).toBe("S(0)");
  });

  it("writes 3 as three nested successors", () => {
    expect(peanoOf(3)).toBe("S(S(S(0)))");
  });

  it("rejects negative numbers", () => {
    expect(() => peanoOf(-1)).toThrow();
  });

  it("rejects fractions", () => {
    expect(() => peanoOf(1.5)).toThrow();
  });
});

describe("additionSteps", () => {
  it("starts with the plain expression and ends with the sum", () => {
    const steps = additionSteps(1, 1);
    expect(steps[0].expression).toBe("1 + 1");
    expect(steps[steps.length - 1].expression).toBe("2");
  });

  it("walks 1 + 1 through the successor rule exactly once", () => {
    const expressions = additionSteps(1, 1).map((s) => s.expression);
    expect(expressions).toContain("1 + S(0)");
    expect(expressions).toContain("S(1 + 0)");
    expect(expressions).toContain("S(1)");
  });

  it("handles b = 0 with the base rule alone", () => {
    const steps = additionSteps(4, 0);
    expect(steps).toHaveLength(2);
    expect(steps[1].expression).toBe("4");
    expect(steps[1].rule).toBe("a + 0 = a");
  });

  it("computes larger sums correctly", () => {
    const steps = additionSteps(2, 3);
    expect(steps[steps.length - 1].expression).toBe("5");
  });
});
