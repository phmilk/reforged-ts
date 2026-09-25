/** @noSelfInFile */

import { Unit } from "../../handles/unit";
import { unitEventRows } from "./rows";

/** The death row of UnitEvents: `death`. */
export const deathRows = unitEventRows({
  /** A unit dies; `killer` is undefined when nothing killed it. */
  death: {
    event: EVENT_PLAYER_UNIT_DEATH,
    twin: EVENT_UNIT_DEATH,
    unit: "unit",
    read: (unit) => ({ unit, killer: Unit.fromKilling() }),
  },
});
