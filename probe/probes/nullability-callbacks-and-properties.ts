// The Nullability sweep's Slice `nullability-callbacks-and-properties`
// (#390): the 8 callback-getters, each called outside its enum or filter
// callback, and the 6 optional-properties, each called on an object that
// should have none (./nullability/nullable.ts), in `common.j` order, and
// what each call returned recorded (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-callbacks-and-properties`
// turns its Result file into this Slice's section of the sweep report. The
// arguments come from the Fixtures (./nullability/fixtures.ts), built
// before the cases run; every case is of group a.

import type { ProbeContext } from "../game/probe";
import { type ReturnCase, runCases } from "./nullability/case-runner";
import { inGroupOrder } from "./nullability/expand";
import {
  gameUiParentFrame,
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
 * which has no leaderboard, and the game UI's parent frame, the highest
 * frame reached so far.
 */
function sliceCases(): ReturnCase[] {
  const footman = liveUnit();
  const player = userSlotPlayer();
  const frame = gameUiParentFrame();
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
    // A top-level frame has a parent (the game UI's was a handle in
    // the retired `nullability-slice-1`), so the case goes one frame higher.
    optionalPropertyCase("BlzFrameGetParent", "game UI's parent frame", () =>
      BlzFrameGetParent(frame),
    ),
    // A Probe run posts no mouse input, so the cursor rests wherever it was
    // when the game started, maybe over a melee starting unit; the case's
    // outcome records whether a unit was under it.
    optionalPropertyCase("BlzGetMouseFocusUnit", "no mouse input", () =>
      BlzGetMouseFocusUnit(),
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
