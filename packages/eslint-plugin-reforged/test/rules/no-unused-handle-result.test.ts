import { describe, expect, it } from "vitest";

import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

const imports =
  'import { Effect, Init, MapPlayer, Timer, Unit } from "reforged-ts";\n';
const createUnit = 'Unit.create(MapPlayer.fromIndex(0)!, FourCC("hfoo"), 0, 0)';

function error(callee: string, type: string, line = 2) {
  return {
    messageId: "unusedHandle" as const,
    data: { callee, type },
    line,
  };
}

ruleTester.run("no-unused-handle-result", ruleOf("no-unused-handle-result"), {
  valid: [
    {
      name: "a kept result",
      code: `${imports}Init.onGlobals(() => {\n  const unit = ${createUnit};\n  const timer = CreateTimer()!;\n  const filter = Filter(() => true);\n  DestroyFilter(filter);\n  DestroyTimer(CreateTimer()!);\n});`,
    },
    {
      name: "a dropped Timer.after and other statics not named create",
      code: `${imports}Timer.after(1, () => {});\nUnit.fromEvent();\nMapPlayer.fromIndex(0);`,
    },
    {
      name: "dropped calls that are not creations",
      code: "GetTriggerUnit();\nPlayer(0);\nGetLocalPlayer();\nexport {};",
    },
    {
      name: "a dropped registration Native",
      code: "declare const trigger: trigger;\nTriggerRegisterTimerEvent(trigger, 1, false);\nTriggerAddAction(trigger, () => {});\nexport {};",
    },
    {
      name: "an explicit void discard",
      code: "void CreateTimer();\nexport {};",
    },
    {
      name: "a project function named like a creation Native",
      code: "export function CreateTimer(): number {\n  return 1;\n}\nCreateTimer();",
    },
  ],
  invalid: [
    {
      name: "a dropped Unit.create",
      code: `${imports}Init.onGlobals(() => {\n  ${createUnit};\n});`,
      errors: [error("Unit.create", "Unit", 3)],
    },
    {
      name: "a dropped Wrapper creation static not named create",
      code: `${imports}Effect.createAttachment("model.mdx", Unit.fromEvent()!, "origin");`,
      errors: [error("Effect.createAttachment", "Effect")],
    },
    {
      name: "a dropped CreateTimer(), with and without a non-null assertion",
      code: "CreateTimer();\nCreateTimer()!;\nexport {};",
      errors: [error("CreateTimer", "timer", 1), error("CreateTimer", "timer")],
    },
    {
      name: "a dropped Filter(...) and Condition(...)",
      code: "export function register(): void {\n  Filter(() => true);\n  Condition(() => true);\n}",
      errors: [
        error("Filter", "filterfunc"),
        error("Condition", "conditionfunc", 3),
      ],
    },
  ],
});

describe("no-unused-handle-result through the recommended config", () => {
  it("reports a dropped creation as an error", () => {
    expect(
      lintWithRecommended(
        "export function leak(): void {\n  CreateGroup();\n}",
      ),
    ).toMatchObject([
      {
        ruleId: "reforged/no-unused-handle-result",
        severity: 2,
        messageId: "unusedHandle",
      },
    ]);
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    expect(
      lintWithRecommended(
        'export function spawn(): void {\n  // eslint-disable-next-line reforged/no-unused-handle-result -- the unit is found again through its group\n  CreateUnit(Player(0)!, FourCC("hfoo"), 0, 0, 0);\n}',
      ),
    ).toEqual([]);
  });
});
