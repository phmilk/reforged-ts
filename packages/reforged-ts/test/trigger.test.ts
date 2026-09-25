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
  Region,
  Timer,
  Trackable,
  Trigger,
  Unit,
} from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
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
  it("wraps a function with Condition and returns the Trigger", () => {
    const trigger = Trigger.create();
    const condition = () => false;
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
    expect(wrapped).toBe(condition);
    expect(callsOn(trigger, "TriggerAddCondition")).toEqual([
      `TriggerAddCondition(${handleRef("trigger", trigger.handle)}, ${handleRef("conditionfunc", expr)})`,
    ]);
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
      () => trigger.isRunning(),
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
