/** @noSelfInFile */

// The UnitEvents table's rule for twins, at the type level and at run time:
// an entry is a twin because it has `twinOf`, and a row otherwise, whatever
// its key. A row may be keyed `nameOf` and still gives a descriptor; a twin
// must be keyed `${twinOf}Of` after a row of its group, which the
// `@ts-expect-error` lines pin: the compile fails if one stops being an
// error.

import { describe, expect, it } from "reforged-test/lua";
import type { EventDescriptor } from "../../src/index";
import { MapPlayer, Unit } from "../../src/index";
import { unitEventRows, unitEvents } from "../../src/events/unit/rows";
import { defined } from "../support/defined";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");

/** A group with a row keyed `handOf`, and the twin of that row. */
const hands = unitEventRows({
  handOf: {
    event: EVENT_PLAYER_UNIT_ATTACKED,
    unit: "unit",
    read: (unit) => ({ unit }),
  },
  handOfOf: { twinOf: "handOf", event: EVENT_UNIT_ATTACKED },
});

const events = unitEvents({ hands });

// A row keyed `…Of` gives an Event descriptor, not a function.
const handOf: EventDescriptor<{ unit: Unit }> = events.handOf;
// Its twin gives `nameOf(unit)`, reading the row's payload.
const handOfOf: (unit: Unit) => EventDescriptor<{ unit: Unit }> =
  events.handOfOf;

// A twin keyed other than `${twinOf}Of`.
unitEventRows({
  attacked: {
    event: EVENT_PLAYER_UNIT_ATTACKED,
    unit: "unit",
    read: (unit) => ({ unit }),
  },
  // @ts-expect-error -- a twin of `attacked` must be keyed `attackedOf`.
  fooTwin: { twinOf: "attacked", event: EVENT_UNIT_ATTACKED },
});

// A twin naming no row of its group.
unitEventRows({
  attacked: {
    event: EVENT_PLAYER_UNIT_ATTACKED,
    unit: "unit",
    read: (unit) => ({ unit }),
  },
  // @ts-expect-error -- the group has no row `damaged`.
  damagedOf: { twinOf: "damaged", event: EVENT_UNIT_DAMAGED },
});

describe("unitEventRows", () => {
  it("gives a row keyed nameOf a descriptor registered for every slot", () => {
    expect(handOf.name).toBe("UnitEvents.handOf");
    expect(typeof handOf.register).toBe("function");
  });

  it("gives the twin of that row nameOf(unit)", () => {
    expect(typeof handOfOf).toBe("function");
    expect(handOfOf(Unit.create(owner, FourCC("hfoo"), 0, 0)).name).toBe(
      "UnitEvents.handOfOf",
    );
  });
});
