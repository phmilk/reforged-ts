// Object adoption (#709): a temporary Map project, a copy of a World
// Editor map folder fixture plus what the test writes, whose objects are
// adopted into src/objects/. What the test asserts is what the author sees:
// the definition files written, the Object manifest's text, the map folder's
// bytes, the errors and their reasons. The World Editor's windows are
// injected titles.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  ObjectDataWriterError,
  ObjectDefinitionsError,
  adoptObjects,
  openObjectData,
  syncObjectDefinitions,
  type ObjectAdoptionOptions,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  removeTemporary,
} from "./support/map-folder.js";
import { typecheck } from "./support/map-project.js";

afterAll(removeTemporary);

const MANIFEST = "object-manifest.json";

interface MapProject {
  readonly root: string;
  readonly mapFolder: string;
}

/** Links `node_modules/<name>` of `root` to `target`, this package's installation of it by default. */
function link(
  root: string,
  name: string,
  target = path.join(PACKAGE_ROOT, "node_modules", name),
): void {
  const linkPath = path.join(root, "node_modules", name);
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(fs.realpathSync(target), linkPath, "junction");
}

/** A Map project in a temporary folder: a copy of a fixture map folder, `files` under its root, typescript and reforged-builtins linked. */
function mapProject(
  fixture: string,
  files: Readonly<Record<string, string>> = {},
): MapProject {
  const root = makeTempDir();
  const mapFolder = path.join(root, "test.w3m");
  fs.cpSync(fixtureMap(fixture), mapFolder, { recursive: true });
  fs.writeFileSync(path.join(root, "package.json"), '{ "private": true }\n');
  link(root, "typescript");
  link(root, "reforged-builtins");
  write({ root, mapFolder }, files);
  return { root, mapFolder };
}

/** Writes files under the Map project's root, by relative path. */
function write(
  project: MapProject,
  files: Readonly<Record<string, string>>,
): void {
  for (const [name, contents] of Object.entries(files)) {
    const file = path.join(project.root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  }
}

const NO_WINDOW: ObjectAdoptionOptions = {
  worldEditorCheck: { readWindowTitles: () => [] },
};

/** The window titles of a World Editor holding a folder, saved or not. */
function titles(folder: string, modified: boolean): ObjectAdoptionOptions {
  const title = `Warcraft III World Editor - [${path.resolve(folder)}${modified ? " *" : ""}]`;
  return { worldEditorCheck: { readWindowTitles: () => [title] } };
}

/** Adopts objects of a Map project with no World Editor window. */
function adopt(
  project: MapProject,
  rawcodes: readonly string[] | "all",
  options: ObjectAdoptionOptions = {},
) {
  return adoptObjects(project.mapFolder, project.root, rawcodes, {
    ...NO_WINDOW,
    ...options,
  });
}

/** Every file of a folder, by relative path, with the SHA-256 of its bytes. */
function hashes(folder: string): Map<string, string> {
  return new Map(
    (fs.readdirSync(folder, { recursive: true }) as string[])
      .filter((name) => {
        const file = path.join(folder, name);
        return !name.startsWith("node_modules") && fs.statSync(file).isFile();
      })
      .sort()
      .map((name) => [
        name,
        createHash("sha256")
          .update(fs.readFileSync(path.join(folder, name)))
          .digest("hex"),
      ]),
  );
}

/** A file of the Map project's, by relative path. */
function read(project: MapProject, name: string): string {
  return fs.readFileSync(path.join(project.root, name), "utf8");
}

/** Paths relative to the Map project's root, with `/` separators. */
function relative(project: MapProject, files: readonly string[]): string[] {
  return files.map((file) =>
    path.relative(project.root, file).split(path.sep).join("/"),
  );
}

/** The manifest's entries of a list, as `kind rawcode`. */
function entries(project: MapProject, list: "owned" | "removed"): string[] {
  const manifest = JSON.parse(read(project, MANIFEST)) as Record<
    string,
    { kind: string; rawcode: string }[]
  >;
  return (manifest[list] ?? []).map(
    ({ kind, rawcode }) => `${kind} ${rawcode}`,
  );
}

/** The error a call throws. */
function thrown(call: () => unknown): unknown {
  try {
    call();
  } catch (error) {
    return error;
  }
  throw new Error("expected an error");
}

/** The Map project of editor-objects.w3m whose Custom unit h000 holds a field the field table does not know and a reference to the Custom ability A000. */
function projectWithUnknownField(): MapProject {
  const project = mapProject("editor-objects.w3m");
  const editor = openObjectData(project.mapFolder, {
    projectRoot: project.root,
  });
  editor.setField({ kind: "unit", rawcode: "h000", field: "Xfoo" }, 7, {
    type: "int",
  });
  editor.setField({ kind: "unit", rawcode: "h000", field: "uabi" }, "A000");
  editor.setField(
    { kind: "ability", rawcode: "A000", field: "Xbar", level: 2 },
    1.5,
    { type: "real" },
  );
  editor.save(undefined, { worldEditorCheck: false });
  return project;
}

describe("adoptObjects", () => {
  it("adopts a Custom object of each kind into src/objects/<kind>/<Name>_<rawcode>.ts, and records it in the manifest", () => {
    const project = mapProject("editor-objects.w3m");

    const report = adopt(project, [
      "h000",
      "I000",
      "A000",
      "buff:B000",
      "destructable:B000",
      "D000",
      "R000",
    ]);

    expect(relative(project, report.files)).toEqual([
      "src/objects/unit/Captain_h000.ts",
      "src/objects/item/CaptainsClaws_I000.ts",
      "src/objects/ability/ArcticBlizzard_A000.ts",
      "src/objects/buff/HolyFire_B000.ts",
      "src/objects/destructable/Gate_B000.ts",
      "src/objects/doodad/StatueOfTheCaptain_D000.ts",
      "src/objects/upgrade/SharperSwords_R000.ts",
    ]);
    expect(
      report.adopted.map(({ kind, rawcode }) => `${kind} ${rawcode}`),
    ).toEqual([
      "unit h000",
      "item I000",
      "ability A000",
      "buff B000",
      "destructable B000",
      "doodad D000",
      "upgrade R000",
    ]);
    expect(report.manifestWritten).toBe(true);
    expect(report.worldEditor).toBe("no-window");
    expect(report.warnings).toEqual([]);
    expect(read(project, "src/objects/unit/Captain_h000.ts"))
      .toBe(`import { defineUnit } from "reforged-map/objects";

export const Captain_h000 = defineUnit({
  rawcode: "h000",
  base: FourCC("hfoo"),
  fields: {
    unam: "Captain",
  },
});
`);
    expect(read(project, "src/objects/buff/HolyFire_B000.ts"))
      .toBe(`import { defineBuff } from "reforged-map/objects";

export const HolyFire_B000 = defineBuff({
  rawcode: "B000",
  base: FourCC("Binf"),
  fields: {
    ftip: "Holy Fire",
  },
});
`);
    expect(read(project, "src/objects/upgrade/SharperSwords_R000.ts"))
      .toBe(`import { defineUpgrade } from "reforged-map/objects";

export const SharperSwords_R000 = defineUpgrade({
  rawcode: "R000",
  base: FourCC("Rhme"),
  fields: {
    gnam: { 0: "Sharper Swords" },
  },
});
`);
    expect(entries(project, "owned")).toEqual([
      "unit h000",
      "item I000",
      "ability A000",
      "buff B000",
      "destructable B000",
      "doodad D000",
      "upgrade R000",
    ]);
    expect(entries(project, "removed")).toEqual([]);
  });

  it("adopts a renamed Built-in object, with no base, named as the map names it", () => {
    const project = mapProject("editor-objects.w3m");

    const report = adopt(project, ["hfoo"]);

    expect(relative(project, report.files)).toEqual([
      "src/objects/unit/Militia_hfoo.ts",
    ]);
    expect(report.adopted).toEqual([
      {
        kind: "unit",
        rawcode: "hfoo",
        base: undefined,
        file: report.files[0],
      },
    ]);
    expect(read(project, "src/objects/unit/Militia_hfoo.ts"))
      .toBe(`import { defineUnit } from "reforged-map/objects";

export const Militia_hfoo = defineUnit({
  rawcode: "hfoo",
  fields: {
    unam: "Militia",
  },
});
`);
    expect(read(project, MANIFEST)).toBe(`{
  "format": 1,
  "owned": [
    {
      "kind": "unit",
      "rawcode": "hfoo",
      "modifications": [
        {
          "field": "unam",
          "type": "string",
          "value": "Militia"
        }
      ]
    }
  ],
  "removed": []
}
`);
  });

  it("adopts a multi-level ability, each levelled field as a record from level to value, and every field the map folder holds", () => {
    const project = mapProject("editor-contract.w3m");

    adopt(project, ["A000", "A001", "h002", "D001", "R001"]);

    expect(read(project, "src/objects/ability/ArcticBlizzard_A000.ts"))
      .toBe(`import { defineAbility } from "reforged-map/objects";

export const ArcticBlizzard_A000 = defineAbility({
  rawcode: "A000",
  base: FourCC("AHbz"),
  fields: {
    anam: "Arctic Blizzard",
    Hbz1: { 2: 9 },
    amcs: { 1: 80, 2: 100, 3: 130 },
  },
});
`);
    expect(read(project, "src/objects/ability/GreaterLight_A001.ts"))
      .toBe(`import { defineAbility } from "reforged-map/objects";

export const GreaterLight_A001 = defineAbility({
  rawcode: "A001",
  base: FourCC("AHhb"),
  fields: {
    anam: "Greater Light",
    aart: "ReplaceableTextures\\\\CommandButtons\\\\BTNStarfall.blp",
    amcs: { 1: 50 },
    atp1: { 2: "Greater Light II" },
  },
});
`);
    expect(read(project, "src/objects/unit/Sergeant_h002.ts"))
      .toBe(`import { defineUnit } from "reforged-map/objects";

export const Sergeant_h002 = defineUnit({
  rawcode: "h002",
  base: FourCC("hpea"),
  fields: {
    unam: "Sergeant",
    uhpm: 350,
    umdl: "units\\\\human\\\\Footman\\\\Footman.mdl",
    unsf: "(contract)",
    ushr: false,
  },
});
`);
    expect(
      read(project, "src/objects/doodad/StatueOfTheSergeant_D001.ts"),
    ).toContain(
      `    dnam: "Statue of the Sergeant",\n    dfil: "Doodads\\\\Outland\\\\Props\\\\Statue\\\\Statue.mdl",\n    dmas: 1.5,\n`,
    );
    expect(
      read(project, "src/objects/upgrade/SharperPowder_R001.ts"),
    ).toContain(
      `    gnam: { 0: "Sharper Powder" },\n    gar1: { 1: "ReplaceableTextures\\\\CommandButtons\\\\BTNDwarvenLongRifle.blp" },\n    gglb: 150,\n`,
    );
  });

  it("adopts a field the field table does not know through the raw escape, with a comment and a warning, and a reference as FourCC", () => {
    const project = projectWithUnknownField();

    const report = adopt(project, ["h000", "A000"]);

    expect(read(project, "src/objects/unit/Captain_h000.ts"))
      .toBe(`import { defineUnit } from "reforged-map/objects";

export const Captain_h000 = defineUnit({
  rawcode: "h000",
  base: FourCC("hfoo"),
  fields: {
    unam: "Captain",
    uabi: [FourCC("A000")],
  },
  raw: [
    // Xfoo is not in the field table of reforged-builtins (Game version 3.0.1): adopted through the raw escape.
    { field: "Xfoo", type: "int", value: 7 },
  ],
});
`);
    expect(
      read(project, "src/objects/ability/ArcticBlizzard_A000.ts"),
    ).toContain(
      `  raw: [
    // Xbar is not in the field table of reforged-builtins (Game version 3.0.1): adopted through the raw escape.
    { field: "Xbar", type: "real", level: 2, dataPointer: 0, value: 1.5 },
  ],
`,
    );
    expect(report.warnings).toEqual([
      "src/objects/unit/Captain_h000.ts, unit h000, field Xfoo: the field table of reforged-builtins (Game version 3.0.1) does not know it, so it was adopted through the raw escape with its value type. Check it, and move it to fields once a newer reforged-builtins knows it.",
      "src/objects/ability/ArcticBlizzard_A000.ts, ability A000, field Xbar: the field table of reforged-builtins (Game version 3.0.1) does not know it, so it was adopted through the raw escape with its value type. Check it, and move it to fields once a newer reforged-builtins knows it.",
    ]);
  });

  it('adopts every adoptable object with "all", leaving the map folder byte for byte as it was', () => {
    const project = mapProject("editor-objects.w3m");
    adopt(project, ["h000"]);
    const before = hashes(project.mapFolder);

    const report = adopt(project, "all");

    expect(hashes(project.mapFolder)).toEqual(before);
    expect(
      report.adopted.map(({ kind, rawcode }) => `${kind} ${rawcode}`),
    ).toEqual([
      "unit h001",
      "unit hfoo",
      "item I000",
      "item ratc",
      "ability A000",
      "ability AHhb",
      "buff B000",
      "buff Binf",
      "destructable B000",
      "destructable LTlt",
      "doodad AObr",
      "doodad D000",
      "upgrade R000",
      "upgrade Rhar",
    ]);
    expect(relative(project, report.files)).toContain(
      "src/objects/unit/ChevalierElu_h001.ts",
    );
    expect(entries(project, "owned")).toHaveLength(15);
  });

  it('adopts nothing with "all" when nothing is adoptable', () => {
    const project = mapProject("editor-objects.w3m");
    adopt(project, "all");
    const before = hashes(project.root);

    const report = adopt(project, "all");

    expect(report.adopted).toEqual([]);
    expect(report.files).toEqual([]);
    expect(report.manifestWritten).toBe(false);
    expect(hashes(project.root)).toEqual(before);
  });

  it("drops the removed entry of a Rawcode it adopts", () => {
    const project = mapProject("editor-objects.w3m", {
      [MANIFEST]: `${JSON.stringify(
        {
          format: 1,
          owned: [],
          removed: [
            {
              kind: "unit",
              rawcode: "h000",
              base: "hfoo",
              modifications: [{ field: "unam", type: "string", value: "Old" }],
            },
          ],
        },
        null,
        2,
      )}\n`,
    });

    adopt(project, ["h000"]);

    expect(entries(project, "owned")).toEqual(["unit h000"]);
    expect(entries(project, "removed")).toEqual([]);
  });

  describe("refuses, writing nothing", () => {
    /** Asserts that a call throws the Object definitions error of a reason and writes nothing. */
    function refused(
      project: MapProject,
      call: () => unknown,
      reason: string,
    ): ObjectDefinitionsError {
      const before = hashes(project.root);
      const error = thrown(call);
      expect(error).toBeInstanceOf(ObjectDefinitionsError);
      expect((error as ObjectDefinitionsError).reason).toBe(reason);
      expect(hashes(project.root)).toEqual(before);
      return error as ObjectDefinitionsError;
    }

    it("a Rawcode the code owns", () => {
      const project = mapProject("editor-objects.w3m");
      adopt(project, ["h000"]);
      fs.rmSync(path.join(project.root, "src/objects/unit/Captain_h000.ts"));

      const error = refused(
        project,
        () => adopt(project, ["h000"]),
        "not-adoptable",
      );

      expect(error.message).toBe(
        "The unit h000 is in the Object manifest: the code owns it already. Change its definition, or restore it from git if it was deleted.",
      );
      expect(error.rawcode).toBe("h000");
    });

    it("a Rawcode the code defines", () => {
      const project = mapProject("editor-objects.w3m", {
        "src/objects/units.ts": `import { defineUnit } from "reforged-map/objects";\nexport const Captain = defineUnit({ rawcode: "h000", base: FourCC("hfoo") });\n`,
      });

      const error = refused(
        project,
        () => adopt(project, ["h000"]),
        "not-adoptable",
      );

      expect(error.message).toBe(
        "src/objects/units.ts defines the unit h000 already: it cannot be adopted. Remove that definition to adopt the map folder's object, or give the definition another Rawcode.",
      );
      expect(error.file).toBe(path.join(project.root, "src/objects/units.ts"));
    });

    it("an unchanged Built-in object, and a Rawcode the map folder does not hold", () => {
      const project = mapProject("editor-objects.w3m");

      const error = refused(
        project,
        () => adopt(project, ["hkni", "h009"]),
        "not-adoptable",
      );

      expect(error.message).toBe(`2 problems in the Object definitions:
- The map folder does not change the Built-in unit hkni: there is nothing to adopt. Define the change in code with defineUnit({ rawcode: "hkni", fields: { ... } }) instead.
- The map folder holds no object h009 of any kind. Check the Rawcode.`);
    });

    it("a Rawcode two kinds share, unless its kind is named", () => {
      const project = mapProject("editor-objects.w3m");

      const error = refused(
        project,
        () => adopt(project, ["B000"]),
        "not-adoptable",
      );

      expect(error.message).toBe(
        "The map folder holds a buff and a destructable at B000: name the kind of the one to adopt, buff:B000 or destructable:B000.",
      );
    });

    it("a kind with no object at the Rawcode", () => {
      const project = mapProject("editor-objects.w3m");

      const error = refused(
        project,
        () => adopt(project, ["item:h000"]),
        "not-adoptable",
      );

      expect(error.message).toBe(
        "The map folder holds no item h000. Check the Rawcode and the kind.",
      );
    });

    it("a value no definition can hold", () => {
      const project = mapProject("editor-objects.w3m");
      const editor = openObjectData(project.mapFolder, {
        projectRoot: project.root,
      });
      editor.setField({ kind: "unit", rawcode: "h000", field: "ushr" }, 2);
      editor.save(undefined, { worldEditorCheck: false });

      const error = refused(
        project,
        () => adopt(project, ["h000"]),
        "not-adoptable",
      );

      expect(error.message).toBe(
        "The unit h000's field ushr holds 2, not a flag of 0 or 1, which an Object definition cannot hold. Fix it in the World Editor, then adopt the object again.",
      );
      expect(error.field).toBe("ushr");
    });

    it("an existing target file", () => {
      const project = mapProject("editor-objects.w3m", {
        "src/objects/unit/Captain_h000.ts": "// mine\n",
      });

      const error = refused(
        project,
        () => adopt(project, ["h000", "I000"]),
        "target-exists",
      );

      expect(error.message).toBe(
        "src/objects/unit/Captain_h000.ts exists: adoption never overwrites a file. Move or rename it, then adopt the unit h000 again.",
      );
      expect(error.file).toBe(
        path.join(project.root, "src/objects/unit/Captain_h000.ts"),
      );
    });

    it("unsaved edits in the World Editor, unless forced", () => {
      const project = mapProject("editor-objects.w3m");
      const before = hashes(project.root);

      const error = thrown(() =>
        adopt(project, ["h000"], titles(project.mapFolder, true)),
      );

      expect(error).toBeInstanceOf(ObjectDataWriterError);
      expect((error as ObjectDataWriterError).reason).toBe(
        "modified-in-world-editor",
      );
      expect((error as Error).message).toBe(
        `The World Editor shows unsaved edits for ${project.mapFolder} (its title ends in " *]"): nothing was adopted. Save or discard them in the World Editor first, then adopt again, or adopt with force to adopt what the map folder holds on disk.`,
      );
      expect(hashes(project.root)).toEqual(before);

      const forced = adopt(project, ["h000"], {
        ...titles(project.mapFolder, true),
        force: true,
      });
      expect(relative(project, forced.files)).toEqual([
        "src/objects/unit/Captain_h000.ts",
      ]);
      expect(forced.worldEditor).toBeUndefined();
    });

    it("never a World Editor that holds the map without unsaved edits", () => {
      const project = mapProject("editor-objects.w3m");

      const report = adopt(project, ["h000"], titles(project.mapFolder, false));

      expect(report.worldEditor).toBe("open");
      expect(report.warnings).toEqual([]);
    });
  });

  describe("then Object sync writes no byte and leaves the manifest unchanged", () => {
    for (const fixture of [
      "editor-objects.w3m",
      "editor-contract.w3m",
      "editor-locales.w3m",
    ]) {
      it(`on ${fixture}`, () => {
        const project = mapProject(fixture);
        adopt(project, "all");
        const before = hashes(project.root);

        const report = syncObjectDefinitions(project.mapFolder, project.root, {
          worldEditorCheck: { readWindowTitles: () => [] },
        });

        expect(report.written).toEqual([]);
        expect(report.manifestWritten).toBe(false);
        expect(report.added).toEqual([]);
        expect(report.changed).toEqual([]);
        expect(report.warnings).toEqual([]);
        expect(hashes(project.root)).toEqual(before);
      });
    }

    it("with a field through the raw escape and a reference", () => {
      const project = projectWithUnknownField();
      adopt(project, "all");
      const before = hashes(project.root);

      const report = syncObjectDefinitions(project.mapFolder, project.root, {
        worldEditorCheck: { readWindowTitles: () => [] },
      });

      expect(report.written).toEqual([]);
      expect(report.manifestWritten).toBe(false);
      expect(hashes(project.root)).toEqual(before);
    });
  });
});

describe("the adopted files in a Map project", () => {
  let diagnostics: string[];
  let files: string[];

  beforeAll(() => {
    if (
      !fs.existsSync(path.join(PACKAGE_ROOT, "dist", "object-definitions.d.ts"))
    ) {
      throw new Error(
        "reforged-map has no emitted declarations: run `pnpm build` first.",
      );
    }
    const contract = mapProject("editor-contract.w3m");
    const unknown = projectWithUnknownField();
    const root = makeTempDir();
    files = [];
    for (const project of [contract, unknown]) {
      const { files: written } = adopt(project, "all");
      for (const file of written) {
        const name = path.join(
          path.basename(path.dirname(file)),
          `${path.basename(project.root)}-${path.basename(file)}`,
        );
        const target = path.join(root, "src", "objects", name);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(file, target);
        files.push(name);
      }
    }
    link(root, "reforged-types");
    link(root, "reforged-builtins");
    link(root, "reforged-map", PACKAGE_ROOT);
    const tsconfig = path.join(root, "tsconfig.json");
    fs.writeFileSync(
      tsconfig,
      JSON.stringify({
        compilerOptions: {
          target: "ES2023",
          lib: ["ES2023"],
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          noEmit: true,
          types: ["reforged-types/3.0.1"],
        },
        include: ["src"],
      }),
    );
    diagnostics = typecheck(tsconfig);
  }, 60_000);

  it("type-check", () => {
    expect(files.length).toBeGreaterThan(30);
    expect(diagnostics).toEqual([]);
  });
});
