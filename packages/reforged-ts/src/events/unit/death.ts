/** @noSelfInFile */

import { Unit } from "../../handles/unit";
import { unitEventRows } from "./rows";

/** The death row of UnitEvents: `death`. */
export const deathRows = unitEventRows({
  /**
   * A unit dies; `killer` is undefined when nothing killed it.
   * @native TriggerRegisterPlayerUnitEvent
   */
  death: {
    event: EVENT_PLAYER_UNIT_DEATH,
    unit: "unit",
    read: (unit) => ({
      /** The dying unit. */
      unit,
      /** The killing unit, undefined when nothing killed it. */
      killer: Unit.fromKilling(),
    }),
  },
  /**
   * The event of `death` on one Unit: `unit` dies; `killer` is undefined when
   * nothing killed it.
   * @native TriggerRegisterUnitEvent
   */
  deathOf: { twinOf: "death", event: EVENT_UNIT_DEATH },
});
