/** @noSelfInFile */

import { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

export const summonRows = unitEventRows({
  /** A unit summons `summoned`; `summonOf` registers on the summoner. */
  summon: {
    event: EVENT_PLAYER_UNIT_SUMMON,
    twin: EVENT_UNIT_SUMMON,
    unit: "summoner",
    from: () => Unit.fromSummoning(),
    read: (summoner, event) => ({
      summoner,
      summoned: required(Unit.fromSummoned(), "summoned", event),
    }),
  },
});
