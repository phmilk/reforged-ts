/** @noSelfInFile */

// UnitEvents.changeOwner and UnitEvents.changeOwnerOf(unit) through on(), and
// the lookup they read the changing unit with: the suites of
// support/events.ts, which fire the Subscription's Trigger with a stubbed
// context and observe the call log and what the handler received.

import { MapPlayer, Unit, UnitEvents } from "../../src/index";
import { defined } from "../support/defined";
import {
  describeDescriptor,
  describeLookup,
  everySlot,
} from "../support/events";
import { handleRef } from "../support/handle-ref";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const previous = defined(MapPlayer.fromIndex(1), "the player in slot 1");
const changing = Unit.create(owner, FourCC("hfoo"), 0, 0);

describeDescriptor({
  name: "UnitEvents.changeOwner",
  descriptor: UnitEvents.changeOwner,
  registers: (trigger) =>
    everySlot(
      (player) =>
        `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, EVENT_PLAYER_UNIT_CHANGE_OWNER, nil)`,
    ),
  context: {
    GetChangingUnit: changing.handle,
    GetChangingUnitPrevOwner: previous.handle,
  },
  payload: { unit: changing, previousOwner: previous },
  required: [
    ["unit", "GetChangingUnit"],
    ["previousOwner", "GetChangingUnitPrevOwner"],
  ],
});

describeDescriptor({
  name: "UnitEvents.changeOwnerOf",
  descriptor: UnitEvents.changeOwnerOf(changing),
  registers: (trigger) => [
    `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", changing.handle)}, EVENT_UNIT_CHANGE_OWNER)`,
  ],
  context: { GetChangingUnitPrevOwner: previous.handle },
  payload: { unit: changing, previousOwner: previous },
  required: [["previousOwner", "GetChangingUnitPrevOwner"]],
});

describeLookup({
  name: "Unit.fromChanging",
  lookup: () => Unit.fromChanging(),
  context: { GetChangingUnit: changing.handle },
  expected: changing,
});
