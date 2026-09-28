/** @noSelfInFile */

import { MapPlayer } from "../../handles/player";
import { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

/** The ownership row of UnitEvents: `changeOwner`. */
export const ownershipRows = unitEventRows({
  /**
   * A unit changes owner; `previousOwner` is the player it had.
   * Every field is set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  changeOwner: {
    event: EVENT_PLAYER_UNIT_CHANGE_OWNER,
    unit: "unit",
    from: () => Unit.fromChanging(),
    read: (unit, event) => ({
      /** The unit changing owner. */
      unit,
      /** The player that owned the unit before the change. */
      previousOwner: required(
        MapPlayer.fromPreviousOwner(),
        "previousOwner",
        event,
      ),
    }),
  },
  /**
   * The event of `changeOwner` on one Unit: `unit` changes owner;
   * `previousOwner` is the player it had. Every field is set.
   * @native TriggerRegisterUnitEvent
   */
  changeOwnerOf: { twinOf: "changeOwner", event: EVENT_UNIT_CHANGE_OWNER },
});
