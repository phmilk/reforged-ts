// The Nullability sweep's Slice `nullability-callbacks-and-properties`
// (#390): the 8 callback-getters, each called outside its enum or filter
// callback, and the 6 optional-properties, each called on an object that
// has none (./nullability/nullable.ts), in `common.j` order, and what each
// call returned recorded (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-callbacks-and-properties`
// turns its Result file into this Slice's section of the sweep report. The
// arguments come from the Fixtures (./nullability/fixtures.ts), built
// before the cases run; every case is of group a.

import type { ProbeContext } from "../game/probe";
import { type ReturnCase, runCases } from "./nullability/case-runner";
import { inGroupOrder } from "./nullability/expand";
import {
  destroyedFrame,
  liveUnit,
  userSlotPlayer,
} from "./nullability/fixtures";
import {
  callbackGetterCase,
  optionalPropertyCase,
} from "./nullability/nullable";

/**
 * The Slice's cases, in `common.j` order, over the Fixtures built here
 * before any case runs: a footman, which has no rally point, `Player(0)`,
 * which has no leaderboard, and a destroyed frame, which has no parent.
 */
function sliceCases(): ReturnCase[] {
  const footman = liveUnit();
  const player = userSlotPlayer();
  const frame = destroyedFrame();
  const noRallyPoint = "unit with no rally point";
  return inGroupOrder(
    callbackGetterCase("GetFilterUnit", () => GetFilterUnit()),
    callbackGetterCase("GetEnumUnit", () => GetEnumUnit()),
    callbackGetterCase("GetFilterDestructable", () => GetFilterDestructable()),
    callbackGetterCase("GetEnumDestructable", () => GetEnumDestructable()),
    callbackGetterCase("GetFilterItem", () => GetFilterItem()),
    callbackGetterCase("GetEnumItem", () => GetEnumItem()),
    callbackGetterCase("GetFilterPlayer", () => GetFilterPlayer()),
    callbackGetterCase("GetEnumPlayer", () => GetEnumPlayer()),
    optionalPropertyCase("GetUnitRallyPoint", noRallyPoint, () =>
      GetUnitRallyPoint(footman),
    ),
    optionalPropertyCase("GetUnitRallyUnit", noRallyPoint, () =>
      GetUnitRallyUnit(footman),
    ),
    optionalPropertyCase("GetUnitRallyDestructable", noRallyPoint, () =>
      GetUnitRallyDestructable(footman),
    ),
    optionalPropertyCase(
      "PlayerGetLeaderboard",
      "player with no leaderboard",
      () => PlayerGetLeaderboard(player),
    ),
    optionalPropertyCase("BlzFrameGetParent", "destroyed frame", () =>
      BlzFrameGetParent(frame),
    ),
    // A Probe run posts no mouse input, and the footman, the only unit,
    // stands at the map's origin; the case's outcome records whether the
    // cursor rested on it.
    optionalPropertyCase(
      "BlzGetMouseFocusUnit",
      "no unit under the cursor",
      () => BlzGetMouseFocusUnit(),
    ),
  );
}

/**
 * The cases not to call, each as `<native> <case>`: a case that crashed the
 * game in an earlier run, named by the pending step `probe:read` printed.
 */
const SKIP: readonly string[] = [];

export function run(p: ProbeContext): void {
  runCases(p, sliceCases(), { skip: SKIP });
}
