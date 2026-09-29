/** @noSelfInFile */

// The UnitEvents table itself: an entry is a twin by its `twinOf` field, not
// by its key, so a row whose name ends in `Of` is a row, and its twin is
// keyed `nameOfOf`.

import { describe, expect, it } from "reforged-test/lua";
import { MapPlayer, Unit } from "../../src/index";
import { unitEventRows, unitEvents } from "../../src/events/unit/rows";
import { defined } from "../support/defined";

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

// A twin still names a row of its group, from a key ending in `Of`.
unitEventRows({
  handOf,
  // @ts-expect-error: `twinOf` names no row of the group.
  handOfOf: { twinOf: "hand", event: EVENT_UNIT_DEATH },
});
unitEventRows({
  handOf,
  // @ts-expect-error: a twin's key is its row's name followed by `Of`.
  handTwin: { twinOf: "handOf", event: EVENT_UNIT_DEATH },
});

describe("unitEventRows", () => {
  it("takes a row whose name ends in Of as a row", () => {
    expect(events.handOf.name).toEqual("UnitEvents.handOf");
  });

  it("takes the twin of that row, keyed nameOfOf", () => {
    expect(events.handOfOf(dying).name).toEqual("UnitEvents.handOfOf");
  });
});
