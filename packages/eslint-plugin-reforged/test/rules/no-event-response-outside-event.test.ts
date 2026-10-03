import { describe, expect, it } from "vitest";

import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

const imports =
  'import { Group, Init, Timer, Trigger, Unit, on, type EventDescriptor } from "reforged-ts";\ndeclare const death: EventDescriptor<{ unit: Unit }>;\n';

const unitEvent = "any unit event";
const trigger = "the context of a trigger's event";

function atTopLevel(name: string, line = 3) {
  return {
    messageId: "atTopLevel" as const,
    data: { name, context: trigger, event: unitEvent, callee: "" },
    line,
  };
}

ruleTester.run(
  "no-event-response-outside-event",
  ruleOf("no-event-response-outside-event"),
  {
    valid: [
      {
        name: "in an on() handler, a TriggerAddAction callback and a TriggerAddCondition filter",
        code: `${imports}on(death, (payload) => {\n  const unit = GetTriggerUnit();\n  print(payload.unit, unit);\n});\ndeclare const t: trigger;\nTriggerAddAction(t, () => {\n  KillUnit(GetTriggerUnit()!);\n});\nTriggerAddCondition(t, Condition(() => GetTriggerUnit() !== undefined));`,
      },
      {
        name: "in a named helper function and in a method",
        code: `${imports}function dying(): unit | undefined {\n  return GetTriggerUnit();\n}\nexport class Handler {\n  run(): Unit | undefined {\n    print(GetTriggerUnit());\n    return Unit.fromEvent();\n  }\n}\nexport const lookup = { get unit() { return GetTriggerUnit(); } };\nInit.onGameStart(dying);`,
      },
      {
        name: "GetExpiredTimer and Timer.fromExpired inside timer callbacks",
        code: `${imports}declare const t: timer;\nTimerStart(t, 1, false, () => {\n  DestroyTimer(GetExpiredTimer()!);\n});\nTimer.after(1, () => {\n  print(Timer.fromExpired());\n});\nTimer.every(1, () => {\n  print(GetExpiredTimer());\n});`,
      },
      {
        name: "GetEnumUnit inside a ForGroup callback, itself in a timer callback",
        code: `${imports}declare const g: group;\nTimer.after(1, () => {\n  ForGroup(g, () => {\n    KillUnit(GetEnumUnit()!);\n  });\n});\nInit.onGameStart(() => {\n  ForGroup(g, () => print(Unit.fromEnum()));\n});`,
      },
      {
        name: "a helper called from a timer callback, and a literal passed to a project function",
        code: `${imports}function report(): void {\n  print(GetTriggerUnit());\n}\nfunction later(fn: () => void): void {\n  fn();\n}\nTimer.after(1, () => {\n  report();\n});\nlater(() => print(GetTriggerUnit()));`,
      },
      {
        name: "a member that opens its own enumeration, and members with no event-response tag",
        code: `${imports}declare const group: Group;\nexport const units = group.getUnits();\nInit.onGlobals(() => {\n  print(Unit.create);\n  Timer.create();\n});`,
      },
      {
        name: "a project function and a project timer named like the library's",
        code: "function GetTriggerUnit(): number {\n  return 1;\n}\nexport const one = GetTriggerUnit();\nconst Timer = { after(_: number, fn: () => void) { fn(); } };\nTimer.after(1, () => print(GetEnumUnit()));",
      },
      {
        name: "an Init callback that is not passed directly, and the timer callback's other arguments",
        code: `${imports}const onStart = () => GetTriggerUnit();\nInit.onGameStart(onStart);\ndeclare const t: timer;\nTimerStart(t, 1, false, onStart);`,
      },
    ],
    invalid: [
      {
        name: "GetTriggerUnit at module top level",
        code: `${imports}export const unit = GetTriggerUnit();`,
        errors: [atTopLevel("GetTriggerUnit")],
      },
      {
        name: "GetTriggerUnit inside Init.onGameStart",
        code: `${imports}Init.onGameStart(() => {\n  print(GetTriggerUnit());\n});`,
        errors: [
          {
            messageId: "inInitStage",
            data: {
              name: "GetTriggerUnit",
              context: trigger,
              event: unitEvent,
              callee: "Init.onGameStart",
            },
            line: 4,
          },
        ],
      },
      {
        name: "GetTriggerUnit inside Timer.after inside an on() handler",
        code: `${imports}on(death, () => {\n  Timer.after(1, () => {\n    print(GetTriggerUnit());\n  });\n});`,
        errors: [
          {
            messageId: "inTimerCallback",
            data: {
              name: "GetTriggerUnit",
              context: trigger,
              event: unitEvent,
              callee: "Timer.after",
            },
            line: 5,
          },
        ],
      },
      {
        name: "GetEnumUnit inside a TimerStart callback",
        code: `${imports}declare const t: timer;\nTimerStart(t, 1, false, function () {\n  KillUnit(GetEnumUnit()!);\n});`,
        errors: [
          {
            messageId: "inTimerCallback",
            data: {
              name: "GetEnumUnit",
              context: "the context of an enumeration callback",
              event: "ForGroup",
              callee: "TimerStart",
            },
            line: 5,
          },
        ],
      },
      {
        name: "Unit.fromEvent inside a Timer.every callback",
        code: `${imports}Timer.every(1, () => {\n  print(Unit.fromEvent());\n});`,
        errors: [
          {
            messageId: "inTimerCallback",
            data: {
              name: "Unit.fromEvent (GetTriggerUnit)",
              context: trigger,
              event: unitEvent,
              callee: "Timer.every",
            },
            line: 4,
          },
        ],
      },
      {
        name: "a member classified by its @native tag, not its name",
        code: `${imports}export const unit = Unit.current();`,
        errors: [atTopLevel("Unit.current (GetTriggerUnit)")],
      },
      {
        name: "a static getter, a filter getter in timer.start, and an Init stage on another stage",
        code: `${imports}export const id = Trigger.eventId;\nTimer.create().start(1, false, () => print(Unit.fromFilter()));\nInit.onGlobals(() => print(GetExpiredTimer()));`,
        errors: [
          {
            messageId: "atTopLevel",
            data: {
              name: "Trigger.eventId (GetTriggerEventId)",
              context: trigger,
              event: "any run of a trigger",
              callee: "",
            },
            line: 3,
          },
          {
            messageId: "inTimerCallback",
            data: {
              name: "Unit.fromFilter (GetFilterUnit)",
              context: "the context of a filter function",
              event:
                "the filter of GroupEnumUnits* and of the unit event registrations",
              callee: "Timer#start",
            },
            line: 4,
          },
          {
            messageId: "inInitStage",
            data: {
              name: "GetExpiredTimer",
              context: "the context of a Timer's expiry",
              event: "TimerStart",
              callee: "Init.onGlobals",
            },
            line: 5,
          },
        ],
      },
      {
        name: "inside an immediately invoked function at top level, and in a static initialiser",
        code: `${imports}(() => {\n  print(GetSpellAbilityId());\n})();\nexport class Holder {\n  static unit = GetTriggerUnit();\n}`,
        errors: [
          {
            messageId: "atTopLevel",
            data: {
              name: "GetSpellAbilityId",
              context: trigger,
              event: "EVENT_PLAYER_UNIT_SPELL_*, EVENT_UNIT_SPELL_*",
              callee: "",
            },
            line: 4,
          },
          atTopLevel("GetTriggerUnit", 7),
        ],
      },
    ],
  },
);

describe("no-event-response-outside-event through the recommended config", () => {
  it("reports an event response at top level as a warning", () => {
    expect(
      lintWithRecommended("export const unit = GetTriggerUnit();"),
    ).toMatchObject([
      {
        ruleId: "reforged/no-event-response-outside-event",
        severity: 1,
        messageId: "atTopLevel",
      },
    ]);
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    expect(
      lintWithRecommended(
        'import { Timer } from "reforged-ts";\nTimer.after(1, () => {\n  // eslint-disable-next-line reforged/no-event-response-outside-event -- the timer is started from inside ForGroup\n  print(GetEnumUnit());\n});',
      ),
    ).toEqual([]);
  });
});
