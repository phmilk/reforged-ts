/** @noSelfInFile */

// Protected callbacks beyond Timer: trigger actions and conditions, the
// filters of the registration and enumeration members, `Group.for` and
// `Force.for`, and the handlers and `when` predicates of `on()`. In Dev mode
// each runs under pcall and a failure is reported naming its Wrapper and
// member (the descriptor for `on()`); a condition or filter that throws
// evaluates false. With Dev mode off the Natives receive the very functions.

import { describe, expect, it } from "reforged-test/lua";
import {
  Force,
  Group,
  MapPlayer,
  on,
  Reforged,
  Trigger,
  Unit,
  UnitEvents,
} from "../src/index";
import { defined } from "./support/defined";
import { withNative } from "./support/native-override";

// The globals Init stage is entered first: in Dev mode a Wrapper created
// before it raises.
__stub_init_globals();

const footman = FourCC("hfoo");
const owner = defined(MapPlayer.fromIndex(1), "MapPlayer.fromIndex(1)");

/** What `body` printed while it ran. */
function printedBy(body: () => void): string[] {
  const before = __stub_printed().length;
  body();
  return __stub_printed().slice(before);
}

/** The function the last call of the Native `name` got as argument `index`. */
function lastArg(name: string, index: number): unknown {
  const calls = __stub_args(name);
  return calls[calls.length - 1][index];
}

describe("trigger actions and conditions in Dev mode", () => {
  it("runs the second action after the first threw, and reports the first", () => {
    Reforged.configure({ devMode: true });
    const trigger = Trigger.create();
    let second = 0;
    trigger.addAction(() => {
      error("first action failed", 0);
    });
    trigger.addAction(() => {
      second++;
    });
    const printed = printedBy(() => {
      expect(__stub_fire_trigger(trigger.handle)).toEqual(true);
    });
    expect(second).toEqual(1);
    expect(printed).toEqual([
      `reforged-ts: Trigger#${String(trigger.id)} Trigger.addAction failed: first action failed`,
    ]);
  });

  it("evaluates a throwing condition as false, and runs no action", () => {
    Reforged.configure({ devMode: true });
    const trigger = Trigger.create();
    let ran = 0;
    trigger.addCondition((): boolean => {
      error("condition failed", 0);
    });
    trigger.addAction(() => {
      ran++;
    });
    const printed = printedBy(() => {
      expect(trigger.eval()).toEqual(false);
      expect(__stub_fire_trigger(trigger.handle)).toEqual(false);
    });
    expect(ran).toEqual(0);
    expect(printed).toEqual([
      `reforged-ts: Trigger#${String(trigger.id)} Trigger.addCondition failed: condition failed`,
    ]);
  });

  it("excludes the unit a throwing registration filter was asked about", () => {
    Reforged.configure({ devMode: true });
    const target = Unit.create(owner, footman, 0, 0);
    const trigger = Trigger.create();
    let ran = 0;
    trigger.registerPlayerUnitEvent(
      owner,
      EVENT_PLAYER_UNIT_DAMAGED,
      (): boolean => {
        error("filter failed", 0);
      },
    );
    trigger.addAction(() => {
      ran++;
    });
    const printed = printedBy(() => {
      expect(
        __stub_dispatch_damage({
          source: target.handle,
          target: target.handle,
          amount: 1,
        }),
      ).toEqual(0);
    });
    expect(ran).toEqual(0);
    expect(printed).toEqual([
      `reforged-ts: Trigger#${String(trigger.id)} Trigger.registerPlayerUnitEvent failed: filter failed`,
    ]);
    trigger.destroy();
  });

  it("makes a throwing enumeration filter return false", () => {
    Reforged.configure({ devMode: true });
    const group = Group.create();
    const filter = (): boolean => {
      error("enum filter failed", 0);
    };
    const printed = printedBy(() => {
      withNative(
        "GroupEnumUnitsInRange",
        () => undefined,
        () => {
          group.enumUnitsInRange(0, 0, 100, filter);
        },
      );
      const handed = lastArg("Filter", 0) as () => boolean;
      expect(handed()).toEqual(false);
    });
    expect(printed).toEqual([
      `reforged-ts: Group#${String(group.id)} Group.enumUnitsInRange failed: enum filter failed`,
    ]);
  });
});

describe("enumeration callbacks in Dev mode", () => {
  it("reports a throwing Group.for callback and continues with the next unit", () => {
    Reforged.configure({ devMode: true });
    const group = Group.create();
    const units = [0, 1, 2].map(() => Unit.create(owner, footman, 0, 0));
    for (const unit of units) {
      group.addUnit(unit);
    }
    const visited: (Unit | undefined)[] = [];
    const printed = printedBy(() => {
      group.for(() => {
        const unit = Unit.fromEnum();
        visited.push(unit);
        if (unit === units[1]) {
          error("enum failed", 0);
        }
      });
    });
    expect(visited).toEqual(units);
    expect(printed).toEqual([
      `reforged-ts: Group#${String(group.id)} Group.for failed: enum failed`,
    ]);
  });

  it("reports a throwing Force.for callback and continues with the next player", () => {
    Reforged.configure({ devMode: true });
    const force = Force.create();
    let calls = 0;
    const printed = printedBy(() => {
      withNative(
        "ForForce",
        (_force, callback) => {
          callback();
          callback();
        },
        () => {
          force.for(() => {
            calls++;
            error("force enum failed", 0);
          });
        },
      );
    });
    expect(calls).toEqual(2);
    expect(printed).toEqual([
      `reforged-ts: Force#${String(force.id)} Force.for failed: force enum failed`,
    ]);
  });
});

describe("on() subscriptions in Dev mode", () => {
  it("names the descriptor when the handler throws", () => {
    Reforged.configure({ devMode: true });
    const dying = Unit.create(owner, footman, 0, 0);
    const subscription = on(UnitEvents.death, () => {
      error("handler failed", 0);
    });
    const printed = printedBy(() => {
      __stub_fire_trigger(subscription.trigger.handle, {
        GetTriggerUnit: dying.handle,
      });
    });
    expect(printed).toEqual([
      "reforged-ts: UnitEvents.death failed: handler failed",
    ]);
    subscription.destroy();
  });

  it("names the descriptor when `when` throws, and the handler does not run", () => {
    Reforged.configure({ devMode: true });
    const unit = Unit.create(owner, footman, 0, 0);
    let ran = 0;
    const subscription = on(
      UnitEvents.deathOf(unit),
      () => {
        ran++;
      },
      (): boolean => {
        error("when failed", 0);
      },
    );
    const printed = printedBy(() => {
      expect(__stub_fire_trigger(subscription.trigger.handle)).toEqual(false);
    });
    expect(ran).toEqual(0);
    expect(printed).toEqual([
      "reforged-ts: UnitEvents.deathOf failed: when failed",
    ]);
    subscription.destroy();
  });
});

describe("release mode", () => {
  it("hands TriggerAddAction, Condition and Filter the very functions", () => {
    Reforged.configure({ devMode: false });
    const trigger = Trigger.create();
    const action = () => undefined;
    const condition = () => true;
    const filter = () => true;
    trigger.addAction(action);
    expect(lastArg("TriggerAddAction", 1)).toBe(action);
    trigger.addCondition(condition);
    expect(lastArg("Condition", 0)).toBe(condition);
    trigger.registerPlayerUnitEvent(owner, EVENT_PLAYER_UNIT_DEATH, filter);
    expect(lastArg("Filter", 0)).toBe(filter);
    const group = Group.create();
    const callback = () => undefined;
    group.for(callback);
    expect(lastArg("ForGroup", 1)).toBe(callback);
  });

  it("hands them new functions in Dev mode", () => {
    Reforged.configure({ devMode: true });
    const trigger = Trigger.create();
    const action = () => undefined;
    const condition = () => true;
    const filter = () => true;
    trigger.addAction(action);
    expect(lastArg("TriggerAddAction", 1) === action).toEqual(false);
    trigger.addCondition(condition);
    expect(lastArg("Condition", 0) === condition).toEqual(false);
    trigger.registerPlayerUnitEvent(owner, EVENT_PLAYER_UNIT_DEATH, filter);
    expect(lastArg("Filter", 0) === filter).toEqual(false);
  });

  it("lets a throwing action's error through with Dev mode off", () => {
    Reforged.configure({ devMode: false });
    const trigger = Trigger.create();
    trigger.addAction(() => {
      error("unprotected action", 0);
    });
    const printed = printedBy(() => {
      expect(() => {
        __stub_fire_trigger(trigger.handle);
      }).toThrow("unprotected action");
    });
    expect(printed).toEqual([]);
  });
});
