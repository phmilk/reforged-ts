import type { InvalidTestCase } from "@typescript-eslint/rule-tester";
import { describe, expect, it } from "vitest";

import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

type MessageIds = "percentInDisplayString" | "doublePercent";

// Every text-sink family of data/local-safe.json: the call (or accessor
// assignment) that displays `MESSAGE`, and any import it needs.
const sinks: readonly { name: string; code: string; imports?: string }[] = [
  {
    name: "DisplayTextToPlayer",
    code: "DisplayTextToPlayer(Player(0)!, 0, 0, MESSAGE);",
  },
  {
    name: "DisplayTimedTextToPlayer",
    code: "DisplayTimedTextToPlayer(Player(0)!, 0, 0, 5, MESSAGE);",
  },
  {
    name: "DisplayTimedTextFromPlayer",
    code: "DisplayTimedTextFromPlayer(Player(0)!, 0, 0, 5, MESSAGE);",
  },
  {
    name: "DisplayTextToForce",
    code: "DisplayTextToForce(GetPlayersAll()!, MESSAGE);",
  },
  {
    name: "DisplayTimedTextToForce",
    code: "DisplayTimedTextToForce(GetPlayersAll()!, 5, MESSAGE);",
  },
  { name: "BJDebugMsg", code: "BJDebugMsg(MESSAGE);" },
  { name: "print", code: "print(MESSAGE);" },
  {
    name: "BlzFrameSetText",
    code: 'BlzFrameSetText(BlzGetFrameByName("Bar", 0)!, MESSAGE);',
  },
  {
    name: "BlzFrameAddText",
    code: 'BlzFrameAddText(BlzGetFrameByName("Bar", 0)!, MESSAGE);',
  },
  {
    name: "Frame#setText",
    code: 'Frame.fromName("Bar", 0)!.setText(MESSAGE);',
    imports: 'import { Frame } from "reforged-ts";\n',
  },
  {
    name: "Frame#addText",
    code: 'Frame.fromName("Bar", 0)?.addText(MESSAGE);',
    imports: 'import { Frame } from "reforged-ts";\n',
  },
  {
    name: "Frame#text",
    code: 'Frame.fromName("Bar", 0)!.text = MESSAGE;',
    imports: 'import { Frame } from "reforged-ts";\n',
  },
];

// The ways a string feeds a sink: the prelude, the expression put in the
// sink, and both after the suggestion.
const feeds: readonly {
  name: string;
  prelude: string;
  expression: string;
  fixedPrelude?: string;
  fixedExpression?: string;
}[] = [
  {
    name: "directly",
    prelude: "",
    expression: '"50%"',
    fixedExpression: '"50%%"',
  },
  {
    name: "through a template",
    prelude: "const hp = 50;\n",
    expression: "`${hp}% life`",
    fixedExpression: "`${hp}%% life`",
  },
  {
    name: "through a concatenation",
    prelude: "const hp = 50;\n",
    expression: 'hp + "%"',
    fixedExpression: 'hp + "%%"',
  },
  {
    name: "through tostring",
    prelude: "",
    expression: 'tostring("50%")',
    fixedExpression: 'tostring("50%%")',
  },
  {
    // I2S takes a number; the assertion stands for any value the walk
    // follows into the converter's first argument.
    name: "through I2S",
    prelude: "",
    expression: 'I2S("50%" as unknown as number)!',
    fixedExpression: 'I2S("50%%" as unknown as number)!',
  },
  {
    name: "through String()",
    prelude: "",
    expression: 'String("50%")',
    fixedExpression: 'String("50%%")',
  },
  {
    name: "through a one-hop const",
    prelude: 'const message = "50%";\n',
    expression: "message",
    fixedPrelude: 'const message = "50%%";\n',
  },
];

function invalidCase(
  sink: (typeof sinks)[number],
  feed: (typeof feeds)[number],
): InvalidTestCase<MessageIds, []> {
  const source = (prelude: string, expression: string) =>
    `${sink.imports ?? ""}${prelude}${sink.code.replace("MESSAGE", () => expression)}`;
  return {
    name: `${sink.name}, ${feed.name}`,
    code: source(feed.prelude, feed.expression),
    errors: [
      {
        messageId: "percentInDisplayString",
        data: { sink: sink.name },
        suggestions: [
          {
            messageId: "doublePercent",
            output: source(
              feed.fixedPrelude ?? feed.prelude,
              feed.fixedExpression ?? feed.expression,
            ),
          },
        ],
      },
    ],
  };
}

ruleTester.run(
  "no-percent-in-display-strings",
  ruleOf("no-percent-in-display-strings"),
  {
    valid: [
      {
        name: "a % that never reaches a sink",
        code: 'const ratio = "50%";\nconst length = ratio.length;\nSetPlayerName(Player(0)!, `${length}%`);',
      },
      {
        name: "a % in a visual allowlist call",
        code: 'BlzFrameSetTexture(BlzGetFrameByName("Bar", 0)!, "bar%.blp", 0, false);',
      },
      { name: "%% already escaped", code: 'print("50%%");' },
      {
        name: "%% already escaped in a template and a const",
        code: 'const hp = 50;\nconst message = `${hp}%% life`;\nBJDebugMsg(message + " (100%%)");',
      },
      {
        name: "a sink reached through a user function (not followed)",
        code: 'function show(message: string): void {\n  print(message);\n}\nshow("50%");',
      },
      {
        name: "a sink reached through two consts (one hop only)",
        code: 'const first = "50%";\nconst second = first;\nprint(second);',
      },
      {
        name: "a string parsed by S2I is not displayed",
        code: 'print(I2S(S2I("50%")));\nprint(R2SW(1.5, S2I("5%"), 2));',
      },
      {
        name: "a let is not followed",
        code: 'let message = "50%";\nmessage = "done";\nprint(message);',
      },
      {
        name: "a project function named print",
        code: 'export function print(message: string): string {\n  return message;\n}\nprint("50%");',
      },
      {
        name: "a numeric + is not a concatenation",
        code: "const a = 1;\nprint(a + 2);",
      },
      {
        name: "a modulo inside a template expression",
        code: "print(`${10 % 3}`);",
      },
      {
        name: "a tagged template",
        code: 'function tag(parts: TemplateStringsArray): string {\n  return parts.join("");\n}\nprint(tag`50%`);',
      },
      {
        name: "a string used as a callee argument of a sink's argument",
        code: 'print(string.format("%d", 5));',
      },
      {
        name: "a plain property of a Wrapper (not an accessor)",
        code: 'import { Frame } from "reforged-ts";\nFrame.fromName("Bar", 0)!.label = "50%";',
      },
      {
        name: "a listed accessor of another kind",
        code: 'import { Frame } from "reforged-ts";\nconst frame = Frame.fromName("Bar", 0)!;\nframe.setValue(50);\nconst label = { text: "" };\nlabel.text = "50%";',
      },
    ],
    invalid: [
      ...sinks.flatMap((sink) => feeds.map((feed) => invalidCase(sink, feed))),
      {
        name: "every lone % of a template is doubled, %% kept",
        code: "const hp = 50;\nprint(`${hp}% of 100%% (${hp}%)`);",
        errors: [
          {
            messageId: "percentInDisplayString",
            data: { sink: "print" },
            line: 2,
            column: 7,
            suggestions: [
              {
                messageId: "doublePercent",
                output: "const hp = 50;\nprint(`${hp}%% of 100%% (${hp}%%)`);",
              },
            ],
          },
        ],
      },
      {
        name: "a literal inside a template, through an assertion",
        code: 'const hp = 50;\nprint(`${hp}${"%" as string}`);',
        errors: [
          {
            messageId: "percentInDisplayString",
            suggestions: [
              {
                messageId: "doublePercent",
                output: 'const hp = 50;\nprint(`${hp}${"%%" as string}`);',
              },
            ],
          },
        ],
      },
      {
        name: "a const read twice is reported once",
        code: 'const message = "50%";\nprint(message);\nBJDebugMsg(message);',
        errors: [
          {
            messageId: "percentInDisplayString",
            data: { sink: "print" },
            suggestions: [
              {
                messageId: "doublePercent",
                output:
                  'const message = "50%%";\nprint(message);\nBJDebugMsg(message);',
              },
            ],
          },
        ],
      },
    ],
  },
);

describe("no-percent-in-display-strings through the recommended config", () => {
  it("reports a % as a warning", () => {
    expect(lintWithRecommended('print("50%");')).toMatchObject([
      {
        ruleId: "reforged/no-percent-in-display-strings",
        severity: 1,
        messageId: "percentInDisplayString",
      },
    ]);
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    expect(
      lintWithRecommended(
        '// eslint-disable-next-line reforged/no-percent-in-display-strings -- a format string for string.format\nprint("50%");',
      ),
    ).toEqual([]);
  });
});
