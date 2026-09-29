/** @noSelfInFile */

import { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

/** The transport row of UnitEvents: `loaded`. */
export const transportRows = unitEventRows({
  /**
   * A unit is loaded into `transport`.
   * @native TriggerRegisterPlayerUnitEvent
   */
  loaded: {
    event: EVENT_PLAYER_UNIT_LOADED,
    unit: "unit",
    from: () => Unit.fromLoaded(),
    read: (unit, event) => ({
      /** The loaded unit. */
      unit,
      /** The transport it is loaded into. */
      transport: required(Unit.fromTransport(), "transport", event),
    }),
  },
  /**
   * The event of `loaded` on one Unit: registers `EVENT_UNIT_LOADED` on
   * `unit`, meant as the loaded unit. Which unit the game fires it for (the
   * loaded unit or the transport) is unverified in-game (the Patch documents
   * only the player-unit event), so its payload reads the loaded unit and
   * the transport from the Natives, as `loaded` does.
   * @native TriggerRegisterUnitEvent
   */
  loadedOf: {
    twinOf: "loaded",
    event: EVENT_UNIT_LOADED,
    twinReadsUnit: true,
  },
});
