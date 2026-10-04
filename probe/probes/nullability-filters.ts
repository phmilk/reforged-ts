// The Nullability sweep's Slice `nullability-filters` (#396): the 16
// Natives outside `TriggerRegister*` that take a `filter` the Overlay types
// nullable, `GroupEnum*`, `ForceEnum*`, `EnumDestructablesInRect` and
// `EnumItemsInRect`, in `common.j` order, each declared for the filters'
// case generator (./nullability/filter.ts): call cases, which record
// whether the call completed with a `nil` filter, an always-true one and a
// live one, and how many objects it enumerated (./nullability/case-runner.ts).
// `pnpm probe:nullability-report nullability-filters` turns its Result
// file into this Slice's section of the sweep report. The arguments come
// from the Fixtures (./nullability/fixtures.ts), built before the cases
// run; every case is of group a.

import type { ProbeContext } from "../game/probe";
import { type CallCase, runCases } from "./nullability/case-runner";
import { filterCases } from "./nullability/filter";
import {
  clawsFilter,
  emptyForce,
  emptyGroup,
  otherPlayerFilter,
  footmanFilter,
  liveDestructable,
  liveFilter,
  liveGate,
  liveItem,
  liveLocation,
  livePeasant,
  liveRing,
  liveUnit,
  originRect,
  selectedUnit,
  treeFilter,
  userSlotPlayer,
} from "./nullability/fixtures";

/** The `countLimit` of the `*Counted` Natives: more than any of them finds here. */
const COUNT_LIMIT = 100;

/** The units of `whichGroup` after `enumerate` fills it, the group cleared first. */
function unitsAfter(whichGroup: group, enumerate: () => void): number {
  GroupClear(whichGroup);
  enumerate();
  return BlzGroupGetSize(whichGroup);
}

/** The players of `whichForce` after `enumerate` fills it, the force cleared first. */
function playersAfter(whichForce: force, enumerate: () => void): number {
  ForceClear(whichForce);
  enumerate();
  let count = 0;
  for (let id = 0; id < GetBJMaxPlayerSlots(); id++) {
    const player = Player(id);
    if (player !== undefined && IsPlayerInForce(player, whichForce)) count++;
  }
  return count;
}

/** How many times `enumerate` calls the action it is given. */
function actionsOf(enumerate: (action: () => void) => void): number {
  let count = 0;
  enumerate(() => {
    count++;
  });
  return count;
}

/**
 * The Slice's cases, in `common.j` order, over the Fixtures built here
 * before any case runs. Around the map's origin, far from `Player(0)`'s
 * start location, stand a footman and a peasant of `Player(0)`, both
 * selected, a Claws of Attack and a Ring of Protection on the ground, and a
 * Lordaeron tree and a gate, so a live filter keeps one of two: footmen,
 * Claws of Attack, Lordaeron trees. `GroupEnumUnitsOfType` looks for
 * peasants, which the footman filter leaves out. For players, the live
 * filter keeps every player but `Player(0)`, the only player in the game.
 * The always-true filter is a `Filter` returning `true`. Each Native has a
 * group or a force of its own, cleared before each call, and a
 * `*Counted` Native a `countLimit` above what it finds.
 */
function sliceCases(): CallCase[] {
  const owner = userSlotPlayer();
  selectedUnit(liveUnit());
  selectedUnit(livePeasant());
  liveItem();
  liveRing();
  liveDestructable();
  liveGate();
  const rect = originRect();
  const location = liveLocation();
  const alwaysTrue = liveFilter();
  const units = { alwaysTrue, live: footmanFilter() };
  const players = { alwaysTrue, live: otherPlayerFilter() };
  const items = { alwaysTrue, live: clawsFilter() };
  const destructables = { alwaysTrue, live: treeFilter() };
  const groupCases = (
    native: string,
    enumerate: (g: group, filter: boolexpr | undefined) => void,
  ): CallCase[] => {
    const g = emptyGroup();
    return filterCases(native, "unit", units, (filter) =>
      unitsAfter(g, () => {
        enumerate(g, filter);
      }),
    );
  };
  const forceCases = (
    native: string,
    enumerate: (f: force, filter: boolexpr | undefined) => void,
  ): CallCase[] => {
    const f = emptyForce();
    return filterCases(native, "player", players, (filter) =>
      playersAfter(f, () => {
        enumerate(f, filter);
      }),
    );
  };
  return [
    groupCases("GroupEnumUnitsOfType", (g, filter) => {
      GroupEnumUnitsOfType(g, "peasant", filter);
    }),
    groupCases("GroupEnumUnitsOfPlayer", (g, filter) => {
      GroupEnumUnitsOfPlayer(g, owner, filter);
    }),
    groupCases("GroupEnumUnitsOfTypeCounted", (g, filter) => {
      GroupEnumUnitsOfTypeCounted(g, "peasant", filter, COUNT_LIMIT);
    }),
    groupCases("GroupEnumUnitsInRect", (g, filter) => {
      GroupEnumUnitsInRect(g, rect, filter);
    }),
    groupCases("GroupEnumUnitsInRectCounted", (g, filter) => {
      GroupEnumUnitsInRectCounted(g, rect, filter, COUNT_LIMIT);
    }),
    groupCases("GroupEnumUnitsInRange", (g, filter) => {
      GroupEnumUnitsInRange(g, 0, 0, 512, filter);
    }),
    groupCases("GroupEnumUnitsInRangeOfLoc", (g, filter) => {
      GroupEnumUnitsInRangeOfLoc(g, location, 512, filter);
    }),
    groupCases("GroupEnumUnitsInRangeCounted", (g, filter) => {
      GroupEnumUnitsInRangeCounted(g, 0, 0, 512, filter, COUNT_LIMIT);
    }),
    groupCases("GroupEnumUnitsInRangeOfLocCounted", (g, filter) => {
      GroupEnumUnitsInRangeOfLocCounted(g, location, 512, filter, COUNT_LIMIT);
    }),
    groupCases("GroupEnumUnitsSelected", (g, filter) => {
      GroupEnumUnitsSelected(g, owner, filter);
    }),
    forceCases("ForceEnumPlayers", (f, filter) => {
      ForceEnumPlayers(f, filter);
    }),
    forceCases("ForceEnumPlayersCounted", (f, filter) => {
      ForceEnumPlayersCounted(f, filter, COUNT_LIMIT);
    }),
    forceCases("ForceEnumAllies", (f, filter) => {
      ForceEnumAllies(f, owner, filter);
    }),
    forceCases("ForceEnumEnemies", (f, filter) => {
      ForceEnumEnemies(f, owner, filter);
    }),
    filterCases(
      "EnumDestructablesInRect",
      "destructable",
      destructables,
      (filter) =>
        actionsOf((action) => {
          EnumDestructablesInRect(rect, filter, action);
        }),
    ),
    filterCases("EnumItemsInRect", "item", items, (filter) =>
      actionsOf((action) => {
        EnumItemsInRect(rect, filter, action);
      }),
    ),
  ].flat();
}

/**
 * The cases not to call, each as `<native> <case>`: a case that crashed the
 * game in an earlier run, named by the pending step `probe:read` printed.
 */
const SKIP: readonly string[] = [];

/**
 * Seconds of game time between building the Fixtures and the first case:
 * a unit `SelectUnit` selects is not yet among the units
 * `GroupEnumUnitsSelected` finds in the same thread.
 */
const SELECTION_DELAY = 1;

export function run(p: ProbeContext): void {
  const cases = sliceCases();
  p.hold();
  p.after(SELECTION_DELAY, () => {
    runCases(p, cases, { skip: SKIP });
    p.finish();
  });
}
