// The one view of the map's objects in the generated code and the Rawcode
// lookup (#707): the map folder's objects, minus each object the Object
// manifest owns that no definition defines, plus every Object definition.
// A temporary Map project, a copy of the World Editor's map folder fixture
// plus src/objects/ and the manifest written by the test.

import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  CONSTANTS_FILES,
  OBJECTS_DECLARATIONS_FILE,
  ObjectDefinitionsError,
  generateObjects,
  openRawcodeLookup,
  type RawcodeLookup,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  removeTemporary,
} from "./support/map-folder.js";

afterAll(removeTemporary);

/** The fixture the Map projects copy: Captain (`h000`) among a Custom object and a changed Built-in object of each kind. */
const FIXTURE = "editor-objects.w3m";

const IMPORT = `import { defineBuff, defineUnit, localized } from "reforged-map/objects";\n`;

/** Links `node_modules/<name>` of `root` to this package's installation of it. */
function link(root: string, name: string): void {
  const linkPath = path.join(root, "node_modules", name);
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(
    fs.realpathSync(path.join(PACKAGE_ROOT, "node_modules", name)),
    linkPath,
    "junction",
  );
}

interface Project {
  readonly root: string;
  readonly mapFolder: string;
  /** Writes a file under the root, its folders made. */
  write(name: string, contents: string): void;
}

/** A Map project in a temporary folder: the fixture as its map folder, `files` under its root, and its peers linked. */
function project(
  files: Readonly<Record<string, string>>,
  { typescript = true }: { typescript?: boolean } = {},
): Project {
  const root = makeTempDir();
  const mapFolder = path.join(root, "test.w3m");
  fs.cpSync(fixtureMap(FIXTURE), mapFolder, { recursive: true });
  fs.writeFileSync(path.join(root, "package.json"), '{ "private": true }\n');
  if (typescript) link(root, "typescript");
  link(root, "reforged-builtins");
  const write = (name: string, contents: string): void => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  };
  for (const [name, contents] of Object.entries(files)) write(name, contents);
  return { root, mapFolder, write };
}

/** An Object manifest owning these objects, with no modification recorded. */
function manifest(
  ...owned: { kind: string; rawcode: string; base?: string }[]
): string {
  return `${JSON.stringify(
    {
      format: 1,
      owned: owned.map((entry) => ({ ...entry, modifications: [] })),
      removed: [],
    },
    null,
    2,
  )}\n`;
}

const SERGEANT =
  IMPORT +
  `export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: localized("Sergeant", { deDE: "Feldwebel" }), uhpm: 420 } });
export const Knight = defineUnit({ rawcode: "hkni", fields: { unam: "Paladin Knight", uhpm: 900 } });
`;

function generated(p: Project): Map<string, string> {
  const { files } = generateObjects(p.mapFolder, { projectRoot: p.root });
  return new Map(files.map(({ name, contents }) => [name, contents]));
}

function open(p: Project): RawcodeLookup {
  return openRawcodeLookup({
    mapFolder: p.mapFolder,
    projectRoot: p.root,
    minInterval: 0,
  });
}

/** The name of a known Rawcode's first object, its origin and its definition's file relative to the root; the status otherwise. */
function seen(lookup: RawcodeLookup, root: string, rawcode: string): string {
  const result = lookup.lookup(rawcode);
  if (result.status !== "known") return result.status;
  const [object] = result.objects;
  const file =
    object.origin === "builtin" || object.definitionFile === undefined
      ? "-"
      : path.relative(root, object.definitionFile).split(path.sep).join("/");
  return `${object.origin} ${String(object.name)} ${file}`;
}

/** Moves a file's modification time forward, as a later save does. */
function touchLater(file: string, seconds: number): void {
  const later = new Date(Date.now() + seconds * 1000);
  fs.utimesSync(file, later, later);
}

describe("generateObjects with Object definitions", () => {
  it("gives a defined object the constant, overload and TSDoc of the map folder's, naming its file, and drops an owned object no definition defines", () => {
    const p = project({
      "src/objects/units.ts": SERGEANT,
      "src/objects/effects.ts":
        IMPORT +
        `export const Halo = defineBuff({ rawcode: "B001", base: FourCC("Binf"), fields: { ftip: "Halo" } });\n`,
      "object-manifest.json": manifest({
        kind: "unit",
        rawcode: "h000",
        base: "hfoo",
      }),
    });

    const files = generated(p);
    const units = files.get(CONSTANTS_FILES.unit) ?? "";
    const overloads = files.get(OBJECTS_DECLARATIONS_FILE) ?? "";

    expect(units).toContain(
      [
        "  /**",
        "   * Sergeant (`h002`), a Custom unit of this map, derived from Footman (`hfoo`).",
        "   *",
        "   * Defined in code, by the Object definition in `src/objects/units.ts`.",
        "   */",
        `  Sergeant_h002: ${String(0x68303032)} as Rawcode<"unit">,`,
      ].join("\n"),
    );
    expect(units).toContain("ChevalierElu_h001");
    // Owned by the code and defined by no definition: the build removes it.
    expect(units).not.toContain("h000");
    expect(overloads).not.toContain('"h000"');
    expect(overloads).toContain(
      [
        "/**",
        " * Sergeant (`h002`), a Custom unit of this map, derived from Footman (`hfoo`).",
        " *",
        " * Defined in code, by the Object definition in `src/objects/units.ts`.",
        " *",
        " * Its constant is `CustomUnits.Sergeant_h002`, from the generated `custom-units.ts`.",
        " */",
        'declare function FourCC(id: "h002"): Rawcode<"unit">;',
      ].join("\n"),
    );
    expect(overloads).toContain(
      [
        "/**",
        " * Knight (`hkni`), a Built-in unit of Patch 3.0.1, named Paladin Knight in this map.",
        " *",
        " * Defined in code, by the Object definition in `src/objects/units.ts`.",
        " *",
        " * Its constant is `Units.Knight_hkni`, from `reforged-builtins/units`.",
        " */",
        'declare function FourCC(id: "hkni"): Rawcode<"unit">;',
      ].join("\n"),
    );
    expect(files.get(CONSTANTS_FILES.buff)).toContain("Halo_B001");
  });

  it("generates from the map folder alone when the definitions folder is missing, needing no typescript", () => {
    const p = project({}, { typescript: false });

    expect(generated(p).get(CONSTANTS_FILES.unit)).toContain("Captain_h000");
  });

  it("reads the definitions folder and the manifest given as options", () => {
    const p = project({
      "defs/units.ts": SERGEANT,
      "meta/owned.json": manifest({
        kind: "unit",
        rawcode: "h000",
        base: "hfoo",
      }),
    });

    const { files } = generateObjects(p.mapFolder, {
      projectRoot: p.root,
      definitionsFolder: "defs",
      manifest: "meta/owned.json",
    });
    const units = files.find(({ name }) => name === CONSTANTS_FILES.unit);

    expect(units?.contents).toContain("`defs/units.ts`");
    expect(units?.contents).not.toContain("Captain_h000");
  });

  it("throws the Object definitions error of a definition that throws", () => {
    const p = project({
      "src/objects/broken.ts": `throw new Error("no tiers");\n`,
    });

    let thrown: unknown;
    try {
      generateObjects(p.mapFolder, { projectRoot: p.root });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ObjectDefinitionsError);
    expect((thrown as ObjectDefinitionsError).reason).toBe("load-failed");
    expect((thrown as Error).message).toContain("src/objects/broken.ts");
  });
});

describe("openRawcodeLookup with Object definitions", () => {
  it("returns a defined object with its definition's file, and an owned object no definition defines as the build leaves it", () => {
    const p = project({
      "src/objects/units.ts": SERGEANT,
      "object-manifest.json": manifest(
        { kind: "unit", rawcode: "h000", base: "hfoo" },
        { kind: "unit", rawcode: "hfoo" },
      ),
    });
    const lookup = open(p);

    const sergeant = lookup.lookup("h002");
    expect(sergeant).toMatchObject({
      status: "known",
      objects: [
        {
          origin: "custom",
          kind: "unit",
          name: "Sergeant",
          base: { rawcode: "hfoo", name: "Footman" },
          constant: { object: "CustomUnits", member: "Sergeant_h002" },
          definitionFile: path.join(p.root, "src", "objects", "units.ts"),
        },
      ],
    });
    expect(seen(lookup, p.root, "hkni")).toBe(
      "modified Paladin Knight src/objects/units.ts",
    );
    // A map folder's object keeps no definition's file.
    expect(seen(lookup, p.root, "h001")).toBe("custom Chevalier Élu -");
    // Dropped: the Custom object is gone, the Built-in object back to the game's.
    expect(lookup.lookup("h000").status).toBe("unknown");
    expect(seen(lookup, p.root, "hfoo")).toBe("builtin Footman -");
  });

  it("reloads on a new, an edited and a deleted definition file and on a manifest change", () => {
    const p = project({});
    const lookup = open(p);
    expect(lookup.lookup("h002").status).toBe("unknown");

    p.write("src/objects/units.ts", SERGEANT);
    expect(seen(lookup, p.root, "h002")).toBe(
      "custom Sergeant src/objects/units.ts",
    );

    const file = path.join(p.root, "src", "objects", "units.ts");
    p.write(
      "src/objects/units.ts",
      SERGEANT.replace(`localized("Sergeant"`, `localized("Corporal"`),
    );
    touchLater(file, 5);
    expect(seen(lookup, p.root, "h002")).toBe(
      "custom Corporal src/objects/units.ts",
    );

    p.write(
      "src/objects/tiers/more.ts",
      IMPORT +
        `export const Corporal = defineUnit({ rawcode: "h003", base: FourCC("hfoo"), fields: { unam: "Corporal" } });\n`,
    );
    expect(seen(lookup, p.root, "h003")).toBe(
      "custom Corporal src/objects/tiers/more.ts",
    );

    fs.rmSync(file);
    expect(lookup.lookup("h002").status).toBe("unknown");
    expect(seen(lookup, p.root, "h000")).toBe("custom Captain -");

    p.write(
      "object-manifest.json",
      manifest({ kind: "unit", rawcode: "h000", base: "hfoo" }),
    );
    expect(lookup.lookup("h000").status).toBe("unknown");
  });

  it("is unavailable, naming the file, while a definition throws, and recovers when it is fixed", () => {
    const p = project({
      "src/objects/units.ts": SERGEANT,
      "src/objects/broken.ts": `import "./helper";\n`,
      "src/objects/helper.ts": `throw new Error("no tiers");\n`,
    });
    const lookup = open(p);

    const result = lookup.lookup("h002");
    expect(result.status).toBe("unavailable");
    expect(result.status === "unavailable" && result.reason).toContain(
      "src/objects/helper.ts threw while loading: no tiers",
    );
    // Never a view without the failing definitions.
    expect(lookup.lookup("hfoo").status).toBe("unavailable");
    expect(lookup.gameVersion()).toBeUndefined();

    p.write("src/objects/helper.ts", "export const tiers = 3;\n");
    touchLater(path.join(p.root, "src", "objects", "helper.ts"), 5);
    expect(seen(lookup, p.root, "h002")).toBe(
      "custom Sergeant src/objects/units.ts",
    );
  });

  it("is unavailable on an identity error, naming the file", () => {
    const p = project({
      "src/objects/twice.ts":
        IMPORT +
        `export const A = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: {} });
export const B = defineUnit({ rawcode: "h002", base: FourCC("hkni"), fields: {} });
`,
    });

    const result = open(p).lookup("h002");

    expect(result.status).toBe("unavailable");
    expect(result.status === "unavailable" && result.reason).toContain(
      "src/objects/twice.ts",
    );
  });

  it("names typescript when the Map project has definitions but no typescript, and retries at the next check", () => {
    const p = project(
      { "src/objects/units.ts": SERGEANT },
      { typescript: false },
    );
    const lookup = open(p);

    const result = lookup.lookup("h002");
    expect(result.status).toBe("unavailable");
    expect(result.status === "unavailable" && result.reason).toContain(
      "typescript is not installed in the Map project",
    );

    link(p.root, "typescript");
    expect(seen(lookup, p.root, "h002")).toBe(
      "custom Sergeant src/objects/units.ts",
    );
  });

  it("reuses the transpiled text of a file whose modification time did not change", () => {
    const p = project({
      "src/objects/units.ts": SERGEANT,
    });
    const file = path.join(p.root, "src", "objects", "units.ts");
    // A whole second, which utimes sets exactly.
    const mtime = Math.floor(Date.now() / 1000) - 60;
    fs.utimesSync(file, mtime, mtime);
    const lookup = open(p);
    expect(seen(lookup, p.root, "h002")).toBe(
      "custom Sergeant src/objects/units.ts",
    );

    // Same size, same modification time: the cached text is evaluated, and
    // the new name is not seen. Another file appearing makes the lookup
    // load again.
    p.write(
      "src/objects/units.ts",
      SERGEANT.replace(`localized("Sergeant"`, `localized("Sargeant"`),
    );
    fs.utimesSync(file, mtime, mtime);
    p.write("src/objects/other.ts", "export {};\n");
    expect(seen(lookup, p.root, "h002")).toBe(
      "custom Sergeant src/objects/units.ts",
    );

    touchLater(file, 5);
    expect(seen(lookup, p.root, "h002")).toBe(
      "custom Sargeant src/objects/units.ts",
    );
  });
});
