import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReleaseTrain from "@/components/composites/ReleaseTrain";
import {
  BOTTOM_PAD,
  ENV_GAP,
  ENV_H,
  LANE_GAP,
  MAIN_X1,
  SUB_GAP,
  TOP_PAD,
  devForkX,
  featurePath,
  forkX,
  layoutRows,
  shippedX,
} from "@/lib/release-train/layout";
import {
  MAX_FEATURES,
  MAX_RELEASES,
  initialState,
  mergeTarget,
  reduce,
  ticketsIn,
  type Command,
  type State,
} from "@/lib/release-train/model";
import { mulberry32, pick } from "@/lib/team-game/rng";

function run(state: State, ...commands: Command[]): State {
  return commands.reduce(reduce, state);
}

function release(state: State, id: number) {
  const found = state.releases.find((r) => r.id === id);
  if (!found) throw new Error(`no release ${id}`);
  return found;
}

/** REL-122 built and promoted all the way to production. */
function shipFirst(): State {
  return run(
    initialState(),
    { type: "build", release: 122 },
    { type: "promote", release: 122 },
    { type: "promote", release: 122 },
    { type: "promote", release: 122 },
  );
}

/** Rules the model keeps no matter which commands arrive, as readable failures. */
function violations(state: State): string[] {
  const out: string[] = [];
  const releaseIds = state.releases.map((rel) => rel.id);
  if (state.features.length > MAX_FEATURES) out.push("too many features");
  if (state.releases.length > MAX_RELEASES) out.push("too many releases");
  if (state.log.length > 4) out.push("log grew past four lines");
  for (const feature of state.features) {
    if (new Set(feature.releases).size !== feature.releases.length) out.push(`feat/${feature.id} selected twice into one release`);
    for (const id of feature.releases) if (!releaseIds.includes(id)) out.push(`feat/${feature.id} points at missing release ${id}`);
  }
  for (const rel of state.releases) {
    // env 3 means shipped, and a shipped release leaves the board.
    if (rel.env < 0 || rel.env > 2) out.push(`${rel.name} env ${rel.env}`);
    if (rel.build === null && rel.env !== 0) out.push(`${rel.name} approved without a build`);
  }
  // Every artifact lives in exactly one place: a release, the store, or the shipped list.
  const builds = [
    ...state.releases.flatMap((rel) => (rel.build === null ? [] : [rel.build])),
    ...state.retained.map((b) => b.id),
    ...state.shipped.map((sh) => sh.build),
  ];
  if (new Set(builds).size !== builds.length) out.push("a build is in two places");
  for (const id of [...state.envBuilds, ...state.prevEnv]) {
    if (id !== null && id >= state.nextBuild) out.push(`environment runs unknown build ${id}`);
  }
  if (state.prodIndex < (state.shipped.length ? 0 : -1) || state.prodIndex >= state.shipped.length) out.push("PROD points nowhere");
  if (state.devBase >= state.shipped.length) out.push("dev recut from an unshipped baseline");
  return out;
}

describe("release-train model", () => {
  it("starts with one release carrying one of two tickets", () => {
    const s = initialState();
    expect(s.releases.map((r) => r.name)).toEqual(["REL-122"]);
    expect(ticketsIn(s, 122).map((f) => f.id)).toEqual([4311]);
    expect(s.features.filter((f) => f.releases.length === 0).map((f) => f.id)).toEqual([4312]);
  });

  it("never mutates the state it was given", () => {
    const before = initialState();
    const frozen = JSON.stringify(before);
    reduce(before, { type: "addFeature" });
    reduce(before, { type: "select", feature: 4312, release: 122 });
    expect(JSON.stringify(before)).toBe(frozen);
  });

  it("caps features and releases, and keeps the last four log lines", () => {
    let s = initialState();
    for (let i = 0; i < 12; i += 1) s = run(s, { type: "addFeature" }, { type: "addRelease" });
    expect(s.features).toHaveLength(MAX_FEATURES);
    expect(s.releases).toHaveLength(MAX_RELEASES);
    expect(s.features.map((f) => f.id)).toEqual([4311, 4312, 4313, 4314, 4315, 4316, 4317, 4318]);
    expect(s.log).toHaveLength(4);
  });

  it("builds only a release with tickets, and only once", () => {
    let s = run(initialState(), { type: "addRelease" }, { type: "build", release: 123 });
    expect(release(s, 123).build).toBeNull();
    s = run(s, { type: "build", release: 122 }, { type: "build", release: 122 });
    expect(release(s, 122).build).toBe(18427);
    expect(s.nextBuild).toBe(18428);
  });

  it("promotes the same build through QA and UAT, then ships it", () => {
    let s = run(initialState(), { type: "addRelease" }, { type: "build", release: 122 }, { type: "promote", release: 122 });
    expect(release(s, 122).env).toBe(1);
    expect(s.envBuilds).toEqual([18427, null]);
    s = run(s, { type: "promote", release: 122 });
    expect(s.envBuilds).toEqual([18427, 18427]);
    s = run(s, { type: "promote", release: 122 });

    expect(s.shipped).toEqual([{ name: "REL-122", build: 18427, tickets: [4311] }]);
    expect(s.prodIndex).toBe(0);
    expect(s.releases.map((r) => r.id)).toEqual([123]);
    // The ticket branch and the release branch both leave the graph.
    expect(s.features.map((f) => f.id)).toEqual([4312]);
    expect(s.archived).toBe(2);
    expect(release(s, 123).needsRetrofit).toBe(true);
  });

  it("blocks a stale release until it merges main", () => {
    let s = run(initialState(), { type: "addRelease" }, { type: "select", feature: 4312, release: 123 }, { type: "build", release: 122 });
    s = run(s, { type: "promote", release: 122 }, { type: "promote", release: 122 }, { type: "promote", release: 122 });
    s = run(s, { type: "build", release: 123 });
    expect(release(s, 123).build).toBeNull();
    s = run(s, { type: "retrofit", release: 123 }, { type: "build", release: 123 });
    expect(release(s, 123).build).toBe(18428);
  });

  it("voids a build when its release changes, but keeps the artifact", () => {
    const s = run(initialState(), { type: "build", release: 122 }, { type: "select", feature: 4312, release: 122 });
    expect(release(s, 122).build).toBeNull();
    expect(s.retained).toEqual([{ id: 18427, name: "REL-122", tickets: [4311] }]);
  });

  it("knocks the UAT holder back to QA-approved when another release takes UAT", () => {
    let s = run(
      initialState(),
      { type: "addRelease" },
      { type: "select", feature: 4312, release: 123 },
      { type: "build", release: 122 },
      { type: "promote", release: 122 },
      { type: "promote", release: 122 },
      { type: "build", release: 123 },
      { type: "promote", release: 123 },
    );
    expect(release(s, 122).env).toBe(2);
    s = run(s, { type: "promote", release: 123 });
    expect(release(s, 123).env).toBe(2);
    expect(release(s, 122).env).toBe(1);
    expect(s.envBuilds[1]).toBe(18428);
    expect(s.prevEnv[1]).toBe(18427);
  });

  it("merges a release into the one in QA, which then carries the rider to production", () => {
    let s = run(
      initialState(),
      { type: "addRelease" },
      { type: "select", feature: 4312, release: 123 },
      { type: "build", release: 122 },
      { type: "promote", release: 122 },
      { type: "build", release: 123 },
    );
    const target = mergeTarget(s, release(s, 123));
    expect(target?.id).toBe(122);

    s = run(s, { type: "merge", source: 123, dest: 122 });
    expect(release(s, 123).riding).toBe(122);
    expect(release(s, 123).build).toBe(18428);
    expect(release(s, 122).build).toBeNull();
    expect(ticketsIn(s, 122).map((f) => f.id)).toEqual([4311, 4312]);
    // A rider cannot merge again until it diverges.
    expect(mergeTarget(s, release(s, 123))).toBeUndefined();

    s = run(s, { type: "build", release: 122 }, { type: "promote", release: 122 }, { type: "promote", release: 122 }, { type: "promote", release: 122 });
    expect(s.releases).toEqual([]);
    expect(s.features).toEqual([]);
    expect(s.shipped[0]!.tickets).toEqual([4311, 4312]);
    expect(s.retained.map((b) => b.id)).toContain(18428);
  });

  it("lets a rider diverge by taking a new ticket", () => {
    let s = run(
      initialState(),
      { type: "addRelease" },
      { type: "addFeature" },
      { type: "select", feature: 4312, release: 123 },
      { type: "build", release: 122 },
      { type: "promote", release: 122 },
      { type: "merge", source: 123, dest: 122 },
    );
    s = run(s, { type: "select", feature: 4313, release: 123 });
    expect(release(s, 123).riding).toBeNull();
    expect(s.log.at(-2)?.text).toMatch(/REL-123 diverged from REL-122/);
  });

  it("abandons a release: tickets stay in dev, the build stays in the store, riders ride alone", () => {
    const s = run(
      initialState(),
      { type: "addRelease" },
      { type: "select", feature: 4312, release: 123 },
      { type: "build", release: 122 },
      { type: "promote", release: 122 },
      { type: "merge", source: 123, dest: 122 },
      { type: "build", release: 122 },
      { type: "abandon", release: 122 },
    );
    expect(s.releases.map((r) => r.id)).toEqual([123]);
    expect(release(s, 123).riding).toBeNull();
    expect(s.features.find((f) => f.id === 4311)?.releases).toEqual([]);
    expect(s.retained.map((b) => b.id)).toContain(18428);
  });

  it("rolls PROD back and forward between shipped builds", () => {
    let s = run(shipFirst(), { type: "addFeature" }, { type: "addRelease" }, { type: "select", feature: 4313, release: 123 });
    s = run(s, { type: "build", release: 123 }, { type: "promote", release: 123 }, { type: "promote", release: 123 }, { type: "promote", release: 123 });
    expect(s.prodIndex).toBe(1);
    s = run(s, { type: "setProd", index: 0 });
    expect(s.prodIndex).toBe(0);
    expect(s.log.at(-1)?.kind).toBe("bad");
    s = run(s, { type: "setProd", index: 1 });
    expect(s.prodIndex).toBe(1);
    expect(run(s, { type: "setProd", index: 5 }).prodIndex).toBe(1);
  });

  it("redeploys the previous build to an environment, and back again", () => {
    let s = run(
      initialState(),
      { type: "addRelease" },
      { type: "select", feature: 4312, release: 123 },
      { type: "build", release: 122 },
      { type: "promote", release: 122 },
      { type: "promote", release: 122 },
      { type: "build", release: 123 },
      { type: "promote", release: 123 },
    );
    expect(s.envBuilds[0]).toBe(18428);
    expect(s.prevEnv[0]).toBe(18427);
    s = run(s, { type: "redeploy", slot: 0 });
    expect(s.envBuilds[0]).toBe(18427);
    expect(s.prevEnv[0]).toBe(18428);
    s = run(s, { type: "redeploy", slot: 0 });
    expect(s.envBuilds[0]).toBe(18428);
    // UAT never ran anything else, so there is nothing to go back to.
    expect(run(s, { type: "redeploy", slot: 1 }).envBuilds).toEqual(s.envBuilds);
  });

  it("recuts dev only when there is a newer baseline", () => {
    expect(run(initialState(), { type: "resetDev" }).devBase).toBe(-1);
    const s = run(shipFirst(), { type: "resetDev" });
    expect(s.devBase).toBe(0);
    expect(run(s, { type: "resetDev" }).log).toEqual(s.log);
  });

  it("toggles dev and release lanes independently", () => {
    const s = run(initialState(), { type: "toggle", target: "dev" }, { type: "toggle", target: 122 });
    expect(s.devExpanded).toBe(true);
    expect(release(s, 122).expanded).toBe(false);
  });

  it("holds its invariants through a long random walk", () => {
    const rng = mulberry32(2026);
    let state = initialState();
    for (let i = 0; i < 1500; i += 1) {
      // Mostly real ids, sometimes one that does not exist.
      const known = [...state.releases.map((rel) => rel.id), 999];
      const features = state.features;
      const r = () => known[pick(rng, known.length)]!;
      const f = () => (features.length ? features[pick(rng, features.length)]!.id : 1);
      const options: Command[] = [
        { type: "addFeature" },
        { type: "addRelease" },
        { type: "select", feature: f(), release: r() },
        { type: "build", release: r() },
        { type: "promote", release: r() },
        { type: "promote", release: r() },
        { type: "retrofit", release: r() },
        { type: "setProd", index: pick(rng, 4) - 1 },
        { type: "redeploy", slot: pick(rng, 2) },
        { type: "merge", source: r(), dest: r() },
        { type: "abandon", release: r() },
        { type: "resetDev" },
        { type: "toggle", target: rng() < 0.5 ? "dev" : r() },
      ];
      state = reduce(state, options[pick(rng, options.length)]!);

      const broken = violations(state);
      if (broken.length > 0) throw new Error(`step ${i}: ${broken.join("; ")}`);
    }
    // The walk reached the interesting parts of the model.
    expect(state.shipped.length).toBeGreaterThan(2);
  });
});

describe("release-train layout", () => {
  it("stacks the dev lane, then each release, then main", () => {
    const { rows, mainY, height } = layoutRows(initialState());
    expect(rows.map((r) => [r.kind, r.y])).toEqual([
      ["dev", TOP_PAD + 12],
      ["release", TOP_PAD + 12 + LANE_GAP],
    ]);
    // REL-122 is expanded with one ticket under it.
    const releaseRow = rows[1]!;
    expect(releaseRow.subs.map((sub) => [sub.feature.id, sub.y])).toEqual([[4311, releaseRow.y + SUB_GAP]]);
    expect(mainY).toBe(releaseRow.y + LANE_GAP + SUB_GAP + 14);
    expect(height).toBe(Math.max(mainY + BOTTOM_PAD, TOP_PAD + 4 * (ENV_H + ENV_GAP) + 44));
  });

  it("pushes lower lanes down when dev expands, and back when a release collapses", () => {
    const base = layoutRows(initialState());
    const expanded = layoutRows(reduce(initialState(), { type: "toggle", target: "dev" }));
    expect(expanded.rows[0].subs.map((sub) => sub.feature.id)).toEqual([4312]);
    expect(expanded.rows[1]!.y).toBe(base.rows[1]!.y + SUB_GAP);
    expect(expanded.mainY).toBe(base.mainY + SUB_GAP);

    const collapsed = layoutRows(reduce(initialState(), { type: "toggle", target: 122 }));
    expect(collapsed.rows[1]!.subs).toEqual([]);
    expect(collapsed.mainY).toBe(base.mainY - SUB_GAP);
  });

  it("never gets shorter than the environments board", () => {
    const empty = reduce(initialState(), { type: "abandon", release: 122 });
    expect(layoutRows(empty).height).toBe(TOP_PAD + 4 * (ENV_H + ENV_GAP) + 44);
  });

  it("forks every feature off main left of where dev forks", () => {
    for (let id = 4300; id < 4400; id += 1) {
      expect(forkX(id)).toBeGreaterThanOrEqual(46);
      expect(forkX(id)).toBeLessThan(devForkX(initialState()));
    }
  });

  it("places shipped builds back from main's tip, newest last", () => {
    expect(shippedX(3, 2)).toBe(MAIN_X1 - 50);
    expect(shippedX(3, 1)).toBe(MAIN_X1 - 90);
    expect(shippedX(3, 0)).toBe(MAIN_X1 - 130);
    const recut = reduce(shipFirst(), { type: "resetDev" });
    expect(devForkX(recut)).toBe(shippedX(1, 0));
  });

  it("draws a feature path from its fork on main to its merge point on the lane", () => {
    const d = featurePath(74, 200, 130, 98, 356);
    expect(d.startsWith("M 74 200 ")).toBe(true);
    expect(d.endsWith(", 356 98")).toBe(true);
  });
});

describe("ReleaseTrain", () => {
  it("renders the controls, the graph, and the environments board", () => {
    render(<ReleaseTrain />);
    expect(screen.getByRole("button", { name: "New feature" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "New release" })).toBeEnabled();
    expect(screen.getByRole("img", { name: /Branch graph/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PROD is empty. Ship a build to fill it." })).toBeInTheDocument();
    expect(screen.getByText("0 branches archived · 0 builds live")).toBeInTheDocument();
  });

  it("builds and promotes a release to production", () => {
    render(<ReleaseTrain />);
    fireEvent.click(screen.getByRole("button", { name: "Build" }));
    fireEvent.click(screen.getByRole("button", { name: "Promote to QA" }));
    fireEvent.click(screen.getByRole("button", { name: "Promote to UAT" }));
    fireEvent.click(screen.getByRole("button", { name: "Promote to PROD" }));

    expect(screen.getByText("2 branches archived · 1 builds live")).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Retained builds" })).getByText("in production")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^PROD runs build 18427\./ })).toBeInTheDocument();
  });

  it("carries a ticket into a release by tap, without drag", () => {
    render(<ReleaseTrain />);
    const buckets = screen.getByRole("list", { name: "Releases and their tickets" });
    fireEvent.click(within(buckets).getByRole("button", { name: "4312" }));
    expect(within(buckets).getByRole("button", { name: "4312" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(buckets).getByRole("button", { name: /^REL-122/ }));

    const rel = within(buckets).getAllByRole("listitem")[1]!;
    expect(within(rel).getByRole("button", { name: "4312" })).toBeInTheDocument();
    expect(screen.getByText("feat/4312 selected into REL-122. It keeps integrating in dev too.")).toBeInTheDocument();
  });

  it("expands a lane and shows what a commit carries", () => {
    render(<ReleaseTrain />);
    const dev = screen.getByRole("button", { name: /^dev, 1 tickets\./ });
    expect(dev).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(dev);
    expect(screen.getByRole("button", { name: /^dev, 1 tickets\./ })).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByRole("button", { name: /^main's tip/ }));
    expect(screen.getByText(/^main's tip: the current production baseline\./)).toBeInTheDocument();
  });
});
