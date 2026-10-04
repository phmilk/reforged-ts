// The Nullability sweep's Slice `nullability-getters` (#391): the 18
// enum-getters and the 8 intrinsic-properties, in `common.j` order, each
// declared for the getters' case generators (./nullability/getter.ts), and
// what each call returned recorded (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-getters` turns its Result file
// into this Slice's section of the sweep report. The arguments come from
// the Fixtures (./nullability/fixtures.ts), built before the cases run; the
// stale units and items are of group b, so they run last.

import type { ProbeContext } from "../game/probe";
import { type ReturnCase, runCases } from "./nullability/case-runner";
import { inGroupOrder } from "./nullability/expand";
import {
  deadItem,
  deadUnit,
  freshCameraSetup,
  liveItem,
  liveUnit,
  removedItem,
  removedUnit,
} from "./nullability/fixtures";
import { enumGetterCases, intrinsicPropertyCases } from "./nullability/getter";
import { handle, numeric, player } from "./nullability/parameters";

/**
 * The Slice's cases, every (a) case before any (b) case, over the Fixtures
 * built here before any case runs: a footman and a Claws of Attack, each
 * live, dead and removed, and a fresh camera setup, which no Native
 * destroys. A player parameter is `Player(0)`, and the getters' rule adds
 * an empty slot and Neutral Passive.
 */
function sliceCases(): ReturnCase[] {
  const whichItem = handle("whichItem", liveItem(), [
    ["dead item", deadItem()],
    ["removed item", removedItem()],
  ]);
  const whichUnit = handle("whichUnit", liveUnit(), [
    ["dead unit", deadUnit()],
    ["removed unit", removedUnit()],
  ]);
  const whichPlayer = player("whichPlayer");
  return inGroupOrder(
    // Start location 0, priority slot 0: the first of each.
    enumGetterCases(
      "GetStartLocPrio",
      [numeric("whichStartLoc", 0), numeric("prioSlotIndex", 0)],
      ([startLoc, prioSlot]) => GetStartLocPrio(startLoc, prioSlot),
    ),
    enumGetterCases("GetGameTypeSelected", [], () => GetGameTypeSelected()),
    enumGetterCases("GetGamePlacement", [], () => GetGamePlacement()),
    enumGetterCases("GetGameSpeed", [], () => GetGameSpeed()),
    enumGetterCases("GetGameDifficulty", [], () => GetGameDifficulty()),
    enumGetterCases("GetResourceDensity", [], () => GetResourceDensity()),
    enumGetterCases("GetCreatureDensity", [], () => GetCreatureDensity()),
    enumGetterCases("GetPlayerColor", [whichPlayer], ([p]) =>
      GetPlayerColor(p),
    ),
    enumGetterCases("GetPlayerController", [whichPlayer], ([p]) =>
      GetPlayerController(p),
    ),
    enumGetterCases("GetPlayerSlotState", [whichPlayer], ([p]) =>
      GetPlayerSlotState(p),
    ),
    intrinsicPropertyCases("GetWorldBounds", [], () => GetWorldBounds()),
    intrinsicPropertyCases("GetItemPlayer", [whichItem], ([i]) =>
      GetItemPlayer(i),
    ),
    enumGetterCases("GetItemType", [whichItem], ([i]) => GetItemType(i)),
    enumGetterCases("GetItemEquipmentType", [whichItem], ([i]) =>
      GetItemEquipmentType(i),
    ),
    enumGetterCases("GetItemTag", [whichItem], ([i]) => GetItemTag(i)),
    intrinsicPropertyCases("GetUnitLoc", [whichUnit], ([u]) => GetUnitLoc(u)),
    intrinsicPropertyCases("GetOwningPlayer", [whichUnit], ([u]) =>
      GetOwningPlayer(u),
    ),
    enumGetterCases("GetUnitRace", [whichUnit], ([u]) => GetUnitRace(u)),
    intrinsicPropertyCases("GetLocalPlayer", [], () => GetLocalPlayer()),
    enumGetterCases("GetPlayerRace", [whichPlayer], ([p]) => GetPlayerRace(p)),
    enumGetterCases("VersionGet", [], () => VersionGet()),
    enumGetterCases("GetDefaultDifficulty", [], () => GetDefaultDifficulty()),
    intrinsicPropertyCases(
      "CameraSetupGetDestPositionLoc",
      [handle("whichSetup", freshCameraSetup(), [])],
      ([setup]) => CameraSetupGetDestPositionLoc(setup),
    ),
    intrinsicPropertyCases("GetCameraTargetPositionLoc", [], () =>
      GetCameraTargetPositionLoc(),
    ),
    intrinsicPropertyCases("GetCameraEyePositionLoc", [], () =>
      GetCameraEyePositionLoc(),
    ),
    enumGetterCases("GetAIDifficulty", [player("num")], ([p]) =>
      GetAIDifficulty(p),
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
