import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  DECLARATIONS_FILE,
  LUA_STUB_FILE,
  generateEditorGlobals,
  type EditorGlobalsOutput,
} from "../src/index.js";
import { readWtgVariables, WtgFormatError } from "../src/war3map-wtg.js";
import {
  fixtureMap,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";
import { buildWtg, type TestVariable } from "./support/wtg.js";

afterAll(removeTemporary);

const FALLBACK =
  "object-type variables (unit-type, ability, item-type...) are declared as war3map.lua types them.";

/** The generated file of that name. */
function contents(output: EditorGlobalsOutput, name: string): string {
  const file = output.files.find((candidate) => candidate.name === name);
  if (file === undefined) throw new Error(`no ${name} generated`);
  return file.contents;
}

/** The `declare let` lines of the declarations, as name to type. */
function declaredTypes(output: EditorGlobalsOutput): Record<string, string> {
  return Object.fromEntries(
    contents(output, DECLARATIONS_FILE)
      .split("\n")
      .flatMap((line) => {
        const match = /^declare let (\w+): (.*);$/.exec(line);
        return match ? [[match[1], match[2]]] : [];
      }),
  );
}

/** The output of a map folder holding this war3map.lua and, unless undefined, this war3map.wtg. */
function generate(
  script: readonly string[],
  wtg: Uint8Array | undefined,
): EditorGlobalsOutput {
  return generateEditorGlobals(
    mapFolder({
      "war3map.lua": script.join("\r\n"),
      ...(wtg === undefined ? {} : { "war3map.wtg": wtg }),
    }),
  );
}

/** Each Variable Editor type and the type it declares. */
const TABLE: readonly (readonly [string, string])[] = [
  ["unitcode", 'Rawcode<"unit">'],
  ["itemcode", 'Rawcode<"item">'],
  ["abilcode", 'Rawcode<"ability">'],
  ["buffcode", 'Rawcode<"buff">'],
  ["destructablecode", 'Rawcode<"destructable">'],
  ["techcode", 'Rawcode<"unit" | "upgrade">'],
  ["ordercode", "number"],
];

/** One scalar and one array variable per Variable Editor type of the table. */
const TABLE_VARIABLES: TestVariable[] = TABLE.flatMap(([type]) => [
  { name: `S_${type}`, type },
  { name: `A_${type}`, type, arraySize: 4 },
]);

/** What the 3.0 World Editor writes in the header for them. */
const EDITOR_SCRIPT = TABLE.flatMap(([type]) => [
  `udg_S_${type} = 0`,
  `udg_A_${type} = __jarray(0)`,
]);

/** What HiveWE `main` writes in the header for them (phmilk/reforged-ts-template#65). */
const HIVEWE_SCRIPT = TABLE.flatMap(([type]) => [
  `udg_S_${type} = nil`,
  `udg_A_${type} = __jarray("")`,
]);

const EXPECTED = Object.fromEntries(
  TABLE.flatMap(([type, declared]) => [
    [`udg_S_${type}`, declared],
    [`udg_A_${type}`, `Record<number, ${declared}>`],
  ]),
);

describe("udg_ variables typed by Object kind from war3map.wtg", () => {
  it("declares every Variable Editor object type, scalar and array, as its Object kind", () => {
    const output = generate(EDITOR_SCRIPT, buildWtg(TABLE_VARIABLES));
    expect(declaredTypes(output)).toEqual(EXPECTED);
    expect(output.warnings).toEqual([]);
  });

  it('types them by kind from a HiveWE-shaped war3map.lua, nil and __jarray("") included', () => {
    const output = generate(HIVEWE_SCRIPT, buildWtg(TABLE_VARIABLES));
    expect(declaredTypes(output)).toEqual(EXPECTED);
    expect(output.warnings).toEqual([]);
  });

  it("keeps the stub: each variable set to its header literal", () => {
    const stub = contents(
      generate(
        ["udg_S_unitcode = 0", 'udg_A_unitcode = __jarray("")'],
        buildWtg([
          { name: "S_unitcode", type: "unitcode" },
          { name: "A_unitcode", type: "unitcode", arraySize: 2 },
        ]),
      ),
      LUA_STUB_FILE,
    );
    expect(stub).toContain("\nudg_S_unitcode = 0\n");
    expect(stub).toContain('\nudg_A_unitcode = __jarray("")\n');
  });

  it("keeps an integer and an ordercode variable a number", () => {
    const output = generate(
      ["udg_Count = 0", "udg_Order = 0", "udg_Orders = __jarray(0)"],
      buildWtg([
        { name: "Count", type: "integer" },
        { name: "Order", type: "ordercode" },
        { name: "Orders", type: "ordercode", arraySize: 3 },
      ]),
    );
    expect(declaredTypes(output)).toEqual({
      udg_Count: "number",
      udg_Order: "number",
      udg_Orders: "Record<number, number>",
    });
  });

  it("keeps the war3map.lua type of every other Variable Editor type", () => {
    const output = generate(
      [
        "udg_Group = nil",
        'udg_Name = ""',
        "function InitGlobals()",
        "udg_Group = CreateGroup()",
        "end",
      ],
      buildWtg([
        { name: "Group", type: "group" },
        { name: "Name", type: "string" },
      ]),
    );
    expect(declaredTypes(output)).toEqual({
      udg_Group: "NonNullable<ReturnType<typeof CreateGroup>>",
      udg_Name: "string",
    });
  });

  it("ignores a wtg variable absent from war3map.lua, and keeps the type of a udg_ global absent from the wtg", () => {
    const output = generate(
      ["udg_Spawn = 0", "udg_Score = 0", "gg_rct_Spawn = nil"],
      buildWtg([
        { name: "Spawn", type: "unitcode" },
        { name: "Ghost", type: "unitcode" },
        { name: "rct_Spawn", type: "unitcode" },
      ]),
    );
    expect(declaredTypes(output)).toEqual({
      udg_Spawn: 'Rawcode<"unit">',
      udg_Score: "number",
      gg_rct_Spawn: "rect",
    });
    expect(output.warnings).toEqual([]);
  });
});

describe("war3map.wtg warnings and fallbacks", () => {
  const script = ["udg_Spawn = 0", 'udg_Spawns = __jarray("")'];
  const variables: TestVariable[] = [
    { name: "Spawn", type: "unitcode" },
    { name: "Spawns", type: "unitcode", arraySize: 2 },
  ];
  /** war3map.lua's types, the fallback. */
  const fallback = {
    udg_Spawn: "number",
    udg_Spawns: "Record<number, string>",
  };

  it("warns on a missing war3map.wtg; war3map.lua types the variables", () => {
    const output = generate(script, undefined);
    expect(declaredTypes(output)).toEqual(fallback);
    expect(output.warnings).toEqual([`war3map.wtg not found: ${FALLBACK}`]);
  });

  it("warns on a truncated war3map.wtg, wherever it ends", () => {
    const whole = buildWtg(variables);
    for (const length of [0, 3, 10, 40, 92, 100, whole.length - 5]) {
      const output = generate(script, whole.subarray(0, length));
      expect(declaredTypes(output)).toEqual(fallback);
      expect(output.warnings).toEqual([
        `war3map.wtg not read (truncated): ${FALLBACK}`,
      ]);
    }
  });

  it("warns on an unknown format version", () => {
    expect(
      generate(script, buildWtg(variables, { format: 0x80000005 })).warnings,
    ).toEqual([
      `war3map.wtg not read (unknown format version 0x80000005): ${FALLBACK}`,
    ]);
    expect(
      generate(script, buildWtg(variables, { subVersion: 4 })).warnings,
    ).toEqual([
      `war3map.wtg not read (unknown format version 0x80000004, sub-version 4): ${FALLBACK}`,
    ]);
    expect(
      generate(script, buildWtg(variables, { magic: "WTX!" })).warnings,
    ).toEqual([`war3map.wtg not read (not a triggers file): ${FALLBACK}`]);
  });

  it("warns on the pre-1.31 format of wc3libs' fixture, the unknown format version 7", () => {
    const output = generate(
      script,
      fs.readFileSync(path.join(fixtureMap("wc3libs"), "war3map.wtg")),
    );
    expect(declaredTypes(output)).toEqual(fallback);
    expect(output.warnings).toEqual([
      `war3map.wtg not read (unknown format version 0x00000007): ${FALLBACK}`,
    ]);
  });

  it("warns on a variable the two files disagree is an array; it keeps war3map.lua's type", () => {
    const output = generate(
      ["udg_Spawn = 0", 'udg_Spawns = __jarray("")', "udg_Kept = 0"],
      buildWtg([
        { name: "Spawn", type: "unitcode", arraySize: 2 },
        { name: "Spawns", type: "unitcode" },
        { name: "Kept", type: "abilcode" },
      ]),
    );
    expect(declaredTypes(output)).toEqual({
      ...fallback,
      udg_Kept: 'Rawcode<"ability">',
    });
    expect(output.warnings).toEqual([
      "udg_Spawn: war3map.wtg declares it an array, war3map.lua not an array; declared as war3map.lua types it.",
      "udg_Spawns: war3map.wtg declares it not an array, war3map.lua an array; declared as war3map.lua types it.",
    ]);
  });
});

describe("readWtgVariables", () => {
  it("reads each variable's name, type, array flag and size", () => {
    expect(
      readWtgVariables(
        buildWtg([
          { name: "Spawn", type: "unitcode" },
          { name: "Spells", type: "abilcode", arraySize: 12 },
          { name: "Épée", type: "itemcode" },
        ]),
      ),
    ).toEqual([
      { name: "Spawn", type: "unitcode", array: false, arraySize: 1 },
      { name: "Spells", type: "abilcode", array: true, arraySize: 12 },
      { name: "Épée", type: "itemcode", array: false, arraySize: 1 },
    ]);
  });

  it.each([
    "war3map_v3.wtg",
    "war3map_v3_filled.wtg",
    "war3map_v3_hierarchy.wtg",
  ])("reads wc3libs' 1.31+ fixture %s: no variable", (name) => {
    expect(
      readWtgVariables(fs.readFileSync(path.join(fixtureMap("wc3libs"), name))),
    ).toEqual([]);
  });

  it("reads the blank map's war3map.wtg, saved by the 3.0 World Editor: no variable", () => {
    expect(
      readWtgVariables(
        fs.readFileSync(path.join(fixtureMap("blank-map.w3m"), "war3map.wtg")),
      ),
    ).toEqual([]);
  });

  it("throws a WtgFormatError on a file it cannot read", () => {
    expect(() => readWtgVariables(new Uint8Array(2))).toThrow(
      new WtgFormatError("truncated"),
    );
    expect(new WtgFormatError("x").name).toBe("WtgFormatError");
  });
});
