/** @noSelfInFile */

import { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

/** The summon row of UnitEvents: `summon`. */
export const summonRows = unitEventRows({
  /**
   * A unit summons `summoned`.
   * @native TriggerRegisterPlayerUnitEvent
   */
  summon: {
    event: EVENT_PLAYER_UNIT_SUMMON,
    unit: "summoner",
    from: () => Unit.fromSummoning(),
    read: (summoner, event) => ({
      /** The summoning unit. */
      summoner,
      /** The summoned unit. */
      summoned: required(Unit.fromSummoned(), "summoned", event),
    }),
  },
  /**
   * The event of `summon` on one Unit: registers `EVENT_UNIT_SUMMON` on
   * `unit`, meant as the summoner. Which unit the game fires it for is
   * unverified in-game (the Patch documents only the player-unit event), so
   * its payload reads the summoner and the summoned unit from the Natives,
   * as `summon` does.
   * @native TriggerRegisterUnitEvent
   */
  summonOf: {
    twinOf: "summon",
    event: EVENT_UNIT_SUMMON,
    twinReadsUnit: true,
  },
});
