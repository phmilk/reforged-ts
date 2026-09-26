/** @noSelfInFile */

import { MapPlayer } from "../../handles/player";
import { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

/** The ownership row of UnitEvents: `changeOwner`. */
export const ownershipRows = unitEventRows({
  /** A unit changes owner; `previousOwner` is the player it had. */
  changeOwner: {
    event: EVENT_PLAYER_UNIT_CHANGE_OWNER,
    twin: EVENT_UNIT_CHANGE_OWNER,
    unit: "unit",
    from: () => Unit.fromChanging(),
    read: (unit, event) => ({
      unit,
      previousOwner: required(
        MapPlayer.fromPreviousOwner(),
        "previousOwner",
        event,
      ),
    }),
  },
});
