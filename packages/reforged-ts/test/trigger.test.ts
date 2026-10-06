/** @noSelfInFile */

// Trigger on the Handle base: creation throws, lookup returns undefined. The
// registrations, actions and conditions are observed through the call log:
// which Native each member calls with which handles and scalars, and that
// each returns the Trigger it was called on.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import {
  Dialog,
  DialogButton,
  Frame,
  MapPlayer,
  MouseEventKind,
  Reforged,
  Region,
  Timer,
  Trackable,
  Trigger,
  Unit,
} from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { type NativeName, withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const player = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const unit = Unit.create(player, FourCC("hfoo"), 0, 0);
const region = Region.create();
const dialog = Dialog.create();
const button = DialogButton.create(dialog, "Leave");
const timer = Timer.create();
const trackable = Trackable.create("trackable.mdl", 0, 0, 0);
const frame = Frame.create(
  "TriggerFrame",
  defined(Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0), "the game UI frame"),
  0,
  0,
);

/**
 * The command button registrations take the Rawcode of their kind, never a
 * plain `number` or another kind's Rawcode. Never called: `tsc` checks it.
 */
export function commandRawcodeKinds(trigger: Trigger, count: number): void {
  const blizzardType: Rawcode<"ability"> = FourCC("AHbz");
  const footmanType: Rawcode<"unit"> = FourCC("hfoo");
  trigger.registerCommandEvent(blizzardType, "blizzard");
  trigger.registerUpgradeCommandEvent(FourCC("Rhde"));
  // @ts-expect-error: a plain number is not a Rawcode.
  trigger.registerCommandEvent(count, "blizzard");
  // @ts-expect-error: a unit's Rawcode is not an ability's.
  trigger.registerCommandEvent(footmanType, "blizzard");
  // @ts-expect-error: an ability's Rawcode is not an upgrade's.
  trigger.registerUpgradeCommandEvent(blizzardType);
  // @ts-expect-error: a plain number is not a Rawcode.
  trigger.registerUpgradeCommandEvent(count);
}

const playerRef = handleRef("player", player.handle);
const unitRef = handleRef("unit", unit.handle);
const regionRef = handleRef("region", region.handle);

/** The lines of the call log that call the Native `name` on `trigger`. */
function callsOn(trigger: Trigger, name: string): string[] {
  const prefix = `${name}(${handleRef("trigger", trigger.handle)}`;
  return stubCalls().filter((line) => line.startsWith(prefix));
}

/**
 * A registration member called with Wrappers, and what it records after the
 * trigger: the Native with the underlying handles and scalars.
 */
interface Registration {
  readonly member: string;
  readonly register: (trigger: Trigger) => Trigger;
  readonly native: string;
  readonly args: string;
}

const registrations: Registration[] = [
  {
    member: "registerCommandEvent",
    register: (t) => t.registerCommandEvent(FourCC("AHbz"), "blizzard"),
    native: "TriggerRegisterCommandEvent",
    args: `${tostring(FourCC("AHbz"))}, "blizzard"`,
  },
  {
    member: "registerDeathEvent",
    register: (t) => t.registerDeathEvent(unit),
    native: "TriggerRegisterDeathEvent",
    args: unitRef,
  },
  {
    member: "registerDialogButtonEvent",
    register: (t) => t.registerDialogButtonEvent(button),
    native: "TriggerRegisterDialogButtonEvent",
    args: handleRef("button", button.handle),
  },
  {
    member: "registerDialogEvent",
    register: (t) => t.registerDialogEvent(dialog),
    native: "TriggerRegisterDialogEvent",
    args: handleRef("dialog", dialog.handle),
  },
  {
    member: "registerEnterRegion",
    register: (t) => t.registerEnterRegion(region),
    native: "TriggerRegisterEnterRegion",
    args: `${regionRef}, nil`,
  },
  {
    member: "registerFilterUnitEvent",
    register: (t) => t.registerFilterUnitEvent(unit, EVENT_UNIT_DEATH),
    native: "TriggerRegisterFilterUnitEvent",
    args: `${unitRef}, EVENT_UNIT_DEATH, nil`,
  },
  {
    member: "registerFrameEvent",
    register: (t) => t.registerFrameEvent(frame, FRAMEEVENT_CONTROL_CLICK),
    native: "BlzTriggerRegisterFrameEvent",
    args: `${handleRef("framehandle", frame.handle)}, FRAMEEVENT_CONTROL_CLICK`,
  },
  {
    member: "registerGameEvent",
    register: (t) => t.registerGameEvent(EVENT_GAME_VICTORY),
    native: "TriggerRegisterGameEvent",
    args: "EVENT_GAME_VICTORY",
  },
  {
    member: "registerGameStateEvent",
    register: (t) =>
      t.registerGameStateEvent(GAME_STATE_TIME_OF_DAY, GREATER_THAN, 12),
    native: "TriggerRegisterGameStateEvent",
    args: "GAME_STATE_TIME_OF_DAY, GREATER_THAN, 12",
  },
  {
    member: "registerLeaveRegion",
    register: (t) => t.registerLeaveRegion(region),
    native: "TriggerRegisterLeaveRegion",
    args: `${regionRef}, nil`,
  },
  {
    member: "registerPlayerAllianceChange",
    register: (t) => t.registerPlayerAllianceChange(player, ALLIANCE_PASSIVE),
    native: "TriggerRegisterPlayerAllianceChange",
    args: `${playerRef}, ALLIANCE_PASSIVE`,
  },
  {
    member: "registerPlayerChatEvent",
    register: (t) => t.registerPlayerChatEvent(player, "-repick", true),
    native: "TriggerRegisterPlayerChatEvent",
    args: `${playerRef}, "-repick", true`,
  },
  {
    member: "registerPlayerEvent",
    register: (t) => t.registerPlayerEvent(player, EVENT_PLAYER_LEAVE),
    native: "TriggerRegisterPlayerEvent",
    args: `${playerRef}, EVENT_PLAYER_LEAVE`,
  },
  {
    member: "registerPlayerKeyEvent",
    register: (t) => t.registerPlayerKeyEvent(player, OSKEY_A, 2, false),
    native: "BlzTriggerRegisterPlayerKeyEvent",
    args: `${playerRef}, OSKEY_A, 2, false`,
  },
  {
    member: "registerPlayerMouseEvent",
    register: (t) => t.registerPlayerMouseEvent(player, MouseEventKind.Down),
    native: "TriggerRegisterPlayerEvent",
    args: `${playerRef}, EVENT_PLAYER_MOUSE_DOWN`,
  },
  {
    member: "registerPlayerStateEvent",
    register: (t) =>
      t.registerPlayerStateEvent(
        player,
        PLAYER_STATE_RESOURCE_GOLD,
        GREATER_THAN_OR_EQUAL,
        500,
      ),
    native: "TriggerRegisterPlayerStateEvent",
    args: `${playerRef}, PLAYER_STATE_RESOURCE_GOLD, GREATER_THAN_OR_EQUAL, 500`,
  },
  {
    member: "registerPlayerSyncEvent",
    register: (t) => t.registerPlayerSyncEvent(player, "prefix", false),
    native: "BlzTriggerRegisterPlayerSyncEvent",
    args: `${playerRef}, "prefix", false`,
  },
  {
    member: "registerPlayerUnitEvent",
    register: (t) => t.registerPlayerUnitEvent(player, EVENT_PLAYER_UNIT_DEATH),
    native: "TriggerRegisterPlayerUnitEvent",
    args: `${playerRef}, EVENT_PLAYER_UNIT_DEATH, nil`,
  },
  {
    member: "registerTimerEvent",
    register: (t) => t.registerTimerEvent(0.5, true),
    native: "TriggerRegisterTimerEvent",
    args: "0.5, true",
  },
  {
    member: "registerTimerExpire",
    register: (t) => t.registerTimerExpire(timer),
    native: "TriggerRegisterTimerExpireEvent",
    args: handleRef("timer", timer.handle),
  },
  {
    member: "registerTrackableHit",
    register: (t) => t.registerTrackableHit(trackable),
    native: "TriggerRegisterTrackableHitEvent",
    args: handleRef("trackable", trackable.handle),
  },
  {
    member: "registerTrackableTrack",
    register: (t) => t.registerTrackableTrack(trackable),
    native: "TriggerRegisterTrackableTrackEvent",
    args: handleRef("trackable", trackable.handle),
  },
  {
    member: "registerUnitEvent",
    register: (t) => t.registerUnitEvent(unit, EVENT_UNIT_ATTACKED),
    native: "TriggerRegisterUnitEvent",
    args: `${unitRef}, EVENT_UNIT_ATTACKED`,
  },
  {
    member: "registerUnitInRange",
    register: (t) => t.registerUnitInRange(unit, 300),
    native: "TriggerRegisterUnitInRange",
    args: `${unitRef}, 300, nil`,
  },
  {
    member: "registerUnitStateEvent",
    register: (t) =>
      t.registerUnitStateEvent(unit, UNIT_STATE_LIFE, LESS_THAN, 100),
    native: "TriggerRegisterUnitStateEvent",
    args: `${unitRef}, UNIT_STATE_LIFE, LESS_THAN, 100`,
  },
  {
    member: "registerUpgradeCommandEvent",
    register: (t) => t.registerUpgradeCommandEvent(FourCC("Rhde")),
    native: "TriggerRegisterUpgradeCommandEvent",
    args: tostring(FourCC("Rhde")),
  },
  {
    member: "registerVariableEvent",
    register: (t) => t.registerVariableEvent("udg_score", EQUAL, 10),
    native: "TriggerRegisterVariableEvent",
    args: `"udg_score", EQUAL, 10`,
  },
];

/**
 * A registration that takes a filter, called with `filter` in its place, and
 * what it records after the trigger, up to the filter.
 */
interface FilteredRegistration {
  readonly member: string;
  readonly register: (
    trigger: Trigger,
    filter?: boolexpr | (() => boolean),
  ) => Trigger;
  readonly native: string;
  readonly args: string;
}

const filteredRegistrations: FilteredRegistration[] = [
  {
    member: "registerEnterRegion",
    register: (t, filter) => t.registerEnterRegion(region, filter),
    native: "TriggerRegisterEnterRegion",
    args: regionRef,
  },
  {
    member: "registerFilterUnitEvent",
    register: (t, filter) =>
      t.registerFilterUnitEvent(unit, EVENT_UNIT_DEATH, filter),
    native: "TriggerRegisterFilterUnitEvent",
    args: `${unitRef}, EVENT_UNIT_DEATH`,
  },
  {
    member: "registerLeaveRegion",
    register: (t, filter) => t.registerLeaveRegion(region, filter),
    native: "TriggerRegisterLeaveRegion",
    args: regionRef,
  },
  {
    member: "registerPlayerUnitEvent",
    register: (t, filter) =>
      t.registerPlayerUnitEvent(player, EVENT_PLAYER_UNIT_DEATH, filter),
    native: "TriggerRegisterPlayerUnitEvent",
    args: `${playerRef}, EVENT_PLAYER_UNIT_DEATH`,
  },
  {
    member: "registerUnitInRange",
    register: (t, filter) => t.registerUnitInRange(unit, 300, filter),
    native: "TriggerRegisterUnitInRange",
    args: `${unitRef}, 300`,
  },
];

describe("Trigger.create", () => {
  it("wraps the handle CreateTrigger returns, and a lookup finds it", () => {
    const trigger = Trigger.create();
    expect(stubCalls()).toContainCall("CreateTrigger()");
    expect(Trigger.fromHandle(trigger.handle)).toBe(trigger);
  });

  it("throws when CreateTrigger returns nil", () => {
    const message = withNative(
      "CreateTrigger",
      () => undefined,
      () =>
        raisedIn(() => {
          Trigger.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Trigger");
  });
});

describe("Trigger.fromEvent", () => {
  it("is undefined when GetTriggeringTrigger returns nil", () => {
    const trigger = withNative(
      "GetTriggeringTrigger",
      () => undefined,
      () => Trigger.fromEvent(),
    );
    expect(trigger).toBeUndefined();
  });

  it("wraps the triggering trigger, the same object a lookup finds", () => {
    const handle = CreateTrigger();
    const trigger = withNative(
      "GetTriggeringTrigger",
      () => handle,
      () => Trigger.fromEvent(),
    );
    expect(trigger?.handle).toBe(handle);
    expect(Trigger.fromHandle(handle)).toBe(trigger);
  });
});

describe("Trigger registrations", () => {
  for (const row of registrations) {
    it(`${row.member} records ${row.native} and returns the Trigger`, () => {
      const trigger = Trigger.create();
      expect(row.register(trigger)).toBe(trigger);
      expect(callsOn(trigger, row.native)).toEqual([
        `${row.native}(${handleRef("trigger", trigger.handle)}, ${row.args})`,
      ]);
    });
  }
});

describe("Trigger filtered registrations", () => {
  for (const row of filteredRegistrations) {
    it(`${row.member} passes nothing for an omitted filter`, () => {
      const trigger = Trigger.create();
      expect(row.register(trigger)).toBe(trigger);
      expect(callsOn(trigger, row.native)).toEqual([
        `${row.native}(${handleRef("trigger", trigger.handle)}, ${row.args}, nil)`,
      ]);
    });

    it(`${row.member} passes the Filter of a function`, () => {
      const trigger = Trigger.create();
      const filter = () => true;
      const expr = Filter(filter);
      let wrapped: (() => boolean) | undefined;
      const returned = withNative(
        "Filter",
        (func) => {
          wrapped = func;
          return expr;
        },
        () => row.register(trigger, filter),
      );
      expect(returned).toBe(trigger);
      expect(wrapped).toBe(filter);
      expect(callsOn(trigger, row.native)).toEqual([
        `${row.native}(${handleRef("trigger", trigger.handle)}, ${row.args}, ${handleRef("filterfunc", expr)})`,
      ]);
    });

    it(`${row.member} passes a boolexpr as is`, () => {
      const trigger = Trigger.create();
      const expr = Condition(() => true);
      expect(row.register(trigger, expr)).toBe(trigger);
      expect(callsOn(trigger, row.native)).toEqual([
        `${row.native}(${handleRef("trigger", trigger.handle)}, ${row.args}, ${handleRef("conditionfunc", expr)})`,
      ]);
    });
  }
});

describe("Trigger.registerAnyUnitEvent", () => {
  it("registers the event on every player slot, with no filter", () => {
    const trigger = Trigger.create();
    expect(trigger.registerAnyUnitEvent(EVENT_PLAYER_UNIT_DEATH)).toBe(trigger);
    const expected: string[] = [];
    for (let index = 0; index < bj_MAX_PLAYER_SLOTS; index++) {
      const slot = defined(
        Player(index),
        `the player in slot ${tostring(index)}`,
      );
      expected.push(
        `TriggerRegisterPlayerUnitEvent(${handleRef("trigger", trigger.handle)}, ${handleRef("player", slot)}, EVENT_PLAYER_UNIT_DEATH, nil)`,
      );
    }
    expect(expected.length).toEqual(28);
    expect(callsOn(trigger, "TriggerRegisterPlayerUnitEvent")).toEqual(
      expected,
    );
  });
});

describe("Trigger.registerPlayerMouseEvent", () => {
  const kinds: [MouseEventKind, string][] = [
    [MouseEventKind.Down, "EVENT_PLAYER_MOUSE_DOWN"],
    [MouseEventKind.Up, "EVENT_PLAYER_MOUSE_UP"],
    [MouseEventKind.Move, "EVENT_PLAYER_MOUSE_MOVE"],
  ];
  for (const [kind, constant] of kinds) {
    it(`registers ${constant} for the ${kind} kind`, () => {
      const trigger = Trigger.create();
      expect(trigger.registerPlayerMouseEvent(player, kind)).toBe(trigger);
      expect(callsOn(trigger, "TriggerRegisterPlayerEvent")).toEqual([
        `TriggerRegisterPlayerEvent(${handleRef("trigger", trigger.handle)}, ${playerRef}, ${constant})`,
      ]);
    });
  }
});

describe("Trigger.addAction", () => {
  it("adds the function and returns the Trigger", () => {
    const trigger = Trigger.create();
    const returned = trigger.addAction(() => {
      // nothing to do
    });
    expect(returned).toBe(trigger);
    expect(callsOn(trigger, "TriggerAddAction")).toEqual([
      `TriggerAddAction(${handleRef("trigger", trigger.handle)}, <function>)`,
    ]);
  });
});

describe("Trigger.addCondition", () => {
  it("wraps a closure of its own around a function with Condition and returns the Trigger", () => {
    const trigger = Trigger.create();
    let ran = 0;
    const condition = () => {
      ran++;
      return false;
    };
    const expr = Condition(condition);
    let wrapped: (() => boolean) | undefined;
    const returned = withNative(
      "Condition",
      (func) => {
        wrapped = func;
        return expr;
      },
      () => trigger.addCondition(condition),
    );
    expect(returned).toBe(trigger);
    const closure = defined(wrapped, "the function Condition received");
    expect(closure === condition).toEqual(false);
    expect(closure()).toEqual(false);
    expect(ran).toEqual(1);
    expect(callsOn(trigger, "TriggerAddCondition")).toEqual([
      `TriggerAddCondition(${handleRef("trigger", trigger.handle)}, ${handleRef("conditionfunc", expr)})`,
    ]);
  });

  it("destroys the Condition it made when TriggerAddCondition returns nil", () => {
    const trigger = Trigger.create();
    const condition = () => true;
    const created = returnedBy("Condition", () => {
      withNative(
        "TriggerAddCondition",
        () => undefined,
        () => trigger.addCondition(condition),
      );
    });
    expect(destroyed(created[0])).toEqual(true);
    trigger.removeCondition(condition);
    expect(callsOn(trigger, "TriggerRemoveCondition")).toEqual([]);
  });

  it("passes a boolexpr as is", () => {
    const trigger = Trigger.create();
    const expr = Filter(() => true);
    expect(trigger.addCondition(expr)).toBe(trigger);
    expect(callsOn(trigger, "TriggerAddCondition")).toEqual([
      `TriggerAddCondition(${handleRef("trigger", trigger.handle)}, ${handleRef("filterfunc", expr)})`,
    ]);
  });
});

describe("Trigger chaining", () => {
  it("builds a complete Trigger in one expression", () => {
    const trigger = Trigger.create()
      .registerTimerExpire(timer)
      .registerFrameEvent(frame, FRAMEEVENT_MOUSE_UP)
      .addCondition(() => true)
      .addAction(() => {
        // nothing to do
      });
    const ref = handleRef("trigger", trigger.handle);
    expect(callsOn(trigger, "TriggerRegisterTimerExpireEvent")).toEqual([
      `TriggerRegisterTimerExpireEvent(${ref}, ${handleRef("timer", timer.handle)})`,
    ]);
    expect(callsOn(trigger, "BlzTriggerRegisterFrameEvent")).toEqual([
      `BlzTriggerRegisterFrameEvent(${ref}, ${handleRef("framehandle", frame.handle)}, FRAMEEVENT_MOUSE_UP)`,
    ]);
    expect(callsOn(trigger, "TriggerAddCondition").length).toEqual(1);
    expect(callsOn(trigger, "TriggerAddAction").length).toEqual(1);
  });
});

describe("Trigger.isRunning and Trigger.interrupt", () => {
  it("isRunning answers what BlzTriggerIsRunning answers", () => {
    const trigger = Trigger.create();
    const running = withNative(
      "BlzTriggerIsRunning",
      () => true,
      () => trigger.isRunning,
    );
    expect(running).toEqual(true);
    expect(stubCalls()).toContainCall(
      `BlzTriggerIsRunning(${handleRef("trigger", trigger.handle)})`,
    );
  });

  it("interrupt calls BlzTriggerInterrupt", () => {
    const trigger = Trigger.create();
    withNative(
      "BlzTriggerInterrupt",
      () => undefined,
      () => {
        trigger.interrupt();
      },
    );
    expect(stubCalls()).toContainCall(
      `BlzTriggerInterrupt(${handleRef("trigger", trigger.handle)})`,
    );
  });
});

/**
 * What each call of the Native `name` returned while `body` ran, in order,
 * the stub still running (and recording) for each.
 */
function returnedBy(name: NativeName, body: () => void): handle[] {
  const globals = _G as unknown as Record<
    string,
    (...args: unknown[]) => handle
  >;
  const stub = globals[name];
  const returned: handle[] = [];
  globals[name] = (...args: unknown[]) => {
    const result = stub(...args);
    returned.push(result);
    return result;
  };
  try {
    body();
  } finally {
    globals[name] = stub;
  }
  return returned;
}

/** Whether the call log holds a `DestroyCondition` of `expr`. */
function destroyed(expr: handle): boolean {
  const line = `DestroyCondition(${handleRef("conditionfunc", expr)})`;
  return stubCalls().includes(line);
}

/** How many `DestroyCondition` calls of `expr` the call log holds. */
function destroyedTimes(expr: handle): number {
  const line = `DestroyCondition(${handleRef("conditionfunc", expr)})`;
  return stubCalls().filter((call) => call === line).length;
}

let globalsEntered = false;

/**
 * Runs `body` with Dev mode on or off, Dev mode off again afterwards. In Dev
 * mode a Trigger is created only after the globals Init stage, entered once.
 */
function inMode(devMode: boolean, body: () => void): void {
  if (devMode && !globalsEntered) {
    __stub_init_globals();
    globalsEntered = true;
  }
  Reforged.configure({ devMode });
  try {
    body();
  } finally {
    Reforged.configure({ devMode: false });
  }
}

for (const devMode of [false, true]) {
  const mode = devMode ? "in Dev mode" : "with Dev mode off";

  describe(`Trigger.removeAction ${mode}`, () => {
    it("removes the action TriggerAddAction returned for the function, and returns the Trigger", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        let removedRan = 0;
        let keptRan = 0;
        const removed = () => {
          removedRan++;
        };
        const [action] = returnedBy("TriggerAddAction", () => {
          trigger.addAction(removed);
        });
        trigger.addAction(() => {
          keptRan++;
        });
        expect(trigger.removeAction(removed)).toBe(trigger);
        expect(callsOn(trigger, "TriggerRemoveAction")).toEqual([
          `TriggerRemoveAction(${handleRef("trigger", trigger.handle)}, ${handleRef("triggeraction", action)})`,
        ]);
        __stub_fire_trigger(trigger.handle);
        expect(removedRan).toEqual(0);
        expect(keptRan).toEqual(1);
      });
    });

    it("removes every action a function added twice, and nothing on a second removal", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        const twice = () => undefined;
        const actions = returnedBy("TriggerAddAction", () => {
          trigger.addAction(twice).addAction(twice);
        });
        expect(actions.length).toEqual(2);
        trigger.removeAction(twice).removeAction(twice);
        const ref = handleRef("trigger", trigger.handle);
        expect(callsOn(trigger, "TriggerRemoveAction")).toEqual(
          actions.map(
            (action) =>
              `TriggerRemoveAction(${ref}, ${handleRef("triggeraction", action)})`,
          ),
        );
      });
    });

    it("keeps nothing when TriggerAddAction returns nil, and still returns the Trigger", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        const action = () => undefined;
        const returned = withNative(
          "TriggerAddAction",
          () => undefined,
          () => trigger.addAction(action),
        );
        expect(returned).toBe(trigger);
        expect(trigger.removeAction(action)).toBe(trigger);
        expect(callsOn(trigger, "TriggerRemoveAction")).toEqual([]);
      });
    });

    it("calls no Native for a function never added", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create().addAction(() => undefined);
        const empty = Trigger.create();
        expect(trigger.removeAction(() => undefined)).toBe(trigger);
        expect(empty.removeAction(() => undefined)).toBe(empty);
        expect(callsOn(trigger, "TriggerRemoveAction")).toEqual([]);
        expect(callsOn(empty, "TriggerRemoveAction")).toEqual([]);
      });
    });

    it("passes a triggeraction straight to the Native", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        const raw = defined(
          TriggerAddAction(trigger.handle, () => undefined),
          "TriggerAddAction",
        );
        expect(trigger.removeAction(raw)).toBe(trigger);
        expect(callsOn(trigger, "TriggerRemoveAction")).toEqual([
          `TriggerRemoveAction(${handleRef("trigger", trigger.handle)}, ${handleRef("triggeraction", raw)})`,
        ]);
      });
    });

    it("lets an action that removes itself finish its run, and not run again", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        const steps: string[] = [];
        const once = () => {
          steps.push("before");
          trigger.removeAction(once);
          steps.push("after");
        };
        trigger.addAction(once);
        __stub_fire_trigger(trigger.handle);
        __stub_fire_trigger(trigger.handle);
        expect(steps).toEqual(["before", "after"]);
        expect(callsOn(trigger, "TriggerRemoveAction").length).toEqual(1);
      });
    });

    it("forgets the actions after removeActions", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        const action = () => undefined;
        expect(trigger.addAction(action).removeActions()).toBe(trigger);
        trigger.removeAction(action);
        expect(callsOn(trigger, "TriggerClearActions").length).toEqual(1);
        expect(callsOn(trigger, "TriggerRemoveAction")).toEqual([]);
      });
    });
  });

  describe(`Trigger.removeCondition ${mode}`, () => {
    it("removes the condition added for a function and destroys its Condition", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        const condition = () => false;
        let conditions: handle[] = [];
        const created = returnedBy("Condition", () => {
          conditions = returnedBy("TriggerAddCondition", () => {
            trigger.addCondition(condition);
          });
        });
        expect(trigger.removeCondition(condition)).toBe(trigger);
        expect(callsOn(trigger, "TriggerRemoveCondition")).toEqual([
          `TriggerRemoveCondition(${handleRef("trigger", trigger.handle)}, ${handleRef("triggercondition", conditions[0])})`,
        ]);
        expect(destroyed(created[0])).toEqual(true);
        // With the condition gone, the actions run.
        expect(__stub_fire_trigger(trigger.handle)).toEqual(true);
      });
    });

    it("removes a caller's boolexpr without destroying it", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        const expr = Condition(() => false);
        const conditions = returnedBy("TriggerAddCondition", () => {
          trigger.addCondition(expr);
        });
        expect(trigger.removeCondition(expr)).toBe(trigger);
        expect(callsOn(trigger, "TriggerRemoveCondition")).toEqual([
          `TriggerRemoveCondition(${handleRef("trigger", trigger.handle)}, ${handleRef("triggercondition", conditions[0])})`,
        ]);
        expect(destroyed(expr)).toEqual(false);
      });
    });

    it("removes every condition a value added twice, and nothing on a second removal", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        const twice = () => true;
        let conditions: handle[] = [];
        const created = returnedBy("Condition", () => {
          conditions = returnedBy("TriggerAddCondition", () => {
            trigger.addCondition(twice).addCondition(twice);
          });
        });
        expect(conditions.length).toEqual(2);
        trigger.removeCondition(twice).removeCondition(twice);
        const ref = handleRef("trigger", trigger.handle);
        expect(callsOn(trigger, "TriggerRemoveCondition")).toEqual(
          conditions.map(
            (condition) =>
              `TriggerRemoveCondition(${ref}, ${handleRef("triggercondition", condition)})`,
          ),
        );
        expect(created.map((expr) => destroyed(expr))).toEqual([true, true]);
      });
    });

    it("gives every add of a function a Condition of its own, never the caller's", () => {
      inMode(devMode, () => {
        // The harness's Condition returns one handle per function, as JASS
        // caches one per code: handing it the caller's function would make
        // the adds share the caller's handle.
        const trigger = Trigger.create();
        const shared = () => true;
        const mine = Condition(shared);
        const created = returnedBy("Condition", () => {
          trigger.addCondition(shared).addCondition(shared);
        });
        expect(created.length).toEqual(2);
        expect(created[0] === created[1]).toEqual(false);
        expect(created.includes(mine)).toEqual(false);
        const before = stubCalls().length;
        trigger.removeCondition(shared);
        expect(
          stubCalls()
            .slice(before)
            .filter((line) => line.startsWith("DestroyCondition")),
        ).toEqual(
          created.map(
            (expr) => `DestroyCondition(${handleRef("conditionfunc", expr)})`,
          ),
        );
        expect(destroyed(mine)).toEqual(false);
      });
    });

    it("destroys the Condition of a condition that removes itself only when its evaluation returns", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        let made: handle[] = [];
        let destroyedWhileRunning: boolean | undefined;
        let evaluated = 0;
        const once = () => {
          evaluated++;
          trigger.removeCondition(once);
          destroyedWhileRunning = destroyed(made[0]);
          return false;
        };
        made = returnedBy("Condition", () => {
          trigger.addCondition(once);
        });
        expect(__stub_fire_trigger(trigger.handle)).toEqual(false);
        expect(destroyedWhileRunning).toEqual(false);
        expect(destroyedTimes(made[0])).toEqual(1);
        // Removed at once: the next firing no longer evaluates it.
        expect(__stub_fire_trigger(trigger.handle)).toEqual(true);
        expect(evaluated).toEqual(1);
      });
    });

    it("destroys the Condition of a condition that removes itself and then throws", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        const failing = (): boolean => {
          trigger.removeCondition(failing);
          error("removed, then failed", 0);
        };
        const [made] = returnedBy("Condition", () => {
          trigger.addCondition(failing);
        });
        if (devMode) {
          // Reported and evaluated false.
          expect(__stub_fire_trigger(trigger.handle)).toEqual(false);
        } else {
          expect(() => {
            __stub_fire_trigger(trigger.handle);
          }).toThrow("removed, then failed");
        }
        expect(destroyedTimes(made)).toEqual(1);
      });
    });

    it("defers destroying the Conditions removeConditions removes from inside one of them", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        let destroyedWhileRunning: boolean | undefined;
        let made: handle[] = [];
        made = returnedBy("Condition", () => {
          trigger
            .addCondition(() => {
              trigger.removeConditions();
              destroyedWhileRunning = destroyed(made[0]);
              return true;
            })
            .addCondition(() => true);
        });
        __stub_fire_trigger(trigger.handle);
        expect(destroyedWhileRunning).toEqual(false);
        expect(made.map((expr) => destroyedTimes(expr))).toEqual([1, 1]);
      });
    });

    it("calls no Native for a function or boolexpr never added", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create().addCondition(() => true);
        const empty = Trigger.create();
        const unknown = Filter(() => true);
        const before = stubCalls().length;
        expect(trigger.removeCondition(() => true)).toBe(trigger);
        expect(trigger.removeCondition(unknown)).toBe(trigger);
        expect(empty.removeCondition(() => true)).toBe(empty);
        expect(
          stubCalls()
            .slice(before)
            .filter(
              (line) =>
                line.startsWith("TriggerRemoveCondition") ||
                line.startsWith("DestroyCondition"),
            ),
        ).toEqual([]);
      });
    });

    it("passes a triggercondition straight to the Native", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        const expr = Condition(() => true);
        const raw = defined(
          TriggerAddCondition(trigger.handle, expr),
          "the triggercondition",
        );
        expect(trigger.removeCondition(raw)).toBe(trigger);
        expect(callsOn(trigger, "TriggerRemoveCondition")).toEqual([
          `TriggerRemoveCondition(${handleRef("trigger", trigger.handle)}, ${handleRef("triggercondition", raw)})`,
        ]);
        expect(destroyed(expr)).toEqual(false);
      });
    });

    it("destroys the created Conditions on removeConditions, and forgets them", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        const condition = () => true;
        const expr = Condition(() => true);
        const created = returnedBy("Condition", () => {
          trigger.addCondition(condition).addCondition(expr);
        });
        expect(trigger.removeConditions()).toBe(trigger);
        expect(destroyed(created[0])).toEqual(true);
        expect(destroyed(expr)).toEqual(false);
        trigger.removeCondition(condition).removeCondition(expr);
        expect(callsOn(trigger, "TriggerClearConditions").length).toEqual(1);
        expect(callsOn(trigger, "TriggerRemoveCondition")).toEqual([]);
      });
    });
  });

  describe(`Trigger.destroy ${mode}`, () => {
    it("destroys the created Conditions and forgets what was added", () => {
      inMode(devMode, () => {
        const trigger = Trigger.create();
        const handle = trigger.handle;
        const action = () => undefined;
        const condition = () => true;
        const expr = Condition(() => true);
        const created = returnedBy("Condition", () => {
          trigger.addAction(action).addCondition(condition).addCondition(expr);
        });
        trigger.destroy();
        expect(destroyed(created[0])).toEqual(true);
        expect(destroyed(expr)).toEqual(false);
        // The registry forgot the destroyed Wrapper: a lookup makes a new
        // one, which has nothing left to remove.
        const again = defined(Trigger.fromHandle(handle), "the new Wrapper");
        const before = stubCalls().length;
        again.removeAction(action).removeCondition(condition);
        expect(
          stubCalls()
            .slice(before)
            .filter((line) => line.startsWith("TriggerRemove")),
        ).toEqual([]);
      });
    });
  });
}
