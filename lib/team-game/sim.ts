import { mulberry32, pick } from "./rng";

/**
 * One continuous game: grow a five-person team from a slow start to shared
 * direction. The reader mostly watches. Chatting and well-timed unblocking
 * move the team up the ladder; pushing and measuring hold it at the bottom.
 *
 * Deterministic for a seed and a command sequence. Time is real seconds.
 * No DOM: the component owns the loop, draw.ts renders a frame.
 */

/** Tuning. Every number the game uses. */
export const T = {
  daySecs: 20,
  /** Base seconds of work in one ticket at 1x. */
  ticketSecs: 30,
  /** Customers: each shipped point pleases them a little; waiting displeases them steadily. */
  happinessPerPoint: 0.006,
  happinessDecayPerSec: 0.005,
  happinessStart: 0.35,
  happinessFloor: 0.05,
  /** Seconds without pushing or measuring that unlock the flow level. */
  calmForFlow: 12,
  rapportForFriends: 0.4,
  rapportForCompetition: 0.7,
  /** A dev hits something confusing about this often at level 0; less at higher levels. */
  stuckEverySecs: 34,
  /** Chance a stuck is the kind they cannot solve alone. Highest early on. */
  permaChanceBase: 0.45,
  permaChanceMin: 0.15,
  permaChancePerLevel: 0.08,
  /** An ordinary stuck resolves itself somewhere in this window. */
  selfSolveSecs: [10, 18] as const,
  /** Stuck in their own specialty: quick, and never permanent. */
  ownSolveSecs: [3, 6] as const,
  /** Solving it alone beats being helped. */
  selfSolveRapport: 0.08,
  /** Stuck longer than this and morale starts going. */
  moraleDrainAfterSecs: 10,
  moraleDrainPerSec: 0.04,
  /** Morale comes back much slower than it leaves. */
  moraleRecoverPerSec: 0.008,
  /** Moving a ticket to the right expert pays; moving it anywhere else does not. */
  moveExpertRapport: 0.08,
  /** Someone left sitting stuck this long starts eroding the whole room. */
  neglectAfterSecs: 15,
  neglectRapportPerSec: 0.005,
  /** Clicking a stuck dev sooner than this teaches nothing. */
  tooFastSecs: 1.5,
  chatSecs: 2.5,
  chatCooldownSecs: 8,
  chatRapport: 0.04,
  helpRapport: 0.05,
  peerHelpRapport: 0.04,
  /** Chance a stuck lands in the dev's own specialty. People gravitate to their area. */
  ownStuckBias: 0.45,
  /** Expertise is demonstrated, never granted: this many proofs, and a body of work. */
  demosToReveal: 2,
  ticketsToReveal: 3,
  /** Ambient rapport (self-solves, peer help, small talk) only grows while the
   *  leader has engaged with the room this recently. An absent manager gets nothing. */
  attentionSecs: 30,
  /** Friends help a stuck teammate after this long. */
  peerHelpAfterSecs: 4,
  peerHelpSecs: 2,
  walkSecs: 1,
  /** Each level has to be lived in for a bit before the next can arrive. */
  levelDwellSecs: 8,
  coffeeEverySecs: [28, 44] as const,
  coffeeSecs: 3.5,
  /** Pushing: the current speed times this now, times the debt factor below
   *  for twice as long after. Both scale the level rather than replacing it. */
  pushSpeed: 1.1,
  debtSpeed: 0.8,
  debtFactor: 2,
  /** Measuring: no instant slowdown. The room goes quiet, camaraderie and
   *  morale drain until the level itself slips, and estimates inflate the
   *  longer the dashboard stays up, so velocity climbs while output falls. */
  measureInflateStart: 2,
  measureInflatePerSec: 0.4,
  measureInflateMax: 60,
  measureRapportDrainPerSec: 0.025,
  measureMoraleDrainPerSec: 0.03,
  /** Velocity averages this many rolling days, so the reading is smooth. */
  velocityWindowDays: 3,
  /** Friendly competition: occasional show-off bursts. */
  burstEverySecs: 12,
  burstSecs: 4,
  burstSpeed: 1.5,
  peerChatEverySecs: 15,
  peerChatSecs: 2,
  maxEvents: 30,
} as const;

/** Cumulative performance levels. Illustrations, not research findings. */
export const LEVELS = [
  { mult: 1, name: "A slow start", hint: "Leave them alone. No pushing, no dashboards." },
  { mult: 2, name: "In the flow", hint: "Get people talking. Help whoever is stuck, once they ask." },
  { mult: 3, name: "Friends-ish", hint: "Keep the conversations going." },
  { mult: 5, name: "Friendly competition", hint: "Watch who solves what. Route tickets to test a hunch." },
  { mult: 7, name: "Right people, right work", hint: "They are ready. Give them the direction." },
  { mult: 10, name: "Shared direction", hint: "Nothing left to add. Watch them go." },
] as const;

const NAMES = ["Maya", "Tomas", "Priya", "Jonah", "Ana", "Dana", "Ravi", "Lena", "Marco", "Yuki", "Ines", "Oleg", "Tara", "Kofi", "Sam"];
export const DOMAINS = ["front end", "back end", "data", "infra", "legacy"] as const;
export type Domain = (typeof DOMAINS)[number];

const SMALL_TALK = [
  "movies?",
  "lunch?",
  "waterslide",
  "stocks",
  "css grids",
  "lol",
  "new keyboard?",
  "ramen place?",
  "that meme",
  "coffee run?",
  "3d prints",
  "did you see it",
];
const STUCK_TALK = ["?", "hm.", "wat", "why tho", "no docs…", "who wrote this"];
const SOLVED_TALK = ["got it!", "oh. OH.", "found it", "so that's why"];
const HELPED_TALK = ["oh!", "makes sense", "ty", "ohh right"];
const WORK_TALK = ["rebasing…", "lgtm", "deploying", "tests pass", "one more line"];
const BURST_TALK = ["watch this", "half the lines", "check this out", "one sec"];
const EXPLAIN_TALK = ["because…", "look here", "so basically", "old migration thing"];

function pickFrom(game: Game, pool: readonly string[]): string {
  return pool[pick(game.rng, pool.length)];
}

/** What a stuck ticket looks like from the outside. */
export const STUCK_LABELS: Record<Domain, string> = {
  "front end": "a layout bug",
  "back end": "an API issue",
  data: "a data mismatch",
  infra: "a weird infra issue",
  legacy: "a legacy system bug",
};

export type DevState = "working" | "stuck" | "chatting" | "coffee" | "helping" | "burst";

export interface Dev {
  id: number;
  name: string;
  /** What they are exceptional at. Hidden until demonstrated twice. */
  strength: Domain;
  revealed: boolean;
  /** Times they proved that strength: own-area self-solves, routed tickets solved. */
  demos: number;
  /** Tickets they personally shipped. Expertise needs a body of work behind it. */
  shippedCount: number;
  state: DevState;
  /** Sim time the current timed state ends. */
  until: number;
  /** 0..1 on the current ticket. */
  progress: number;
  /** The estimate on the ticket. Balloons while the dashboard is up. */
  points: number;
  /** What the ticket is really worth to customers. Never balloons. */
  value: number;
  /** 0..1. Drains after sitting stuck too long; recovers slowly. */
  morale: number;
  /** Sim time they got stuck, while stuck. */
  stuckAt: number;
  /** What the stuck is about, while stuck. */
  stuckDomain: Domain | null;
  /** True when they cannot solve it alone. The player cannot see this. */
  perma: boolean;
  /** Sim time an ordinary stuck resolves itself. */
  selfSolveAt: number;
  /** Whether this episode's morale drop was already announced. */
  moraleNoted: boolean;
  /** Sim time of the next confusing part / coffee urge / show-off. */
  nextStuck: number;
  nextCoffee: number;
  /** Last time the player chatted with them. */
  lastChat: number;
  /** Teammate being helped, while helping. */
  helping: number | null;
  /** Where they are: their desk, the pot, or a teammate's desk. */
  at: { kind: "desk"; dev: number } | { kind: "pot" };
  from: { kind: "desk"; dev: number } | { kind: "pot" };
  /** 0..1 progress from `from` to `at`. */
  walk: number;
  /** Bubble text and when it fades. */
  bubble: string | null;
  bubbleUntil: number;
}

export interface GameEvent {
  time: number;
  text: string;
  kind: "info" | "good" | "bad";
}

export interface Game {
  seed: number;
  rng: () => number;
  time: number;
  started: boolean;
  devs: Dev[];
  /** 0..5 into LEVELS. */
  level: number;
  /** Sim time the current level was reached. */
  levelAt: number;
  /** Team feeling, 0..1. */
  rapport: number;
  /** Contiguous seconds of calm, toward the flow level. */
  calm: number;
  push: boolean;
  /** Seconds of slower work still owed after pushing. */
  debt: number;
  measure: boolean;
  /** Seconds the dashboard has been up this session. Estimates grow with it. */
  measuredSecs: number;
  rallied: boolean;
  shipped: number;
  points: number;
  cups: number;
  /** 0..1. Rises as points ship, sinks while customers wait. */
  happiness: number;
  /** Ships inside the last day, for the velocity reading. */
  recentShips: { time: number; points: number }[];
  /** Last velocity reading, in points per day. Null until measured once. */
  velocity: number | null;
  events: GameEvent[];
  nextBurst: number;
  nextPeerChat: number;
  nextWorkTalk: number;
  /** Sim time of the last chat, unblock, or moved ticket. */
  lastTouch: number;
  /** One-time insight flags. */
  saidTooFast: boolean;
  saidMovedNothing: boolean;
}

export type Command =
  | { type: "start" }
  /** Click a dev: unblock them if stuck, otherwise chat. */
  | { type: "dev"; id: number }
  /** Hand a stuck dev's ticket to someone else. Pays only if that someone is the expert. */
  | { type: "move"; id: number }
  | { type: "push"; on: boolean }
  | { type: "measure"; on: boolean }
  | { type: "rally" };

// ---------------------------------------------------------------- setup

export function createGame(seed: number): Game {
  const rng = mulberry32(seed);
  const pool = [...NAMES];
  const strengths = [...DOMAINS];
  // Shuffle strengths so the specialties land on different people per seed.
  for (let i = strengths.length - 1; i > 0; i -= 1) {
    const j = pick(rng, i + 1);
    [strengths[i], strengths[j]] = [strengths[j], strengths[i]];
  }
  const devs: Dev[] = Array.from({ length: 5 }, (_, id) => ({
    id,
    name: pool.splice(pick(rng, pool.length), 1)[0],
    strength: strengths[id],
    revealed: false,
    demos: 0,
    shippedCount: 0,
    state: "working" as DevState,
    until: 0,
    progress: rng() * 0.3,
    points: 0,
    value: 0,
    morale: 1,
    stuckAt: 0,
    stuckDomain: null,
    perma: false,
    selfSolveAt: 0,
    moraleNoted: false,
    nextStuck: 4 + rng() * T.stuckEverySecs,
    nextCoffee: T.coffeeEverySecs[0] + rng() * (T.coffeeEverySecs[1] - T.coffeeEverySecs[0]),
    lastChat: -Infinity,
    helping: null,
    at: { kind: "desk" as const, dev: id },
    from: { kind: "desk" as const, dev: id },
    walk: 1,
    bubble: null,
    bubbleUntil: 0,
  }));
  const game: Game = {
    seed,
    rng,
    time: 0,
    started: false,
    devs,
    level: 0,
    levelAt: 0,
    rapport: 0.05,
    calm: 0,
    push: false,
    debt: 0,
    measure: false,
    measuredSecs: 0,
    rallied: false,
    shipped: 0,
    points: 0,
    cups: 0,
    happiness: T.happinessStart,
    recentShips: [],
    velocity: null,
    events: [],
    nextBurst: 0,
    nextPeerChat: T.peerChatEverySecs,
    nextWorkTalk: 6,
    lastTouch: -Infinity,
    saidTooFast: false,
    saidMovedNothing: false,
  };
  for (const dev of devs) nextTicket(game, dev);
  return game;
}

function ticketValue(rng: () => number): number {
  return [1, 2, 3, 5][pick(rng, 4)];
}

function addEvent(game: Game, text: string, kind: GameEvent["kind"] = "info"): void {
  game.events.push({ time: game.time, text, kind });
  if (game.events.length > T.maxEvents) game.events.shift();
}

function say(game: Game, dev: Dev, text: string, secs = 2): void {
  dev.bubble = text;
  dev.bubbleUntil = game.time + secs;
}

// ---------------------------------------------------------------- commands

export function applyCommand(game: Game, command: Command): void {
  switch (command.type) {
    case "start":
      if (!game.started) {
        game.started = true;
        addEvent(game, "Day 1. Five people, a pot of coffee, and a backlog.");
      }
      return;
    case "dev": {
      if (!game.started) return;
      const dev = game.devs.find((d) => d.id === command.id);
      if (!dev) return;
      if (dev.state === "stuck") unblock(game, dev);
      else if (dev.state === "working" || dev.state === "burst") chat(game, dev);
      return;
    }
    case "move": {
      if (!game.started) return;
      const dev = game.devs.find((d) => d.id === command.id);
      if (dev) moveTicket(game, dev);
      return;
    }
    case "push":
      if (!game.started || game.push === command.on) return;
      game.push = command.on;
      if (command.on) addEvent(game, "You are standing over them. It looks faster.", "bad");
      else if (game.debt > 0) addEvent(game, "You looked away. Now they are catching their breath.", "bad");
      return;
    case "measure":
      if (!game.started || game.measure === command.on) return;
      game.measure = command.on;
      if (command.on) {
        game.measuredSecs = 0;
        // A fresh dashboard starts its own baseline. From here the line
        // only climbs, because the estimates climb faster than the team slows.
        game.recentShips = [];
        game.velocity = 0;
        addEvent(game, "The dashboard is live. Estimates grew by morning.", "bad");
      }
      else addEvent(game, "The dashboard is gone. People are talking again.", "good");
      return;
    case "rally":
      if (!game.started || game.level !== 4 || game.rallied || game.time - game.levelAt < T.levelDwellSecs) return;
      game.rallied = true;
      game.level = 5;
      game.levelAt = game.time;
      addEvent(game, "Everyone knows where this is going, and why. 10x.", "good");
      return;
  }
}

function chat(game: Game, dev: Dev): void {
  if (game.time - dev.lastChat < T.chatCooldownSecs) return;
  dev.lastChat = game.time;
  game.lastTouch = game.time;
  dev.state = "chatting";
  dev.until = game.time + T.chatSecs;
  say(game, dev, SMALL_TALK[pick(game.rng, SMALL_TALK.length)], T.chatSecs);
  if (trapped(game)) return; // Nobody opens up while the dashboard is watching.
  game.rapport = Math.min(1, game.rapport + T.chatRapport);
}

function unblock(game: Game, dev: Dev): void {
  const stuckFor = game.time - dev.stuckAt;
  game.lastTouch = game.time;
  resume(game, dev);
  say(game, dev, pickFrom(game, HELPED_TALK), 1.5);
  if (stuckFor < T.tooFastSecs) {
    if (!game.saidTooFast) {
      game.saidTooFast = true;
      addEvent(game, "You answered before they finished the question.", "bad");
    }
    return;
  }
  if (trapped(game)) return;
  game.rapport = Math.min(1, game.rapport + T.helpRapport);
}

/** A capitalized stuck label, for the start of a sentence. */
function stuckLabel(domain: Domain): string {
  const label = STUCK_LABELS[domain];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Hand the stuck ticket to someone else. Lands on the one person who is
 * exceptional at that area: solved quickly, and both sides gain. Lands
 * anywhere else: the problem moves with it.
 */
function moveTicket(game: Game, dev: Dev): void {
  if (dev.state !== "stuck" || dev.stuckDomain === null) return;
  game.lastTouch = game.time;
  const domain = dev.stuckDomain;
  const expert = game.devs.find((d) => d.id !== dev.id && d.strength === domain);
  resume(game, dev);
  dev.progress = 0;
  nextTicket(game, dev);
  say(game, dev, "new ticket", 1.5);

  if (expert && (expert.state === "working" || expert.state === "burst")) {
    expert.state = "burst";
    expert.until = game.time + T.burstSecs;
    say(game, expert, "on it", 2);
    if (trapped(game)) return;
    game.rapport = Math.min(1, game.rapport + T.moveExpertRapport);
    addEvent(game, `${stuckLabel(domain)} went to ${expert.name}. Right person, ten minutes.`, "good");
    noteDemonstration(game, expert, true);
    return;
  }

  if (!game.saidMovedNothing) {
    game.saidMovedNothing = true;
    addEvent(game, "The ticket moved. The problem moved with it.");
  }
}

/**
 * A dev just proved their strength: solved their own kind of problem, or
 * handled a ticket routed to them. Twice, with real work shipped behind
 * it, and the leader can call it expertise.
 */
function noteDemonstration(game: Game, dev: Dev, quiet = false): void {
  if (dev.revealed) return;
  dev.demos += 1;
  if (!checkReveal(game, dev) && !quiet && dev.demos === 1) {
    addEvent(game, `${dev.name} made short work of ${STUCK_LABELS[dev.strength]}. Worth remembering.`, "good");
  }
}

function checkReveal(game: Game, dev: Dev): boolean {
  if (dev.revealed || dev.demos < T.demosToReveal || dev.shippedCount < T.ticketsToReveal) return false;
  dev.revealed = true;
  addEvent(game, `That is twice now. ${dev.name} is exceptional at ${dev.strength} work.`, "good");
  return true;
}

/** Ladder progress pauses while the player pushes, owes a debt, or measures. */
function trapped(game: Game): boolean {
  return game.push || game.debt > 0 || game.measure;
}

/** Ambient growth needs a leader who has engaged with the room recently. */
function attended(game: Game): boolean {
  return game.time - game.lastTouch <= T.attentionSecs;
}

export function revealedCount(game: Game): number {
  return game.devs.filter((d) => d.revealed).length;
}

/** The team's current speed multiplier. Pushing scales the level it
 *  interrupts: a 2x team reads 2.2x, never a reset to 1. Measuring shows
 *  no factor at all; its cost arrives through rapport, morale, and the
 *  level sliding back down. */
export function speed(game: Game): number {
  const base = LEVELS[game.level].mult;
  let factor = 1;
  if (game.push) factor = T.pushSpeed;
  else if (game.debt > 0) factor = T.debtSpeed;
  return Math.round(base * factor * 10) / 10;
}

/** 0..1 toward the next level, for the hint bar. */
export function levelProgress(game: Game): number {
  switch (game.level) {
    case 0:
      return Math.min(1, game.calm / T.calmForFlow);
    case 1:
      return Math.min(1, game.rapport / T.rapportForFriends);
    case 2:
      return Math.min(1, game.rapport / T.rapportForCompetition);
    case 3:
      return revealedCount(game) / 5;
    case 4:
      return game.rallied ? 1 : 0;
    default:
      return 1;
  }
}

// ---------------------------------------------------------------- stepping

export function step(game: Game, dt: number): void {
  if (!game.started) return;
  game.time += dt;

  if (game.push) game.debt += dt * T.debtFactor;
  else if (game.debt > 0) game.debt = Math.max(0, game.debt - dt);

  // A watched room goes quiet. Camaraderie and morale leak away slowly,
  // and with them, eventually, the level itself.
  if (game.measure) {
    game.measuredSecs += dt;
    game.rapport = Math.max(0, game.rapport - T.measureRapportDrainPerSec * dt);
    for (const dev of game.devs) dev.morale = Math.max(0, dev.morale - T.measureMoraleDrainPerSec * dt);
  }

  const mult = speed(game);
  for (const dev of game.devs) tickDev(game, dev, dt, mult);

  // A colleague left sitting stuck wears on everyone. Without this, a team
  // nobody pays attention to would still drift up the ladder on its own.
  const neglected = game.devs.filter(
    (dev) => dev.state === "stuck" && game.time - dev.stuckAt > T.neglectAfterSecs,
  ).length;
  if (neglected > 0) {
    game.rapport = Math.max(0, game.rapport - T.neglectRapportPerSec * neglected * dt);
  }

  tickLadder(game, dt);
  tickAmbience(game);

  // Customers drift toward unhappy unless features keep landing.
  game.happiness = Math.max(T.happinessFloor, game.happiness - T.happinessDecayPerSec * dt);
  // The velocity reading only exists while someone is measuring.
  const window = T.daySecs * T.velocityWindowDays;
  while (game.recentShips.length > 0 && game.recentShips[0].time < game.time - window) {
    game.recentShips.shift();
  }
  if (game.measure) {
    game.velocity = Math.round(
      game.recentShips.reduce((sum, ship) => sum + ship.points, 0) / T.velocityWindowDays,
    );
  }
}

function permaChance(level: number): number {
  return Math.max(T.permaChanceMin, T.permaChanceBase - T.permaChancePerLevel * level);
}

/** A dev hits the confusing part of a ticket. Some of these never solve themselves. */
function beginStuck(game: Game, dev: Dev): void {
  // Stucks lean toward the dev's own area, then toward areas whose expert
  // is still unproven, so the discovery loop never stalls on one straggler.
  let domain: Domain;
  const unproven = game.devs.filter((d) => !d.revealed).map((d) => d.strength);
  if (game.rng() < T.ownStuckBias) domain = dev.strength;
  else if (unproven.length > 0 && game.rng() < 0.75) domain = unproven[pick(game.rng, unproven.length)];
  else domain = DOMAINS[pick(game.rng, DOMAINS.length)];
  const own = domain === dev.strength;
  dev.state = "stuck";
  dev.stuckAt = game.time;
  dev.stuckDomain = domain;
  dev.moraleNoted = false;
  dev.perma = own ? false : game.rng() < permaChance(game.level);
  const [lo, hi] = own ? T.ownSolveSecs : T.selfSolveSecs;
  dev.selfSolveAt = game.time + lo + game.rng() * (hi - lo);
  say(game, dev, pickFrom(game, STUCK_TALK), 6);
}

function tickDev(game: Game, dev: Dev, dt: number, mult: number): void {
  if (dev.bubble && game.time >= dev.bubbleUntil) dev.bubble = null;
  // Morale leaves fast while stuck, and comes back slowly everywhere else.
  // It cannot recover while the dashboard is watching.
  if (dev.state !== "stuck" && !game.measure) dev.morale = Math.min(1, dev.morale + T.moraleRecoverPerSec * dt);
  if (dev.walk < 1) {
    dev.walk = Math.min(1, dev.walk + dt / T.walkSecs);
    if (dev.walk < 1) return;
  }

  switch (dev.state) {
    case "working":
    case "burst": {
      if (dev.state === "burst" && game.time >= dev.until) dev.state = "working";
      if (game.time >= dev.nextStuck && dev.state === "working") {
        beginStuck(game, dev);
        return;
      }
      if (game.time >= dev.nextCoffee) {
        dev.nextCoffee = game.time + T.coffeeEverySecs[0] + game.rng() * (T.coffeeEverySecs[1] - T.coffeeEverySecs[0]);
        goTo(game, dev, { kind: "pot" });
        dev.state = "coffee";
        dev.until = game.time + T.walkSecs + T.coffeeSecs;
        return;
      }
      let pace = mult * (0.4 + 0.6 * dev.morale);
      if (dev.state === "burst") pace *= T.burstSpeed;
      dev.progress += (dt * pace) / T.ticketSecs;
      if (dev.progress >= 1) shipTicket(game, dev);
      return;
    }

    case "stuck": {
      const stuckFor = game.time - dev.stuckAt;
      // An ordinary stuck resolves itself, and that lesson sticks. The
      // permanent kind never does; from the outside they look the same.
      if (!dev.perma && game.time >= dev.selfSolveAt) {
        const domain = dev.stuckDomain;
        resume(game, dev);
        say(game, dev, pickFrom(game, SOLVED_TALK), 2);
        if (!trapped(game) && attended(game) && domain) {
          game.rapport = Math.min(1, game.rapport + T.selfSolveRapport);
          if (domain === dev.strength) {
            noteDemonstration(game, dev);
          } else if (game.rng() < 0.4) {
            addEvent(game, `${dev.name} worked through ${STUCK_LABELS[domain]} alone. That lesson stays.`, "good");
          }
        }
        return;
      }
      // Sitting stuck wears people down, and it takes a long time to come back.
      if (stuckFor >= T.moraleDrainAfterSecs) {
        dev.morale = Math.max(0, dev.morale - T.moraleDrainPerSec * dt);
        if (!dev.moraleNoted && dev.morale < 0.6) {
          dev.moraleNoted = true;
          addEvent(game, `${dev.name} has been stuck a long time. The pace will show it for a while.`, "bad");
        }
      }
      // Friends notice and walk over, once the team has gotten there.
      if (game.level >= 2 && stuckFor >= T.peerHelpAfterSecs && !game.devs.some((d) => d.helping === dev.id)) {
        const helper = game.devs.find((d) => d.state === "working" && d.id !== dev.id);
        if (helper) {
          helper.state = "helping";
          helper.helping = dev.id;
          helper.until = game.time + T.walkSecs + T.peerHelpSecs;
          goTo(game, helper, { kind: "desk", dev: dev.id });
          say(game, helper, pickFrom(game, EXPLAIN_TALK), T.peerHelpSecs + T.walkSecs);
        }
      }
      return;
    }

    case "chatting":
      if (game.time >= dev.until) dev.state = "working";
      return;

    case "coffee":
      if (game.time >= dev.until) {
        game.cups += 1;
        goTo(game, dev, { kind: "desk", dev: dev.id });
        dev.state = "working";
      }
      return;

    case "helping":
      if (game.time >= dev.until) {
        const helped = dev.helping !== null ? game.devs.find((d) => d.id === dev.helping) : undefined;
        dev.helping = null;
        goTo(game, dev, { kind: "desk", dev: dev.id });
        dev.state = "working";
        if (helped && helped.state === "stuck") {
          const domain = helped.stuckDomain;
          resume(game, helped);
          say(game, helped, pickFrom(game, HELPED_TALK), 1.5);
          if (attended(game)) {
            game.rapport = Math.min(1, game.rapport + T.peerHelpRapport);
            // Helping is teaching: explaining your own area counts as a
            // proof, and being walked through your own area counts as half.
            if (domain === dev.strength) noteDemonstration(game, dev);
            if (domain === helped.strength) {
              helped.demos += 0.5;
              checkReveal(game, helped);
            }
          }
          addEvent(game, `${dev.name} walked over to ${helped.name}'s desk. No ticket was filed.`, "good");
        }
      }
      return;
  }
}

function resume(game: Game, dev: Dev): void {
  dev.state = "working";
  dev.stuckDomain = null;
  dev.perma = false;
  dev.nextStuck = game.time + (T.stuckEverySecs * (1 + game.level * 0.2)) * (0.6 + game.rng() * 0.8);
  dev.bubble = null;
}

function shipTicket(game: Game, dev: Dev): void {
  game.shipped += 1;
  game.points += dev.points;
  dev.shippedCount += 1;
  // Customers feel the real value of the feature, never the estimate.
  game.happiness = Math.min(1, game.happiness + dev.value * T.happinessPerPoint);
  // Velocity counts the estimate, which is the whole problem with it.
  game.recentShips.push({ time: game.time, points: dev.points });
  dev.progress = 0;
  nextTicket(game, dev);
  // A pending second proof can land once the body of work catches up.
  if (!trapped(game)) checkReveal(game, dev);
}

function nextTicket(game: Game, dev: Dev): void {
  dev.value = ticketValue(game.rng);
  // The longer the dashboard stays up, the bigger the estimates get.
  const inflate = game.measure
    ? Math.min(T.measureInflateMax, T.measureInflateStart + T.measureInflatePerSec * game.measuredSecs)
    : 1;
  dev.points = Math.round(dev.value * inflate);
}

function goTo(game: Game, dev: Dev, place: Dev["at"]): void {
  dev.from = dev.walk >= 1 ? dev.at : dev.from;
  dev.at = place;
  dev.walk = 0;
}

function tickLadder(game: Game, dt: number): void {
  if (trapped(game)) game.calm = 0;
  else game.calm += dt;
  if (game.time - game.levelAt < T.levelDwellSecs) return;

  // Rapport-built levels are held up by rapport. Let it drain and the
  // ladder comes back down, one level at a time. Falling works even while
  // the dashboard is up; only climbing is frozen.
  const holds = [0, 0, T.rapportForFriends, T.rapportForCompetition, T.rapportForCompetition, T.rapportForCompetition];
  if (game.level >= 2 && game.rapport < holds[game.level] - 0.02) {
    if (game.level === 5) game.rallied = false;
    game.level -= 1;
    game.levelAt = game.time;
    addEvent(
      game,
      game.measure
        ? `People talk less under the dashboard. Back to ${LEVELS[game.level].mult}x.`
        : `The room drifted apart. Back to ${LEVELS[game.level].mult}x.`,
      "bad",
    );
    return;
  }
  if (trapped(game)) return;

  if (game.level === 0 && game.calm >= T.calmForFlow) {
    levelUp(game, "Nobody interrupted them for a while. They found the flow. 2x.");
  } else if (game.level === 1 && game.rapport >= T.rapportForFriends) {
    levelUp(game, "The waterslide conversation happened. They are friends-ish now. 3x.");
  } else if (game.level === 2 && game.rapport >= T.rapportForCompetition) {
    const dev = game.devs[pick(game.rng, 5)];
    levelUp(game, `${dev.name} rewrote it in half the lines, then showed everyone how. 5x.`);
  } else if (game.level === 3 && revealedCount(game) === 5) {
    levelUp(game, "You know what each person is exceptional at, and the work shows it. 7x.");
  }
}

function levelUp(game: Game, text: string): void {
  game.level += 1;
  game.levelAt = game.time;
  addEvent(game, text, "good");
}

function tickAmbience(game: Game): void {
  // Show-off bursts, once friendly competition exists.
  if (game.level >= 3 && game.time >= game.nextBurst) {
    game.nextBurst = game.time + T.burstEverySecs * (0.7 + game.rng() * 0.6);
    const dev = game.devs.find((d) => d.state === "working");
    if (dev) {
      dev.state = "burst";
      dev.until = game.time + T.burstSecs;
      say(game, dev, pickFrom(game, BURST_TALK), 2);
    }
  }
  // Desk-to-desk small talk, once people are friends-ish.
  if (game.level >= 2 && !trapped(game) && game.time >= game.nextPeerChat) {
    game.nextPeerChat = game.time + T.peerChatEverySecs * (0.7 + game.rng() * 0.6);
    const pair = game.devs.filter((d) => d.state === "working");
    if (pair.length >= 2) {
      const a = pair[pick(game.rng, pair.length)];
      say(game, a, pickFrom(game, SMALL_TALK), T.peerChatSecs);
      if (attended(game)) game.rapport = Math.min(1, game.rapport + 0.01);
    }
  }
  // Quiet shop talk at any level, so the office never goes silent.
  if (game.time >= game.nextWorkTalk) {
    game.nextWorkTalk = game.time + 9 + game.rng() * 10;
    const dev = game.devs.find((d) => d.state === "working" && d.bubble === null);
    if (dev) say(game, dev, pickFrom(game, WORK_TALK), 1.8);
  }
}

export function day(game: Game): number {
  return Math.floor(game.time / T.daySecs) + 1;
}
