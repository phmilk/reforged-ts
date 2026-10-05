import { describe, expect, it } from "vitest";

import crashingArguments from "../../data/crashing-arguments.json" with { type: "json" };
import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

const prelude =
  'import { Frame } from "reforged-ts";\ndeclare const owner: Frame;\ndeclare const handle: framehandle;\n';

const frameEntry = crashingArguments.find(
  (entry) => entry.name === "BlzCreateFrameByType",
);
if (frameEntry === undefined) {
  throw new Error("data/crashing-arguments.json lists no BlzCreateFrameByType");
}

/** The report of `callee` with that frame type and `inherits: ""`, on line 4. */
function crash(callee: string, typeName: string, column: number) {
  return {
    messageId: "crashingArguments" as const,
    data: {
      callee,
      arguments: `typeName ${JSON.stringify(typeName)} and inherits ""`,
      case: frameEntry?.case,
      build: frameEntry?.build,
      reason: frameEntry?.reason,
      replacement: frameEntry?.replacement,
    },
    line: 4,
    column,
  };
}

ruleTester.run("no-crashing-arguments", ruleOf("no-crashing-arguments"), {
  valid: [
    {
      name: "the Native with a template",
      code: `${prelude}BlzCreateFrameByType("CONTROL", "Box", handle, "MyControlTemplate", 0);`,
    },
    {
      name: "the Native with another type and no template",
      code: `${prelude}BlzCreateFrameByType("BACKDROP", "Box", handle, "", 0);`,
    },
    {
      name: "the Native with a non-literal type",
      code: `${prelude}declare const typeName: string;\nBlzCreateFrameByType(typeName, "Box", handle, "", 0);`,
    },
    {
      name: "the Native with a non-literal inherits",
      code: `${prelude}const inherits = "";\nBlzCreateFrameByType("CONTROL", "Box", handle, inherits, 0);`,
    },
    {
      name: "Frame.createType with a template",
      code: `${prelude}Frame.createType("Box", owner, 0, "SIMPLEMESSAGEFRAME", "MyMessageTemplate");`,
    },
    {
      name: "Frame.createType with another type and no template",
      code: `${prelude}Frame.createType("Box", owner, 0, "TEXTAREA", "");`,
    },
    {
      name: "Frame.createType with a non-literal type",
      code: `${prelude}declare const typeName: string;\nFrame.createType("Box", owner, 0, typeName, "");`,
    },
    {
      name: "a project function named like the Native",
      code: 'export function BlzCreateFrameByType(typeName: string, name: string, owner: unknown, inherits: string, createContext: number): void {\n  print(typeName, name, owner, inherits, createContext);\n}\nBlzCreateFrameByType("CONTROL", "Box", undefined, "", 0);',
    },
    {
      name: "a project method named like the library member",
      code: 'const Frames = { createType(name: string, owner: unknown, createContext: number, typeName: string, inherits: string) { return [name, owner, createContext, typeName, inherits]; } };\nFrames.createType("Box", undefined, 0, "CONTROL", "");',
    },
  ],
  invalid: [
    ...["SIMPLEMESSAGEFRAME", "CONTROL"].flatMap((typeName) => [
      {
        name: `the Native with ${typeName} and no template`,
        code: `${prelude}BlzCreateFrameByType("${typeName}", "Box", handle, "", 0);`,
        errors: [crash("BlzCreateFrameByType", typeName, 1)],
      },
      {
        name: `Frame.createType with ${typeName} and no template`,
        code: `${prelude}Frame.createType("Box", owner, 0, "${typeName}", "");`,
        errors: [crash("Frame.createType", typeName, 1)],
      },
    ]),
    {
      name: "template literals without substitutions are literals",
      code: `${prelude}BlzCreateFrameByType(\`CONTROL\`, "Box", handle, \`\`, 0);`,
      errors: [crash("BlzCreateFrameByType", "CONTROL", 1)],
    },
    {
      name: "Frame.createType through a subclass, in a callback",
      code: `${prelude}class Panel extends Frame {}\nconst build = () => Panel.createType("Box", owner, 0, "CONTROL", "");\nbuild();`,
      errors: [{ ...crash("Frame.createType", "CONTROL", 21), line: 5 }],
    },
  ],
});

// Escapes and severity go through the recommended config, as a Map project
// writes them: the RuleTester registers the rule under its own prefix.
describe("no-crashing-arguments through the recommended config", () => {
  it("reports a Crashing case as an error", () => {
    const messages = lintWithRecommended(
      `${prelude}export const box = BlzCreateFrameByType("CONTROL", "Box", handle, "", 0);`,
    ).filter((each) => each.ruleId === "reforged/no-crashing-arguments");
    expect(messages).toMatchObject([
      { severity: 2, messageId: "crashingArguments", line: 4 },
    ]);
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    const messages = lintWithRecommended(
      `${prelude}// eslint-disable-next-line reforged/no-crashing-arguments -- a later Build no longer crashes\nexport const box = BlzCreateFrameByType("CONTROL", "Box", handle, "", 0);`,
    ).filter((each) => each.ruleId === "reforged/no-crashing-arguments");
    expect(messages).toEqual([]);
  });
});
