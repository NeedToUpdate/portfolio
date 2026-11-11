import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HumanReviewLab from "@/components/composites/HumanReviewLab";

const slider = (label: string) => screen.getByRole("slider", { name: new RegExp(`^${label},`) });
const set = (label: string, value: number) => fireEvent.change(slider(label), { target: { value: String(value) } });
const result = () => screen.getByText(/^With the time above/).nextElementSibling;
/** The big number: time saved, or scope still missing. */
const headline = () => screen.getByText(/^(Implementation time saved|Scope still missing)$/).nextElementSibling;

describe("HumanReviewLab", () => {
  it("starts at a ten-day ask with two days of AI coding, no review, and two days of QA", () => {
    render(<HumanReviewLab />);
    expect(slider("Business ask")).toHaveValue("10");
    expect(slider("AI coding")).toHaveValue("2");
    expect(slider("Human review")).toHaveValue("0");
    expect(slider("QA")).toHaveValue("2");

    expect(headline()).toHaveTextContent("6 days");
    expect(screen.getByText("14/18")).toBeInTheDocument();
    expect(result()).toHaveTextContent(
      "In 4 days total, AI wrote enough code to double the requested scope. However, there are now 5 story points of technical debt, and 4 production bugs to deal with this month.",
    );
  });

  it("clears the escaped bugs and most of the debt once review gets time", () => {
    render(<HumanReviewLab />);
    set("Human review", 4);
    expect(slider("Human review")).toHaveValue("4");
    expect(headline()).toHaveTextContent("2 days");
    expect(screen.getByText("18/18")).toBeInTheDocument();
    expect(result()).toHaveTextContent(/there are no production bugs to deal with this month/);
  });

  it("leaves one contextual bug that QA alone cannot catch", () => {
    render(<HumanReviewLab />);
    set("QA", 8);
    expect(screen.getByText("17/18")).toBeInTheDocument();
    expect(result()).toHaveTextContent(/1 production bug to deal with this month/);
    expect(result()).toHaveTextContent(/did not know about/);
  });

  it("shrinks the other phases to fit a smaller ask", () => {
    render(<HumanReviewLab />);
    set("Human review", 3);
    set("Business ask", 4);
    expect(slider("AI coding")).toHaveValue("2");
    expect(slider("Human review")).toHaveValue("2");
    expect(slider("QA")).toHaveValue("0");
    expect(slider("QA")).toHaveAttribute("max", "0");
  });

  it("reports missing scope when the AI gets no coding time", () => {
    render(<HumanReviewLab />);
    set("AI coding", 0);
    expect(screen.getByText("Scope still missing")).toBeInTheDocument();
    expect(headline()).toHaveTextContent("10 days of work");
    expect(result()).toHaveTextContent(/still unfinished, with 100% of the requested scope missing/);
  });

  it("has nothing to say about an empty ask", () => {
    render(<HumanReviewLab />);
    set("Business ask", 0);
    expect(result()).toHaveTextContent(/The business didn't ask you for anything\./);
  });
});
