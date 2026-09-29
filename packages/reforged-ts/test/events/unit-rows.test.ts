/** @noSelfInFile */

// The UnitEvents table itself: an entry is a twin by its `twinOf`, not by its
// key, so a row whose name ends in `Of` is a row, and its twin is keyed
// `nameOfOf`. Each `@ts-expect-error` group breaks one rule of
// `unitEventRows`; the suites run the descriptors of a group it takes, its
// row written inline as the groups of the library are.

import { describe, expect, it } from "reforged-test/lua";
import { MapPlayer, Unit } from "../../src/index";
import { unitEventRows, unitEvents } from "../../src/events/unit/rows";
import { defined } from "../support/defined";
import { describeDescriptor, everySlot } from "../support/events";
import { handleRef } from "../support/handle-ref";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const dying = Unit.create(owner, FourCC("hfoo"), 0, 0);

const hand = unitEventRows({
  handOf: {
    event: EVENT_PLAYER_UNIT_DEATH,
    unit: "unit",
    read: (unit) => ({ unit }),
  },
  handOfOf: { twinOf: "handOf", event: EVENT_UNIT_DEATH },
});
const events = unitEvents({ hand });

const row = {
  event: EVENT_PLAYER_UNIT_DEATH,
  unit: "unit",
  read: (unit: Unit) => ({ unit }),
} as const;

unitEventRows({
  row,
  // @ts-expect-error: `twinOf` names no entry of the group.
  nothingOf: { twinOf: "nothing", event: EVENT_UNIT_DEATH },
});
unitEventRows({
  row,
  rowOf: { twinOf: "row", event: EVENT_UNIT_DEATH },
  // @ts-expect-error: `twinOf` names a twin, not a row.
  rowOfOf: { twinOf: "rowOf", event: EVENT_UNIT_DEATH },
});
unitEventRows({
  row,
  // @ts-expect-error: a twin's key is its row's name followed by `Of`.
  rowTwin: { twinOf: "row", event: EVENT_UNIT_DEATH },
});
/** A twin naming either of two rows, never called. */
export function eitherRow(twinOf: "row" | "other"): void {
  unitEventRows({
    row,
    other: row,
    // @ts-expect-error: a twin names one row.
    rowOf: { twinOf, event: EVENT_UNIT_DEATH },
  });
}
unitEventRows({
  row,
  // @ts-expect-error: a twin reads its row's payload, not its own.
  rowOf: { twinOf: "row", event: EVENT_UNIT_DEATH, read: row.read },
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

describe("unitEvents", () => {
  it("raises an error when two groups give the same name", () => {
    expect(() =>
      unitEvents({
        mine: unitEventRows({ handOf: row }),
        hand,
      }),
    ).toThrow("reforged-ts: UnitEvents.handOf is in two groups");
  });
});
