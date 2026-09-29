/** @noSelfInFile */

// The UnitEvents table itself: an entry is a twin by its shape, not by its
// key, so a row whose name ends in `Of` is a row, and its twin is keyed
// `nameOfOf`. The `@ts-expect-error` lines are the groups `unitEventRows`
// rejects; the suites run the descriptors of a group it takes.

import { MapPlayer, Unit } from "../../src/index";
import { unitEventRows, unitEvents } from "../../src/events/unit/rows";
import { defined } from "../support/defined";
import { describeDescriptor, everySlot } from "../support/events";
import { handleRef } from "../support/handle-ref";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const dying = Unit.create(owner, FourCC("hfoo"), 0, 0);

const handOf = {
  event: EVENT_PLAYER_UNIT_DEATH,
  unit: "unit",
  read: (unit: Unit) => ({ unit }),
} as const;

const events = unitEvents({
  hand: unitEventRows({
    handOf,
    handOfOf: { twinOf: "handOf", event: EVENT_UNIT_DEATH },
  }),
});

unitEventRows({
  handOf,
  // @ts-expect-error: `twinOf` names no entry of the group.
  handOfOf: { twinOf: "hand", event: EVENT_UNIT_DEATH },
});
unitEventRows({
  handOf,
  handOfOf: { twinOf: "handOf", event: EVENT_UNIT_DEATH },
  // @ts-expect-error: `twinOf` names a twin, not a row.
  handOfOfOf: { twinOf: "handOfOf", event: EVENT_UNIT_DEATH },
});
unitEventRows({
  handOf,
  // @ts-expect-error: a twin's key is its row's name followed by `Of`.
  handTwin: { twinOf: "handOf", event: EVENT_UNIT_DEATH },
});
unitEventRows({
  handOf,
  // @ts-expect-error: a unit event makes the entry a twin, lacking `twinOf`.
  handOfOf: { twinof: "handOf", event: EVENT_UNIT_DEATH },
});

describeDescriptor({
  name: "UnitEvents.handOf",
  descriptor: events.handOf,
  registers: (trigger) =>
    everySlot(
      (player) =>
        `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, EVENT_PLAYER_UNIT_DEATH, nil)`,
    ),
  context: { GetTriggerUnit: dying.handle },
  payload: { unit: dying },
  required: [["unit", "GetTriggerUnit"]],
});

describeDescriptor({
  name: "UnitEvents.handOfOf",
  descriptor: events.handOfOf(dying),
  registers: (trigger) => [
    `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", dying.handle)}, EVENT_UNIT_DEATH)`,
  ],
  context: {},
  payload: { unit: dying },
});
