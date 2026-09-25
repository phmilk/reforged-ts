/** @noSelfInFile */

// UnitEvents.death and UnitEvents.deathOf(unit) through on(), and the lookup
// they read the killer with: the suites of support/events.ts, which fire the
// Subscription's Trigger with a stubbed context and observe the call log and
// what the handler received.

import { MapPlayer, Unit, UnitEvents } from "../../src/index";
import { defined } from "../support/defined";
import {
  describeDescriptor,
  describeLookup,
  everySlot,
} from "../support/events";
import { handleRef } from "../support/handle-ref";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const dying = Unit.create(owner, FourCC("hfoo"), 0, 0);
const killer = Unit.create(owner, FourCC("hfoo"), 0, 0);

describeDescriptor({
  name: "UnitEvents.death",
  descriptor: UnitEvents.death,
  registers: (trigger) =>
    everySlot(
      (player) =>
        `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, EVENT_PLAYER_UNIT_DEATH, nil)`,
    ),
  context: { GetTriggerUnit: dying.handle, GetKillingUnit: killer.handle },
  payload: { unit: dying, killer },
  required: [["unit", "GetTriggerUnit"]],
  optional: [["killer", "GetKillingUnit"]],
});

describeDescriptor({
  name: "UnitEvents.deathOf",
  descriptor: UnitEvents.deathOf(dying),
  registers: (trigger) => [
    `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", dying.handle)}, EVENT_UNIT_DEATH)`,
  ],
  context: { GetKillingUnit: killer.handle },
  payload: { unit: dying, killer },
  optional: [["killer", "GetKillingUnit"]],
});

describeLookup({
  name: "Unit.fromKilling",
  lookup: () => Unit.fromKilling(),
  context: { GetKillingUnit: killer.handle },
  expected: killer,
});
