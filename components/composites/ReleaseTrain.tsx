"use client";

import { useCallback, useMemo, useState, type DragEvent, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import InteractiveFigure from "./InteractiveFigure";

/**
 * The release train, playable. Add features, open releases, drag tickets
 * between trains, build, and promote the build through the environments.
 * Shipped releases reconcile into main and leave the graph; the ledger
 * keeps the numbers. Lanes collapse to a badge and expand on click, and
 * every commit can be clicked to see what it carries.
 *
 * Discrete state, so this is React + SVG rather than a canvas loop. The
 * palette matches the article's preview image: blue features, violet dev,
 * emerald release path. Rows sit in translated groups with a transform
 * transition, so the graph glides instead of jumping when lanes expand,
 * collapse, or leave.
 */

const BLUE = "#4aa8ff";
const VIOLET = "#ad80eb";
const GREEN = "#2fe39b";
const INK = "#ebedf3";
const MUTED = "#969dad";
const LINE = "#2a303f";
const MONO = "var(--font-mono, monospace)";
const GLIDE = { transition: "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)" } as const;

const ENVS = ["QA", "UAT", "PROD"] as const;
const MAX_FEATURES = 8;
const MAX_RELEASES = 3;

interface Feature {
  id: number;
  /** Releases this ticket is selected into. It always integrates in dev;
   *  selection copies the branch into a release, it never moves it. */
  releases: number[];
}

interface Release {
  id: number;
  name: string;
  /** Build ID once the pipeline has run; null while assembling. */
  build: number | null;
  /** Environments the build has passed, 0..3. */
  env: number;
  /** The baseline moved under this release; promote is blocked until rebased. */
  needsRetrofit: boolean;
  /** Carrier release this one has merged into and now rides, or null. */
  riding: number | null;
  expanded: boolean;
}

interface Shipped {
  name: string;
  build: number;
  tickets: number[];
}

interface Log {
  text: string;
  kind: "info" | "good" | "bad";
}

interface State {
  features: Feature[];
  releases: Release[];
  shipped: Shipped[];
  /** Branches removed from the graph after their release went live. */
  archived: number;
  /** The build QA and UAT currently run. PROD follows prodIndex below. */
  envBuilds: (number | null)[];
  /** Builds that were superseded before shipping. Still in the store. */
  retained: { id: number; name: string; tickets: number[] }[];
  /** The build QA and UAT ran before the current one, for redeploys. */
  prevEnv: (number | null)[];
  /** Which shipped build PROD currently runs. Rollback moves it backward. */
  prodIndex: number;
  /** Index into shipped that dev was last recut from; -1 means the original baseline. */
  devBase: number;
  devExpanded: boolean;
  nextTicket: number;
  nextRelease: number;
  nextBuild: number;
  log: Log[];
}

function addLog(log: Log[], text: string, kind: Log["kind"] = "info"): Log[] {
  return [...log, { text, kind }].slice(-4);
}

function initialState(): State {
  return {
    features: [{ id: 4311, releases: [122] }, { id: 4312, releases: [] }],
    releases: [{ id: 122, name: "REL-122", build: null, env: 0, needsRetrofit: false, riding: null, expanded: true }],
    shipped: [],
    archived: 0,
    envBuilds: [null, null],
    prevEnv: [null, null],
    retained: [],
    prodIndex: -1,
    devBase: -1,
    devExpanded: false,
    nextTicket: 4313,
    nextRelease: 123,
    nextBuild: 18427,
    log: [{ text: "feat/4311 is selected into REL-122. feat/4312 is only integrating in dev.", kind: "info" }],
  };
}

/** A build's approvals describe that build. Change the branch, lose the
 *  build from the release, but never from the artifact store. */
function voidBuild(s: State, release: Release): void {
  if (release.build === null) return;
  s.log = addLog(
    s.log,
    `${release.name} changed after build ${release.build}. The approvals stay with ${release.build}; the new combination needs its own build.`,
    "bad",
  );
  s.retained.push({ id: release.build, name: release.name, tickets: s.features.filter((f) => f.releases.includes(release.id)).map((f) => f.id) });
  release.build = null;
  release.env = 0;
}

// ---------------------------------------------------------------- layout

const GRAPH_W = 920;
/** The handoff divider: branches live left of it, environments right of it. */
const ZONE_X = 712;
const ENV_X = 726;
const ENV_W = 150;
const ENV_H = 28;
const ENV_GAP = 15;
const BUILD_W = 78;
const BUILD_X = 598;
const LANE_GAP = 52;
const SUB_GAP = 32;
const TOP_PAD = 34;
const BOTTOM_PAD = 52;
const LANE_START_X = 300;
const MAIN_X0 = 18;
const MAIN_X1 = 692;

interface LaneRow {
  kind: "dev" | "release";
  release?: Release;
  y: number;
  /** Features drawn as sub-lanes under this lane, with absolute y positions. */
  subs: { feature: Feature; y: number }[];
}

function layoutRows(state: State): { rows: LaneRow[]; mainY: number; height: number } {
  const rows: LaneRow[] = [];
  let y = TOP_PAD + 12;

  const devSubs = state.devExpanded ? state.features.filter((f) => f.releases.length === 0) : [];
  rows.push({ kind: "dev", y, subs: devSubs.map((feature, i) => ({ feature, y: y + SUB_GAP * (i + 1) })) });
  y += LANE_GAP + devSubs.length * SUB_GAP;

  for (const release of state.releases) {
    const subs = release.expanded ? state.features.filter((f) => f.releases.includes(release.id)) : [];
    rows.push({ kind: "release", release, y, subs: subs.map((feature, i) => ({ feature, y: y + SUB_GAP * (i + 1) })) });
    y += LANE_GAP + subs.length * SUB_GAP;
  }

  const mainY = y + 14;
  const height = Math.max(mainY + BOTTOM_PAD, TOP_PAD + 4 * (ENV_H + ENV_GAP) + 44);
  return { rows, mainY, height };
}

/** Stagger fork points along main so parallel branches read separately. */
function forkX(featureId: number): number {
  return 46 + ((featureId * 37) % 7) * 28;
}

// ---------------------------------------------------------------- svg bits

function GlowPath({ d, color, width = 2, dash, opacity = 1 }: { d: string; color: string; width?: number; dash?: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeWidth={width * 3.2} strokeLinecap="round" opacity={0.18} strokeDasharray={dash} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} />
    </g>
  );
}

function Commit({
  x,
  y,
  color,
  r = 6,
  label,
  onInspect,
  active,
}: {
  x: number;
  y: number;
  color: string;
  r?: number;
  /** What this commit carries; clicking shows it in the detail panel. */
  label: string;
  onInspect: (label: string) => void;
  active: boolean;
}) {
  return (
    <g
      onClick={() => onInspect(label)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onInspect(label);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={label}
      style={{ cursor: "pointer" }}
    >
      {/* Oversized invisible hit area, so small dots are easy to tap. */}
      <circle cx={x} cy={y} r={14} fill="transparent" />
      <circle cx={x} cy={y} r={r + 5} fill={color} opacity={active ? 0.4 : 0.16} style={{ transition: "opacity 250ms" }} />
      <circle cx={x} cy={y} r={r} fill="#070a10" stroke={color} strokeWidth={active ? 3 : 2} />
    </g>
  );
}

/** A rounded curve from main up into a horizontal sub-lane, then into its target lane. */
function featurePath(fx: number, mainY: number, subY: number, laneY: number, mergeX: number): string {
  const kneeX = fx + 48;
  const runEnd = mergeX - 54;
  return [
    `M ${fx} ${mainY}`,
    `C ${fx + 10} ${subY + 26}, ${fx + 16} ${subY}, ${kneeX} ${subY}`,
    `L ${runEnd} ${subY}`,
    `C ${runEnd + 30} ${subY}, ${mergeX - 24} ${laneY}, ${mergeX} ${laneY}`,
  ].join(" ");
}

// ---------------------------------------------------------------- component

export default function ReleaseTrain({ description }: { description?: string }) {
  const [state, setState] = useState<State>(initialState);
  /** Ticket picked up by click (keyboard/tap fallback for drag). */
  const [carrying, setCarrying] = useState<number | null>(null);
  /** The commit or chip the reader clicked, shown in the detail panel. */
  const [inspect, setInspect] = useState<string | null>(null);

  const update = useCallback((fn: (draft: State) => void) => {
    setState((prev) => {
      const draft: State = JSON.parse(JSON.stringify(prev));
      fn(draft);
      return draft;
    });
  }, []);

  const addFeature = () =>
    update((s) => {
      if (s.features.length >= MAX_FEATURES) return;
      const id = s.nextTicket;
      s.nextTicket += 1;
      s.features.push({ id, releases: [] });
      s.log = addLog(s.log, `feat/${id} branched from main and merged into dev for integration.`);
    });

  const addRelease = () =>
    update((s) => {
      if (s.releases.length >= MAX_RELEASES) return;
      const id = s.nextRelease;
      s.nextRelease += 1;
      s.releases.push({ id, name: `REL-${id}`, build: null, env: 0, needsRetrofit: false, riding: null, expanded: true });
      s.log = addLog(s.log, `release/REL-${id} opened from the production baseline.`);
    });

  const addTo = useCallback(
    (featureId: number, releaseId: number) =>
      update((s) => {
        const feature = s.features.find((f) => f.id === featureId);
        const to = s.releases.find((r) => r.id === releaseId);
        if (!feature || !to || feature.releases.includes(releaseId)) return;
        if (to.riding !== null) {
          const carrier = s.releases.find((r) => r.id === to.riding);
          to.riding = null;
          s.log = addLog(s.log, `${to.name} diverged from ${carrier ? carrier.name : "its carrier"}. It rides alone again.`);
        }
        voidBuild(s, to);
        const alsoIn = feature.releases.length > 0;
        feature.releases.push(releaseId);
        s.log = addLog(
          s.log,
          alsoIn
            ? `feat/${feature.id} also selected into ${to.name}. The same branch travels with both releases.`
            : `feat/${feature.id} selected into ${to.name}. It keeps integrating in dev too.`,
          "good",
        );
      }),
    [update],
  );

  const build = (releaseId: number) =>
    update((s) => {
      const release = s.releases.find((r) => r.id === releaseId);
      if (!release || release.build !== null || release.needsRetrofit) return;
      const tickets = s.features.filter((f) => f.releases.includes(releaseId));
      if (tickets.length === 0) return;
      release.build = s.nextBuild;
      s.nextBuild += 1;
      release.env = 0;
      s.log = addLog(
        s.log,
        `Build ${release.build} created from ${release.name} with ${tickets.map((t) => t.id).join(", ")}. The handoff is the ID, not the branch.`,
        "good",
      );
    });

  const promote = (releaseId: number) =>
    update((s) => {
      const release = s.releases.find((r) => r.id === releaseId);
      if (!release || release.build === null || release.needsRetrofit) return;
      // UAT is a hard slot: one release at a time. QA can be taken over,
      // but doing so cuts the current occupant's run short.
      const other = (stage: number) =>
        s.releases.find((r) => r.id !== releaseId && r.riding !== releaseId && r.build !== null && r.env === stage);
      let tookOver = false;
      if (release.env === 0) {
        const occupant = other(1);
        if (occupant) {
          occupant.env = 0;
          tookOver = true;
          s.log = addLog(
            s.log,
            `Build ${release.build} took over QA. ${occupant.name}'s run there was cut short; build ${occupant.build} needs QA again.`,
            "bad",
          );
        }
      }
      if (release.env === 1) {
        const occupant = other(2);
        if (occupant) {
          occupant.env = 1;
          tookOver = true;
          s.log = addLog(
            s.log,
            `Build ${release.build} took over UAT. ${occupant.name} falls back; build ${occupant.build} needs UAT again. UAT holds only what ships next.`,
            "bad",
          );
        }
      }
      release.env += 1;
      if (!tookOver && release.env === 2 && s.envBuilds[1] !== null && s.envBuilds[1] !== release.build) {
        s.log = addLog(s.log, `Build ${release.build} replaced ${s.envBuilds[1]} in UAT.`);
      }
      if (release.env - 1 < 2) {
        const slot = release.env - 1;
        if (s.envBuilds[slot] !== null && s.envBuilds[slot] !== release.build) s.prevEnv[slot] = s.envBuilds[slot];
        s.envBuilds[slot] = release.build;
      }
      if (release.env < ENVS.length) {
        s.log = addLog(s.log, `${ENVS[release.env - 1]} approved build ${release.build}. The same artifact moves on.`, "good");
        return;
      }
      // Live. Reconcile main, archive the branches, retrofit the rest.
      // Riders merged into this release reach production with it.
      const riders = s.releases.filter((r) => r.riding === releaseId);
      const gone = [releaseId, ...riders.map((r) => r.id)];
      const tickets = s.features.filter((f) => f.releases.includes(releaseId));
      for (const f of s.features) f.releases = f.releases.filter((id) => !gone.includes(id));
      const archived = s.features.filter((f) => f.releases.length === 0 && tickets.includes(f));
      s.features = s.features.filter((f) => !archived.includes(f));
      for (const rider of riders) {
        if (rider.build !== null) s.retained.push({ id: rider.build, name: rider.name, tickets: [] });
      }
      s.releases = s.releases.filter((r) => !gone.includes(r.id));
      s.shipped.push({ name: release.name, build: release.build, tickets: tickets.map((t) => t.id) });
      s.prodIndex = s.shipped.length - 1;
      s.archived += archived.length + gone.length;
      if (riders.length > 0) {
        s.log = addLog(s.log, `${riders.map((r) => r.name).join(", ")} rode ${release.name} to production and ${riders.length === 1 ? "is" : "are"} archived.`, "good");
      }
      s.log = addLog(
        s.log,
        `Build ${release.build} is live. Source reconciled into main; ${release.name} and ${tickets.length} ticket ${
          tickets.length === 1 ? "branch" : "branches"
        } archived.`,
        "good",
      );
      for (const other of s.releases) other.needsRetrofit = true;
      if (s.releases.length > 0) {
        s.log = addLog(s.log, `Retrofit PRs opened: main into ${s.releases.map((r) => r.name).join(", ")}.`, "bad");
      }
    });

  const retrofit = (releaseId: number) =>
    update((s) => {
      const release = s.releases.find((r) => r.id === releaseId);
      if (!release || !release.needsRetrofit) return;
      release.needsRetrofit = false;
      voidBuild(s, release);
      s.log = addLog(s.log, `${release.name} now carries the new production baseline.`, "good");
    });

  const setProd = (index: number) =>
    update((s) => {
      if (index < 0 || index >= s.shipped.length || index === s.prodIndex) return;
      const back = index < s.prodIndex;
      s.prodIndex = index;
      s.log = addLog(
        s.log,
        back
          ? `PROD rolled back to build ${s.shipped[index].build}. The deployment record shows what actually runs; reconcile the baseline to match.`
          : `PROD moved forward to build ${s.shipped[index].build}.`,
        back ? "bad" : "good",
      );
    });

  const redeploy = (slot: number) =>
    update((s) => {
      const previous = s.prevEnv[slot];
      if (previous === null) return;
      s.prevEnv[slot] = s.envBuilds[slot];
      s.envBuilds[slot] = previous;
      s.log = addLog(s.log, `${ENVS[slot]} redeployed build ${previous} from the store. The retained artifact made that a click, not a rebuild.`);
    });

  const mergeInto = (sourceId: number, destId: number) =>
    update((s) => {
      const source = s.releases.find((r) => r.id === sourceId);
      const dest = s.releases.find((r) => r.id === destId);
      if (!source || !dest || source.id === dest.id) return;
      // A git merge: the destination now carries the source's work, so its
      // build and approvals are gone. The source branch is untouched and
      // stays open, its own build still valid, releasable on its own later.
      voidBuild(s, dest);
      for (const f of s.features) {
        if (f.releases.includes(sourceId) && !f.releases.includes(destId)) {
          f.releases.push(destId);
        }
      }
      source.riding = destId;
      s.log = addLog(s.log, `release/${source.name} merged into ${dest.name}. ${dest.name} carries both, and ${source.name} rides with it.`, "good");
    });

  const abandon = (releaseId: number) =>
    update((s) => {
      const release = s.releases.find((r) => r.id === releaseId);
      if (!release) return;
      if (release.build !== null) {
        s.retained.push({ id: release.build, name: release.name, tickets: s.features.filter((f) => f.releases.includes(releaseId)).map((f) => f.id) });
      }
      for (const f of s.features) f.releases = f.releases.filter((id) => id !== releaseId);
      for (const r of s.releases) {
        if (r.riding === releaseId) {
          r.riding = null;
          s.log = addLog(s.log, `${r.name} rides alone again.`);
        }
      }
      s.releases = s.releases.filter((r) => r.id !== releaseId);
      s.log = addLog(s.log, `release/${release.name} abandoned. The branch is gone; its features keep integrating in dev.`, "bad");
    });

  const resetDev = () =>
    update((s) => {
      if (s.devBase >= s.shipped.length - 1) return;
      s.devBase = s.shipped.length - 1;
      s.log = addLog(
        s.log,
        "dev deleted and recut from the production baseline. The open branches merged back in; the old history stayed behind.",
        "good",
      );
    });

  const toggle = (target: "dev" | number) =>
    update((s) => {
      if (target === "dev") s.devExpanded = !s.devExpanded;
      else {
        const release = s.releases.find((r) => r.id === target);
        if (release) release.expanded = !release.expanded;
      }
    });

  const drop = (releaseId: number) => (event: DragEvent) => {
    event.preventDefault();
    const id = Number(event.dataTransfer.getData("text/ticket"));
    if (Number.isFinite(id) && id > 0) addTo(id, releaseId);
    setCarrying(null);
  };

  /** Native drag and tap-to-carry share one highlight state. */
  const grab = (featureId: number) => setCarrying(featureId);
  const release_ = () => setCarrying(null);

  const pickOrMove = (featureId: number) => setCarrying((prev) => (prev === featureId ? null : featureId));

  const dropCarried = (releaseId: number) => {
    if (carrying === null) return;
    addTo(carrying, releaseId);
    setCarrying(null);
  };

  const { rows, mainY, height } = useMemo(() => layoutRows(state), [state]);
  const unassigned = state.features.filter((f) => f.releases.length === 0);
  const onInspect = (label: string) => setInspect((prev) => (prev === label ? null : label));

  return (
    <InteractiveFigure
      prompt="release some builds"
      accessibleDescription={
        description ??
        "An interactive release-train diagram. Add feature branches, open releases, and drag tickets into releases; every ticket keeps integrating in dev, shown there dimmed once selected, and dragging between releases copies it. Dev can also be reset: deleted and recut from the latest production baseline, with the open branches merging back in. Abandoning a release returns its tickets to dev. Building a release produces a numbered artifact that promotes through QA, UAT, and PROD. A shipped release reconciles into main and its branches leave the graph, counted in a ledger. Releases still in flight then need a retrofit before they can promote, and changing a built release voids its build. UAT holds only what ships next, so overwriting it knocks the other release back to QA-approved, and promoting into a busy QA cuts the other release's run short; merging avoids both: the combined release rebuilds and re-approves from QA, while the merged branch stays open with its own build, still independently releasable, ships automatically if its carrier reaches production first, and diverges again the moment it takes a new ticket. Branch lanes collapse to a ticket count and expand on click, and clicking any commit describes what it carries."
      }
    >
      <div className="not-prose flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={addFeature} disabled={state.features.length >= MAX_FEATURES} className="whitespace-nowrap">
            New feature
          </Button>
          <Button variant="outline" onClick={addRelease} disabled={state.releases.length >= MAX_RELEASES} className="whitespace-nowrap">
            New release
          </Button>
          <span className="ml-auto shrink-0 font-mono text-xs text-muted">
            {state.archived} branches archived · {state.shipped.length} builds live
          </span>
        </div>

        {/* The graph. Wide content scrolls inside its own container. */}
        <div className="min-w-0 overflow-x-auto rounded-md border border-line/60 bg-base/80">
          <div className="min-w-[680px]">
          <svg
            viewBox={`0 0 ${GRAPH_W} ${height}`}
            width="100%"
            onClick={() => setCarrying(null)}
            role="img"
            aria-label="Branch graph: feature branches fork from main, integrate in dev, and selected work assembles into releases whose builds promote through the environments."
          >
            {/* Grid dots. */}
            {Array.from({ length: Math.ceil(GRAPH_W / 34) }, (_, cx) =>
              Array.from({ length: Math.ceil(height / 34) }, (_, cy) => (
                <circle key={`${cx}-${cy}`} cx={17 + cx * 34} cy={17 + cy * 34} r={0.8} fill={LINE} opacity={0.35} />
              )),
            )}

            {/* main flows into dev, so integration always includes what
                production already runs. A recut dev forks from the latest
                reconciled baseline instead of the original one. */}
            <GlowPath
              d={(() => {
                const fx = state.devBase === -1 ? 252 : MAIN_X1 - 50 - (state.shipped.length - 1 - state.devBase) * 40;
                return `M ${fx} ${mainY} C ${fx + 30} ${mainY - 24}, ${fx + 32} ${rows[0].y + 26}, ${fx + 68} ${rows[0].y}`;
              })()}
              color={BLUE}
              width={1.8}
              opacity={0.8}
            />
            <Commit
              x={state.devBase === -1 ? 322 : MAIN_X1 - 50 - (state.shipped.length - 1 - state.devBase) * 40 + 70}
              y={rows[0].y}
              color={VIOLET}
              r={5}
              label={
                state.devBase === -1
                  ? "main merged into dev. Integration always includes what production already runs, so upcoming work is tested against reality."
                  : `dev was recut from the baseline ${state.shipped[state.devBase].name} left behind. Fresh history, same branches.`
              }
              onInspect={onInspect}
              active={(inspect?.startsWith("main merged into dev") || inspect?.startsWith("dev was recut")) ?? false}
            />
            {state.shipped.map((sh, i) => {
              if (i <= state.devBase) return null;
              const sx = MAIN_X1 - 50 - (state.shipped.length - 1 - i) * 40;
              const label = `main merged into dev after ${sh.name} shipped. Integration keeps testing on top of what is live.`;
              return (
                <g key={`dev-sync-${sh.build}`} className="animate-fade-in">
                  <GlowPath
                    d={`M ${sx} ${mainY} C ${sx + 22} ${mainY - 24}, ${sx + 14} ${rows[0].y + 26}, ${sx + 36} ${rows[0].y}`}
                    color={BLUE}
                    width={1.6}
                    opacity={0.7}
                  />
                  <Commit x={sx + 36} y={rows[0].y} color={VIOLET} r={4.5} label={label} onInspect={onInspect} active={inspect === label} />
                </g>
              );
            })}

            {/* Feature sub-lanes span main to their lane, so they live outside
                the gliding row groups and fade in as a whole. */}
            {rows.map((row) =>
              row.subs.map(({ feature, y }) => (
                <g key={`sub-${feature.id}-${row.kind === "dev" ? "dev" : row.release!.id}`} className="animate-fade-in">
                  <GlowPath d={featurePath(forkX(feature.id), mainY, y, row.y, LANE_START_X + 48 + (y % 3) * 8)} color={BLUE} width={1.7} opacity={0.9} />
                  <Commit
                    x={forkX(feature.id)}
                    y={mainY}
                    color={BLUE}
                    r={4.5}
                    label={`main at the point feat/${feature.id} branched off. Independent work starts from the baseline, not from dev.`}
                    onInspect={onInspect}
                    active={inspect?.includes(`feat/${feature.id} branched off`) ?? false}
                  />
                  {[0.38, 0.78].map((t, i) => (
                    <Commit
                      key={t}
                      x={(() => {
                        // The straight run of the branch: knee to the merge curve.
                        const fx = forkX(feature.id);
                        const runEnd = LANE_START_X + 48 + (y % 3) * 8 - 54;
                        return fx + 48 + (runEnd - (fx + 48)) * t;
                      })()}
                      y={y}
                      color={BLUE}
                      r={4.5}
                      label={`feat/${feature.id}, commit ${i + 1}: reviewed work for ticket ${feature.id}.${
                        row.kind === "release" ? ` Selected into ${row.release!.name}.` : " Integrating in dev only."
                      }`}
                      onInspect={onInspect}
                      active={inspect === `feat/${feature.id}, commit ${i + 1}: reviewed work for ticket ${feature.id}.${row.kind === "release" ? ` Selected into ${row.release!.name}.` : " Integrating in dev only."}`}
                    />
                  ))}
                  <text x={forkX(feature.id) + 52} y={y + 18} fill={MUTED} fontSize={12} fontFamily={MONO}>
                    feat/{feature.id}
                  </text>
                </g>
              )),
            )}

            {/* Lane rows glide to their new position when the layout changes. */}
            {rows.map((row) => {
              const laneColor = row.kind === "dev" ? VIOLET : GREEN;
              const release = row.release;
              const laneEndX = row.kind === "dev" ? ZONE_X - 16 : BUILD_X - 16;
              const count = row.kind === "dev" ? unassigned.length : state.features.filter((f) => f.releases.includes(release!.id)).length;
              const expanded = row.kind === "dev" ? state.devExpanded : release!.expanded;
              const label = row.kind === "dev" ? "dev" : `release/${release!.name}`;

              return (
                <g key={row.kind === "dev" ? "dev" : release!.id} style={{ transform: `translate(0px, ${row.y}px)`, ...GLIDE }}>
                  <GlowPath d={`M ${LANE_START_X} 0 L ${laneEndX} 0`} color={laneColor} width={2.2} opacity={row.kind === "dev" ? 0.9 : 1} />
                  {row.kind === "dev" ? (
                    <g
                      onClick={() => onInspect("dev deploys to the shared integration environment. Work meets here early; nothing promotes from it.")}
                      style={{ cursor: "pointer" }}
                      role="button"
                      tabIndex={0}
                      aria-label="The dev integration environment"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") onInspect("dev deploys to the shared integration environment. Work meets here early; nothing promotes from it.");
                      }}
                    >
                      {/* dev dead-ends: integration, never promotion. */}
                      <circle cx={laneEndX} cy={0} r={8} fill={VIOLET} opacity={0.5} />
                      <circle cx={laneEndX} cy={0} r={4} fill={VIOLET} />
                    </g>
                  ) : null}

                  {/* Collapsed badge: ticket count. Click toggles the sub-lanes. */}
                  <g
                    onClick={() => toggle(row.kind === "dev" ? "dev" : release!.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggle(row.kind === "dev" ? "dev" : release!.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={expanded}
                    aria-label={`${label}, ${count} tickets. ${expanded ? "Collapse" : "Expand"} branches.`}
                    style={{ cursor: "pointer" }}
                  >
                    <circle cx={LANE_START_X} cy={0} r={15} fill="#070a10" stroke={laneColor} strokeWidth={2} />
                    <text x={LANE_START_X} y={4.5} textAnchor="middle" fill={laneColor} fontSize={13} fontWeight={700} fontFamily={MONO}>
                      {count}
                    </text>
                    <text x={LANE_START_X - 24} y={4.5} textAnchor="end" fill={INK} fontSize={13.5} fontFamily={MONO}>
                      {label}
                    </text>
                    <text x={LANE_START_X + 24} y={4.5} fill={MUTED} fontSize={11}>
                      {expanded ? "▾" : "▸"}
                    </text>
                  </g>

                  {/* Build chip: a rider's own artifact stays distinct and listed. */}
                  {release ? (
                    <g>
                      {release.riding === null && release.needsRetrofit ? (
                        <g className="animate-pulse">
                          <GlowPath
                            d={`M ${LANE_START_X + 44} ${mainY - row.y} C ${LANE_START_X + 66} ${mainY - row.y - 24}, ${LANE_START_X + 66} 24, ${LANE_START_X + 88} 0`}
                            color={BLUE}
                            width={1.6}
                            dash="3 6"
                          />
                          <text x={LANE_START_X + 100} y={17} fill={BLUE} fontSize={11.5} fontFamily={MONO}>
                            retrofit pending
                          </text>
                        </g>
                      ) : null}
                      {release.build !== null ? (
                        <g className="animate-fade-in">
                          <g
                            onClick={() =>
                              onInspect(
                                `Build ${release.build}: tickets ${state.features
                                  .filter((f) => f.releases.includes(release.id))
                                  .map((f) => f.id)
                                  .join(", ")}. Approvals attach to this ID, and the same artifact is promoted through every environment.`,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onInspect(`Build ${release.build}: tickets ${state.features.filter((f) => f.releases.includes(release.id)).map((f) => f.id).join(", ")}. Approvals attach to this ID, and the same artifact is promoted through every environment.`);
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`Build ${release.build}`}
                            style={{ cursor: "pointer" }}
                          >
                            <rect x={BUILD_X} y={-14} rx={6} width={BUILD_W} height={28} fill="#070a10" stroke={GREEN} strokeWidth={2} />
                            <text x={BUILD_X + BUILD_W / 2} y={5} textAnchor="middle" fill={GREEN} fontSize={13} fontWeight={700} fontFamily={MONO}>
                              {release.build}
                            </text>
                          </g>
                        </g>
                      ) : release.riding === null ? (
                        <text x={BUILD_X} y={-10} fill={MUTED} fontSize={12} fontFamily={MONO}>
                          {count > 0 ? "assembling…" : "empty release"}
                        </text>
                      ) : null}
                    </g>
                  ) : null}
                </g>
              );
            })}

            {/* main, gliding with the layout. */}
            <g style={{ transform: `translate(0px, ${mainY}px)`, ...GLIDE }}>
              <GlowPath d={`M ${MAIN_X0} 0 L ${MAIN_X1} 0`} color={BLUE} width={2.4} />
              {[MAIN_X0 + 16, 96, 174, 252].map((x) => (
                <Commit
                  key={x}
                  x={x}
                  y={0}
                  color={BLUE}
                  label="A commit on the production baseline. Features and releases start from here, so nothing drags dev's unreleased work along."
                  onInspect={onInspect}
                  active={false}
                />
              ))}
              {state.shipped.map((s, i) => (
                <Commit
                  key={s.build}
                  x={MAIN_X1 - 50 - (state.shipped.length - 1 - i) * 40}
                  y={0}
                  color={GREEN}
                  r={6.5}
                  label={`Reconcile from ${s.name}: the exact source that produced build ${s.build} (tickets ${s.tickets.join(", ")}). This is the baseline releases still in flight retrofit from.`}
                  onInspect={onInspect}
                  active={inspect?.includes(`build ${s.build} (tickets`) ?? false}
                />
              ))}
              <Commit
                x={MAIN_X1 - 12}
                y={0}
                color={BLUE}
                r={7}
                label="main's tip: the current production baseline. New features and releases branch from here."
                onInspect={onInspect}
                active={inspect?.startsWith("main's tip") ?? false}
              />
              <text x={MAIN_X0 + 2} y={28} fill={MUTED} fontSize={13} fontFamily={MONO}>
                main
              </text>
            </g>

            {/* The handoff divider and the environments board: which build
                each environment is running right now. Fixed, outside the
                gliding lane groups. */}
            <g>
              <path d={`M ${ZONE_X} 16 L ${ZONE_X} ${height - 16}`} stroke={LINE} strokeWidth={1.4} strokeDasharray="4 6" fill="none" />
              <text x={ENV_X} y={TOP_PAD - 8} fill={MUTED} fontSize={11} fontFamily={MONO} letterSpacing="0.12em">
                ENVIRONMENTS
              </text>
              {(["DEV", "QA", "UAT", "PROD"] as const).map((env, i) => {
                const y = TOP_PAD + i * (ENV_H + ENV_GAP);
                const color = env === "DEV" ? VIOLET : GREEN;
                const occupant =
                  env === "DEV"
                    ? "dev"
                    : env === "PROD"
                      ? state.prodIndex >= 0
                        ? String(state.shipped[state.prodIndex].build)
                        : null
                      : state.envBuilds[i - 1] !== null
                        ? String(state.envBuilds[i - 1])
                        : null;
                const greys: { id: number; act: () => void; hint: string }[] = [];
                if (env === "PROD") {
                  for (const j of [state.prodIndex - 1, state.prodIndex + 1]) {
                    if (j >= 0 && j < state.shipped.length) {
                      greys.push({
                        id: state.shipped[j].build,
                        act: () => setProd(j),
                        hint: j < state.prodIndex ? `Roll PROD back to build ${state.shipped[j].build}` : `Move PROD forward to build ${state.shipped[j].build}`,
                      });
                    }
                  }
                } else if (env !== "DEV" && state.prevEnv[i - 1] !== null) {
                  greys.push({
                    id: state.prevEnv[i - 1]!,
                    act: () => redeploy(i - 1),
                    hint: `Redeploy build ${state.prevEnv[i - 1]} to ${env}`,
                  });
                }
                const label =
                  env === "DEV"
                    ? "DEV runs whatever the dev branch integrates, on top of a copy of main. It is never promoted."
                    : env === "PROD"
                      ? occupant
                        ? `PROD runs build ${occupant}${state.prodIndex < state.shipped.length - 1 ? " after a rollback" : ""}. The deployment record, not the branch, says what is live.`
                        : "PROD is empty. Ship a build to fill it."
                      : occupant
                        ? `${env} is running build ${occupant}. Its approval belongs to that build, even if the branch has moved on.`
                        : `${env} is idle. It runs whichever build gets promoted next.`;
                return (
                  <g
                    key={env}
                    onClick={() => onInspect(label)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onInspect(label);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={label}
                    style={{ cursor: "pointer" }}
                  >
                    <rect
                      x={ENV_X}
                      y={y}
                      rx={5}
                      width={ENV_W}
                      height={ENV_H}
                      fill={occupant ? (env === "DEV" ? "rgba(173,128,235,0.12)" : "rgba(47,227,155,0.12)") : "#070a10"}
                      stroke={color}
                      strokeWidth={occupant ? 2 : 1.2}
                      opacity={occupant ? 1 : 0.55}
                      style={{ transition: "opacity 350ms" }}
                    />
                    <text x={ENV_X + 10} y={y + ENV_H / 2 + 4} fill={occupant ? color : MUTED} fontSize={12} fontWeight={600} fontFamily={MONO}>
                      {env}
                    </text>
                    <text x={ENV_X + ENV_W - 10} y={y + ENV_H / 2 + 4} textAnchor="end" fill={occupant ? INK : MUTED} fontSize={12} fontWeight={700} fontFamily={MONO}>
                      {occupant ?? "–"}
                    </text>
                    {greys.map((grey, g) => (
                      <text
                        key={grey.id}
                        x={ENV_X + ENV_W - 58 - g * 40}
                        y={y + ENV_H / 2 + 4}
                        textAnchor="end"
                        fill={MUTED}
                        opacity={0.75}
                        fontSize={10.5}
                        fontFamily={MONO}
                        textDecoration="underline"
                        tabIndex={0}
                        role="button"
                        aria-label={grey.hint}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          grey.act();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            grey.act();
                          }
                        }}
                      >
                        {grey.id}
                      </text>
                    ))}
                  </g>
                );
              })}
            </g>
          </svg>
          </div>
        </div>

        {/* Commit inspector. */}
        <div aria-live="polite" className="min-w-0 rounded-md border border-line/60 bg-surface px-3 py-2">
          <p className="min-w-0 break-words font-mono text-xs leading-relaxed text-ink/90">
            {inspect ?? <span className="text-muted">Click a commit, a build, or a lane badge to see what it carries.</span>}
          </p>
        </div>

        {/* Ticket buckets: drag between them, or tap a ticket then a destination. */}
        <p className="-mb-2 min-w-0 break-words text-[11px] text-muted">
          Drag a ticket into a release, or tap it and tap the destination.
        </p>
        <div role="list" aria-label="Releases and their tickets" className="grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-2">
          <Bucket title="dev" note="every ticket integrates here">
            {unassigned.map((f) => (
              <Ticket key={f.id} id={f.id} carrying={carrying === f.id} onPick={() => pickOrMove(f.id)} onGrab={grab} onRelease={release_} />
            ))}
            {state.features
              .filter((f) => f.releases.length > 0)
              .map((f) => (
                <span
                  key={f.id}
                  title={`feat/${f.id} · selected into ${f.releases.map((id) => `REL-${id}`).join(", ")}`}
                  className="inline-flex animate-fade-in items-center whitespace-nowrap rounded border border-line/50 px-1.5 py-0.5 font-mono text-[10px] text-muted/60"
                >
                  {f.id}
                </span>
              ))}
            <span className="mt-1 flex w-full flex-wrap gap-1.5">
              <Button
                variant="outline"
                onClick={resetDev}
                disabled={state.devBase >= state.shipped.length - 1}
                title="Delete dev and branch it fresh from main. The open feature branches merge back in."
                className="whitespace-nowrap !px-2.5 !py-1 !text-xs"
              >
                Reset dev
              </Button>
            </span>
          </Bucket>
          {state.releases.map((release) => {
            const tickets = state.features.filter((f) => f.releases.includes(release.id));
            const carrier = release.riding !== null ? state.releases.find((r) => r.id === release.riding) : undefined;
            const qaHolder = state.releases.find((r) => r.id !== release.id && r.riding !== release.id && r.build !== null && r.env === 1);
            const uatHolder = state.releases.find((r) => r.id !== release.id && r.riding !== release.id && r.build !== null && r.env === 2);
            const qaBusy = release.build !== null && release.env === 0 && Boolean(qaHolder);
            const uatBusy = release.build !== null && release.env === 1 && Boolean(uatHolder);
            const mergeTarget = state.releases.find(
              (r) => r.id !== release.id && r.riding === null && r.build !== null && (r.env === 1 || r.env === 2),
            );
            const canMerge = !carrier && Boolean(mergeTarget) && release.env <= 1 && !release.needsRetrofit;
            const riders = state.releases.filter((r) => r.riding === release.id);
            return (
              <Bucket
                key={release.id}
                title={release.name}
                note={
                  release.needsRetrofit
                    ? "out of date with main"
                    : `${
                        release.build !== null
                          ? `build ${release.build} · ${release.env}/${ENVS.length} approved`
                          : "assembling"
                      }${qaBusy ? ` · QA busy with ${qaHolder!.name}` : ""}${
                        uatBusy ? ` · UAT held by ${uatHolder!.name}` : ""
                      }${carrier ? ` · riding ${carrier.name}` : ""}${
                        riders.length > 0 ? ` · carrying ${riders.map((r) => r.name).join(", ")}` : ""
                      }`
                }
                warn={release.needsRetrofit}
                active={carrying !== null}
                onDrop={drop(release.id)}
                onPick={() => dropCarried(release.id)}
                onAbandon={() => abandon(release.id)}
              >
                {tickets.map((f) => (
                  <Ticket key={f.id} id={f.id} carrying={carrying === f.id} onPick={() => pickOrMove(f.id)} onGrab={grab} onRelease={release_} />
                ))}
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {release.needsRetrofit ? (
                    <Button variant="outline" onClick={() => retrofit(release.id)} className="whitespace-nowrap !px-2.5 !py-1 !text-xs">
                      Merge main
                    </Button>
                  ) : release.build === null ? (
                    <Button variant="outline-strong" disabled={tickets.length === 0} onClick={() => build(release.id)} className="whitespace-nowrap !px-2.5 !py-1 !text-xs">
                      Build
                    </Button>
                  ) : (
                    <Button
                      onClick={() => promote(release.id)}
                      title={
                        uatBusy
                          ? `UAT holds only what ships next. Overwriting sends ${uatHolder!.name} back; build ${uatHolder!.build} will need UAT again.`
                          : qaBusy
                            ? `QA is testing ${qaHolder!.name}. Taking QA cuts their run short; merging avoids that.`
                            : undefined
                      }
                      className="whitespace-nowrap !px-2.5 !py-1 !text-xs"
                    >
                      {release.env >= ENVS.length
                        ? "Ship"
                        : uatBusy
                          ? `Overwrite ${uatHolder!.name} in UAT`
                          : `Promote to ${ENVS[release.env]}`}
                    </Button>
                  )}
                  {canMerge ? (
                    <Button
                      variant="outline"
                      onClick={() => mergeInto(release.id, mergeTarget!.id)}
                      title={`Merge ${release.name} into ${mergeTarget!.name}: the combined release rebuilds and re-approves from QA, and ${mergeTarget!.name}'s old build stays deployed until the new one replaces it. ${release.name} stays open.`}
                      className="whitespace-nowrap !px-2.5 !py-1 !text-xs"
                    >
                      Merge into {mergeTarget!.name}
                    </Button>
                  ) : null}
                </span>
              </Bucket>
            );
          })}
        </div>

        {state.shipped.length > 0 || state.retained.length > 0 ? (
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Artifact store</span>
              <span className="font-mono text-[10px] text-muted/80">greyed builds in the board are one click from running again</span>
            </div>
            <div role="list" aria-label="Retained builds" className="mt-1 flex min-w-0 flex-col gap-0.5 font-mono text-xs text-muted">
              {state.shipped.map((sh, i) => (
                <p role="listitem" key={sh.build} className="min-w-0 animate-fade-in break-words">
                  <span className="text-plasma/90">{sh.name}</span> · build {sh.build} · {sh.tickets.length} {sh.tickets.length === 1 ? "ticket" : "tickets"} ·{" "}
                  {i === state.prodIndex ? (
                    <span className="text-plasma">in production</span>
                  ) : i > state.prodIndex ? (
                    <span className="text-orange-400/90">rolled back</span>
                  ) : (
                    "previous, retained"
                  )}
                </p>
              ))}
              {state.retained.map((b) => (
                <p role="listitem" key={b.id} className="min-w-0 animate-fade-in break-words">
                  <span className="text-ink/70">{b.name}</span> · build {b.id} · superseded, retained
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {state.log.length > 0 ? (
          <div role="list" aria-label="What just happened" className="flex min-w-0 flex-col gap-0.5 border-t border-line/60 pt-2 font-mono text-xs">
            {state.log.map((entry, i) => (
              <p
                role="listitem"
                key={`${i}-${entry.text}`}
                className={`min-w-0 break-words ${entry.kind === "bad" ? "text-orange-400/90" : entry.kind === "good" ? "text-plasma/90" : "text-muted"}`}
              >
                {entry.text}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </InteractiveFigure>
  );
}

function Bucket({
  title,
  note,
  warn,
  active = false,
  onDrop,
  onPick,
  onAbandon,
  children,
}: {
  title: string;
  note: string;
  warn?: boolean;
  /** A ticket is picked up: highlight this bucket as a destination. */
  active?: boolean;
  onDrop?: (event: DragEvent) => void;
  onPick?: () => void;
  /** Throw the whole release away; its features stay in dev. */
  onAbandon?: () => void;
  children: ReactNode;
}) {
  const droppable = Boolean(onDrop);
  return (
    <div
      role="listitem"
      onDragOver={droppable ? (e) => e.preventDefault() : undefined}
      onDrop={onDrop}
      className={`min-w-0 rounded-md border p-2.5 transition-colors duration-300 ${
        active && droppable ? "border-dashed border-accent/70 bg-accent/5" : warn ? "border-orange-400/60" : "border-line"
      }`}
    >
      <span className="flex min-w-0 items-start justify-between gap-2">
        <button
          type="button"
          onClick={onPick}
          className="block min-w-0 flex-1 text-left"
          title={active && droppable ? `Select the ticket into ${title}` : undefined}
        >
          <span className="block truncate font-mono text-sm font-semibold text-ink">{title}</span>
          <span className={`mt-0.5 block truncate text-[11px] ${warn ? "text-orange-400" : "text-muted"}`}>{note}</span>
        </button>
        {onAbandon ? (
          <button
            type="button"
            onClick={onAbandon}
            title={`Abandon ${title}. Its features go back to integrating only in dev.`}
            aria-label={`Abandon ${title}`}
            className="shrink-0 rounded p-1 text-muted transition-colors hover:text-orange-400"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6h18" />
              <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        ) : null}
      </span>
      <span className="mt-1.5 flex min-w-0 flex-wrap gap-1.5">{children}</span>
    </div>
  );
}

function Ticket({
  id,
  carrying,
  onPick,
  onGrab,
  onRelease,
}: {
  id: number;
  carrying: boolean;
  onPick: () => void;
  onGrab: (id: number) => void;
  onRelease: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/ticket", String(id));
        onGrab(id);
      }}
      onDragEnd={onRelease}
      onClick={onPick}
      aria-pressed={carrying}
      title={carrying ? "Now pick a destination" : `Drag feat/${id} into a release, or tap to pick it up`}
      className={`group inline-flex animate-fade-in cursor-grab touch-manipulation items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-xs transition-all duration-200 active:cursor-grabbing ${
        carrying
          ? "border-accent bg-accent/15 text-accent shadow-[0_0_8px_rgba(222,186,108,0.25)]"
          : "border-line text-ink/90 hover:-translate-y-px hover:border-accent/60"
      }`}
    >
      {/* Grip dots: the universal "this drags" glyph. */}
      <svg width="7" height="11" viewBox="0 0 7 11" aria-hidden className={carrying ? "text-accent" : "text-muted/70 group-hover:text-accent/80"}>
        {[0, 4].map((x) =>
          [0, 4, 8].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="2.2" height="2.2" rx="0.6" fill="currentColor" />),
        )}
      </svg>
      {id}
    </button>
  );
}
