import type { InvalidTestCase } from "@typescript-eslint/rule-tester";
import { describe, expect, it } from "vitest";

import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

type MessageIds = "handleIdAsData";

const unitImport = 'import { Unit } from "reforged-ts";\n';
const unitPrelude = `${unitImport}declare const unit: Unit;\n`;

// The two id sources: the prelude declaring what they read, the id
// expression, and the `source` of the message.
const sources: readonly { name: string; prelude: string; id: string }[] = [
  {
    name: "GetHandleId",
    prelude: "declare const u: unit;\nexport {};\n",
    id: "GetHandleId(u)",
  },
  { name: "Unit#id", prelude: unitPrelude, id: "unit.id" },
];

// The uses as data: the code around ID.
const dataUses: readonly { name: string; code: string }[] = [
  {
    name: "as a table key",
    code: 'const table = new LuaTable<number, string>();\ntable.set(ID, "hero");',
  },
  {
    name: "as an index",
    code: 'const names: string[] = [];\nnames[ID] = "hero";',
  },
  {
    name: "in a Map key",
    code: 'const byId = new Map<number, string>();\nbyId.set(ID, "hero");',
  },
  { name: "in arithmetic", code: "const slot = ID % 12;" },
  { name: "in a comparison", code: 'if (ID > 100) {\n  print("late");\n}' },
  { name: "stored in a let", code: "let last = ID;\nlast += 1;" },
  {
    name: "stored in an object",
    code: "const state = { owner: ID };\nprint(state.owner);",
  },
  {
    name: "stored in a const used as data",
    code: "const key = ID;\nconst table: Record<number, boolean> = {};\ntable[key] = true;",
  },
  {
    name: "converted by I2S into a key",
    code: "const table: Record<string, boolean> = {};\ntable[I2S(ID)!] = true;",
  },
  {
    name: "concatenated into a key",
    code: 'const key = "unit" + ID;\nconst table: Record<string, boolean> = {};\ntable[key] = true;',
  },
];

// The display uses: the code around ID, which reaches a text sink.
const displayUses: readonly { name: string; code: string }[] = [
  { name: "passed to print", code: "print(ID);" },
  { name: "in a template for BJDebugMsg", code: "BJDebugMsg(`id ${ID}`);" },
  {
    name: "concatenated for DisplayTextToPlayer",
    code: 'DisplayTextToPlayer(Player(0)!, 0, 0, "id " + ID);',
  },
  { name: "through tostring", code: "print(tostring(ID));" },
  { name: "through I2S", code: "print(I2S(ID));" },
  {
    name: "through I2S, concatenated for DisplayTextToPlayer",
    code: 'DisplayTextToPlayer(Player(0)!, 0, 0, "id " + I2S(ID)!);',
  },
  { name: "through R2S", code: "BJDebugMsg(R2S(ID)!);" },
  { name: "through R2SW", code: "print(R2SW(ID, 8, 0));" },
  {
    name: "through a one-hop const",
    code: "const label = `id ${ID}`;\nprint(label);",
  },
  {
    name: "the const itself, then displayed",
    code: "const id = ID;\nBJDebugMsg(`${id}`);",
  },
];

function invalidCase(
  source: (typeof sources)[number],
  use: (typeof dataUses)[number],
): InvalidTestCase<MessageIds, []> {
  return {
    name: `${source.name} ${use.name}`,
    code: `${source.prelude}${use.code.replace("ID", () => source.id)}`,
    errors: [{ messageId: "handleIdAsData", data: { source: source.name } }],
  };
}

ruleTester.run("no-handle-id-as-data", ruleOf("no-handle-id-as-data"), {
  valid: [
    ...sources.flatMap((source) =>
      displayUses.map((use) => ({
        name: `${source.name} ${use.name}`,
        code: `${source.prelude}${use.code.replace("ID", () => source.id)}`,
      })),
    ),
    {
      name: "the unit through the Frame text accessor",
      code: `${unitImport}import { Frame } from "reforged-ts";\ndeclare const unit: Unit;\nFrame.fromName("Bar", 0)!.text = \`\${unit.id}\`;`,
    },
    {
      name: "an optional chain to print",
      code: `${unitImport}declare const unit: Unit | undefined;\nprint(unit?.id);`,
    },
    {
      name: "MapPlayer#id is the slot index, not a handle id",
      code: 'import { MapPlayer } from "reforged-ts";\nconst slot = MapPlayer.fromIndex(0)!.id;\nconst table: Record<number, boolean> = {};\ntable[slot] = true;',
    },
    {
      name: "an id property of a project object",
      code: "const hero = { id: 5 };\nconst table: Record<number, boolean> = {};\ntable[hero.id] = true;",
    },
    {
      name: "a project function named GetHandleId",
      code: "export function GetHandleId(value: number): number {\n  return value;\n}\nconst key = GetHandleId(5) + 1;",
    },
    {
      name: "keyed by the object",
      code: `${unitPrelude}const table = new LuaTable<Unit, string>();\ntable.set(unit, "hero");`,
    },
  ],
  invalid: [
    ...sources.flatMap((source) =>
      dataUses.map((use) => invalidCase(source, use)),
    ),
    {
      name: "the id accessor of a Wrapper subclass",
      code: `${unitImport}declare class Hero extends Unit {}\ndeclare const hero: Hero;\nconst key = hero.id + 1;`,
      errors: [{ messageId: "handleIdAsData", data: { source: "Hero#id" } }],
    },
    {
      name: "an optional chain as a key",
      code: `${unitImport}declare const unit: Unit | undefined;\nconst key = unit?.id;\nconst table: Record<number, boolean> = {};\ntable[key ?? 0] = true;`,
      errors: [{ messageId: "handleIdAsData", data: { source: "Unit#id" } }],
    },
    {
      name: "a sink reached through a user function (not followed)",
      code: `${unitPrelude}function show(value: number): void {\n  print(value);\n}\nshow(unit.id);`,
      errors: [{ messageId: "handleIdAsData", data: { source: "Unit#id" } }],
    },
    {
      name: "R2SW's width is not the formatted value",
      code: "declare const u: unit;\nexport {};\nprint(R2SW(1.5, GetHandleId(u), 2));",
      errors: [
        { messageId: "handleIdAsData", data: { source: "GetHandleId" } },
      ],
    },
    {
      name: "a project function named I2S is not the converter",
      code: "declare const u: unit;\nexport function I2S(value: number): string {\n  return tostring(value);\n}\nprint(I2S(GetHandleId(u)));",
      errors: [
        { messageId: "handleIdAsData", data: { source: "GetHandleId" } },
      ],
    },
    {
      name: "a pure Native other than the string converters is not followed",
      code: "declare const u: unit;\nexport {};\nprint(R2S(I2R(GetHandleId(u)))!);",
      errors: [
        { messageId: "handleIdAsData", data: { source: "GetHandleId" } },
      ],
    },
    {
      name: "a visual allowlist call is not a text sink",
      code: "declare const u: unit;\nexport {};\nSetUnitVertexColor(u, GetHandleId(u), 255, 255, 255);",
      errors: [
        { messageId: "handleIdAsData", data: { source: "GetHandleId" } },
      ],
    },
  ],
});

describe("no-handle-id-as-data through the recommended config", () => {
  it("reports a handle id as a warning", () => {
    expect(
      lintWithRecommended(
        "declare const u: unit;\nexport const key = GetHandleId(u) + 1;",
      ),
    ).toMatchObject([
      {
        ruleId: "reforged/no-handle-id-as-data",
        severity: 1,
        messageId: "handleIdAsData",
      },
    ]);
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    expect(
      lintWithRecommended(
        "declare const u: unit;\n// eslint-disable-next-line reforged/no-handle-id-as-data -- a debug-only counter, never compared across clients\nexport const key = GetHandleId(u) + 1;",
      ),
    ).toEqual([]);
  });
});
