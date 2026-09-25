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
    messageId: "handleAtTopLevel" as const,
    data: { callee, type },
    line,
  };
}

ruleTester.run(
  "no-handles-at-module-top-level",
  ruleOf("no-handles-at-module-top-level"),
  {
    valid: [
      {
        name: "creations inside a function, an arrow function and a method",
        code: `${imports}export function spawn(): Unit {\n  return ${createUnit};\n}\nexport const tick = () => CreateTimer();\nexport class Spawner {\n  spawn() {\n    return Effect.create("model.mdx", 0, 0);\n  }\n}`,
      },
      {
        name: "creations inside an Init.onGlobals callback and a timer callback",
        code: `${imports}Init.onGlobals(() => {\n  const unit = ${createUnit};\n  const timer = CreateTimer();\n});\nTimer.after(1, () => {\n  const effect = Effect.createAttachment("model.mdx", Unit.fromEvent()!, "origin");\n});`,
      },
      {
        name: "registration-type Natives and Filter/Condition at top level",
        code: "declare const trigger: trigger;\nTriggerRegisterTimerEvent(trigger, 1, false);\nTriggerAddAction(trigger, () => {});\nTriggerAddCondition(trigger, Condition(() => true));\nexport {};",
      },
      {
        name: "lookups and conversions at top level",
        code: "const player = Player(0);\nconst local = GetLocalPlayer();\nconst race = ConvertRace(1);\nexport {};",
      },
      {
        name: "Wrapper statics not named create",
        code: `${imports}Timer.after(1, () => {});\nconst unit = Unit.fromEvent();\nconst player = MapPlayer.fromIndex(0);`,
      },
      {
        name: "an instance property initialiser, a parameter default and a getter",
        code: "export class Holder {\n  timer = CreateTimer();\n}\nexport function start(timer = CreateTimer()) {\n  return timer;\n}\nexport const lazy = {\n  get timer() {\n    return CreateTimer();\n  },\n};",
      },
      {
        name: "a project function named like a creation Native",
        code: "export function CreateTimer(): number {\n  return 1;\n}\nconst timer = CreateTimer();",
      },
      {
        name: "a project class with a static create",
        code: "export class Pool {\n  static create(): Pool {\n    return new Pool();\n  }\n}\nconst pool = Pool.create();",
      },
    ],
    invalid: [
      {
        name: "a Wrapper create at top level",
        code: `${imports}export const unit = ${createUnit};`,
        errors: [error("Unit.create", "Unit")],
      },
      {
        name: "a Wrapper creation static not named create",
        code: `${imports}export const blood = Effect.createAttachment("model.mdx", Unit.fromEvent()!, "origin");`,
        errors: [error("Effect.createAttachment", "Effect")],
      },
      {
        name: "create on a project class extending a Wrapper",
        code: `${imports}class Hero extends Unit {}\nexport const hero = Hero.create(MapPlayer.fromIndex(0)!, FourCC("Hpal"), 0, 0);`,
        errors: [error("Unit.create", "Unit", 3)],
      },
      {
        name: "handle-returning Natives at top level, in a script",
        code: 'const timer = CreateTimer();\nconst unit = CreateUnit(Player(0)!, FourCC("hfoo"), 0, 0, 0);\nLocation(0, 0);',
        errors: [
          error("CreateTimer", "timer", 1),
          error("CreateUnit", "unit", 2),
          error("Location", "location", 3),
        ],
      },
      {
        name: "inside immediately invoked functions",
        code: `${imports}(() => {\n  const timer = Timer.create();\n})();\n(function () {\n  const group = CreateGroup();\n})();`,
        errors: [
          error("Timer.create", "Timer", 3),
          error("CreateGroup", "group", 6),
        ],
      },
      {
        name: "in an object literal evaluated at load",
        code: 'export const effects = {\n  blood: AddSpecialEffect("model.mdx", 0, 0),\n};',
        errors: [error("AddSpecialEffect", "effect")],
      },
      {
        name: "in a class static initialiser and a static block",
        code: "export class Registry {\n  static timer = CreateTimer();\n  static {\n    CreateGroup();\n  }\n}",
        errors: [
          error("CreateTimer", "timer"),
          error("CreateGroup", "group", 4),
        ],
      },
      {
        name: "an exported default and a namespace body",
        code: `${imports}export default Timer.create();\nnamespace Pools {\n  export const trigger = CreateTrigger();\n}`,
        errors: [
          error("Timer.create", "Timer"),
          error("CreateTrigger", "trigger", 4),
        ],
      },
    ],
  },
);

describe("no-handles-at-module-top-level through the recommended config", () => {
  it("reports a creation at top level as an error", () => {
    expect(
      lintWithRecommended("export const timer = CreateTimer();"),
    ).toMatchObject([
      {
        ruleId: "reforged/no-handles-at-module-top-level",
        severity: 2,
        messageId: "handleAtTopLevel",
      },
    ]);
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    expect(
      lintWithRecommended(
        "// eslint-disable-next-line reforged/no-handles-at-module-top-level -- a hashtable has no engine state to desync\nexport const table = InitHashtable();",
      ),
    ).toEqual([]);
  });
});
