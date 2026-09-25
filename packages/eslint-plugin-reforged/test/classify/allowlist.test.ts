// The allowlist and text-sink helpers the rules share (#114, reused by #115,
// #116 and #117), through probe rules: one reports the allowlist entry every
// call and assignment invokes, the other reports the sink every string
// literal reaches.
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

import { createAllowlist } from "../../src/classify/allowlist.js";
import { reachedTextSink } from "../../src/classify/text-sink.js";
import { loadPluginData } from "../../src/data/index.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();
const { localSafe } = loadPluginData();
const createProbe = ESLintUtils.RuleCreator((name) => name);

const entryProbe = createProbe<[{ extraVisual?: string[] }], "entry">({
  name: "allowlist-entry",
  meta: {
    type: "problem",
    docs: { description: "Reports the allowlist entry of each invocation" },
    messages: { entry: "{{name}} {{kind}}" },
    schema: [
      {
        type: "object",
        properties: {
          extraVisual: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [{ extraVisual = [] }]) {
    const services = ESLintUtils.getParserServices(context);
    const allowlist = createAllowlist(localSafe, extraVisual);
    const report = (node: Parameters<typeof allowlist.entryOf>[1]): void => {
      const entry = allowlist.entryOf(services, node);
      if (entry !== undefined) {
        context.report({ node, messageId: "entry", data: entry });
      }
    };
    return { CallExpression: report, AssignmentExpression: report };
  },
});

const sinkProbe = createProbe<[], "sink">({
  name: "text-sink",
  meta: {
    type: "problem",
    docs: { description: "Reports the text sink each string literal reaches" },
    messages: { sink: "{{name}}" },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const allowlist = createAllowlist(localSafe);
    return {
      Literal(node) {
        if (typeof node.value !== "string") {
          return;
        }
        const hit = reachedTextSink(context, allowlist, node);
        if (hit !== undefined) {
          context.report({ node, messageId: "sink", data: { name: hit.name } });
        }
      },
      CallExpression(node) {
        // A non-literal start: a Native's value (as #116 asks for GetHandleId).
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === "GetHandleId"
        ) {
          const hit = reachedTextSink(context, allowlist, node);
          if (hit !== undefined) {
            context.report({
              node,
              messageId: "sink",
              data: { name: hit.name },
            });
          }
        }
      },
    };
  },
});

const frame =
  'import { Camera, Frame } from "reforged-ts";\nconst frame = Frame.fromName("Bar", 0)!;\n';

ruleTester.run("allowlist entry", entryProbe, {
  valid: [
    {
      name: "a Native that is not listed",
      code: "KillUnit(GetTriggerUnit()!);",
    },
    {
      name: "a member off the list (decision 6: setValue, value)",
      code: `${frame}frame.setValue(1);\nframe.value = 1;`,
    },
    {
      name: "a plain property write of a Wrapper",
      code: `${frame}frame.label = "x";`,
    },
    {
      name: "a project object with listed member names",
      code: "const o = { setVisible(flag: boolean) { return flag; }, text: '' };\no.setVisible(true);\no.text = 'a';",
    },
    {
      name: "a project function shadowing a Native",
      code: "export function SetCameraField(): void {}\nSetCameraField();",
    },
  ],
  invalid: [
    {
      name: "a visual Native around a frame lookup (not listed)",
      code: 'BlzFrameSetVisible(BlzGetFrameByName("Bar", 0)!, false);',
      errors: [
        {
          messageId: "entry",
          data: { name: "BlzFrameSetVisible", kind: "visual" },
        },
      ],
    },
    {
      name: "print, a Lua global",
      code: 'print("a");',
      errors: [{ messageId: "entry", data: { name: "print", kind: "text" } }],
    },
    {
      name: "instance methods, a static and accessor assignments",
      code: `${frame}frame.setVisible(true);\nframe.setText("a");\nCamera.pan(0, 0, undefined);\nframe.visible = false;\nframe.text = "a";`,
      errors: [
        {
          messageId: "entry",
          data: { name: "Frame#setVisible", kind: "visual" },
        },
        { messageId: "entry", data: { name: "Frame#setText", kind: "text" } },
        { messageId: "entry", data: { name: "Camera.pan", kind: "visual" } },
        { messageId: "entry", data: { name: "Frame#visible", kind: "visual" } },
        { messageId: "entry", data: { name: "Frame#text", kind: "text" } },
      ],
    },
    {
      name: "extra names treated as visual",
      code: `${frame}frame.setValue(1);\nKillUnit(GetTriggerUnit()!);`,
      options: [{ extraVisual: ["Frame#setValue", "KillUnit"] }],
      errors: [
        {
          messageId: "entry",
          data: { name: "Frame#setValue", kind: "visual" },
        },
        { messageId: "entry", data: { name: "KillUnit", kind: "visual" } },
      ],
    },
  ],
});

ruleTester.run("text sink", sinkProbe, {
  valid: [
    {
      name: "a visual call is not a sink",
      code: 'BlzFrameSetTexture(BlzGetFrameByName("Bar", 0)!, "a.blp", 0, false);',
    },
    {
      name: "a conditional is not followed",
      code: 'print(Math.random() > 0.5 ? "a" : "b");',
    },
    {
      name: "a handle id used as data",
      code: "const ids = new LuaMap<number, boolean>();\nids.set(GetHandleId(GetTriggerUnit()!), true);",
    },
  ],
  invalid: [
    {
      name: "a handle id through a concatenation and a const",
      code: 'const label = "unit " + GetHandleId(GetTriggerUnit()!);\nprint(label);',
      errors: [
        { messageId: "sink", data: { name: "print" } },
        { messageId: "sink", data: { name: "print" } },
      ],
    },
    {
      name: "a const read in a template, then tostring",
      code: 'const part = "a";\nBJDebugMsg(tostring(`${part}!`));',
      errors: [{ messageId: "sink", data: { name: "BJDebugMsg" } }],
    },
    {
      name: "an accessor assignment",
      code: `${frame}frame.text = "a" as string;`,
      errors: [{ messageId: "sink", data: { name: "Frame#text" } }],
    },
  ],
});
