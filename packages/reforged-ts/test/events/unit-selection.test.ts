/** @noSelfInFile */

// UnitEvents.selected and UnitEvents.deselected, and their Of twins, through
// on(): the suites of support/events.ts, which fire the Subscription's
// Trigger with a stubbed context and observe the call log and what the
// handler received.

import { MapPlayer, Unit, UnitEvents } from "../../src/index";
import { defined } from "../support/defined";
import { describeDescriptor, everySlot } from "../support/events";
import { handleRef } from "../support/handle-ref";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const selecting = defined(MapPlayer.fromIndex(1), "the player in slot 1");
const footman = Unit.create(owner, FourCC("hfoo"), 0, 0);

for (const [name, event, twin] of [
  ["selected", "EVENT_PLAYER_UNIT_SELECTED", "EVENT_UNIT_SELECTED"],
  ["deselected", "EVENT_PLAYER_UNIT_DESELECTED", "EVENT_UNIT_DESELECTED"],
] as const) {
  describeDescriptor({
    name: `UnitEvents.${name}`,
    descriptor: UnitEvents[name],
    registers: (trigger) =>
      everySlot(
        (player) =>
          `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, ${event}, nil)`,
      ),
    context: {
      GetTriggerUnit: footman.handle,
      GetTriggerPlayer: selecting.handle,
    },
    payload: { unit: footman, player: selecting },
    required: [
      ["unit", "GetTriggerUnit"],
      ["player", "GetTriggerPlayer"],
    ],
  });

  describeDescriptor({
    name: `UnitEvents.${name}Of`,
    descriptor: UnitEvents[`${name}Of`](footman),
    registers: (trigger) => [
      `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", footman.handle)}, ${twin})`,
    ],
    context: { GetTriggerPlayer: selecting.handle },
    payload: { unit: footman, player: selecting },
    required: [["player", "GetTriggerPlayer"]],
  });
}
