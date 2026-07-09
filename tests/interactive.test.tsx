import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RequestPathExplorer from "@/components/composites/RequestPathExplorer";
import MinWidthDemo from "@/components/composites/MinWidthDemo";
import StarfieldDemo from "@/components/composites/StarfieldDemo";

describe("RequestPathExplorer", () => {
  it("starts on the page path through Lambda", () => {
    render(<RequestPathExplorer />);
    expect(screen.getByTestId("path-explanation")).toHaveTextContent(/renders the HTML/i);
  });

  it("routes static assets to S3", () => {
    render(<RequestPathExplorer />);
    fireEvent.click(screen.getByRole("button", { name: /static asset/i }));
    expect(screen.getByTestId("path-explanation")).toHaveTextContent(/S3/);
  });

  it("serves repeat visits from the edge", () => {
    render(<RequestPathExplorer />);
    fireEvent.click(screen.getByRole("button", { name: /repeat visit/i }));
    expect(screen.getByTestId("path-explanation")).toHaveTextContent(/edge/i);
  });
});

describe("MinWidthDemo", () => {
  it("starts in the broken state", () => {
    render(<MinWidthDemo />);
    expect(screen.getByTestId("minwidth-explanation")).toHaveTextContent(/runs off the edge/i);
    expect(screen.getByTestId("minwidth-content")).not.toHaveClass("min-w-0");
  });

  it("applies min-width: 0 on toggle", () => {
    render(<MinWidthDemo />);
    fireEvent.click(screen.getByRole("button", { name: /apply min-width/i }));
    expect(screen.getByTestId("minwidth-content")).toHaveClass("min-w-0");
    expect(screen.getByTestId("minwidth-explanation")).toHaveTextContent(/truncates/i);
  });
});

describe("StarfieldDemo", () => {
  // jsdom has no canvas context; the component must survive that.
  it("renders and regenerates without a canvas context", () => {
    render(<StarfieldDemo />);
    const button = screen.getByRole("button", { name: /generate a new sky/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
  });
});
