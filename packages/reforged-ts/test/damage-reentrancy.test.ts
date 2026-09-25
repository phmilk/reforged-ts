/** @noSelfInFile */

// Damage re-entrancy: in Dev mode a damage handler that damages back without
// bound is stopped by `Unit.damageTarget` once the damage handlers running
// nest deeper than the limit (eight by default, `configure`'s
// `damageDepthLimit`), and the failure is reported naming the unit and the
// depth; a single bounce passes. A Trigger is marked by its damage
// registration, so `on()` subscriptions are covered, and an action added
// before the registration too. With Dev mode off nothing is counted.

import { describe, expect, it } from "reforged-test/lua";
import {
  MapPlayer,
  on,
  Reforged,
  Trigger,
  Unit,
  UnitEvents,
} from "../src/index";
import { defined } from "./support/defined";

// Dev mode raises for a Wrapper created before the globals Init stage.
__stub_init_globals();

const footman = FourCC("hfoo");
const owner = defined(MapPlayer.fromIndex(1), "MapPlayer.fromIndex(1)");

/** What `body` printed while it ran. */
function printedBy(body: () => void): string[] {
  const before = __stub_printed().length;
  body();
  return __stub_printed().slice(before);
}

/** How many times `UnitDamageTarget` was called while `body` ran. */
function damageCallsIn(body: () => void): number {
  const before = __stub_args("UnitDamageTarget").length;
  body();
  return __stub_args("UnitDamageTarget").length - before;
}

/** `source` deals one point of damage to `target`. */
function hit(source: Unit, target: Unit): void {
  source.damageTarget(
    target.handle,
    1,
    false,
    false,
    ATTACK_TYPE_NORMAL,
    DAMAGE_TYPE_NORMAL,
    WEAPON_TYPE_WHOKNOWS,
  );
}

/** Two fresh units that damage each other. */
function duel(): [Unit, Unit] {
  return [Unit.create(owner, footman, 0, 0), Unit.create(owner, footman, 0, 0)];
}

/** The damaged unit hits back its damage source, while `more()` holds. */
function hitBack(more: () => boolean = () => true): () => void {
  return () => {
    if (!more()) {
      return;
    }
    const target = defined(Unit.fromEvent(), "the damaged unit");
    const source = defined(Unit.fromDamageSource(), "the damage source");
    hit(target, source);
  };
}

/** A Trigger on the damaged events of both units, hitting back. */
function reflecting(a: Unit, b: Unit, more?: () => boolean): Trigger {
  const trigger = Trigger.create();
  trigger.registerUnitEvent(a, EVENT_UNIT_DAMAGED);
  trigger.registerUnitEvent(b, EVENT_UNIT_DAMAGED);
  trigger.addAction(hitBack(more));
  return trigger;
}

/** The message the Guard raises for `unit` at `depth` past `limit`. */
function stopped(unit: Unit, depth: number, limit: number): string {
  return `reforged-ts: Unit#${String(unit.id)} Unit.damageTarget at damage depth ${String(depth)}, past the limit of ${String(limit)}: a damage handler that deals damage fires the damage events again, which loops until the client crashes`;
}

/** Whether `line` is the report of `origin` failing with `message`. */
function reports(line: string, origin: string, message: string): boolean {
  return (
    line.startsWith(`reforged-ts: ${origin} failed: `) && line.endsWith(message)
  );
}

describe("damage re-entrancy in Dev mode", () => {
  it("stops a handler that damages back unconditionally at the limit", () => {
    Reforged.configure({ devMode: true });
    const [a, b] = duel();
    const trigger = reflecting(a, b);
    let printed: string[] = [];
    const calls = damageCallsIn(() => {
      printed = printedBy(() => {
        hit(a, b);
      });
    });
    // The first call is the test's; each later one is a nested dispatch.
    expect(calls - 1).toEqual(8);
    expect(printed.length).toEqual(1);
    // Depth 9 is the ninth handler, hitting back with b.
    expect(
      reports(
        printed[0],
        `Trigger#${String(trigger.id)} Trigger.addAction`,
        stopped(b, 9, 8),
      ),
    ).toEqual(true);
    trigger.destroy();
  });

  it("lets a single bounce through, without a report", () => {
    Reforged.configure({ devMode: true });
    const [a, b] = duel();
    let bounces = 1;
    const trigger = reflecting(a, b, () => bounces-- > 0);
    let printed: string[] = [];
    const calls = damageCallsIn(() => {
      printed = printedBy(() => {
        hit(a, b);
      });
    });
    expect(calls).toEqual(2);
    expect(printed).toEqual([]);
    trigger.destroy();
  });

  it("honours the limit set through configure, kept by a later configure without it", () => {
    Reforged.configure({ devMode: true, damageDepthLimit: 3 });
    Reforged.configure({ devMode: true });
    const [a, b] = duel();
    const trigger = reflecting(a, b);
    let printed: string[] = [];
    const calls = damageCallsIn(() => {
      printed = printedBy(() => {
        hit(a, b);
      });
    });
    expect(calls - 1).toEqual(3);
    expect(printed.length).toEqual(1);
    expect(
      reports(
        printed[0],
        `Trigger#${String(trigger.id)} Trigger.addAction`,
        stopped(a, 4, 3),
      ),
    ).toEqual(true);
    trigger.destroy();
    Reforged.configure({ devMode: true, damageDepthLimit: 8 });
  });

  it("counts an action added before the damage registration", () => {
    Reforged.configure({ devMode: true });
    const [a, b] = duel();
    const trigger = Trigger.create();
    trigger.addAction(hitBack());
    trigger.registerUnitEvent(a, EVENT_UNIT_DAMAGED);
    trigger.registerUnitEvent(b, EVENT_UNIT_DAMAGED);
    const calls = damageCallsIn(() => {
      printedBy(() => {
        hit(a, b);
      });
    });
    expect(calls - 1).toEqual(8);
    trigger.destroy();
  });

  it("counts a condition of a damage trigger", () => {
    Reforged.configure({ devMode: true });
    const [a, b] = duel();
    const trigger = Trigger.create();
    trigger.registerUnitEvent(a, EVENT_UNIT_DAMAGED);
    trigger.registerUnitEvent(b, EVENT_UNIT_DAMAGED);
    trigger.addCondition(() => {
      hitBack()();
      return false;
    });
    let printed: string[] = [];
    const calls = damageCallsIn(() => {
      printed = printedBy(() => {
        hit(a, b);
      });
    });
    expect(calls - 1).toEqual(8);
    expect(printed.length).toEqual(1);
    expect(
      reports(
        printed[0],
        `Trigger#${String(trigger.id)} Trigger.addCondition`,
        stopped(b, 9, 8),
      ),
    ).toEqual(true);
    trigger.destroy();
  });

  it("stops an on() damage subscription that damages back", () => {
    Reforged.configure({ devMode: true });
    const [a, b] = duel();
    const subscriptions = [a, b].map((unit) =>
      on(UnitEvents.damagedOf(unit), ({ source, target }) => {
        hit(target, defined(source, "the damage source"));
      }),
    );
    let printed: string[] = [];
    const calls = damageCallsIn(() => {
      printed = printedBy(() => {
        hit(a, b);
      });
    });
    expect(calls - 1).toEqual(8);
    expect(printed.length).toEqual(1);
    expect(
      reports(printed[0], "UnitEvents.damagedOf", stopped(b, 9, 8)),
    ).toEqual(true);
    for (const subscription of subscriptions) {
      subscription.destroy();
    }
  });
});

describe("damage re-entrancy with Dev mode off", () => {
  it("counts nothing: a chain deeper than the limit completes", () => {
    Reforged.configure({ devMode: false });
    const [a, b] = duel();
    let bounces = 12;
    const trigger = reflecting(a, b, () => bounces-- > 0);
    let printed: string[] = [];
    const calls = damageCallsIn(() => {
      printed = printedBy(() => {
        hit(a, b);
      });
    });
    expect(calls).toEqual(13);
    expect(printed).toEqual([]);
    trigger.destroy();
  });
});
