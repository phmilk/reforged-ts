// reforged-map/typescript-plugin (#595): hover and go to definition on a
// Rawcode literal, asked of a real tsserver that loads the packed plugin by
// name, over a Map project whose map folder under maps/ is the one the 3.0
// World Editor saved (test/fixtures/editor-objects.w3m): a Custom unit,
// Footman renamed Militia, a Custom buff and a Custom destructable both at
// `B000`, and the Melee (Forsaken Kingdom) Game data set, which leaves
// Pillage (`Asa2`) out.

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

const RAWCODES = [
  'export const footman = FourCC("hfoo");',
  'export const captain = FourCC("h000");',
  "export const knight = FourCC(`hkni`);",
  'export const shared = FourCC("B000");',
  'export const pillage = FourCC("Asa2");',
  'export const typo = FourCC("h00A");',
  'export const lowercase = FourCC("hpal");',
  'export const nothing = FourCC("~~~~");',
  'export const short = FourCC("hfo");',
  'export const decimalAs = 1751543663 as Rawcode<"unit">;',
  'export const decimalAngle = <Rawcode<"unit">>1751543663;',
  "export const hexAs = 0x68666f6f as Rawcode;",
  "export const hexAngle = <UnknownRawcode>0x68666f6f;",
  'export const bytes = 5 as Rawcode<"unit">;',
  'export const tooLarge = 4294967296 as Rawcode<"unit">;',
  "",
].join("\n");

const LEFT_ALONE = [
  'const name = "hfoo";',
  "export const computed = FourCC(name);",
  "export const templated = (i: number) => FourCC(`h00${String(i)}`);",
  'export const order: string = "stop";',
  "export const plain = 1751543663 as number;",
  'export const zero = 0 as Rawcode<"unit">;',
  "",
].join("\n");

const LOCAL_FOURCC = [
  "function FourCC(id: string): string {",
  "  return id;",
  "}",
  'export const local = FourCC("hfoo");',
  "",
].join("\n");

const FOOTMAN = [
  "**Footman** (`hfoo`), a Built-in unit of Patch 3.0.0, named Militia in this map.",
  "Race: human.",
  "In the Custom (Forsaken Kingdom), Melee (Forsaken Kingdom), Custom (The Frozen Throne), Melee (The Frozen Throne), Custom (Reign of Chaos) and Melee (Reign of Chaos) Game data sets.",
  "Its constant is `Units.Footman_hfoo`, from `reforged-builtins/units`.",
].join("\n\n");

let server: TsServer;
let project: string;
let rawcodes: string;
let leftAlone: string;
let local: string;
/** A project whose generated constants modules are absent. */
let noConstants: string;

beforeAll(async () => {
  const probe = packPlugin();
  const maps = { "editor-objects.w3m": fixtureMap("editor-objects.w3m") };
  project = createPluginProject({
    maps,
    files: {
      "src/rawcodes.ts": RAWCODES,
      "src/left-alone.ts": LEFT_ALONE,
      "src/local.ts": LOCAL_FOURCC,
    },
  });
  rawcodes = path.join(project, "src", "rawcodes.ts");
  leftAlone = path.join(project, "src", "left-alone.ts");
  local = path.join(project, "src", "local.ts");
  const other = createPluginProject({
    maps,
    files: { "src/rawcodes.ts": RAWCODES },
  });
  for (const name of fs.readdirSync(path.join(other, "src", "generated"))) {
    if (name.startsWith("custom-")) {
      fs.rmSync(path.join(other, "src", "generated", name));
    }
  }
  noConstants = path.join(other, "src", "rawcodes.ts");
  server = new TsServer(probe);
  for (const file of [rawcodes, leftAlone, local, noConstants]) {
    await server.open(file);
  }
}, 120_000);

afterAll(() => {
  server.close();
  removeTemporary();
});

/** The plugin's hover text on the literal `needle` of the rawcodes file, hovered on its second character. */
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

describe("hover on a Rawcode literal", () => {
  it("shows a Built-in object the map modifies with the game's name and the map's", async () => {
    expect(await hover('"hfoo"')).toBe(FOOTMAN);
  });

  it("spans the literal, quotes included", async () => {
    const info = await server.quickinfo(
      rawcodes,
      locate(rawcodes, '"hfoo"', 1),
    );
    expect(info?.start).toEqual(locate(rawcodes, '"hfoo"'));
    expect(info?.end).toEqual(locate(rawcodes, '"hfoo"', 6));
  });

  it("shows a Custom object with its base and its constant in the generated module", async () => {
    expect(await hover('"h000"')).toBe(
      [
        "**Captain** (`h000`), a Custom unit of this map, derived from Footman (`hfoo`).",
        "Race: human.",
        "Its constant is `CustomUnits.Captain_h000`, from the generated `custom-units.ts`.",
      ].join("\n\n"),
    );
  });

  it("shows a Built-in object from a template literal without substitutions", async () => {
    expect(await hover("`hkni`")).toBe(
      [
        "**Knight** (`hkni`), a Built-in unit of Patch 3.0.0.",
        "Race: human.",
        "In the Custom (Forsaken Kingdom), Melee (Forsaken Kingdom), Custom (The Frozen Throne), Melee (The Frozen Throne), Custom (Reign of Chaos) and Melee (Reign of Chaos) Game data sets.",
        "Its constant is `Units.Knight_hkni`, from `reforged-builtins/units`.",
      ].join("\n\n"),
    );
  });

  it("shows both objects of a Rawcode two kinds share", async () => {
    expect(await hover('"B000"')).toBe(
      [
        "`B000` names a Custom buff and a Custom destructable, so `FourCC` gives no single kind.",
        "**Holy Fire** (`B000`), a Custom buff of this map, derived from Inner Fire (`Binf`).",
        "Race: human.",
        "Its constant is `CustomBuffs.HolyFire_B000`, from the generated `custom-buffs.ts`.",
        "**Gate** (`B000`), a Custom destructable of this map, derived from Summer Tree Wall (`LTlt`).",
        "Its constant is `CustomDestructables.Gate_B000`, from the generated `custom-destructables.ts`.",
      ].join("\n\n"),
    );
  });

  it("shows a Built-in object outside the map's Game data set, with the lint rule's sentence", async () => {
    expect(await hover('"Asa2"')).toBe(
      [
        "**Pillage** (`Asa2`), a Built-in ability of Patch 3.0.0.",
        "Race: orc.",
        "In the Custom (The Frozen Throne) Game data set.",
        "Its constant is `Abilities.Pillage_Asa2`, from `reforged-builtins/abilities`.",
        "`Asa2` (Pillage) is a Built-in ability of Patch 3.0.0 but not of this map's Game data set (Melee (Forsaken Kingdom)).",
      ].join("\n\n"),
    );
  });

  it("shows an unknown Rawcode with the lint rule's sentence and the Rawcodes one edit away", async () => {
    expect(await hover('"h00A"')).toBe(
      [
        "`h00A` is neither a Built-in object of Patch 3.0.0 nor an object of this map.",
        "One edit away:\n- `h000` (Captain, unit)\n- `h001` (Chevalier Élu, unit)",
      ].join("\n\n"),
    );
  });

  it("suggests a change of case first", async () => {
    expect(await hover('"hpal"')).toMatch(
      /^`hpal` is neither .*\n\nOne edit away:\n- `Hpal` \(Paladin, unit\)/,
    );
  });

  it("shows an unknown Rawcode with nothing one edit away without a list", async () => {
    expect(await hover('"~~~~"')).toBe(
      "`~~~~` is neither a Built-in object of Patch 3.0.0 nor an object of this map.",
    );
  });

  it("shows a malformed literal with the lint rule's sentence", async () => {
    expect(await hover('"hfo"')).toBe(
      "`hfo` is not a Rawcode: a Rawcode is exactly four ASCII characters.",
    );
  });

  it.each([
    ["a decimal number under as", "1751543663 as", "`1751543663`"],
    [
      "a decimal number under an angle-bracket assertion",
      ">1751543663",
      "`1751543663`",
    ],
    ["a hex number under as", "0x68666f6f as", "`0x68666f6f` (1751543663)"],
    [
      "a hex number under an angle-bracket assertion",
      ">0x68666f6f",
      "`0x68666f6f` (1751543663)",
    ],
  ])("shows %s with the Rawcode it decodes to", async (_, needle, number) => {
    const at = needle.startsWith(">") ? 2 : 1;
    const info = await server.quickinfo(rawcodes, locate(rawcodes, needle, at));
    expect(info?.documentation).toBe(
      `${number} is the Rawcode \`hfoo\`.\n\n${FOOTMAN}`,
    );
  });

  it("shows a cast number whose bytes are not a Rawcode with its bytes", async () => {
    expect(await hover("5 as", rawcodes)).toBeUndefined();
    const info = await server.quickinfo(rawcodes, locate(rawcodes, "5 as"));
    expect(info?.documentation).toBe(
      "`5` is not a Rawcode: its four bytes, 00 00 00 05, are not four ASCII characters.",
    );
  });

  it("shows a cast number larger than four bytes", async () => {
    expect(await hover("4294967296")).toBe(
      "`4294967296` is not a Rawcode: it does not fit in four bytes.",
    );
  });
});

describe("what the plugin leaves alone", () => {
  it.each([
    ["a computed FourCC argument", "FourCC(name)", 8],
    ["a template literal with a substitution", "`h00${", 2],
    ["a string that is not a FourCC argument", '"stop"', 1],
    ["a number cast to number", "1751543663 as number", 1],
    ["0 cast to a Rawcode", "0 as", 0],
  ])("gives %s TypeScript's own quick info", async (_, needle, at) => {
    const info = await server.quickinfo(
      leftAlone,
      locate(leftAlone, needle, at),
    );
    expect(info?.documentation ?? "").not.toMatch(/Rawcode|Patch/);
  });

  it("gives a local function named FourCC TypeScript's own quick info", async () => {
    const info = await server.quickinfo(local, locate(local, '"hfoo"', 1));
    expect(info?.documentation ?? "").toBe("");
  });

  it("leaves the quick info of the identifier FourCC as TypeScript gives it", async () => {
    const info = await server.quickinfo(
      rawcodes,
      locate(rawcodes, 'FourCC("hfoo")', 1),
    );
    expect(info?.displayString).toMatch(
      /^function FourCC\(id: "hfoo"\): Rawcode<"unit">/,
    );
    expect(info?.documentation).toBe(
      "Footman (`hfoo`), a Built-in unit of Patch 3.0.0, named Militia in this map.\n\nIts constant is `Units.Footman_hfoo`, from `reforged-builtins/units`.",
    );
  });

  it("keeps every other request answering", async () => {
    const info = await server.quickinfo(
      rawcodes,
      locate(rawcodes, "footman", 1),
    );
    expect(info?.displayString).toBe('const footman: Rawcode<"unit">');
    const diagnostics = await server.request("semanticDiagnosticsSync", {
      file: rawcodes,
    });
    expect(diagnostics).toEqual([]);
  });
});

describe("go to definition on a Rawcode literal", () => {
  it.each([
    [
      "a Built-in object to its constant in reforged-builtins",
      "`hkni`",
      ["units.d.ts: Knight_hkni"],
    ],
    [
      "a Custom object to its constant in the generated module",
      '"h000"',
      ["custom-units.ts: Captain_h000"],
    ],
    [
      "a modified Built-in object to the package's constant",
      '"hfoo"',
      ["units.d.ts: Footman_hfoo"],
    ],
    [
      "a shared Rawcode to both constants",
      '"B000"',
      ["custom-buffs.ts: HolyFire_B000", "custom-destructables.ts: Gate_B000"],
    ],
    [
      "a cast number to its object's constant",
      "1751543663 as",
      ["units.d.ts: Footman_hfoo"],
    ],
    ["an unknown Rawcode to nothing", '"h00A"', []],
  ])("goes from %s", async (_, needle, expected) => {
    const at = locate(rawcodes, needle, 1);
    const definitions = await server.definition(rawcodes, at);
    expect(definitions.map(spanText)).toEqual(expected);
    const bound = await server.definitionAndBoundSpan(rawcodes, at);
    expect(bound.definitions.map(spanText)).toEqual(expected);
    if (expected.length > 0) {
      expect(bound.textSpan.start).toEqual(locate(rawcodes, needle));
    }
  });

  it("goes to the object's FourCC overload when the constants module is absent", async () => {
    const at = locate(noConstants, '"h000"', 1);
    const definitions = await server.definition(noConstants, at);
    expect(definitions.map(spanText)).toEqual(["map-objects.d.ts: FourCC"]);
    expect(definitions[0]?.start.line).toBe(
      locate(definitions[0]?.file ?? "", 'FourCC(id: "h000")').line,
    );
  });

  it("goes to nothing for a shared Rawcode without constants, which has no overload", async () => {
    const definitions = await server.definition(
      noConstants,
      locate(noConstants, '"B000"', 1),
    );
    expect(definitions).toEqual([]);
  });
});

describe("the tsserver log", () => {
  it("says once that the plugin loaded, with the project root and the map folder", () => {
    const loaded = server
      .pluginLog()
      .filter((line) =>
        line.startsWith(`loaded for the project root ${project},`),
      );
    expect(loaded).toEqual([
      `loaded for the project root ${project}, map folder ${path.join(project, "maps", "editor-objects.w3m")}.`,
    ]);
  });
});
