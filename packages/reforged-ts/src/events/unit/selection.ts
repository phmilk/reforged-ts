/** @noSelfInFile */

import { MapPlayer } from "../../handles/player";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

/** The selection rows of UnitEvents: `selected` and `deselected`. */
export const selectionRows = unitEventRows({
  /**
   * `player` selects a unit.
   * Every field is set.
   * @example Counting who selects a unit
   * {@includeCode ../../../examples/harness/unit-events.ts#selection}
   * @native TriggerRegisterPlayerUnitEvent
   */
  selected: {
    event: EVENT_PLAYER_UNIT_SELECTED,
    unit: "unit",
    read: (unit, event) => ({
      /** The unit selected or deselected. */
      unit,
      /** The player selecting or deselecting it. */
      player: required(MapPlayer.fromEvent(), "player", event),
    }),
  },
  /**
   * The event of `selected` on one Unit: `player` selects `unit`.
   * Every field is set.
   * @example Counting who selects a unit
   * {@includeCode ../../../examples/harness/unit-events.ts#selection}
   * @native TriggerRegisterUnitEvent
   */
  selectedOf: { twinOf: "selected", event: EVENT_UNIT_SELECTED },
  /**
   * `player` deselects a unit.
   * Every field is set.
   * @example Counting who selects a unit
   * {@includeCode ../../../examples/harness/unit-events.ts#selection}
   * @native TriggerRegisterPlayerUnitEvent
   */
  deselected: {
    event: EVENT_PLAYER_UNIT_DESELECTED,
    unit: "unit",
    read: (unit, event) => ({
      /** The unit selected or deselected. */
      unit,
      /** The player selecting or deselecting it. */
      player: required(MapPlayer.fromEvent(), "player", event),
    }),
  },
  /**
   * The event of `deselected` on one Unit: `player` deselects `unit`.
   * Every field is set.
   * @example Counting who selects a unit
   * {@includeCode ../../../examples/harness/unit-events.ts#selection}
   * @native TriggerRegisterUnitEvent
   */
  deselectedOf: { twinOf: "deselected", event: EVENT_UNIT_DESELECTED },
});
