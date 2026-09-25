/** @noSelfInFile */

// UnitEvents.summon and UnitEvents.summonOf(summoner) through on(), and the
// lookups they read the summoner and the summoned unit with: the suites of
// support/events.ts, which fire the Subscription's Trigger with a stubbed
// context and observe the call log and what the handler received. Which unit
// the game fires EVENT_UNIT_SUMMON for is unverified, so summonOf reads both
// units from the Natives like summon.

import { MapPlayer, Unit, UnitEvents } from "../../src/index";
import { defined } from "../support/defined";
import {
  describeDescriptor,
  describeLookup,
  everySlot,
} from "../support/events";
import { handleRef } from "../support/handle-ref";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const summoner = Unit.create(owner, FourCC("Hamg"), 0, 0);
const summoned = Unit.create(owner, FourCC("hwat"), 0, 0);

describeDescriptor({
  name: "UnitEvents.summon",
  descriptor: UnitEvents.summon,
  registers: (trigger) =>
    everySlot(
      (player) =>
        `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, EVENT_PLAYER_UNIT_SUMMON, nil)`,
    ),
  context: {
    GetSummoningUnit: summoner.handle,
    GetSummonedUnit: summoned.handle,
  },
  payload: { summoner, summoned },
  required: [
    ["summoner", "GetSummoningUnit"],
    ["summoned", "GetSummonedUnit"],
  ],
});

describeDescriptor({
  name: "UnitEvents.summonOf",
  descriptor: UnitEvents.summonOf(summoner),
  registers: (trigger) => [
    `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", summoner.handle)}, EVENT_UNIT_SUMMON)`,
  ],
  context: {
    GetSummoningUnit: summoner.handle,
    GetSummonedUnit: summoned.handle,
  },
  payload: { summoner, summoned },
  required: [
    ["summoner", "GetSummoningUnit"],
    ["summoned", "GetSummonedUnit"],
  ],
});

describeLookup({
  name: "Unit.fromSummoning",
  lookup: () => Unit.fromSummoning(),
  context: { GetSummoningUnit: summoner.handle },
  expected: summoner,
});

describeLookup({
  name: "Unit.fromSummoned",
  lookup: () => Unit.fromSummoned(),
  context: { GetSummonedUnit: summoned.handle },
  expected: summoned,
});
