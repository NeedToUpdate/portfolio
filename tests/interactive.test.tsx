import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RequestPathExplorer from "@/components/composites/RequestPathExplorer";
import MinWidthDemo from "@/components/composites/MinWidthDemo";
import StarfieldDemo from "@/components/composites/StarfieldDemo";
import BrainRouterDemo from "@/components/composites/BrainRouterDemo";
import HomelabDiagram from "@/components/composites/HomelabDiagram";
import ShapeMorphButtons from "@/components/composites/ShapeMorphButtons";
import AIWorkflowTimeline from "@/components/composites/AIWorkflowTimeline";

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

  it("routes API requests through Lambda", () => {
    render(<RequestPathExplorer />);
    fireEvent.click(screen.getByRole("button", { name: /API request/i }));
    expect(screen.getByTestId("path-explanation")).toHaveTextContent(/same Lambda/i);
    expect(screen.getByTestId("node-lambda")).toHaveClass("border-accent/70");
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

describe("BrainRouterDemo", () => {
  it("starts routed to the motor cortex", () => {
    render(<BrainRouterDemo />);
    expect(screen.getByTestId("cortex-explanation")).toHaveTextContent(/FastMCP tool/i);
  });

  it("routes a memory query to the hippocampus", () => {
    render(<BrainRouterDemo />);
    fireEvent.click(screen.getByRole("button", { name: /dentist/i }));
    expect(screen.getByTestId("cortex-explanation")).toHaveTextContent(/hippocampus/i);
  });

  it("routes a reminder to the cerebellum", () => {
    render(<BrainRouterDemo />);
    fireEvent.click(screen.getByRole("button", { name: /buy milk/i }));
    expect(screen.getByTestId("cortex-explanation")).toHaveTextContent(/cerebellum/i);
  });
});

describe("HomelabDiagram", () => {
  it("starts with the Tailscale node explained", () => {
    render(<HomelabDiagram />);
    expect(screen.getByTestId("node-explanation")).toHaveTextContent(/mesh VPN/i);
  });

  it("explains a node from the ingress path on click", () => {
    render(<HomelabDiagram />);
    fireEvent.click(screen.getByTestId("node-authentik"));
    expect(screen.getByTestId("node-explanation")).toHaveTextContent(/forward-auth check/i);
  });

  it("explains a node from the deployment path on click", () => {
    render(<HomelabDiagram />);
    fireEvent.click(screen.getByTestId("node-argocd"));
    expect(screen.getByTestId("node-explanation")).toHaveTextContent(/reconciles the live cluster/i);
  });
});

describe("ShapeMorphButtons", () => {
  it("renders a real data-nebula-shape trigger for every shape", () => {
    render(<ShapeMorphButtons />);
    for (const key of ["spark", "hex", "book", "nodes", "db", "cloud"]) {
      expect(screen.getByTestId(`shape-${key}`)).toHaveAttribute("data-nebula-shape", key);
    }
  });
});

describe("AIWorkflowTimeline", () => {
  it("starts on the framing stage", () => {
    render(<AIWorkflowTimeline />);
    expect(screen.getByTestId("stage-detail")).toHaveTextContent(/research brief/i);
  });

  it("shows the build stage when selected", () => {
    render(<AIWorkflowTimeline />);
    fireEvent.click(screen.getByTestId("stage-build"));
    expect(screen.getByTestId("stage-detail")).toHaveTextContent(/Fable built the first pass/i);
  });

  it("shows the review stage when selected", () => {
    render(<AIWorkflowTimeline />);
    fireEvent.click(screen.getByTestId("stage-polish"));
    expect(screen.getByTestId("stage-detail")).toHaveTextContent(/UI and UX fixes/i);
  });
});
