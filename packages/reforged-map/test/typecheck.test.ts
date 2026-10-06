// The generated declarations in a Map project: the object-type variables of
// war3map.wtg type-checked against the workspace's reforged-types and
// reforged-ts, the fixtures under test/fixtures/map-project.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DECLARATIONS_FILE,
  generateEditorGlobals,
  type EditorGlobalsOutput,
} from "../src/index.js";
import { mapFolder, removeTemporary } from "./support/map-folder.js";
import {
  FIXTURE_DECLARATIONS,
  createMapProject,
  readFixture,
  typecheck,
} from "./support/map-project.js";
import { buildWtg } from "./support/wtg.js";

afterAll(removeTemporary);

/** The map folder of the fixtures: war3map.lua as HiveWE and the 3.0 editor write it, and its war3map.wtg. */
function generate(): EditorGlobalsOutput {
  return generateEditorGlobals(
    mapFolder({
      "war3map.lua": [
        "udg_SpawnType = 0",
        "udg_Tech = nil",
        'udg_Loot = __jarray("")',
        "udg_Order = 0",
        "function InitGlobals()",
        "end",
      ].join("\r\n"),
      "war3map.wtg": buildWtg([
        { name: "SpawnType", type: "unitcode" },
        { name: "Tech", type: "techcode" },
        { name: "Loot", type: "itemcode", arraySize: 8 },
        { name: "Order", type: "ordercode" },
      ]),
    }),
  );
}

/** The `declare let` lines of a declarations file. */
const declarations = (text: string): string[] =>
  text.split(/\r?\n/).filter((line) => line.startsWith("declare let "));

describe("the generated declarations in a Map project", () => {
  let output: EditorGlobalsOutput;
  let diagnostics: string[];

  beforeAll(() => {
    output = generate();
    diagnostics = typecheck(createMapProject(output.files));
  }, 60_000);

  it("declare what the fixtures' editor-globals.d.ts declares", () => {
    const generated = output.files.find((f) => f.name === DECLARATIONS_FILE);
    expect(output.warnings).toEqual([]);
    expect(declarations(generated?.contents ?? "")).toEqual(
      declarations(readFixture(FIXTURE_DECLARATIONS)),
    );
  });

  it("type-check the object-type variables into the Natives and the library, with no cast", () => {
    expect(
      diagnostics.filter((d) => d.startsWith("src/object-variables.ts")),
    ).toEqual([]);
  });

  it("reports exactly the negative fixtures' errors, by code and line", () => {
    expect(diagnostics).toEqual([
      // A plain number is not a unit's Rawcode.
      "src/number-into-unit-type.ts:3 TS2322",
      // A unit-or-upgrade Rawcode is not a unit's.
      "src/tech-into-unit.ts:3 TS2345",
      // A unit's Rawcode is not an ability's.
      "src/unit-type-into-ability.ts:3 TS2345",
    ]);
  });
});
