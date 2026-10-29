// reforged-map/typescript-plugin over Object definitions (#708): the hover
// of a Rawcode a definition defines names the definition's file, go to
// definition offers that file after the constant, at the definition's
// Rawcode literal or else at the file's start, and a definition that throws
// makes Rawcode details unavailable instead of calling its objects unknown
// (#595). One real tsserver over Map projects whose map folder under maps/
// is the one the 3.0 World Editor saved (test/fixtures/editor-objects.w3m).

import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fixtureMap, removeTemporary } from "./support/map-folder.js";
import {
  TsServer,
  createPluginProject,
  locate,
  packPlugin,
  type FileSpan,
} from "./support/tsserver.js";

const IMPORT = 'import { defineUnit } from "reforged-map/objects";\n\n';

const UNITS =
  IMPORT +
  [
    'export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: "Sergeant" } });',
    'export const Knight = defineUnit({ rawcode: "hkni", fields: { unam: "Paladin Knight" } });',
    "",
  ].join("\n");

/** A definition whose Rawcode is computed, so that no literal in its file holds it. */
const TIERS =
  IMPORT +
  [
    "const tier = (n: number): string => `h00${String(n)}`;",
    'export const Corporal = defineUnit({ rawcode: tier(3), base: FourCC("hfoo"), fields: { unam: "Corporal" } });',
    "",
  ].join("\n");

const RAWCODES = [
  'export const sergeant = FourCC("h002");',
  'export const knight = FourCC("hkni");',
  'export const corporal = FourCC("h003");',
  'export const captain = FourCC("h000");',
  "",
].join("\n");

const SERGEANT_HOVER = [
  "**Sergeant** (`h002`), a Custom unit of this map, derived from Footman (`hfoo`).",
  "Defined in code, by the Object definition in `src/objects/units.ts`.",
];

/** The time after which the plugin looks again: the lookup's one second, and a margin. */
const AFTER_INTERVAL = 1200;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let server: TsServer;
let defined: string;
let rawcodes: string;
let throwing: string;
let throwingRawcodes: string;

// Measured 4.9 s with pnpm test on Linux (WSL 2, 8 threads), 2026-10: the
// windows leg's report carries no hook duration.
beforeAll(async () => {
  const probe = packPlugin();
  const maps = { "editor-objects.w3m": fixtureMap("editor-objects.w3m") };
  defined = createPluginProject({
    maps,
    withDefinitions: true,
    files: {
      "src/objects/units.ts": UNITS,
      "src/objects/tiers.ts": TIERS,
      "src/rawcodes.ts": RAWCODES,
    },
  });
  rawcodes = path.join(defined, "src", "rawcodes.ts");
  throwing = createPluginProject({
    maps,
    files: {
      "src/objects/units.ts": UNITS,
      "src/objects/broken.ts": 'throw new Error("no tiers");\n',
      "src/rawcodes.ts": RAWCODES,
    },
  });
  throwingRawcodes = path.join(throwing, "src", "rawcodes.ts");
  server = new TsServer(probe);
  for (const file of [rawcodes, throwingRawcodes]) await server.open(file);
}, 30_000);

afterAll(() => {
  server.close();
  removeTemporary();
});

/** The plugin's hover text on the literal `needle` of a rawcodes file, hovered on its second character. */
async function hover(
  needle: string,
  file = rawcodes,
): Promise<string | undefined> {
  return (await server.quickinfo(file, locate(file, needle, 1)))?.documentation;
}

/** The text a span covers, with its file's name. */
function spanText(span: FileSpan): string {
  const lines = fs.readFileSync(span.file, "utf8").split("\n");
  const line = lines[span.start.line - 1] ?? "";
  return `${path.basename(span.file)}: ${line.slice(span.start.offset - 1, span.end.offset - 1)}`;
}

describe("hover on a Rawcode an Object definition defines", () => {
  it("names the definition's file of a Custom object", async () => {
    expect(await hover('"h002"')).toBe(
      [
        ...SERGEANT_HOVER,
        "Race: human.",
        "Its constant is `CustomUnits.Sergeant_h002`, from the generated `custom-units.ts`.",
      ].join("\n\n"),
    );
  });

  it("names the definition's file of a Built-in object it modifies", async () => {
    expect(await hover('"hkni"')).toBe(
      [
        "**Knight** (`hkni`), a Built-in unit of Patch 3.0.1, named Paladin Knight in this map.",
        "Defined in code, by the Object definition in `src/objects/units.ts`.",
        "Race: human.",
        "In the Custom (Forsaken Kingdom), Melee (Forsaken Kingdom), Custom (The Frozen Throne), Melee (The Frozen Throne), Custom (Reign of Chaos) and Melee (Reign of Chaos) Game data sets.",
        "Its constant is `Units.Knight_hkni`, from `reforged-builtins/units`.",
      ].join("\n\n"),
    );
  });

  it("names no file for an object of the map folder", async () => {
    expect(await hover('"h000"')).not.toContain("Defined in code");
  });
});

describe("go to definition on a Rawcode an Object definition defines", () => {
  it.each([
    [
      "a Custom object to its constant, then its definition's Rawcode literal",
      '"h002"',
      ["custom-units.ts: Sergeant_h002", 'units.ts: "h002"'],
    ],
    [
      "a modified Built-in object to the package's constant, then its definition's Rawcode literal",
      '"hkni"',
      ["units.d.ts: Knight_hkni", 'units.ts: "hkni"'],
    ],
  ])("goes from %s", async (_, needle, expected) => {
    const at = locate(rawcodes, needle, 1);
    const definitions = await server.definition(rawcodes, at);
    expect(definitions.map(spanText)).toEqual(expected);
    const bound = await server.definitionAndBoundSpan(rawcodes, at);
    expect(bound.definitions.map(spanText)).toEqual(expected);
    expect(bound.textSpan.start).toEqual(locate(rawcodes, needle));
  });

  it("goes to the definition file's start when no literal in it holds the Rawcode", async () => {
    const definitions = await server.definition(
      rawcodes,
      locate(rawcodes, '"h003"', 1),
    );
    expect(definitions.map(spanText)).toEqual([
      "custom-units.ts: Corporal_h003",
      "tiers.ts: ",
    ]);
    expect(definitions[1]?.start).toEqual({ line: 1, offset: 1 });
  });
});

describe("a definition that throws", () => {
  // Measured 1.4 s with pnpm test on the windows CI leg of #815, 1.4 s on Linux
  // (WSL 2, 8 threads), 2026-10.
  it("makes the hover unavailable, naming its file, never unknown, and resumes once it is fixed", async () => {
    const unavailable =
      /^Rawcode details are unavailable: The Object definitions could not be loaded: .*src\/objects\/broken\.ts[^\n]*$/;
    // A defined object, and one of the map folder.
    expect(await hover('"h002"', throwingRawcodes)).toMatch(unavailable);
    expect(await hover('"h000"', throwingRawcodes)).toMatch(unavailable);
    expect(
      await server.definition(
        throwingRawcodes,
        locate(throwingRawcodes, '"h002"', 1),
      ),
    ).toEqual([]);
    expect(
      server
        .pluginLog()
        .filter((line) =>
          line.startsWith("The Object definitions could not be loaded: "),
        ),
    ).toHaveLength(1);

    fs.writeFileSync(
      path.join(throwing, "src", "objects", "broken.ts"),
      "export {};\n",
    );
    await wait(AFTER_INTERVAL);
    expect(await hover('"h002"', throwingRawcodes)).toMatch(
      SERGEANT_HOVER.join("\n\n"),
    );
  }, 15_000);
});
