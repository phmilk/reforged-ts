import { describe, expect, it } from "vitest";

import banList from "../../data/unsafe-natives.json" with { type: "json" };
import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

// The fixture calls each banned Native with arguments of its declared types.
const calls: Record<string, string> = {
  TriggerSleepAction: "TriggerSleepAction(1);",
  PolledWait: "PolledWait(1);",
  DestroyEffectAfterTimeBJ:
    'DestroyEffectAfterTimeBJ(AddSpecialEffect("model.mdx", 0, 0)!, 2);',
  CreateTimerBJ: "CreateTimerBJ(false, 1);",
  StartTimerBJ: "StartTimerBJ(CreateTimer()!, false, 1);",
  GetLastCreatedTimerBJ: "GetLastCreatedTimerBJ();",
  SelectGroupForPlayerBJ: "SelectGroupForPlayerBJ(CreateGroup()!, Player(0)!);",
  SmartCameraPanBJ: "SmartCameraPanBJ(Player(0)!, Location(0, 0)!, 1);",
};

ruleTester.run("no-unsafe-natives", ruleOf("no-unsafe-natives"), {
  valid: [
    {
      name: "other Natives",
      code: "const t = CreateTimer()!;\nTimerStart(t, 1, false, () => DestroyTimer(t));",
    },
    {
      name: "a project function named like a banned Native",
      code: "export function TriggerSleepAction(seconds: number): void {\n  print(seconds);\n}\nTriggerSleepAction(1);",
    },
    {
      name: "an imported project function named like a banned Native",
      code: 'import { PolledWait } from "./wait";\nPolledWait(1);',
    },
    {
      name: "a method named like a banned Native",
      code: "const waits = { TriggerSleepAction(seconds: number) { return seconds; } };\nwaits.TriggerSleepAction(1);",
    },
    {
      name: "the allow option",
      code: "TriggerSleepAction(1);\nPolledWait(2);",
      options: [{ allow: ["TriggerSleepAction", "PolledWait"] }],
    },
  ],
  invalid: [
    ...banList.map((entry) => ({
      name: entry.name,
      code: calls[entry.name] ?? `${entry.name}();`,
      errors: [
        {
          messageId: "unsafeNative" as const,
          data: {
            name: entry.name,
            reason: entry.reason,
            replacement: entry.replacement,
          },
          line: 1,
          column: 1,
        },
      ],
    })),
    {
      name: "in a callback, and the allow option removes only its entries",
      code: 'import { Timer } from "reforged-ts";\nTimer.after(1, () => {\n  PolledWait(1);\n  TriggerSleepAction(1);\n});',
      options: [{ allow: ["PolledWait"] }],
      errors: [{ messageId: "unsafeNative", line: 4, column: 3 }],
    },
  ],
});

// Escapes go through the recommended config, as a Map project writes them:
// the RuleTester registers the rule under its own prefix, not `reforged/`.
describe("no-unsafe-natives through the recommended config", () => {
  it("honours an eslint-disable-next-line escape with a reason", () => {
    const messages = lintWithRecommended(
      "// eslint-disable-next-line reforged/no-unsafe-natives -- a trigger action, where the sleep is safe\nTriggerSleepAction(1);",
    );
    expect(messages).toEqual([]);
  });

  it("reports a banned Native as an error", () => {
    const messages = lintWithRecommended("TriggerSleepAction(1);");
    expect(messages).toMatchObject([
      {
        ruleId: "reforged/no-unsafe-natives",
        severity: 2,
        messageId: "unsafeNative",
      },
    ]);
  });
});
