// Object definitions in the build (#703): a temporary Map project, a copy of
// the World Editor's map folder fixture plus src/objects/ written by the
// test, merged into a staged copy of the map folder, read back through the
// Object data editor. The map folder itself is never written.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  ObjectDefinitionsError,
  mergeObjectDefinitions,
  openObjectData,
  type ObjectDataObject,
  type ObjectDefinitionsErrorReason,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  removeTemporary,
} from "./support/map-folder.js";

afterAll(removeTemporary);

/** The fixture the Map projects copy: a Custom object and a changed Built-in object of each kind, as the World Editor saved them. */
const FIXTURE = "editor-objects.w3m";

interface MapProject {
  readonly root: string;
  readonly mapFolder: string;
  readonly staged: string;
}

interface MapProjectOptions {
  /** Whether the Map project installs typescript. */
  readonly typescript?: boolean;
  /** Whether it installs reforged-builtins, or the folder of a stand-in. */
  readonly builtins?: boolean | string;
}

/** Links `node_modules/<name>` of `root` to `target`. */
function link(root: string, name: string, target: string): void {
  const linkPath = path.join(root, "node_modules", name);
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(fs.realpathSync(target), linkPath, "junction");
}

/**
 * A Map project in a temporary folder: a copy of the fixture as its map
 * folder, a second copy as the build's staged copy, `files` under its root,
 * and typescript and reforged-builtins linked from this package's
 * installation.
 */
function mapProject(
  files: Readonly<Record<string, string>>,
  { typescript = true, builtins = true }: MapProjectOptions = {},
): MapProject {
  const root = makeTempDir();
  const mapFolder = path.join(root, "test.w3m");
  const staged = path.join(root, "dist", "test.w3m");
  fs.cpSync(fixtureMap(FIXTURE), mapFolder, { recursive: true });
  fs.cpSync(fixtureMap(FIXTURE), staged, { recursive: true });
  fs.writeFileSync(path.join(root, "package.json"), '{ "private": true }\n');
  if (typescript) {
    link(
      root,
      "typescript",
      path.join(PACKAGE_ROOT, "node_modules", "typescript"),
    );
  }
  if (builtins !== false) {
    link(
      root,
      "reforged-builtins",
      builtins === true
        ? path.join(PACKAGE_ROOT, "node_modules", "reforged-builtins")
        : builtins,
    );
  }
  for (const [name, contents] of Object.entries(files)) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  }
  return { root, mapFolder, staged };
}

/** Every file of a folder, by relative path, with the SHA-256 of its bytes. */
function snapshot(folder: string): Map<string, string> {
  return new Map(
    (fs.readdirSync(folder, { recursive: true }) as string[])
      .filter((name) => fs.statSync(path.join(folder, name)).isFile())
      .sort()
      .map((name) => [
        name,
        createHash("sha256")
          .update(fs.readFileSync(path.join(folder, name)))
          .digest("hex"),
      ]),
  );
}

/** The object of a kind and Rawcode in a map folder, read back through the Object data editor. */
function objectOf(
  folder: string,
  kind: ObjectDataObject["kind"],
  rawcode: string,
): ObjectDataObject | undefined {
  return openObjectData(folder, { projectRoot: PACKAGE_ROOT })
    .objects(kind)
    .find((object) => object.rawcode === rawcode);
}

/** An object's modifications as `field[@level] = value`, in file order. */
function modifications(object: ObjectDataObject | undefined): string[] {
  return (object?.modifications ?? []).map(
    ({ field, level, value }) =>
      `${field}${level === undefined || level === 0 ? "" : `@${String(level)}`} = ${typeof value === "number" ? String(Math.round(value * 1000) / 1000) : JSON.stringify(value)}`,
  );
}

/** The error the merge throws, expected an ObjectDefinitionsError of `reason`. */
function mergeError(
  project: MapProject,
  reason: ObjectDefinitionsErrorReason,
): ObjectDefinitionsError {
  let thrown: unknown;
  try {
    mergeObjectDefinitions(project.staged, project.root);
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ObjectDefinitionsError);
  const error = thrown as ObjectDefinitionsError;
  expect(error.reason, error.message).toBe(reason);
  return error;
}

const IMPORT = `import { defineAbility, defineBuff, defineDestructable, defineDoodad, defineItem, defineUnit, defineUpgrade, localized } from "reforged-map/objects";\n`;

describe("mergeObjectDefinitions", () => {
  it("adds a Custom object of each kind and a change to a Built-in object to the staged copy, and never writes the map folder", () => {
    const project = mapProject({
      "src/objects/units.ts":
        IMPORT +
        `export const Sergeant = defineUnit({
  rawcode: "h002",
  base: FourCC("hfoo"),
  fields: { unam: "Sergeant", umvs: 320, uhpm: 420, ua1t: "pierce", uabi: [FourCC("AHbz"), FourCC("A001")], ucs2: "" },
});
export const Knight = defineUnit({ rawcode: "hkni", fields: { uhpm: 900 } });
`,
      "src/objects/items.ts":
        IMPORT +
        `export const Blade = defineItem({ rawcode: "I001", base: FourCC("ratc"), fields: { unam: localized("Blade"), igol: 100 } });\n`,
      "src/objects/abilities.ts":
        IMPORT +
        `export const Storm = defineAbility({
  rawcode: "A001",
  base: FourCC("AHbz"),
  fields: { anam: "Storm", Hbz1: { 1: 3, 2: 4 }, amcs: { 1: 90 }, aher: false, abuf: { 1: [FourCC("B001")] } },
});
`,
      "src/objects/effects.ts":
        IMPORT +
        `export const Holy = defineBuff({ rawcode: "B001", base: FourCC("Binf"), fields: { ftip: "Holy" } });
export const Wall = defineDestructable({ rawcode: "B001", base: FourCC("LTlt"), fields: { bnam: "Wall", bhps: 80.5 } });
export const Pillar = defineDoodad({ rawcode: "D001", base: FourCC("AOks"), fields: { dnam: "Pillar", dvr1: { 0: 10 } } });
export const Sharper = defineUpgrade({ rawcode: "R001", base: FourCC("Rhme"), fields: { gnam: { 1: "Sharpest" }, gglb: 50 } });
`,
    });
    const before = snapshot(project.mapFolder);

    const result = mergeObjectDefinitions(project.staged, project.root);

    expect(snapshot(project.mapFolder)).toEqual(before);
    expect(
      result.objects.map(({ kind, rawcode, base, file }) => [
        kind,
        rawcode,
        base,
        path.relative(project.root, file).split(path.sep).join("/"),
      ]),
    ).toEqual([
      ["unit", "h002", "hfoo", "src/objects/units.ts"],
      ["unit", "hkni", undefined, "src/objects/units.ts"],
      ["item", "I001", "ratc", "src/objects/items.ts"],
      ["ability", "A001", "AHbz", "src/objects/abilities.ts"],
      ["buff", "B001", "Binf", "src/objects/effects.ts"],
      ["destructable", "B001", "LTlt", "src/objects/effects.ts"],
      ["doodad", "D001", "AOks", "src/objects/effects.ts"],
      ["upgrade", "R001", "Rhme", "src/objects/effects.ts"],
    ]);
    expect(result.warnings).toEqual([]);

    const unit = objectOf(project.staged, "unit", "h002");
    expect(unit?.base).toBe("hfoo");
    expect(unit?.name).toBe("Sergeant");
    expect(modifications(unit).sort()).toEqual(
      [
        'ua1t = "pierce"',
        'uabi = "AHbz,A001"',
        'ucs2 = ""',
        "uhpm = 420",
        "umvs = 320",
        'unam = "Sergeant"',
      ].sort(),
    );
    expect(modifications(objectOf(project.staged, "unit", "hkni"))).toEqual([
      "uhpm = 900",
    ]);
    expect(
      modifications(objectOf(project.staged, "item", "I001")).sort(),
    ).toEqual(["igol = 100", 'unam = "Blade"']);
    expect(
      modifications(objectOf(project.staged, "ability", "A001")).sort(),
    ).toEqual(
      [
        'abuf@1 = "B001"',
        "aher = 0",
        "amcs@1 = 90",
        'anam = "Storm"',
        "Hbz1@1 = 3",
        "Hbz1@2 = 4",
      ].sort(),
    );
    expect(modifications(objectOf(project.staged, "buff", "B001"))).toEqual([
      'ftip = "Holy"',
    ]);
    expect(
      modifications(objectOf(project.staged, "destructable", "B001")).sort(),
    ).toEqual(["bhps = 80.5", 'bnam = "Wall"']);
    expect(
      modifications(objectOf(project.staged, "doodad", "D001")).sort(),
    ).toEqual(['dnam = "Pillar"', "dvr1 = 10"]);
    expect(
      modifications(objectOf(project.staged, "upgrade", "R001")).sort(),
    ).toEqual(["gglb = 50", 'gnam@1 = "Sharpest"']);
    // The map folder's own objects are still there.
    expect(objectOf(project.staged, "unit", "h000")?.name).toBe("Captain");
  });

  it("keeps a value equal to the base's as a modification", () => {
    const project = mapProject({
      "src/objects/units.ts":
        IMPORT +
        `export const Twin = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { uhpm: 420, umvs: 270 } });\n`,
    });

    mergeObjectDefinitions(project.staged, project.root);

    expect(
      modifications(objectOf(project.staged, "unit", "h002")).sort(),
    ).toEqual(["uhpm = 420", "umvs = 270"]);
  });

  it("sets a field the field table does not know through the raw escape", () => {
    const project = mapProject({
      "src/objects/abilities.ts":
        IMPORT +
        `export const Storm = defineAbility({ rawcode: "A001", base: FourCC("AHbz"), raw: [{ field: "Xzz1", type: "int", level: 2, dataPointer: 1, value: 7 }] });\n`,
    });

    mergeObjectDefinitions(project.staged, project.root);

    const ability = objectOf(project.staged, "ability", "A001");
    expect(ability?.modifications).toEqual([
      expect.objectContaining({
        field: "Xzz1",
        type: "int",
        level: 2,
        dataPointer: 1,
        value: 7,
      }),
    ]);
  });

  it("warns of the translations of a localized value it does not write yet", () => {
    const project = mapProject({
      "src/objects/units.ts":
        IMPORT +
        `export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: localized("Sergeant", { deDE: "Feldwebel" }) } });\n`,
    });

    const { warnings } = mergeObjectDefinitions(project.staged, project.root);

    expect(objectOf(project.staged, "unit", "h002")?.name).toBe("Sergeant");
    expect(warnings).toEqual([
      expect.stringMatching(
        /^src\/objects\/units\.ts, unit h002, field unam: the translations of its localized value \(deDE\)/,
      ),
    ]);
  });

  it("does nothing, and needs neither peer, without definition files", () => {
    const project = mapProject(
      { "src/objects/README.md": "Definitions go here.\n" },
      { typescript: false, builtins: false },
    );
    const before = snapshot(project.staged);

    expect(mergeObjectDefinitions(project.staged, project.root)).toEqual({
      objects: [],
      written: [],
      warnings: [],
    });
    expect(snapshot(project.staged)).toEqual(before);
    const missing = mapProject({}, { typescript: false, builtins: false });
    expect(
      mergeObjectDefinitions(missing.staged, missing.root).objects,
    ).toEqual([]);
  });
});

describe("loading definitions", () => {
  it("loads a helper imported between files of src/objects/, with and without extension", () => {
    const project = mapProject({
      "src/objects/helpers/tiers.ts":
        IMPORT +
        `export function tier(rawcode: string, level: number) {
  return defineUnit({ rawcode, base: FourCC("hfoo"), fields: { unam: \`Creep \${String(level)}\`, uhpm: 100 * level } });
}
`,
      "src/objects/helpers/names.ts": `export const PREFIX = "Elite";\n`,
      "src/objects/creeps.ts": `import { tier } from "./helpers/tiers";
import { PREFIX } from "./helpers/names.ts";
import { tier as again } from "./helpers/tiers.js";
export const Creep1 = tier("h002", 1);
export const Creep2 = again("h003", 2);
export const Elite = tier("h004", 3);
export const prefix = PREFIX;
`,
      "src/objects/reexports.ts": `export { Creep1 } from "./creeps";\n`,
    });

    const { objects } = mergeObjectDefinitions(project.staged, project.root);

    expect(
      objects.map(({ rawcode, file }) => [rawcode, path.basename(file)]),
    ).toEqual([
      ["h002", "creeps.ts"],
      ["h003", "creeps.ts"],
      ["h004", "creeps.ts"],
    ]);
    expect(objectOf(project.staged, "unit", "h003")?.name).toBe("Creep 2");
  });

  it("resolves packages and Node's built-in modules from the Map project's root", () => {
    const project = mapProject({
      "node_modules/creep-table/package.json":
        '{ "name": "creep-table", "main": "index.js" }\n',
      "node_modules/creep-table/index.js": "module.exports = { hp: 640 };\n",
      "src/objects/units.ts":
        IMPORT +
        `import path from "node:path";
import { hp } from "creep-table";
export const Brute = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { uhpm: hp, unam: path.basename("a/Brute") } });
`,
    });

    mergeObjectDefinitions(project.staged, project.root);

    expect(
      modifications(objectOf(project.staged, "unit", "h002")).sort(),
    ).toEqual(["uhpm = 640", 'unam = "Brute"']);
  });

  it.each([
    [
      "the generated folder",
      `import { CustomUnits } from "../generated/custom-units";\nexport const x = CustomUnits;\n`,
      /^src\/objects\/units\.ts imports "\.\.\/generated\/custom-units", from the generated folder src\/generated\/, whose constants exist only in the map's Lua/,
    ],
    [
      "reforged-builtins' constants",
      `import { Units } from "reforged-builtins/units";\nexport const x = Units;\n`,
      /^src\/objects\/units\.ts imports "reforged-builtins\/units", whose constants exist only in the map's Lua/,
    ],
    [
      "a file outside src/objects/",
      `import { x as y } from "../util";\nexport const x = y;\n`,
      /^src\/objects\/units\.ts imports "\.\.\/util", a file outside the definitions folder src\/objects\//,
    ],
  ])(
    "refuses an import of %s, naming the import and the importing file",
    (_, source, message) => {
      const project = mapProject({
        "src/objects/units.ts": source,
        "src/util.ts": "export const x = 1;\n",
        "src/generated/custom-units.ts": "export const CustomUnits = {};\n",
      });

      const error = mergeError(project, "load-failed");

      expect(error.message).toMatch(message);
      expect(error.file).toBe(
        path.join(project.root, "src", "objects", "units.ts"),
      );
    },
  );

  it("names the file and the exception's message when a module throws", () => {
    const project = mapProject({
      "src/objects/units.ts": `import "./broken";\nexport const x = 1;\n`,
      "src/objects/broken.ts": `throw new Error("no tiers configured");\n`,
    });

    const error = mergeError(project, "load-failed");

    expect(error.message).toBe(
      "src/objects/broken.ts threw while loading: no tiers configured. Fix it, then build again.",
    );
    expect(error.file).toBe(
      path.join(project.root, "src", "objects", "broken.ts"),
    );
  });

  it("gives FourCC the game's integer", () => {
    const project = mapProject({
      "src/objects/units.ts":
        IMPORT +
        `if (FourCC("hfoo") !== 0x68666f6f) throw new Error("wrong FourCC");
export const Sergeant = defineUnit({ rawcode: "h002", base: (0x68666f6f as never) });
`,
    });

    expect(
      mergeObjectDefinitions(project.staged, project.root).objects,
    ).toEqual([expect.objectContaining({ rawcode: "h002", base: "hfoo" })]);
  });
});

describe("checking definitions", () => {
  it.each([
    [
      "a malformed Rawcode",
      `defineUnit({ rawcode: "h00", base: FourCC("hfoo") })`,
      'src/objects/units.ts: a unit definition\'s Rawcode, "h00", is not four printable ASCII characters, such as "h000".',
      undefined,
    ],
    [
      "a Custom Rawcode equal to a Built-in one",
      `defineUnit({ rawcode: "hkni", base: FourCC("hfoo") })`,
      "src/objects/units.ts, unit hkni: hkni is the Rawcode of the Built-in unit Knight in Game version 3.0.1, and a Custom object never takes a Built-in Rawcode. Choose another Rawcode, or leave the base out to change the Built-in object.",
      "hkni",
    ],
    [
      "a Built-in Rawcode the Patch does not have for the kind",
      `defineUnit({ rawcode: "AHbz" })`,
      "src/objects/units.ts, unit AHbz: the definition gives no base, so it changes a Built-in unit, and Game version 3.0.1 has no Built-in unit AHbz (it is a ability). Give a base to define a Custom unit, or check the Rawcode.",
      "AHbz",
    ],
    [
      "a base that is not a Built-in object of the kind",
      `defineUnit({ rawcode: "h002", base: FourCC("AHbz") })`,
      "src/objects/units.ts, unit h002: the base AHbz is not a Built-in unit of Game version 3.0.1 (it is a ability): a Custom object derives from a Built-in object of its kind. Check the base's Rawcode.",
      "h002",
    ],
  ])(
    "refuses %s, naming the file and the Rawcode",
    (_, call, message, rawcode) => {
      const project = mapProject({
        "src/objects/units.ts": `${IMPORT}export const x = ${call};\n`,
      });

      const error = mergeError(project, "invalid-definition");

      expect(error.message).toBe(message);
      expect(error.rawcode).toBe(rawcode);
      expect(error.file).toBe(
        path.join(project.root, "src", "objects", "units.ts"),
      );
    },
  );

  it("refuses a Rawcode two files define for one kind, naming both files", () => {
    const project = mapProject({
      "src/objects/a.ts": `${IMPORT}export const x = defineUnit({ rawcode: "h002", base: FourCC("hfoo") });\n`,
      "src/objects/b.ts": `${IMPORT}export const y = defineUnit({ rawcode: "h002", base: FourCC("hkni") });\n`,
    });

    const error = mergeError(project, "defined-twice");

    expect(error.message).toBe(
      "src/objects/a.ts and src/objects/b.ts both define the unit h002: one object has one definition. Keep one, or give the other another Rawcode.",
    );
    expect(error.rawcode).toBe("h002");
  });

  it("allows a Custom buff and a Custom destructable at one Rawcode", () => {
    const project = mapProject({
      "src/objects/effects.ts": `${IMPORT}export const a = defineBuff({ rawcode: "B002", base: FourCC("Binf") });
export const b = defineDestructable({ rawcode: "B002", base: FourCC("LTlt") });
`,
    });

    expect(
      mergeObjectDefinitions(project.staged, project.root).objects.map(
        ({ kind, rawcode }) => `${kind} ${rawcode}`,
      ),
    ).toEqual(["buff B002", "destructable B002"]);
  });

  it.each([
    [
      "a field the kind does not have",
      `defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { anam: "x" } as never })`,
      "anam",
      'src/objects/units.ts, unit h002, field anam: the field table of reforged-builtins (Game version 3.0.1) has no unit field "anam". Check the field id, or set a field the game\'s metadata does not know through the raw escape, with its value type.',
    ],
    [
      "a value outside the field's category",
      `defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { umvs: "fast" as never } })`,
      "umvs",
      'src/objects/units.ts, unit h002, field umvs: an integer is expected, not "fast".',
    ],
    [
      "an integer outside 32 bits",
      `defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { uhpm: 2 ** 31 } })`,
      "uhpm",
      "src/objects/units.ts, unit h002, field uhpm: 2147483648 is outside the 32-bit integers, -2147483648 to 2147483647.",
    ],
    [
      "an enumeration's value it does not have",
      `defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { ua1t: "laser" as never } })`,
      "ua1t",
      'src/objects/units.ts, unit h002, field ua1t: "laser" is not a value of the enumeration attackType: "", "unknown", "normal", "pierce", "siege", "spells", "chaos", "magic", "hero".',
    ],
    [
      "a level on a field without levels",
      `defineAbility({ rawcode: "A001", base: FourCC("AHbz"), fields: { alev: { 1: 3 } as never } })`,
      "alev",
      'src/objects/units.ts, ability A001, field alev: the field holds one value, not a value per level: give it as a value, not {"1":3}.',
    ],
    [
      "a levelled field given one value",
      `defineAbility({ rawcode: "A001", base: FourCC("AHbz"), fields: { amcs: 90 as never } })`,
      "amcs",
      "src/objects/units.ts, ability A001, field amcs: the field holds a value per level: give a record from level to value, such as { 1: ... }, not 90.",
    ],
    [
      "a field specific to other bases",
      `defineAbility({ rawcode: "A001", base: FourCC("AHhb"), fields: { Hbz1: { 1: 3 } } })`,
      "Hbz1",
      "src/objects/units.ts, ability A001, field Hbz1: the field is specific to AHbz, ACbz, ANrf, ACrf, and the base AHhb is not one of them. Leave it out, or derive from one of those.",
    ],
    [
      "a list item that is not a Rawcode",
      `defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { uabi: ["AHbz" as never] } })`,
      "uabi",
      'src/objects/units.ts, unit h002, field uabi: "AHbz" in the list is not a Rawcode: give each with FourCC, such as FourCC("A000").',
    ],
  ])(
    "refuses %s, naming the file, the Rawcode and the field",
    (_, call, field, message) => {
      const project = mapProject({
        "src/objects/units.ts": `${IMPORT}export const x = ${call};\n`,
      });
      const before = snapshot(project.staged);

      const error = mergeError(project, "invalid-definition");

      expect(error.message).toBe(message);
      expect(error.field).toBe(field);
      expect(snapshot(project.staged)).toEqual(before);
    },
  );

  it("reports every field error at once", () => {
    const project = mapProject({
      "src/objects/units.ts": `${IMPORT}export const x = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { umvs: "fast" as never, uhpm: 1.5 } });\n`,
    });

    const error = mergeError(project, "invalid-definition");

    expect(error.problems.map((problem) => problem.field)).toEqual([
      "uhpm",
      "umvs",
    ]);
    expect(error.message).toMatch(/^2 problems in the Object definitions:\n- /);
  });
});

describe("a collision with the map folder", () => {
  it.each([
    [
      "a Custom object it defines",
      "h000",
      `defineUnit({ rawcode: "h000", base: FourCC("hfoo") })`,
      "defines",
    ],
    [
      "a Built-in object it changes",
      "hfoo",
      `defineUnit({ rawcode: "hfoo", fields: { uhpm: 500 } })`,
      "changes",
    ],
  ])("throws on %s, writing nothing", (_, rawcode, call, verb) => {
    const project = mapProject({
      "src/objects/units.ts": `${IMPORT}export const x = ${call};\n`,
    });
    const map = snapshot(project.mapFolder);
    const staged = snapshot(project.staged);

    const error = mergeError(project, "collision");

    expect(error.message).toBe(
      `src/objects/units.ts defines the unit ${rawcode}, which the map folder already ${verb}, and the code does not own it. Adopt it into the code (pnpm objects:adopt ${rawcode}), or give the definition another Rawcode.`,
    );
    expect(snapshot(project.mapFolder)).toEqual(map);
    expect(snapshot(project.staged)).toEqual(staged);
  });
});

describe("a missing peer", () => {
  const definition = {
    "src/objects/units.ts": `${IMPORT}export const x = defineUnit({ rawcode: "h002", base: FourCC("hfoo") });\n`,
  };

  it("names typescript", () => {
    const project = mapProject(definition, { typescript: false });

    expect(mergeError(project, "peer-missing").message).toMatch(
      /^typescript is not installed in the Map project \(.*\): Object definitions are transpiled with the Map project's own typescript\. Install typescript in the Map project\.$/,
    );
  });

  it("names reforged-builtins", () => {
    const project = mapProject(definition, { builtins: false });

    expect(mergeError(project, "peer-missing").message).toMatch(
      /^reforged-builtins is not installed: Object definitions need its index and its field table\./,
    );
  });

  it("names the field table of format 2", () => {
    const stand = makeTempDir();
    fs.writeFileSync(
      path.join(stand, "package.json"),
      JSON.stringify({
        name: "reforged-builtins",
        exports: { "./units": { types: "./9.9.9/units.d.ts" } },
      }),
    );
    fs.mkdirSync(path.join(stand, "9.9.9"));
    fs.copyFileSync(
      path.join(
        PACKAGE_ROOT,
        "node_modules",
        "reforged-builtins",
        "3.0.1",
        "index.json",
      ),
      path.join(stand, "9.9.9", "index.json"),
    );
    fs.writeFileSync(
      path.join(stand, "9.9.9", "fields.json"),
      JSON.stringify({
        format: 1,
        gameVersion: "9.9.9",
        kinds: {},
        fields: {},
      }),
    );
    const project = mapProject(definition, { builtins: stand });

    expect(mergeError(project, "peer-missing").message).toBe(
      "reforged-builtins has a field table of format 1 for Game version 9.9.9: Object definitions need the field table of format 2, with each field's category. Install a newer reforged-builtins in the Map project.",
    );
  });
});
