"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import Button from "@/components/ui/Button";
import { computeLayout, drawGame, heightFor, hitDev, readPalette, type Layout, type Palette } from "@/lib/team-game/draw";
import {
  LEVELS,
  applyCommand,
  createGame,
  levelProgress,
  revealedCount,
  speed,
  step,
  type Command,
  type Game,
} from "@/lib/team-game/sim";
import InteractiveFigure from "./InteractiveFigure";

/** Fixed simulation tick, in seconds. Rendering runs on every frame. */
const TICK = 1 / 30;

interface Snapshot {
  started: boolean;
  speed: number;
  levelName: string;
  hint: string;
  progress: number;
  trapped: boolean;
  push: boolean;
  /** Paying back a push: the debt window after the toggle goes off. */
  recovering: boolean;
  measure: boolean;
  canRally: boolean;
  rallied: boolean;
  shipped: number;
  points: number;
  cups: number;
  happiness: number;
  /** Points per day while measured; "?" until the dashboard has ever been up. */
  velocity: string;
  velocityLive: boolean;
  revealed: number;
  devs: {
    id: number;
    name: string;
    strength: string;
    revealed: boolean;
    state: string;
    stuck: boolean;
    /** The area the stuck is in, e.g. "legacy". Short enough for a chip. */
    flavor: string | null;
    wornDown: boolean;
  }[];
  events: { time: number; text: string; kind: "info" | "good" | "bad" }[];
}

function snapshot(game: Game): Snapshot {
  const trapped = game.push || game.debt > 0 || game.measure;
  return {
    started: game.started,
    speed: speed(game),
    levelName: LEVELS[game.level].name,
    hint: trapped ? "Nothing improves while you stand over them." : LEVELS[game.level].hint,
    progress: levelProgress(game),
    trapped,
    push: game.push,
    recovering: !game.push && game.debt > 0,
    measure: game.measure,
    canRally: game.level === 4 && !game.rallied,
    rallied: game.rallied,
    shipped: game.shipped,
    points: game.points,
    cups: game.cups,
    happiness: game.happiness,
    velocity: game.velocity === null ? "?" : String(game.velocity),
    velocityLive: game.measure,
    revealed: revealedCount(game),
    devs: game.devs.map((dev) => ({
      id: dev.id,
      name: dev.name,
      strength: dev.strength,
      revealed: dev.revealed,
      state: dev.state,
      stuck: dev.state === "stuck",
      flavor: dev.stuckDomain,
      wornDown: dev.morale < 0.6,
    })),
    events: game.events.slice(-4),
  };
}

const STATE_LABEL: Record<string, string> = {
  working: "Working",
  stuck: "Stuck",
  chatting: "Chatting",
  coffee: "Coffee",
  helping: "Helping",
  burst: "Showing off",
};

/**
 * The team game: one continuous simulation of five engineers. The reader
 * mostly watches. Chatting and well-timed unblocking grow the team;
 * pushing and measuring keep it slow. The sim lives in lib/team-game and
 * runs on a fixed timestep inside the animation loop; React renders a
 * snapshot a few times a second.
 */
export default function TeamGame({ description }: { description?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game>(createGame(7));
  const layoutRef = useRef<Layout | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  const [view, setView] = useState<Snapshot>(() => snapshot(gameRef.current));

  const dispatch = useCallback((command: Command) => {
    applyCommand(gameRef.current, command);
    setView(snapshot(gameRef.current));
  }, []);

  // The loop: fixed-step simulation, per-frame rendering, throttled DOM
  // sync. Pauses off-screen and in hidden tabs; the game clock stops too.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    const palette: Palette = readPalette(container);
    const reducedMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame = 0;
    let running = false;
    let inView = true;
    let last = 0;
    let accumulator = 0;
    let lastSync = 0;

    const resize = () => {
      const w = container.clientWidth;
      if (!w) return;
      const h = heightFor(w);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.height = `${h}px`;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
      layoutRef.current = computeLayout(w, h);
    };

    const render = (now: number) => {
      if (!ctx || !layoutRef.current) return;
      drawGame(ctx, gameRef.current, layoutRef.current, palette, { now, reducedMotion });
    };

    const loop = (now: number) => {
      if (!running) return;
      const game = gameRef.current;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (game.started) {
        accumulator += dt;
        while (accumulator >= TICK) {
          step(game, TICK);
          accumulator -= TICK;
        }
      }
      render(now);
      if (now - lastSync > 200) {
        setView(snapshot(game));
        lastSync = now;
      }
      frame = requestAnimationFrame(loop);
    };

    const setRunning = (next: boolean) => {
      if (next === running) return;
      running = next;
      if (running) {
        last = performance.now();
        accumulator = 0;
        frame = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(frame);
      }
    };

    const update = () => setRunning(inView && document.visibilityState !== "hidden");

    resize();
    render(performance.now());

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => {
            resize();
            render(performance.now());
          })
        : null;
    resizeObserver?.observe(container);
    if (!resizeObserver) window.addEventListener("resize", resize);

    const intersection =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            (entries) => {
              inView = entries.some((entry) => entry.isIntersecting);
              update();
            },
            { rootMargin: "80px" },
          )
        : null;
    intersection?.observe(container);
    document.addEventListener("visibilitychange", update);
    if (typeof requestAnimationFrame === "function") update();

    return () => {
      setRunning(false);
      resizeObserver?.disconnect();
      intersection?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const onCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const layout = layoutRef.current;
    if (!layout) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const id = hitDev(layout, event.clientX - rect.left, event.clientY - rect.top);
    if (id !== null) dispatch({ type: "dev", id });
  };

  return (
    <InteractiveFigure
      prompt="grow the team"
      accessibleDescription={description ?? "A simulation of a five-person engineering team with generated names. The team starts at 1x speed. Leaving it alone unlocks flow at 2x. Chatting with people and helping whoever is stuck builds rapport toward friends-ish at 3x and friendly competition at 5x. Some stucks resolve themselves and give a bigger bonus for waiting; others never resolve without help, and sitting stuck too long drains a dev's morale, which slows them for a long while. A stuck ticket can also be moved: if another dev is the expert for that kind of problem it pays off, otherwise it changes nothing. Expertise is demonstrated, never granted: a strength is revealed after a dev twice solves problems in their own area, alone or via routed tickets, with a few shipped tickets behind them. Knowing all five reaches 7x, and a rally button then sets shared direction at 10x. Pushing the team or turning on the measurement dashboard makes the number look better while real progress stops. The sprint velocity stat reads as a question mark until the dashboard is turned on. While measuring, estimates balloon so velocity climbs at first, while the room talks less: camaraderie and morale drain, the speed levels slip back down, and customer happiness falls. Counters report features shipped, story points, cups of coffee, and a customer happiness bar that only climbs once the team ships steadily."}
    >
      {/* Defensive layout throughout: this block renders inside the article's
          .prose styles, so no ul/ol/li (prose adds markers and margins to
          those), min-w-0 on every flex/grid child that truncates, flex-wrap
          on every row, shrink-0 on fixed-size pieces, and break-words on
          text that could run long. */}
      <div className="not-prose flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1 basis-60">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">The team speed ladder</p>
            <p className="mt-2 max-w-2xl break-words text-sm text-muted">
              Five engineers you did not pick. Click someone to chat, or to help when they are stuck. The two
              management buttons are always available. Watch what each choice does to the speed.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`font-mono text-3xl font-semibold tabular-nums ${view.trapped ? "text-orange-400" : "text-accent"}`}>
              {view.speed}x
            </p>
            <p className="text-xs text-muted">
              {view.push
                ? "rushing"
                : view.recovering
                  ? "recovering"
                  : view.measure
                    ? "measured"
                    : view.levelName.toLowerCase()}
            </p>
          </div>
        </div>

        <div ref={containerRef} className="relative min-w-0 select-none overflow-hidden rounded-md border border-line/60 bg-base/70">
          <canvas
            ref={canvasRef}
            aria-hidden
            className="block h-auto w-full max-w-full cursor-pointer touch-manipulation"
            onClick={onCanvasClick}
          />
          {!view.started ? (
            <div className="absolute inset-0 flex items-center justify-center bg-base/40">
              <Button onClick={() => dispatch({ type: "start" })}>Meet the team</Button>
            </div>
          ) : null}
        </div>

        {view.started ? (
          <div aria-live="polite" className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="min-w-0 break-words text-sm text-ink/90">{view.hint}</p>
              <span className="shrink-0 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-muted">
                {view.rallied ? "10x" : "next level"}
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-raised" aria-hidden>
              <span
                className={`block h-full transition-[width] duration-300 ${view.trapped ? "bg-orange-400/70" : "bg-accent/80"}`}
                style={{ width: `${Math.round(view.progress * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-wrap items-center gap-2" role="group" aria-label="Team controls">
          <Button
            variant={view.push ? "solid" : "outline"}
            aria-pressed={view.push}
            disabled={!view.started}
            onClick={() => dispatch({ type: "push", on: !view.push })}
            className="whitespace-nowrap"
            title="Stand over the team. A little faster while you watch, slower for twice as long after."
          >
            Push the team
          </Button>
          <Button
            variant={view.measure ? "solid" : "outline"}
            aria-pressed={view.measure}
            disabled={!view.started}
            onClick={() => dispatch({ type: "measure", on: !view.measure })}
            className="whitespace-nowrap"
            title="Put up the dashboard. The points climb. The features do not."
          >
            Measure the team
          </Button>
          {view.canRally ? (
            <Button onClick={() => dispatch({ type: "rally" })} className="whitespace-nowrap" data-testid="rally">
              Rally the team
            </Button>
          ) : null}
        </div>

        {/* role="list" divs, not ul/li: the article's .prose list styles
            would add disc markers and stagger the grid with li margins. */}
        <div role="list" aria-label="The team" className="grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-5">
          {view.devs.map((dev) => (
            <div role="listitem" key={dev.id} className="min-w-0">
              <button
                type="button"
                onClick={() => dispatch({ type: "dev", id: dev.id })}
                disabled={!view.started}
                data-testid={`dev-${dev.id}`}
                className={`w-full min-w-0 overflow-hidden rounded-md border px-3 py-2 text-left transition-colors disabled:opacity-50 ${
                  dev.stuck ? "border-nebula/70 hover:bg-nebula/10" : "border-line hover:border-accent/60"
                }`}
                title={dev.stuck ? `Help ${dev.name}` : `Chat with ${dev.name}`}
              >
                {/* Stacked lines: the name never shares a row, so it never
                    truncates against the strength tag on narrow chips. The
                    strength line is always rendered (blank until revealed)
                    so chips in a row stay the same height. */}
                <span className="block truncate text-sm font-semibold text-ink">{dev.name}</span>
                <span className={`mt-0.5 block truncate text-xs ${dev.stuck ? "text-nebula" : "text-muted"}`}>
                  {dev.stuck && dev.flavor
                    ? `Stuck: ${dev.flavor}`
                    : dev.wornDown && dev.state === "working"
                      ? "Worn down"
                      : STATE_LABEL[dev.state] ?? dev.state}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[10px] text-accent">
                  {dev.revealed ? `★ ${dev.strength}` : " "}
                </span>
              </button>
              {dev.stuck ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "move", id: dev.id })}
                  data-testid={`move-${dev.id}`}
                  className="mt-1 w-full truncate rounded-md border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:border-accent/60 hover:text-ink"
                  title={`Give ${dev.name}'s ticket to someone else`}
                >
                  Move ticket
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
          <Stat label="Features shipped" value={view.shipped} tone="text-accent" />
          <Stat label="Story points" value={view.points} tone={view.measure ? "text-orange-400" : "text-ink"} />
          <Stat
            label="Sprint velocity"
            value={view.velocity}
            tone={view.velocityLive ? "text-orange-400" : "text-muted"}
            note={view.velocity === "?" ? "unmeasured" : view.velocityLive ? "pts per day" : "last reading"}
          />
          <Stat label="Cups of coffee" value={view.cups} tone="text-star" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-[11px] uppercase tracking-wider text-muted">Customer happiness</span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted">{Math.round(view.happiness * 100)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-raised" aria-hidden>
            <span
              className={`block h-full transition-[width] duration-300 ${view.happiness < 0.3 ? "bg-orange-400/80" : "bg-plasma/80"}`}
              style={{ width: `${Math.round(view.happiness * 100)}%` }}
            />
          </div>
        </div>

        {view.events.length > 0 ? (
          <div role="list" aria-label="What just happened" className="flex min-w-0 flex-col gap-0.5 font-mono text-[11px]">
            {view.events.map((event, index) => (
              <p
                role="listitem"
                key={`${event.time}-${index}`}
                className={`min-w-0 break-words ${
                  event.kind === "bad" ? "text-orange-400/90" : event.kind === "good" ? "text-plasma/90" : "text-muted"
                }`}
              >
                {event.text}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </InteractiveFigure>
  );
}

function Stat({ label, value, tone, note }: { label: string; value: number | string; tone: string; note?: string }) {
  return (
    <div className="min-w-0 bg-surface p-3">
      {/* Labels get two reserved lines so every number sits on the same
          baseline whether its label wraps or not. */}
      <p className="min-h-[2.5em] break-words text-[11px] uppercase leading-tight tracking-wider text-muted">{label}</p>
      <p className={`mt-1 truncate font-mono text-xl tabular-nums sm:text-2xl ${tone}`}>{value}</p>
      {note ? <p className="mt-0.5 truncate text-[10px] text-muted/80">{note}</p> : null}
    </div>
  );
}
