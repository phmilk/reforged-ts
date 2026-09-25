/** @noSelfInFile */

// The cost of the runtime Guards in a release build, as a whole: the
// observable definition of "zero cost" (ADR 0007, spec #52). With Dev mode
// off:
//
// - every function the library hands a Native is the very function the Map
//   project passed, at every wrapping site: `TriggerAddAction`, `Condition`,
//   `Filter` (every registration and enumeration member taking a filter),
//   `ForGroup`, `ForForce` and the actions of the `Rectangle` enumerations.
//   The one exception is `TimerStart`: `Timer.start`, `Timer.after` and
//   `Timer.every` hand their handler its Timer (#104), so the Native gets a
//   small closure around the handler in both modes; for them the test
//   asserts the release behaviour instead: no pcall, the error propagates
//   and nothing is reported. `on()` handlers get the same assertion, their
//   payload adapter being the library's own function;
// - `MapPlayer.runLocal` is the bare local-player comparison: one
//   `GetLocalPlayer` call, `fn` called directly, no Guard inside;
// - `destroy()` is its Native plus the release step: no other Native call,
//   the registry entry gone, the collections told, no tombstone;
// - nothing is counted: a report taken after Dev mode is turned on has no
//   row for what release created or destroyed, nor its failures.
//
// The file's tests share one Lua state and run with Dev mode off, except the
// last, which turns it on to read the report.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import {
  Effect,
  Force,
  Frame,
  Group,
  type Handle,
  HandleSet,
  MapPlayer,
  on,
  Rectangle,
  Reforged,
  Region,
  Timer,
  Trigger,
  Unit,
  UnitEvents,
} from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { withPrint } from "./support/print-capture";

__stub_init_globals();
__stub_set_local_player(0);

const local = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
const remote = defined(MapPlayer.fromIndex(1), "MapPlayer.fromIndex(1)");
const footman = FourCC("hfoo");

/** The argument `index` of the last call of the Native `name`. */
function lastArg(name: string, index: number): unknown {
  const calls = __stub_args(name);
  return calls[calls.length - 1][index];
}

/** The call-log lines `body` added. */
function callsDuring(body: () => void): string[] {
  const before = stubCalls().length;
  body();
  return stubCalls().slice(before);
}

/** What `body` printed and showed on screen, together. */
function reportedDuring(body: () => void): string[] {
  const printed = __stub_printed().length;
  const displayed = __stub_displayed().length;
  body();
  return [
    ...__stub_printed().slice(printed),
    ...__stub_displayed()
      .slice(displayed)
      .map((line) => line.text),
  ];
}

/**
 * Runs `body` with the Native `name` recording its call and doing nothing
 * else: most enumeration Natives have no stub, and the test only needs the
 * function they were handed.
 */
function recorded(name: Parameters<typeof withNative>[0], body: () => void) {
  withNative(name, () => undefined, body);
}

/** One member that hands a plain function to a Native. */
interface Site {
  /** The member, as a Dev-mode report would name it. */
  readonly member: string;
  /** The Native that receives the function (directly, or through `Filter`). */
  readonly native: Parameters<typeof withNative>[0];
  /** Where the function lands: the Native's argument, or `Filter`'s. */
  readonly receiver: { readonly name: string; readonly index: number };
  /** Calls the member with `fn`. */
  readonly call: (fn: () => boolean) => void;
}

const group = Group.create();
const force = Force.create();
const rectangle = Rectangle.create(0, 0, 256, 256);
const region = Region.create();
const target = Unit.create(local, footman, 0, 0);
const point = target.getPoint();
const filtered = { name: "Filter", index: 0 };

const sites: readonly Site[] = [
  {
    member: "Trigger.addAction",
    native: "TriggerAddAction",
    receiver: { name: "TriggerAddAction", index: 1 },
    call: (fn) => Trigger.create().addAction(fn),
  },
  {
    member: "Trigger.addAction (damage trigger)",
    native: "TriggerAddAction",
    receiver: { name: "TriggerAddAction", index: 1 },
    call: (fn) =>
      Trigger.create()
        .registerUnitEvent(target, EVENT_UNIT_DAMAGED)
        .addAction(fn),
  },
  {
    member: "Trigger.addCondition",
    native: "TriggerAddCondition",
    receiver: { name: "Condition", index: 0 },
    call: (fn) => Trigger.create().addCondition(fn),
  },
  {
    member: "Trigger.addCondition (damage trigger)",
    native: "TriggerAddCondition",
    receiver: { name: "Condition", index: 0 },
    call: (fn) =>
      Trigger.create()
        .registerUnitEvent(target, EVENT_UNIT_DAMAGED)
        .addCondition(fn),
  },
  {
    member: "Trigger.registerEnterRegion",
    native: "TriggerRegisterEnterRegion",
    receiver: filtered,
    call: (fn) => Trigger.create().registerEnterRegion(region, fn),
  },
  {
    member: "Trigger.registerLeaveRegion",
    native: "TriggerRegisterLeaveRegion",
    receiver: filtered,
    call: (fn) => Trigger.create().registerLeaveRegion(region, fn),
  },
  {
    member: "Trigger.registerFilterUnitEvent",
    native: "TriggerRegisterFilterUnitEvent",
    receiver: filtered,
    call: (fn) =>
      Trigger.create().registerFilterUnitEvent(target, EVENT_UNIT_DAMAGED, fn),
  },
  {
    member: "Trigger.registerPlayerUnitEvent",
    native: "TriggerRegisterPlayerUnitEvent",
    receiver: filtered,
    call: (fn) =>
      Trigger.create().registerPlayerUnitEvent(
        local,
        EVENT_PLAYER_UNIT_DEATH,
        fn,
      ),
  },
  {
    member: "Trigger.registerUnitInRange",
    native: "TriggerRegisterUnitInRange",
    receiver: filtered,
    call: (fn) => Trigger.create().registerUnitInRange(target, 100, fn),
  },
  {
    member: "Group.enumUnitsInRange",
    native: "GroupEnumUnitsInRange",
    receiver: filtered,
    call: (fn) => {
      group.enumUnitsInRange(0, 0, 100, fn);
    },
  },
  {
    member: "Group.enumUnitsInRangeCounted",
    native: "GroupEnumUnitsInRangeCounted",
    receiver: filtered,
    call: (fn) => {
      group.enumUnitsInRangeCounted(0, 0, 100, fn, 5);
    },
  },
  {
    member: "Group.enumUnitsInRangeOfPoint",
    native: "GroupEnumUnitsInRangeOfLoc",
    receiver: filtered,
    call: (fn) => {
      group.enumUnitsInRangeOfPoint(point, 100, fn);
    },
  },
  {
    member: "Group.enumUnitsInRangeOfPointCounted",
    native: "GroupEnumUnitsInRangeOfLocCounted",
    receiver: filtered,
    call: (fn) => {
      group.enumUnitsInRangeOfPointCounted(point, 100, fn, 5);
    },
  },
  {
    member: "Group.enumUnitsInRect",
    native: "GroupEnumUnitsInRect",
    receiver: filtered,
    call: (fn) => {
      group.enumUnitsInRect(rectangle, fn);
    },
  },
  {
    member: "Group.enumUnitsInRectCounted",
    native: "GroupEnumUnitsInRectCounted",
    receiver: filtered,
    call: (fn) => {
      group.enumUnitsInRectCounted(rectangle, fn, 5);
    },
  },
  {
    member: "Group.enumUnitsOfPlayer",
    native: "GroupEnumUnitsOfPlayer",
    receiver: filtered,
    call: (fn) => {
      group.enumUnitsOfPlayer(local, fn);
    },
  },
  {
    member: "Group.enumUnitsOfType",
    native: "GroupEnumUnitsOfType",
    receiver: filtered,
    call: (fn) => {
      group.enumUnitsOfType("footman", fn);
    },
  },
  {
    member: "Group.enumUnitsOfTypeCounted",
    native: "GroupEnumUnitsOfTypeCounted",
    receiver: filtered,
    call: (fn) => {
      group.enumUnitsOfTypeCounted("footman", fn, 5);
    },
  },
  {
    member: "Group.enumUnitsSelected",
    native: "GroupEnumUnitsSelected",
    receiver: filtered,
    call: (fn) => {
      group.enumUnitsSelected(local, fn);
    },
  },
  {
    member: "Group.for",
    native: "ForGroup",
    receiver: { name: "ForGroup", index: 1 },
    call: (fn) => {
      group.for(fn);
    },
  },
  {
    member: "Force.enumAllies",
    native: "ForceEnumAllies",
    receiver: filtered,
    call: (fn) => {
      force.enumAllies(local, fn);
    },
  },
  {
    member: "Force.enumEnemies",
    native: "ForceEnumEnemies",
    receiver: filtered,
    call: (fn) => {
      force.enumEnemies(local, fn);
    },
  },
  {
    member: "Force.enumPlayers",
    native: "ForceEnumPlayers",
    receiver: filtered,
    call: (fn) => {
      force.enumPlayers(fn);
    },
  },
  {
    member: "Force.enumPlayersCounted",
    native: "ForceEnumPlayersCounted",
    receiver: filtered,
    call: (fn) => {
      force.enumPlayersCounted(fn, 5);
    },
  },
  {
    member: "Force.for",
    native: "ForForce",
    receiver: { name: "ForForce", index: 1 },
    call: (fn) => {
      force.for(fn);
    },
  },
  {
    member: "Rectangle.enumDestructables (filter)",
    native: "EnumDestructablesInRect",
    receiver: filtered,
    call: (fn) => {
      rectangle.enumDestructables(fn, () => undefined);
    },
  },
  {
    member: "Rectangle.enumDestructables (action)",
    native: "EnumDestructablesInRect",
    receiver: { name: "EnumDestructablesInRect", index: 2 },
    call: (fn) => {
      rectangle.enumDestructables(() => true, fn);
    },
  },
  {
    member: "Rectangle.enumItems (filter)",
    native: "EnumItemsInRect",
    receiver: filtered,
    call: (fn) => {
      rectangle.enumItems(fn, () => undefined);
    },
  },
  {
    member: "Rectangle.enumItems (action)",
    native: "EnumItemsInRect",
    receiver: { name: "EnumItemsInRect", index: 2 },
    call: (fn) => {
      rectangle.enumItems(() => true, fn);
    },
  },
];

describe("callbacks with Dev mode off", () => {
  for (const site of sites) {
    it(`${site.member} hands ${site.receiver.name} the very function`, () => {
      Reforged.configure({ devMode: false });
      const fn = () => true;
      recorded(site.native, () => {
        site.call(fn);
      });
      expect(lastArg(site.receiver.name, site.receiver.index)).toBe(fn);
    });
  }

  for (const member of ["start", "after", "every"] as const) {
    it(`Timer.${member} runs its handler without pcall: the error propagates and nothing is reported`, () => {
      Reforged.configure({ devMode: false });
      let handle: timer | undefined;
      const handler = () => {
        error(`Timer.${member} handler failed`, 0);
      };
      if (member === "start") {
        handle = Timer.create().start(1, false, handler).handle;
      } else {
        if (member === "after") {
          Timer.after(1, handler);
        } else {
          Timer.every(1, handler);
        }
        handle = lastArg("TimerStart", 0) as timer;
      }
      const started = defined(handle, "the Timer started");
      const reported = reportedDuring(() => {
        expect(() => {
          __stub_fire_timer(started);
        }).toThrow(`Timer.${member} handler failed`);
      });
      expect(reported).toEqual([]);
    });
  }

  it("runs an on() handler without pcall: the error propagates and nothing is reported", () => {
    Reforged.configure({ devMode: false });
    const dying = Unit.create(local, footman, 0, 0);
    const subscription = on(UnitEvents.death, () => {
      error("on() handler failed", 0);
    });
    const reported = reportedDuring(() => {
      expect(() => {
        __stub_fire_trigger(subscription.trigger.handle, {
          GetTriggerUnit: dying.handle,
        });
      }).toThrow("on() handler failed");
    });
    expect(reported).toEqual([]);
    subscription.destroy();
  });
});

describe("MapPlayer.runLocal with Dev mode off", () => {
  it("is one GetLocalPlayer comparison, calling nothing for another player", () => {
    Reforged.configure({ devMode: false });
    let ran = 0;
    const calls = callsDuring(() => {
      MapPlayer.runLocal(remote, () => {
        ran++;
      });
    });
    expect(ran).toEqual(0);
    expect(calls).toEqual(["GetLocalPlayer()"]);
  });

  it("calls the function directly for the local player: no Guard, no pcall", () => {
    Reforged.configure({ devMode: false });
    const frameName = "ReleaseCostUnwrapped";
    const gameUi = defined(
      Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0),
      "the game UI",
    );
    BlzCreateFrame(frameName, gameUi.handle, 0, 0);
    const doomed = Unit.create(local, footman, 0, 0);
    let created: Unit | undefined;
    const reported = reportedDuring(() => {
      expect(() => {
        MapPlayer.runLocal(local, () => {
          // What Dev mode forbids here runs as the Map project wrote it.
          created = Unit.create(local, footman, 0, 0);
          doomed.destroy();
          group.for(() => undefined);
          Frame.fromName(frameName, 0);
          error("runLocal function failed", 0);
        });
      }).toThrow("runLocal function failed");
    });
    expect(created).toBeTruthy();
    expect(reported).toEqual([]);
  });
});

/** A Wrapper family's representative, and the Native its destroy() calls. */
interface Family {
  readonly native: string;
  readonly kind: string;
  readonly create: () => Handle<handle> & { destroy(): unknown };
  readonly lookup: (handle: handle) => Handle<handle> | undefined;
}

const families: readonly Family[] = [
  {
    native: "RemoveUnit",
    kind: "unit",
    create: () => Unit.create(local, footman, 0, 0),
    lookup: (handle) => Unit.fromHandle(handle as unit),
  },
  {
    native: "DestroyTimer",
    kind: "timer",
    create: () => Timer.create(),
    lookup: (handle) => Timer.fromHandle(handle as timer),
  },
  {
    native: "DestroyGroup",
    kind: "group",
    create: () => Group.create(),
    lookup: (handle) => Group.fromHandle(handle as group),
  },
  {
    native: "DestroyEffect",
    kind: "effect",
    create: () => Effect.create("Abilities\\Spells\\Human\\Heal.mdl", 0, 0),
    lookup: (handle) => Effect.fromHandle(handle as effect),
  },
  {
    native: "BlzDestroyFrame",
    kind: "framehandle",
    create: () =>
      Frame.create(
        "ReleaseCostFrame",
        defined(Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0), "the game UI"),
        0,
        0,
      ),
    lookup: (handle) => Frame.fromHandle(handle as framehandle),
  },
  {
    native: "DestroyTrigger",
    kind: "trigger",
    create: () => Trigger.create(),
    lookup: (handle) => Trigger.fromHandle(handle as trigger),
  },
];

describe("destroy() with Dev mode off", () => {
  for (const family of families) {
    it(`calls ${family.native} and nothing else, forgets the Handle, tells the collections and leaves no tombstone`, () => {
      Reforged.configure({ devMode: false });
      const wrapper = family.create();
      const handle = wrapper.handle;
      const ref = handleRef(family.kind, handle);
      const holders = new HandleSet([wrapper]);

      const calls = callsDuring(() => {
        wrapper.destroy();
      });

      expect(calls).toEqual([`${family.native}(${ref})`]);
      expect(holders.size).toEqual(0);
      expect(wrapper.handle).toBe(handle);
      const after = family.lookup(handle);
      expect(after === wrapper).toEqual(false);
      expect(after?.handle).toBe(handle);
    });
  }
});

describe("the counters with Dev mode off", () => {
  it("report nothing, and Dev mode turned on later finds nothing counted", () => {
    Reforged.configure({ devMode: false });
    const timers = [Timer.create(), Timer.create(), Timer.create()];
    timers[0].destroy();
    const failing = Timer.create().start(1, true, () => {
      error("failed in release", 0);
    });
    expect(() => {
      __stub_fire_timer(failing.handle);
    }).toThrow("failed in release");

    const off = withPrint(() => {
      expect(Reforged.debug.report()).toEqual({ wrappers: [], failures: [] });
    });
    expect(off).toEqual([
      "reforged-ts: Dev mode is off: Reforged.debug has nothing to report",
    ]);

    withPrint(() => {
      Reforged.configure({ devMode: true });
    });
    let report: ReturnType<typeof Reforged.debug.report> | undefined;
    withPrint(() => {
      report = Reforged.debug.report();
    });
    expect(report).toEqual({ wrappers: [], failures: [] });
  });
});
