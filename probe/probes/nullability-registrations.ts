// The Nullability sweep's Slice `nullability-registrations` (#395): the 26
// registrations, `TriggerRegister*` and `BlzTriggerRegister*`, in
// `common.j` order, each declared for the registrations' case generator
// (./nullability/constructor.ts), and what each call returned recorded
// (./nullability/case-runner.ts). The five `filter` parameters the Overlay
// types nullable run `nil` among their cases. Three catalogue cases run
// beyond the rule.
// `pnpm probe:nullability-report nullability-registrations` turns its
// Result file into this Slice's section of the sweep report. The arguments
// come from the Fixtures (./nullability/fixtures.ts), built before the
// cases run; the stale handles are of group b, so they run last.

import type { ProbeContext } from "../game/probe";
import { type ReturnCase, runCases } from "./nullability/case-runner";
import { catalogueCase, registrationCases } from "./nullability/constructor";
import { inGroupOrder } from "./nullability/expand";
import {
  buttonAfterDialogClear,
  buttonAfterDialogDestroy,
  deadDestructable,
  deadItem,
  deadUnit,
  destroyedBoolExpr,
  destroyedCondition,
  destroyedDialog,
  destroyedFilter,
  destroyedFrame,
  destroyedTimer,
  destroyedTrigger,
  gameUiFrame,
  liveButton,
  liveDestructable,
  liveDialog,
  liveFilter,
  liveItem,
  liveRegion,
  liveTimer,
  liveTrackable,
  liveTrigger,
  liveUnit,
  removedDestructable,
  removedItem,
  removedRegion,
  removedUnit,
  watchedVariable,
} from "./nullability/fixtures";
import {
  filter,
  fixed,
  handle,
  numeric,
  player,
  rawcode,
  text,
  trigger,
} from "./nullability/parameters";

/**
 * The Slice's cases, every (a) case before any (b) case, over the Fixtures
 * built here before any case runs. Every registration shares one live
 * trigger, and its destroyed one; no trigger has an action, so an event
 * that fires runs nothing. A `filter` runs live, `nil` and destroyed by each
 * of `DestroyCondition`, `DestroyFilter` and `DestroyBoolExpr`; a timer, a
 * dialog and a frame destroyed, a region and a unit removed, a unit dead; a
 * button after `DialogDestroy` or `DialogClear` of its dialog, whose stale
 * state is not known. A trackable has no stale state. A player parameter
 * is `Player(0)` only, by the constructors' rule. An event is one that
 * never fires in a Probe run where one is free to choose (`EVENT_GAME_SAVE`)
 * and an ordinary one otherwise. `TriggerRegisterVariableEvent` watches a
 * Lua global the Fixture `watchedVariable` sets.
 *
 * The catalogue's cases (`catalogueCase`): `TriggerRegisterDeathEvent`
 * with a live destructable and a live item, the widget kinds its typical
 * unit leaves out; `TriggerRegisterFilterUnitEvent` with
 * `EVENT_UNIT_DEATH`, an event `common.j` does not list under it, which a
 * first run gave nil for.
 */
function sliceCases(): ReturnCase[] {
  const whichTrigger = trigger(
    "whichTrigger",
    liveTrigger(),
    destroyedTrigger(),
  );
  const boolexprFilter = filter("filter", liveFilter(), [
    ["destroyed condition", destroyedCondition()],
    ["destroyed filter", destroyedFilter()],
    ["destroyed boolexpr", destroyedBoolExpr()],
  ]);
  const whichRegion = handle("whichRegion", liveRegion(), [
    ["removed region", removedRegion()],
  ]);
  const trackable = handle("t", liveTrackable(), []);
  const destructable = liveDestructable();
  const item = liveItem();
  const whichUnit = handle("whichUnit", liveUnit(), [
    ["dead unit", deadUnit()],
    ["removed unit", removedUnit()],
  ]);
  return inGroupOrder(
    registrationCases(
      "TriggerRegisterVariableEvent",
      [
        whichTrigger,
        text("varName", watchedVariable()),
        fixed("opcode", GREATER_THAN),
        numeric("limitval", 1),
      ],
      ([t, varName, opcode, limitval]) =>
        TriggerRegisterVariableEvent(t, varName, opcode, limitval),
    ),
    registrationCases(
      "TriggerRegisterTimerEvent",
      [whichTrigger, numeric("timeout", 1), fixed("periodic", false)],
      ([t, timeout, periodic]) =>
        TriggerRegisterTimerEvent(t, timeout, periodic),
    ),
    registrationCases(
      "TriggerRegisterTimerExpireEvent",
      [
        whichTrigger,
        handle("t", liveTimer(), [["destroyed timer", destroyedTimer()]]),
      ],
      ([t, timer]) => TriggerRegisterTimerExpireEvent(t, timer),
    ),
    registrationCases(
      "TriggerRegisterGameStateEvent",
      [
        whichTrigger,
        fixed("whichState", GAME_STATE_TIME_OF_DAY),
        fixed("opcode", GREATER_THAN),
        numeric("limitval", 12),
      ],
      ([t, state, opcode, limitval]) =>
        TriggerRegisterGameStateEvent(t, state, opcode, limitval),
    ),
    registrationCases(
      "TriggerRegisterDialogEvent",
      [
        whichTrigger,
        handle("whichDialog", liveDialog(), [
          ["destroyed dialog", destroyedDialog()],
        ]),
      ],
      ([t, d]) => TriggerRegisterDialogEvent(t, d),
    ),
    registrationCases(
      "TriggerRegisterDialogButtonEvent",
      [
        whichTrigger,
        handle("whichButton", liveButton(), [
          ["button after DialogDestroy", buttonAfterDialogDestroy()],
          ["button after DialogClear", buttonAfterDialogClear()],
        ]),
      ],
      ([t, b]) => TriggerRegisterDialogButtonEvent(t, b),
    ),
    registrationCases(
      "TriggerRegisterGameEvent",
      [whichTrigger, fixed("whichGameEvent", EVENT_GAME_SAVE)],
      ([t, e]) => TriggerRegisterGameEvent(t, e),
    ),
    registrationCases(
      "TriggerRegisterEnterRegion",
      [whichTrigger, whichRegion, boolexprFilter],
      ([t, r, f]) => TriggerRegisterEnterRegion(t, r, f),
    ),
    registrationCases(
      "TriggerRegisterLeaveRegion",
      [whichTrigger, whichRegion, boolexprFilter],
      ([t, r, f]) => TriggerRegisterLeaveRegion(t, r, f),
    ),
    registrationCases(
      "TriggerRegisterTrackableHitEvent",
      [whichTrigger, trackable],
      ([t, tr]) => TriggerRegisterTrackableHitEvent(t, tr),
    ),
    registrationCases(
      "TriggerRegisterTrackableTrackEvent",
      [whichTrigger, trackable],
      ([t, tr]) => TriggerRegisterTrackableTrackEvent(t, tr),
    ),
    // Holy Light, its order string, and Iron Forged Swords.
    registrationCases(
      "TriggerRegisterCommandEvent",
      [
        whichTrigger,
        rawcode("whichAbility", FourCC("AHhb")),
        text("order", "holybolt"),
      ],
      ([t, ability, order]) => TriggerRegisterCommandEvent(t, ability, order),
    ),
    registrationCases(
      "TriggerRegisterUpgradeCommandEvent",
      [whichTrigger, rawcode("whichUpgrade", FourCC("Rhme"))],
      ([t, upgrade]) => TriggerRegisterUpgradeCommandEvent(t, upgrade),
    ),
    registrationCases(
      "TriggerRegisterPlayerEvent",
      [
        whichTrigger,
        player("whichPlayer"),
        fixed("whichPlayerEvent", EVENT_PLAYER_LEAVE),
      ],
      ([t, p, e]) => TriggerRegisterPlayerEvent(t, p, e),
    ),
    registrationCases(
      "TriggerRegisterPlayerUnitEvent",
      [
        whichTrigger,
        player("whichPlayer"),
        fixed("whichPlayerUnitEvent", EVENT_PLAYER_UNIT_DEATH),
        boolexprFilter,
      ],
      ([t, p, e, f]) => TriggerRegisterPlayerUnitEvent(t, p, e, f),
    ),
    registrationCases(
      "TriggerRegisterPlayerAllianceChange",
      [
        whichTrigger,
        player("whichPlayer"),
        fixed("whichAlliance", ALLIANCE_PASSIVE),
      ],
      ([t, p, alliance]) => TriggerRegisterPlayerAllianceChange(t, p, alliance),
    ),
    registrationCases(
      "TriggerRegisterPlayerStateEvent",
      [
        whichTrigger,
        player("whichPlayer"),
        fixed("whichState", PLAYER_STATE_RESOURCE_GOLD),
        fixed("opcode", GREATER_THAN),
        numeric("limitval", 100000),
      ],
      ([t, p, state, opcode, limitval]) =>
        TriggerRegisterPlayerStateEvent(t, p, state, opcode, limitval),
    ),
    registrationCases(
      "TriggerRegisterPlayerChatEvent",
      [
        whichTrigger,
        player("whichPlayer"),
        text("chatMessageToDetect", "-nullability"),
        fixed("exactMatchOnly", true),
      ],
      ([t, p, message, exact]) =>
        TriggerRegisterPlayerChatEvent(t, p, message, exact),
    ),
    registrationCases(
      "TriggerRegisterDeathEvent",
      [
        whichTrigger,
        handle<widget>("whichWidget", liveUnit(), [
          ["dead unit", deadUnit()],
          ["removed unit", removedUnit()],
          ["dead destructable", deadDestructable()],
          ["removed destructable", removedDestructable()],
          ["dead item", deadItem()],
          ["removed item", removedItem()],
        ]),
      ],
      ([t, w]) => TriggerRegisterDeathEvent(t, w),
    ),
    // A widget is a unit, a destructable or an item: the typical one is a
    // unit, so the other two live kinds run as catalogue cases.
    catalogueCase(
      "TriggerRegisterDeathEvent",
      "whichWidget",
      "live destructable",
      () => TriggerRegisterDeathEvent(whichTrigger.typical, destructable),
    ),
    catalogueCase("TriggerRegisterDeathEvent", "whichWidget", "live item", () =>
      TriggerRegisterDeathEvent(whichTrigger.typical, item),
    ),
    registrationCases(
      "TriggerRegisterUnitStateEvent",
      [
        whichTrigger,
        whichUnit,
        fixed("whichState", UNIT_STATE_LIFE),
        fixed("opcode", LESS_THAN),
        numeric("limitval", 1),
      ],
      ([t, u, state, opcode, limitval]) =>
        TriggerRegisterUnitStateEvent(t, u, state, opcode, limitval),
    ),
    registrationCases(
      "TriggerRegisterUnitEvent",
      [whichTrigger, whichUnit, fixed("whichEvent", EVENT_UNIT_DEATH)],
      ([t, u, e]) => TriggerRegisterUnitEvent(t, u, e),
    ),
    // The events common.j lists under this Native are
    // EVENT_UNIT_ACQUIRED_TARGET and EVENT_UNIT_TARGET_IN_RANGE. A first run
    // of this Slice on 3.0.0.24268, run
    // 69d34874-a8a3-4119-808e-75b2723ce812, gave nil for EVENT_UNIT_DEATH,
    // its typical event then, so that event stays a case of its own.
    registrationCases(
      "TriggerRegisterFilterUnitEvent",
      [
        whichTrigger,
        whichUnit,
        fixed("whichEvent", EVENT_UNIT_ACQUIRED_TARGET),
        boolexprFilter,
      ],
      ([t, u, e, f]) => TriggerRegisterFilterUnitEvent(t, u, e, f),
    ),
    catalogueCase(
      "TriggerRegisterFilterUnitEvent",
      "whichEvent",
      "EVENT_UNIT_DEATH",
      () =>
        TriggerRegisterFilterUnitEvent(
          whichTrigger.typical,
          whichUnit.typical,
          EVENT_UNIT_DEATH,
          boolexprFilter.typical,
        ),
    ),
    registrationCases(
      "TriggerRegisterUnitInRange",
      [whichTrigger, whichUnit, numeric("range", 256), boolexprFilter],
      ([t, u, range, f]) => TriggerRegisterUnitInRange(t, u, range, f),
    ),
    registrationCases(
      "BlzTriggerRegisterFrameEvent",
      [
        whichTrigger,
        handle("frame", gameUiFrame(), [["destroyed frame", destroyedFrame()]]),
        fixed("eventId", FRAMEEVENT_CONTROL_CLICK),
      ],
      ([t, frame, e]) => BlzTriggerRegisterFrameEvent(t, frame, e),
    ),
    registrationCases(
      "BlzTriggerRegisterPlayerSyncEvent",
      [
        whichTrigger,
        player("whichPlayer"),
        text("prefix", "ReforgedTs"),
        fixed("fromServer", false),
      ],
      ([t, p, prefix, fromServer]) =>
        BlzTriggerRegisterPlayerSyncEvent(t, p, prefix, fromServer),
    ),
    registrationCases(
      "BlzTriggerRegisterPlayerKeyEvent",
      [
        whichTrigger,
        player("whichPlayer"),
        fixed("key", OSKEY_A),
        numeric("metaKey", 0),
        fixed("keyDown", true),
      ],
      ([t, p, key, metaKey, keyDown]) =>
        BlzTriggerRegisterPlayerKeyEvent(t, p, key, metaKey, keyDown),
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
