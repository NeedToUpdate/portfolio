import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TeamGame from "@/components/composites/TeamGame";
import { LEVELS, T, applyCommand, createGame, levelProgress, speed, step, type Game } from "@/lib/team-game/sim";

/** The component's fixed timestep. */
const TICK = 1 / 30;

function started(seed = 7): Game {
  const game = createGame(seed);
  applyCommand(game, { type: "start" });
  return game;
}

/** Step the sim for `secs` of game time; returns the highest level reached. */
function runFor(game: Game, secs: number): number {
  let highest = game.level;
  const steps = Math.round(secs / TICK);
  for (let i = 0; i < steps; i += 1) {
    step(game, TICK);
    highest = Math.max(highest, game.level);
  }
  return highest;
}

/** Everything but the rng closure, for comparing two runs. */
function plain(game: Game): string {
  return JSON.stringify({ ...game, rng: undefined });
}

describe("team-game sim", () => {
  it("is deterministic for a seed and a command sequence", () => {
    const a = started(11);
    const b = started(11);
    for (const game of [a, b]) {
      runFor(game, 20);
      applyCommand(game, { type: "dev", id: 2 });
      applyCommand(game, { type: "push", on: true });
      runFor(game, 5);
      applyCommand(game, { type: "push", on: false });
      runFor(game, 20);
    }
    expect(plain(a)).toBe(plain(b));
  });

  it("gives every dev a different hidden strength", () => {
    const game = createGame(3);
    expect(new Set(game.devs.map((d) => d.strength)).size).toBe(5);
    expect(new Set(game.devs.map((d) => d.name)).size).toBe(5);
    expect(game.devs.every((d) => !d.revealed)).toBe(true);
  });

  it("does nothing until the reader starts it", () => {
    const game = createGame(7);
    const before = plain(game);
    step(game, 1);
    applyCommand(game, { type: "dev", id: 0 });
    applyCommand(game, { type: "push", on: true });
    applyCommand(game, { type: "measure", on: true });
    expect(plain(game)).toBe(before);

    applyCommand(game, { type: "start" });
    expect(game.started).toBe(true);
    expect(game.events).toHaveLength(1);
  });

  it("raises rapport for a chat, then holds a cooldown per dev", () => {
    const game = started();
    const dev = game.devs.find((d) => d.state === "working")!;
    const rapport = game.rapport;
    applyCommand(game, { type: "dev", id: dev.id });
    expect(game.rapport).toBeCloseTo(rapport + T.chatRapport);
    expect(dev.state).toBe("chatting");
    runFor(game, T.chatSecs + 0.1);
    applyCommand(game, { type: "dev", id: dev.id });
    expect(game.rapport).toBeCloseTo(rapport + T.chatRapport);
  });

  it("speeds up while pushing, then owes twice as long at reduced speed", () => {
    const game = started();
    applyCommand(game, { type: "push", on: true });
    expect(speed(game)).toBe(LEVELS[0].mult * T.pushSpeed);
    runFor(game, 5);
    applyCommand(game, { type: "push", on: false });
    expect(game.debt).toBeCloseTo(5 * T.debtFactor, 1);
    expect(speed(game)).toBe(LEVELS[0].mult * T.debtSpeed);
    runFor(game, 10.1);
    expect(game.debt).toBe(0);
    expect(speed(game)).toBe(LEVELS[0].mult);
  });

  it("hides velocity until measured, then inflates the estimates", () => {
    const game = started();
    expect(game.velocity).toBeNull();
    applyCommand(game, { type: "measure", on: true });
    expect(game.velocity).toBe(0);
    runFor(game, 60);
    expect(game.velocity).toBeGreaterThan(0);
    // Every ticket picked up under the dashboard carries an inflated estimate.
    const repicked = game.devs.filter((dev) => dev.shippedCount > 0);
    expect(repicked.length).toBeGreaterThan(0);
    for (const dev of repicked) expect(dev.points).toBeGreaterThanOrEqual(dev.value * T.measureInflateStart);
  });

  it("ignores the rally until the team reaches 7x", () => {
    const game = started();
    applyCommand(game, { type: "rally" });
    expect(game.level).toBe(0);
    expect(game.rallied).toBe(false);
  });

  it("reports progress toward flow while the room stays calm", () => {
    const game = started();
    runFor(game, T.calmForFlow / 2);
    expect(levelProgress(game)).toBeCloseTo(0.5, 1);
  });

  // RULES.md balance targets. Three simulated minutes is 5,400 steps.
  describe("balance", () => {
    it.each([7, 21, 99])("an idle team reaches flow and caps at 2x (seed %i)", (seed) => {
      const game = started(seed);
      const highest = runFor(game, 180);
      expect(highest).toBe(1);
      expect(game.level).toBe(1);
      expect(speed(game)).toBe(2);
    });

    it.each([
      ["push", 7],
      ["push", 21],
      ["measure", 7],
      ["measure", 21],
    ] as const)("a team kept under %s holds level 0 (seed %i)", (type, seed) => {
      const game = started(seed);
      applyCommand(game, { type, on: true });
      expect(runFor(game, 180)).toBe(0);
    });
  });
});

describe("TeamGame", () => {
  let getContext: jest.SpyInstance;
  let raf: jest.SpyInstance;
  let caf: jest.SpyInstance;

  beforeEach(() => {
    // jsdom has no 2D context; the component draws nothing without one.
    getContext = jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    // Hold the loop: frames are requested but never run, so the view only
    // changes through the controls.
    raf = jest.spyOn(window, "requestAnimationFrame").mockReturnValue(42);
    caf = jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (window as { ResizeObserver?: unknown }).ResizeObserver;
    delete (window as { IntersectionObserver?: unknown }).IntersectionObserver;
  });

  it("renders the team waiting to start", () => {
    render(<TeamGame />);
    expect(screen.getByRole("button", { name: "Meet the team" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Push the team" })).toBeDisabled();
    expect(screen.getByRole("list", { name: "The team" }).children).toHaveLength(5);
    expect(screen.getByText("1x")).toBeInTheDocument();
    expect(getContext).toHaveBeenCalledWith("2d");
  });

  it("starts, then pushes the team and shows the cost", () => {
    render(<TeamGame />);
    fireEvent.click(screen.getByRole("button", { name: "Meet the team" }));
    expect(screen.queryByRole("button", { name: "Meet the team" })).not.toBeInTheDocument();

    const push = screen.getByRole("button", { name: "Push the team" });
    fireEvent.click(push);
    expect(push).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1.1x")).toBeInTheDocument();
    expect(screen.getByText("rushing")).toBeInTheDocument();
    expect(screen.getByText("Nothing improves while you stand over them.")).toBeInTheDocument();
  });

  it("puts up the dashboard: velocity goes from unmeasured to live", () => {
    render(<TeamGame />);
    expect(screen.getByText("unmeasured")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Meet the team" }));
    fireEvent.click(screen.getByRole("button", { name: "Measure the team" }));
    expect(screen.getByText("pts per day")).toBeInTheDocument();
    expect(screen.getByText("measured")).toBeInTheDocument();
  });

  it("cancels its frame and drops its observers and listeners on unmount", () => {
    const observers: { observe: jest.Mock; disconnect: jest.Mock }[] = [];
    class FakeObserver {
      observe = jest.fn();
      disconnect = jest.fn();
      constructor() {
        observers.push(this);
      }
    }
    Object.assign(window, { ResizeObserver: FakeObserver, IntersectionObserver: FakeObserver });
    const added = jest.spyOn(document, "addEventListener");
    const removed = jest.spyOn(document, "removeEventListener");

    const { unmount } = render(<TeamGame />);
    expect(raf).toHaveBeenCalled();
    expect(observers).toHaveLength(2);
    const onVisibility = added.mock.calls.find(([type]) => type === "visibilitychange")?.[1];
    expect(onVisibility).toBeDefined();

    unmount();
    expect(caf).toHaveBeenCalledWith(42);
    for (const observer of observers) expect(observer.disconnect).toHaveBeenCalled();
    expect(removed).toHaveBeenCalledWith("visibilitychange", onVisibility);
  });
});
