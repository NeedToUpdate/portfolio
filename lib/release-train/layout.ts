import type { Feature, Release, State } from "./model";

/**
 * Graph geometry for the release train, in SVG user units. Pure maths on
 * the model's state: where each lane, sub-lane, fork, and reconcile commit
 * sits. The component draws at these positions.
 */

export const GRAPH_W = 920;
/** The handoff divider: branches live left of it, environments right of it. */
export const ZONE_X = 712;
export const ENV_X = 726;
export const ENV_W = 150;
export const ENV_H = 28;
export const ENV_GAP = 15;
export const BUILD_W = 78;
export const BUILD_X = 598;
export const LANE_GAP = 52;
export const SUB_GAP = 32;
export const TOP_PAD = 34;
export const BOTTOM_PAD = 52;
export const LANE_START_X = 300;
export const MAIN_X0 = 18;
export const MAIN_X1 = 692;

export interface LaneRow {
  kind: "dev" | "release";
  release?: Release;
  y: number;
  /** Features drawn as sub-lanes under this lane, with absolute y positions. */
  subs: { feature: Feature; y: number }[];
}

/** The dev lane always comes first, so callers can read rows[0] directly. */
export function layoutRows(state: State): { rows: [LaneRow, ...LaneRow[]]; mainY: number; height: number } {
  let y = TOP_PAD + 12;

  const devSubs = state.devExpanded ? state.features.filter((f) => f.releases.length === 0) : [];
  const rows: [LaneRow, ...LaneRow[]] = [{ kind: "dev", y, subs: devSubs.map((feature, i) => ({ feature, y: y + SUB_GAP * (i + 1) })) }];
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
export function forkX(featureId: number): number {
  return 46 + ((featureId * 37) % 7) * 28;
}

/** Where a sub-lane curves into its lane, jittered by its y so stacked
 *  branches do not merge at one point. */
export function subMergeX(subY: number): number {
  return LANE_START_X + 48 + (subY % 3) * 8;
}

/** A shipped build's reconcile commit on main. The newest sits nearest
 *  main's tip; older ones step back to the left. */
export function shippedX(shippedCount: number, index: number): number {
  return MAIN_X1 - 50 - (shippedCount - 1 - index) * 40;
}

/** Where dev forks from main: the original baseline, or the reconcile
 *  commit it was last recut from. */
export function devForkX(state: State): number {
  return state.devBase === -1 ? 252 : shippedX(state.shipped.length, state.devBase);
}

/** A rounded curve from main up into a horizontal sub-lane, then into its target lane. */
export function featurePath(fx: number, mainY: number, subY: number, laneY: number, mergeX: number): string {
  const kneeX = fx + 48;
  const runEnd = mergeX - 54;
  return [
    `M ${fx} ${mainY}`,
    `C ${fx + 10} ${subY + 26}, ${fx + 16} ${subY}, ${kneeX} ${subY}`,
    `L ${runEnd} ${subY}`,
    `C ${runEnd + 30} ${subY}, ${mergeX - 24} ${laneY}, ${mergeX} ${laneY}`,
  ].join(" ");
}
