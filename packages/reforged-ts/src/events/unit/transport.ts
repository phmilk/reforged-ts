/** @noSelfInFile */

import { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

export const transportRows = unitEventRows({
  /**
   * A unit is loaded into `transport`. `loadedOf(unit)` registers
   * `EVENT_UNIT_LOADED` on `unit`, meant as the loaded unit; which unit the
   * game fires it for (the loaded unit or the transport) is unverified
   * in-game (the Patch documents only the player-unit event), so its payload
   * reads the loaded unit and the transport from the Natives, as `loaded`
   * does.
   */
  loaded: {
    event: EVENT_PLAYER_UNIT_LOADED,
    twin: EVENT_UNIT_LOADED,
    unit: "unit",
    from: () => Unit.fromLoaded(),
    twinReadsUnit: true,
    read: (unit, event) => ({
      unit,
      transport: required(Unit.fromTransport(), "transport", event),
    }),
  },
});
