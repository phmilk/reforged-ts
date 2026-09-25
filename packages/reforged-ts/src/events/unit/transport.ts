/** @noSelfInFile */

import { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

export const transportRows = unitEventRows({
  /** A unit is loaded into `transport`; `loadedOf` registers on the unit. */
  loaded: {
    event: EVENT_PLAYER_UNIT_LOADED,
    twin: EVENT_UNIT_LOADED,
    unit: "unit",
    from: () => Unit.fromLoaded(),
    read: (unit, event) => ({
      unit,
      transport: required(Unit.fromTransport(), "transport", event),
    }),
  },
});
