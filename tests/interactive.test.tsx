import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SuccessorPlayground from "@/components/composites/SuccessorPlayground";
import PeanoAdditionStepper from "@/components/composites/PeanoAdditionStepper";

describe("SuccessorPlayground", () => {
  it("starts at zero", () => {
    render(<SuccessorPlayground />);
    expect(screen.getByTestId("peano-value")).toHaveTextContent("0");
    expect(screen.getByTestId("peano-expression")).toHaveTextContent("0");
  });

  it("applies the successor function on click", () => {
    render(<SuccessorPlayground />);
    fireEvent.click(screen.getByRole("button", { name: /apply s/i }));
    expect(screen.getByTestId("peano-value")).toHaveTextContent("1");
    expect(screen.getByTestId("peano-expression")).toHaveTextContent("S(0)");
  });

  it("resets to zero", () => {
    render(<SuccessorPlayground />);
    fireEvent.click(screen.getByRole("button", { name: /apply s/i }));
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(screen.getByTestId("peano-value")).toHaveTextContent("0");
  });
});

describe("PeanoAdditionStepper", () => {
  it("starts at the plain expression", () => {
    render(<PeanoAdditionStepper a={1} b={1} />);
    expect(screen.getByTestId("step-expression")).toHaveTextContent("1 + 1");
  });

  it("steps forward through the rewrite and reaches the sum", () => {
    render(<PeanoAdditionStepper a={1} b={1} />);
    const next = screen.getByRole("button", { name: /next step|done/i });
    for (let i = 0; i < 10; i++) {
      if (!(next as HTMLButtonElement).disabled) {
        fireEvent.click(next);
      }
    }
    expect(screen.getByTestId("step-expression")).toHaveTextContent("2");
  });

  it("steps backward", () => {
    render(<PeanoAdditionStepper a={1} b={1} />);
    fireEvent.click(screen.getByRole("button", { name: /next step/i }));
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByTestId("step-expression")).toHaveTextContent("1 + 1");
  });
});
