import { LEVELS, day, speed, type Dev, type Game } from "./sim";

/**
 * Canvas renderer: a small office, five desks, a coffee pot. Reads a Game
 * and draws one frame; keeps no state of its own. Layout reflows with the
 * canvas width so phones get two desk rows instead of shrunken text.
 */
export interface Palette {
  base: string;
  surface: string;
  raised: string;
  line: string;
  ink: string;
  muted: string;
  accent: string;
  star: string;
  plasma: string;
  nebula: string;
}

const FALLBACK: Palette = {
  base: "8 10 16",
  surface: "14 17 25",
  raised: "21 25 36",
  line: "42 48 63",
  ink: "235 237 243",
  muted: "150 157 173",
  accent: "222 186 108",
  star: "249 235 170",
  plasma: "96 205 216",
  nebula: "173 128 235",
};

/** Read the site's theme tokens off an element so the canvas matches the page. */
export function readPalette(element: Element): Palette {
  if (typeof getComputedStyle !== "function") return FALLBACK;
  const style = getComputedStyle(element);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    base: read("--c-base", FALLBACK.base),
    surface: read("--c-surface", FALLBACK.surface),
    raised: read("--c-raised", FALLBACK.raised),
    line: read("--c-line", FALLBACK.line),
    ink: read("--c-ink", FALLBACK.ink),
    muted: read("--c-muted", FALLBACK.muted),
    accent: read("--c-accent", FALLBACK.accent),
    star: read("--c-star", FALLBACK.star),
    plasma: read("--c-plasma", FALLBACK.plasma),
    nebula: read("--c-nebula", FALLBACK.nebula),
  };
}

function rgba(token: string, alpha = 1): string {
  const [r, g, b] = token.split(/[\s,]+/);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";

interface Point {
  x: number;
  y: number;
}

export interface Layout {
  w: number;
  h: number;
  desks: Point[];
  deskW: number;
  pot: { x: number; y: number; w: number; h: number };
}

const DESK_H = 20;

export function heightFor(width: number): number {
  return width >= 560 ? 260 : 340;
}

export function computeLayout(w: number, h: number): Layout {
  const compact = w < 560;
  const pot = { x: 12, y: 38, w: 92, h: 38 };
  const areaX = 14;
  const areaW = w - 28;
  const desks: Point[] = [];
  let deskW = 64;

  if (!compact) {
    deskW = Math.min(70, Math.floor((areaW - 4 * 16) / 5));
    const gap = (areaW - 5 * deskW) / 4;
    const y = Math.round(h * 0.62);
    for (let i = 0; i < 5; i += 1) desks.push({ x: areaX + deskW / 2 + i * (deskW + gap), y });
  } else {
    deskW = Math.max(50, Math.min(70, Math.floor((areaW - 2 * 14) / 3)));
    const rows = [3, 2];
    let index = 0;
    rows.forEach((count, r) => {
      const gap = Math.min(30, (areaW - count * deskW) / Math.max(1, count - 1));
      const rowW = count * deskW + (count - 1) * gap;
      const startX = areaX + (areaW - rowW) / 2 + deskW / 2;
      const y = r === 0 ? Math.round(h * 0.42) : Math.round(h * 0.78);
      for (let i = 0; i < count; i += 1) {
        desks.push({ x: startX + i * (deskW + gap), y });
        index += 1;
      }
    });
  }
  return { w, h, desks, deskW, pot };
}

function seatPoint(layout: Layout, place: Dev["at"], self: number): Point {
  if (place.kind === "pot") {
    return { x: layout.pot.x + layout.pot.w / 2, y: layout.pot.y + layout.pot.h + 16 };
  }
  const desk = layout.desks[place.dev];
  // The owner sits behind the desk; a visitor stands beside it.
  if (place.dev === self) return { x: desk.x, y: desk.y - DESK_H / 2 - 12 };
  return { x: desk.x + layout.deskW / 2 + 12, y: desk.y - DESK_H / 2 - 12 };
}

function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function devPoint(layout: Layout, dev: Dev): Point {
  const to = seatPoint(layout, dev.at, dev.id);
  if (dev.walk >= 1) return to;
  const from = seatPoint(layout, dev.from, dev.id);
  const t = ease(dev.walk);
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

/** Which dev a canvas click lands on, or null. */
export function hitDev(layout: Layout, x: number, y: number): number | null {
  for (let i = 0; i < layout.desks.length; i += 1) {
    const desk = layout.desks[i];
    if (
      x >= desk.x - layout.deskW / 2 - 8 &&
      x <= desk.x + layout.deskW / 2 + 8 &&
      y >= desk.y - DESK_H / 2 - 34 &&
      y <= desk.y + DESK_H / 2 + 24
    ) {
      return i;
    }
  }
  return null;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Head-and-shoulders bust: a stroked circle sitting on a dome. */
function bust(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, fill: string): void {
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = color;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y + 14, 9, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function bubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, palette: Palette): void {
  ctx.font = `600 9px ${MONO}`;
  const w = ctx.measureText(text).width + 10;
  roundRect(ctx, x - w / 2, y - 16, w, 14, 4);
  ctx.fillStyle = rgba(palette.surface, 0.95);
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = rgba(color, 1);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y - 8.5);
}

function stateColor(palette: Palette, dev: Dev): string {
  switch (dev.state) {
    case "stuck":
      return palette.nebula;
    case "chatting":
      return palette.plasma;
    case "helping":
      return palette.plasma;
    case "coffee":
      return palette.star;
    case "burst":
      return palette.accent;
    default:
      // Worn down after sitting stuck too long: the figure reads dimmer.
      return dev.morale < 0.6 ? palette.muted : palette.ink;
  }
}

export interface DrawOptions {
  /** Real time in ms, for pulses. */
  now: number;
  reducedMotion: boolean;
}

export function drawGame(
  ctx: CanvasRenderingContext2D,
  game: Game,
  layout: Layout,
  palette: Palette,
  options: DrawOptions,
): void {
  const { w, h } = layout;
  const pulse = options.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(options.now / 320);
  ctx.clearRect(0, 0, w, h);

  // Floor dots.
  ctx.fillStyle = rgba(palette.line, 0.28);
  for (let x = 12; x < w; x += 20) {
    for (let y = 34; y < h; y += 20) ctx.fillRect(x, y, 1, 1);
  }

  // Header: day, speed, counters.
  ctx.font = `600 11px ${MONO}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = rgba(palette.ink, 0.95);
  ctx.fillText(game.started ? `Day ${day(game)}` : "Day 1 · ready", 12, 18);

  if (w >= 520) {
    const label = `${speed(game)}x · ${game.push ? "rushing" : game.debt > 0 ? "recovering" : game.measure ? "measured" : LEVELS[game.level].name.toLowerCase()}`;
    ctx.textAlign = "center";
    ctx.fillStyle =
      game.push || game.measure || game.debt > 0 ? rgba("251 146 60", 1) : rgba(palette.accent, 1);
    ctx.fillText(label, w / 2, 18);
  }

  ctx.textAlign = "right";
  ctx.fillStyle = rgba(palette.muted, 1);
  ctx.font = `10px ${MONO}`;
  ctx.fillText(`${game.shipped} shipped · ${game.cups} cups`, w - 12, 18);

  // Coffee pot.
  const pot = layout.pot;
  roundRect(ctx, pot.x, pot.y, pot.w, pot.h, 6);
  ctx.fillStyle = rgba(palette.raised, 1);
  ctx.fill();
  ctx.strokeStyle = rgba(palette.line, 1);
  ctx.lineWidth = 1;
  ctx.stroke();
  const px = pot.x + 14;
  const py = pot.y + 9;
  ctx.strokeStyle = rgba(palette.muted, 1);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + 12, py);
  ctx.lineTo(px + 14, py + 18);
  ctx.lineTo(px - 2, py + 18);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = rgba(palette.star, 0.8);
  ctx.fillRect(px - 0.5, py + 8, 13, 9);
  ctx.font = `9px ${MONO}`;
  ctx.fillStyle = rgba(palette.muted, 1);
  ctx.textAlign = "left";
  ctx.fillText("coffee", px + 24, py + 13);

  // Desks.
  for (const dev of game.devs) {
    const desk = layout.desks[dev.id];
    const dw = layout.deskW;
    const rx = desk.x - dw / 2;
    const ry = desk.y - DESK_H / 2;

    if (dev.state === "stuck") {
      roundRect(ctx, rx - 7, ry - 32, dw + 14, DESK_H + 58, 8);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = rgba(palette.nebula, 0.4 + 0.4 * pulse);
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    roundRect(ctx, rx, ry, dw, DESK_H, 4);
    ctx.fillStyle = rgba(palette.raised, 1);
    ctx.fill();
    ctx.strokeStyle = rgba(palette.line, 1);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Monitor, lit while working.
    const lit = dev.state === "working" || dev.state === "burst";
    roundRect(ctx, desk.x - 8, desk.y - 5, 16, 10, 1.5);
    ctx.fillStyle = lit ? rgba(palette.plasma, dev.state === "burst" ? 0.55 : 0.35) : rgba(palette.surface, 1);
    ctx.fill();
    ctx.strokeStyle = rgba(palette.line, 1);
    ctx.stroke();

    // Star for a revealed strength.
    if (dev.revealed) {
      ctx.fillStyle = rgba(palette.accent, 0.9);
      ctx.font = `9px ${SANS}`;
      ctx.textAlign = "left";
      ctx.fillText("★", rx + dw - 9, ry - 3);
    }

    // Name and ticket progress.
    ctx.font = `500 11px ${SANS}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = rgba(palette.ink, 0.85);
    ctx.fillText(dev.name, rx, ry + DESK_H + 13);
    ctx.fillStyle = rgba(palette.line, 1);
    ctx.fillRect(rx, ry + DESK_H + 17, dw, 3);
    ctx.fillStyle = rgba(dev.state === "stuck" ? palette.nebula : palette.accent, 0.9);
    ctx.fillRect(rx, ry + DESK_H + 17, dw * Math.min(1, dev.progress), 3);
  }

  // People.
  for (const dev of game.devs) {
    const p = devPoint(layout, dev);
    const color = stateColor(palette, dev);
    bust(ctx, p.x, p.y, rgba(color, 1), rgba(palette.surface, 1));
    if (dev.bubble) bubble(ctx, p.x + 12, p.y - 6, dev.bubble, color, palette);
  }
}
