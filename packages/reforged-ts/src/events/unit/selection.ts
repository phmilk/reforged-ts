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
   * @native TriggerRegisterUnitEvent
   */
  selected: {
    event: EVENT_PLAYER_UNIT_SELECTED,
    twin: EVENT_UNIT_SELECTED,
    unit: "unit",
    read: (unit, event) => ({
      unit,
      player: required(MapPlayer.fromEvent(), "player", event),
    }),
  },
  /**
   * `player` deselects a unit.
   * Every field is set.
   * @example Counting who selects a unit
   * {@includeCode ../../../examples/harness/unit-events.ts#selection}
   * @native TriggerRegisterPlayerUnitEvent
   * @native TriggerRegisterUnitEvent
   */
  deselected: {
    event: EVENT_PLAYER_UNIT_DESELECTED,
    twin: EVENT_UNIT_DESELECTED,
    unit: "unit",
    read: (unit, event) => ({
      unit,
      player: required(MapPlayer.fromEvent(), "player", event),
    }),
  },
});
