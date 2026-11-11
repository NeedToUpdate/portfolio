/**
 * The release train's model: features, releases, builds, and the
 * environments they promote through. Discrete and deterministic. No DOM and
 * no React: the component dispatches commands and renders the state that
 * comes back; layout.ts turns that state into graph positions.
 */

export const ENVS = ["QA", "UAT", "PROD"] as const;
export const MAX_FEATURES = 8;
export const MAX_RELEASES = 3;

export interface Feature {
  id: number;
  /** Releases this ticket is selected into. It always integrates in dev;
   *  selection copies the branch into a release, it never moves it. */
  releases: number[];
}

export interface Release {
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

export interface Shipped {
  name: string;
  build: number;
  tickets: number[];
}

export interface Log {
  text: string;
  kind: "info" | "good" | "bad";
}

export interface State {
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

export type Command =
  | { type: "addFeature" }
  | { type: "addRelease" }
  /** Select a ticket into a release. It keeps integrating in dev. */
  | { type: "select"; feature: number; release: number }
  | { type: "build"; release: number }
  | { type: "promote"; release: number }
  /** Merge main into a release after the baseline moved. */
  | { type: "retrofit"; release: number }
  /** Point PROD at a shipped build: rollback or forward. */
  | { type: "setProd"; index: number }
  /** Put QA (0) or UAT (1) back on the build it ran before. */
  | { type: "redeploy"; slot: number }
  | { type: "merge"; source: number; dest: number }
  | { type: "abandon"; release: number }
  | { type: "resetDev" }
  | { type: "toggle"; target: "dev" | number };

export function addLog(log: Log[], text: string, kind: Log["kind"] = "info"): Log[] {
  return [...log, { text, kind }].slice(-4);
}

export function initialState(): State {
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

// ---------------------------------------------------------------- queries

/** Features selected into a release. */
export function ticketsIn(state: State, releaseId: number): Feature[] {
  return state.features.filter((f) => f.releases.includes(releaseId));
}

/** Another release holding a stage (1 = QA-approved, 2 = UAT-approved),
 *  ignoring anything that rides on this one. */
export function stageHolder(state: State, releaseId: number, stage: number): Release | undefined {
  return state.releases.find((r) => r.id !== releaseId && r.riding !== releaseId && r.build !== null && r.env === stage);
}

/** The release this one can merge into, if merging is open to it. */
export function mergeTarget(state: State, release: Release): Release | undefined {
  const carrier = release.riding !== null ? state.releases.find((r) => r.id === release.riding) : undefined;
  const target = state.releases.find(
    (r) => r.id !== release.id && r.riding === null && r.build !== null && (r.env === 1 || r.env === 2),
  );
  return !carrier && target && release.env <= 1 && !release.needsRetrofit ? target : undefined;
}

// ---------------------------------------------------------------- commands

/** Apply a command to a draft in place. Commands the state does not allow
 *  are ignored, the same as a disabled button. */
export function applyCommand(s: State, command: Command): void {
  switch (command.type) {
    case "addFeature":
      return addFeature(s);
    case "addRelease":
      return addRelease(s);
    case "select":
      return addTo(s, command.feature, command.release);
    case "build":
      return build(s, command.release);
    case "promote":
      return promote(s, command.release);
    case "retrofit":
      return retrofit(s, command.release);
    case "setProd":
      return setProd(s, command.index);
    case "redeploy":
      return redeploy(s, command.slot);
    case "merge":
      return mergeInto(s, command.source, command.dest);
    case "abandon":
      return abandon(s, command.release);
    case "resetDev":
      return resetDev(s);
    case "toggle":
      return toggle(s, command.target);
  }
}

/** The state after a command, as a fresh copy: the previous state is never touched. */
export function reduce(prev: State, command: Command): State {
  const draft: State = JSON.parse(JSON.stringify(prev));
  applyCommand(draft, command);
  return draft;
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

function addFeature(s: State): void {
  if (s.features.length >= MAX_FEATURES) return;
  const id = s.nextTicket;
  s.nextTicket += 1;
  s.features.push({ id, releases: [] });
  s.log = addLog(s.log, `feat/${id} branched from main and merged into dev for integration.`);
}

function addRelease(s: State): void {
  if (s.releases.length >= MAX_RELEASES) return;
  const id = s.nextRelease;
  s.nextRelease += 1;
  s.releases.push({ id, name: `REL-${id}`, build: null, env: 0, needsRetrofit: false, riding: null, expanded: true });
  s.log = addLog(s.log, `release/REL-${id} opened from the production baseline.`);
}

function addTo(s: State, featureId: number, releaseId: number): void {
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
}

function build(s: State, releaseId: number): void {
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
}

function promote(s: State, releaseId: number): void {
  const release = s.releases.find((r) => r.id === releaseId);
  if (!release || release.build === null || release.needsRetrofit) return;
  // UAT is a hard slot: one release at a time. QA can be taken over,
  // but doing so cuts the current occupant's run short.
  const other = (stage: number) => stageHolder(s, releaseId, stage);
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
}

function retrofit(s: State, releaseId: number): void {
  const release = s.releases.find((r) => r.id === releaseId);
  if (!release || !release.needsRetrofit) return;
  release.needsRetrofit = false;
  voidBuild(s, release);
  s.log = addLog(s.log, `${release.name} now carries the new production baseline.`, "good");
}

function setProd(s: State, index: number): void {
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
}

function redeploy(s: State, slot: number): void {
  const previous = s.prevEnv[slot];
  if (previous === null) return;
  s.prevEnv[slot] = s.envBuilds[slot];
  s.envBuilds[slot] = previous;
  s.log = addLog(s.log, `${ENVS[slot]} redeployed build ${previous} from the store. The retained artifact made that a click, not a rebuild.`);
}

function mergeInto(s: State, sourceId: number, destId: number): void {
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
}

function abandon(s: State, releaseId: number): void {
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
}

function resetDev(s: State): void {
  if (s.devBase >= s.shipped.length - 1) return;
  s.devBase = s.shipped.length - 1;
  s.log = addLog(
    s.log,
    "dev deleted and recut from the production baseline. The open branches merged back in; the old history stayed behind.",
    "good",
  );
}

function toggle(s: State, target: "dev" | number): void {
  if (target === "dev") s.devExpanded = !s.devExpanded;
  else {
    const release = s.releases.find((r) => r.id === target);
    if (release) release.expanded = !release.expanded;
  }
}
