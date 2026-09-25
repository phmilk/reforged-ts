/** @noSelfInFile */

import { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

/** The summon row of UnitEvents: `summon`. */
export const summonRows = unitEventRows({
  /**
   * A unit summons `summoned`. `summonOf(unit)` registers `EVENT_UNIT_SUMMON`
   * on `unit`, meant as the summoner; which unit the game fires it for is
   * unverified in-game (the Patch documents only the player-unit event), so
   * its payload reads the summoner and the summoned unit from the Natives, as
   * `summon` does.
   */
  summon: {
    event: EVENT_PLAYER_UNIT_SUMMON,
    twin: EVENT_UNIT_SUMMON,
    unit: "summoner",
    from: () => Unit.fromSummoning(),
    twinReadsUnit: true,
    read: (summoner, event) => ({
      summoner,
      summoned: required(Unit.fromSummoned(), "summoned", event),
    }),
  },
});
