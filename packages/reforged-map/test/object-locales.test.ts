// Localized values (#712): a translation is `_Locales/<locale>.w3mod/
// war3map.wts`, a whole copy of the root war3map.wts in the Editor form
// under the same `STRING n`, listed in war3map.imp with flag 0x15
// (docs/research/locales.md, #711). Temporary Map projects copy the World
// Editor's fixtures; editor-locales.w3m holds a unit translated by hand into
// ptBR and deDE, as the 3.0.1 editor kept it.

import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  ObjectDefinitionsError,
  adoptObjects,
  mergeObjectDefinitions,
  openObjectData,
  syncObjectDefinitions,
  type ObjectDataObject,
  type ObjectSyncOptions,
} from "../src/index.js";
import { importListWith } from "../src/war3map-imp.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  removeTemporary,
} from "./support/map-folder.js";

afterAll(removeTemporary);

const IMPORT = `import { defineUnit, localized } from "reforged-map/objects";\n`;

const UNITS = "src/objects/units.ts";

const MANIFEST = "object-manifest.json";

const LOCALES = [
  "deDE",
  "enUS",
  "esES",
  "esMX",
  "frFR",
  "itIT",
  "koKR",
  "plPL",
  "ptBR",
  "ruRU",
  "zhCN",
  "zhTW",
];

const table = (locale: string) => `_Locales/${locale}.w3mod/war3map.wts`;

interface MapProject {
  readonly root: string;
  readonly mapFolder: string;
}

function link(root: string, name: string): void {
  const linkPath = path.join(root, "node_modules", name);
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(
    fs.realpathSync(path.join(PACKAGE_ROOT, "node_modules", name)),
    linkPath,
    "junction",
  );
}

/** A Map project in a temporary folder: a copy of a fixture as its map folder, `files` under its root, typescript and reforged-builtins linked. */
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

/** The twelve `_Locales/<locale>.w3mod/` folders the World Editor creates empty on every save. */
function emptyLocaleFolders(mapFolder: string): void {
  for (const locale of LOCALES) {
    fs.mkdirSync(path.join(mapFolder, "_Locales", `${locale}.w3mod`), {
      recursive: true,
    });
  }
}

const NO_WINDOW: ObjectSyncOptions = {
  worldEditorCheck: { readWindowTitles: () => [] },
};

function sync(project: MapProject, options: ObjectSyncOptions = {}) {
  return syncObjectDefinitions(project.mapFolder, project.root, {
    ...NO_WINDOW,
    ...options,
  });
}

/** Every file and folder under a folder, by relative path with `/`, with the SHA-256 of a file's bytes. */
function hashes(folder: string): Map<string, string> {
  return new Map(
    (fs.readdirSync(folder, { recursive: true }) as string[])
      .filter((name) => !name.startsWith("node_modules"))
      .map((name) => name.split(path.sep).join("/"))
      .sort()
      .map((name) => {
        const file = path.join(folder, name);
        return [
          name,
          fs.statSync(file).isFile()
            ? createHash("sha256").update(fs.readFileSync(file)).digest("hex")
            : "folder",
        ];
      }),
  );
}

function text(folder: string, name: string): string {
  return fs.readFileSync(path.join(folder, name), "utf8");
}

/** The entries of a war3map.imp of format 1: each flag and path. */
function importList(mapFolder: string): [number, string][] {
  const bytes = fs.readFileSync(path.join(mapFolder, "war3map.imp"));
  expect(bytes.readUInt32LE(0)).toBe(1);
  const count = bytes.readUInt32LE(4);
  const entries: [number, string][] = [];
  let offset = 8;
  for (let index = 0; index < count; index++) {
    const flag = bytes[offset];
    const end = bytes.indexOf(0, offset + 1);
    entries.push([flag, bytes.toString("latin1", offset + 1, end)]);
    offset = end + 1;
  }
  expect(offset).toBe(bytes.length);
  return entries;
}

/** The blocks of a war3map.wts as `n: text`, in file order. */
function blocks(wts: string): string[] {
  return [
    ...wts.matchAll(/STRING (\d+)\r\n(?:\/\/[^\r]*\r\n)*\{\r\n([^]*?)\r\n\}/g),
  ].map(([, number, body]) => `${number}: ${body}`);
}

function objectOf(
  folder: string,
  rawcode: string,
): ObjectDataObject | undefined {
  return openObjectData(folder, { projectRoot: PACKAGE_ROOT })
    .objects("unit")
    .find((object) => object.rawcode === rawcode);
}

function thrown(call: () => unknown): unknown {
  try {
    call();
  } catch (error) {
    return error;
  }
  throw new Error("expected an error");
}

const SERGEANT = `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: localized("Sergeant", { ptBR: "Sargento", deDE: "Feldwebel" }), uhpm: 420 } });\n`;

describe("the Object data editor and _Locales", () => {
  it("lists the text per locale of a translated string", () => {
    const editor = openObjectData(fixtureMap("editor-locales.w3m"), {
      projectRoot: PACKAGE_ROOT,
    });

    const unit = editor.objects("unit").find((o) => o.rawcode === "h000");

    expect(
      unit?.modifications.map(({ field, value, translations }) => ({
        field,
        value,
        translations,
      })),
    ).toEqual([
      {
        field: "unam",
        value: "Locale Footman",
        translations: { deDE: "Lokaler Fußsoldat", ptBR: "Soldado Local" },
      },
      {
        field: "utip",
        value: "Tooltip padrão",
        translations: { deDE: "Übersetzter Tooltip", ptBR: "Dica traduzida" },
      },
    ]);
  });

  it("saves a map folder with locale tables, unedited, byte for byte", () => {
    const folder = path.join(makeTempDir(), "test.w3m");
    fs.cpSync(fixtureMap("editor-locales.w3m"), folder, { recursive: true });
    const before = hashes(folder);

    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });
    const { written } = editor.save(undefined, { worldEditorCheck: false });

    expect(written).toEqual([]);
    expect(hashes(folder)).toEqual(before);
  });
});

describe("Object sync of a localized value", () => {
  it("writes the default text into war3map.wts and each translation into its locale's table, a whole copy of the root table, listed in war3map.imp; a second sync writes nothing", () => {
    const project = mapProject("editor-objects.w3m", { [UNITS]: SERGEANT });
    emptyLocaleFolders(project.mapFolder);

    const report = sync(project);

    expect(report.written).toEqual([
      "war3map.w3u",
      "war3mapSkin.w3u",
      "war3map.wts",
      table("deDE"),
      table("ptBR"),
      "war3map.imp",
    ]);
    expect(report.warnings).toEqual([]);
    const root = blocks(text(project.mapFolder, "war3map.wts"));
    const number = /^(\d+): Sergeant$/
      .exec(root.find((block) => block.endsWith(": Sergeant")) ?? "")
      ?.at(1);
    expect(number).toBeDefined();
    for (const [locale, translation] of [
      ["deDE", "Feldwebel"],
      ["ptBR", "Sargento"],
    ]) {
      const localeTable = text(project.mapFolder, table(locale));
      // The root file's form: its byte order mark, CRLF, its comment lines.
      expect(localeTable).toBe(
        text(project.mapFolder, "war3map.wts").replace(
          "{\r\nSergeant\r\n}",
          `{\r\n${translation}\r\n}`,
        ),
      );
      expect(blocks(localeTable)).toEqual(
        root.map((block) =>
          block === `${String(number)}: Sergeant`
            ? `${String(number)}: ${translation}`
            : block,
        ),
      );
    }
    expect(importList(project.mapFolder)).toEqual([
      [0x15, table("deDE")],
      [0x15, table("ptBR")],
    ]);
    // The other locales' folders stay empty.
    expect(
      fs.readdirSync(path.join(project.mapFolder, "_Locales", "frFR.w3mod")),
    ).toEqual([]);
    expect(
      objectOf(project.mapFolder, "h002")?.modifications.find(
        (m) => m.field === "unam",
      )?.translations,
    ).toEqual({ deDE: "Feldwebel", ptBR: "Sargento" });

    const manifest = JSON.parse(text(project.root, MANIFEST)) as {
      owned: { modifications: unknown[] }[];
    };
    expect(manifest.owned[0].modifications).toContainEqual({
      field: "unam",
      type: "string",
      value: "Sergeant",
      translations: { deDE: "Feldwebel", ptBR: "Sargento" },
    });

    const before = hashes(project.root);
    const again = sync(project);

    expect(again.written).toEqual([]);
    expect(again.manifestWritten).toBe(false);
    expect(hashes(project.root)).toEqual(before);
  });

  it("keeps every locale table complete when it adds a string, and drops a locale's table and its import entry once it translates nothing", () => {
    const project = mapProject("editor-objects.w3m", { [UNITS]: SERGEANT });
    sync(project);

    write(project, {
      [UNITS]: `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: localized("Sergeant", { deDE: "Feldwebel" }) } });
export const Squire = defineUnit({ rawcode: "h003", base: FourCC("hfoo"), fields: { unam: "Squire" } });
`,
    });
    const report = sync(project);

    expect(report.written).toContain(table("ptBR"));
    expect(fs.existsSync(path.join(project.mapFolder, table("ptBR")))).toBe(
      false,
    );
    expect(importList(project.mapFolder)).toEqual([[0x15, table("deDE")]]);
    const root = blocks(text(project.mapFolder, "war3map.wts"));
    expect(root.some((block) => block.endsWith(": Squire"))).toBe(true);
    expect(blocks(text(project.mapFolder, table("deDE")))).toEqual(
      root.map((block) =>
        block.endsWith(": Sergeant")
          ? block.replace("Sergeant", "Feldwebel")
          : block,
      ),
    );

    write(project, {
      [UNITS]: `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: "Sergeant" } });\n`,
    });
    sync(project);

    expect(fs.existsSync(path.join(project.mapFolder, table("deDE")))).toBe(
      false,
    );
    // war3map.imp goes with its last entry, as the World Editor writes none for a map without imports.
    expect(fs.existsSync(path.join(project.mapFolder, "war3map.imp"))).toBe(
      false,
    );
  });

  it("leaves the _Locales folders untouched, and makes no war3map.imp, without translations", () => {
    for (const fixture of ["editor-objects.w3m", "editor-contract.w3m"]) {
      const project = mapProject(fixture, {
        [UNITS]: `${IMPORT}export const Sergeant = defineUnit({ rawcode: "hZ09", base: FourCC("hfoo"), fields: { unam: localized("Sergeant"), uhpm: 420 } });\n`,
      });
      emptyLocaleFolders(project.mapFolder);

      const report = sync(project);

      expect(report.written).toEqual([
        "war3map.w3u",
        "war3mapSkin.w3u",
        "war3map.wts",
      ]);
      for (const locale of LOCALES) {
        expect(
          fs.readdirSync(
            path.join(project.mapFolder, "_Locales", `${locale}.w3mod`),
          ),
        ).toEqual([]);
      }
      expect(fs.existsSync(path.join(project.mapFolder, "war3map.imp"))).toBe(
        false,
      );
    }
  });

  it("adds a string to the locale tables a map already has, with its default text, keeping their translations", () => {
    const project = mapProject("editor-locales.w3m", {
      [UNITS]: `${IMPORT}export const Squire = defineUnit({ rawcode: "h003", base: FourCC("hfoo"), fields: { unam: "Squire" } });\n`,
    });
    const imp = fs.readFileSync(path.join(project.mapFolder, "war3map.imp"));

    const report = sync(project);

    expect(report.written).toEqual([
      "war3map.w3u",
      "war3mapSkin.w3u",
      "war3map.wts",
      table("deDE"),
      table("ptBR"),
    ]);
    const root = blocks(text(project.mapFolder, "war3map.wts"));
    expect(root).toEqual([
      "1: Player 1",
      "2: Force 1",
      "3: Locale Footman",
      "4: Tooltip padrão",
      "5: Squire",
    ]);
    // Each table holds every string of the root table: those it lacked
    // with their default text, its translations kept.
    expect(blocks(text(project.mapFolder, table("ptBR")))).toEqual([
      "3: Soldado Local",
      "4: Dica traduzida",
      "1: Player 1",
      "2: Force 1",
      "5: Squire",
    ]);
    expect(blocks(text(project.mapFolder, table("deDE")))).toEqual([
      "3: Lokaler Fußsoldat",
      "4: Übersetzter Tooltip",
      "1: Player 1",
      "2: Force 1",
      "5: Squire",
    ]);
    // The set of locale tables is unchanged, and so is war3map.imp.
    expect(
      fs.readFileSync(path.join(project.mapFolder, "war3map.imp")),
    ).toEqual(imp);
  });

  it("refuses a translation changed in the map folder outside the code, naming both texts", () => {
    const project = mapProject("editor-objects.w3m", { [UNITS]: SERGEANT });
    sync(project);
    const file = path.join(project.mapFolder, table("ptBR"));
    fs.writeFileSync(
      file,
      fs.readFileSync(file, "utf8").replace("Sargento", "Sargentão"),
    );

    const error = thrown(() => sync(project));

    expect(error).toBeInstanceOf(ObjectDefinitionsError);
    expect((error as ObjectDefinitionsError).reason).toBe(
      "changed-outside-code",
    );
    expect((error as Error).message).toContain(
      `The unit h002's unam is "Sergeant" (deDE "Feldwebel", ptBR "Sargento") in the Object manifest and "Sergeant" (deDE "Feldwebel", ptBR "Sargentão") in the map folder.`,
    );
  });

  it("refuses a locale the game does not have", () => {
    const project = mapProject("editor-objects.w3m", {
      [UNITS]: `${IMPORT}export const Sergeant = defineUnit({ rawcode: "h002", base: FourCC("hfoo"), fields: { unam: localized("Sergeant", { ptPT: "Sargento" } as never) } });\n`,
    });

    const error = thrown(() => sync(project));

    expect((error as ObjectDefinitionsError).reason).toBe("invalid-definition");
    expect((error as Error).message).toContain(
      "the localized value's locale ptPT is not one of the game's: deDE, enUS, esES, esMX, frFR, itIT, koKR, plPL, ptBR, ruRU, zhCN, zhTW.",
    );
  });
});

describe("the build's merge of a localized value", () => {
  it("writes the locale tables into the staged copy, never into the map folder", () => {
    const project = mapProject("editor-objects.w3m", { [UNITS]: SERGEANT });
    const staged = path.join(makeTempDir(), "staged.w3m");
    fs.cpSync(project.mapFolder, staged, { recursive: true });
    const before = hashes(project.mapFolder);

    const result = mergeObjectDefinitions(staged, project.root);

    expect(result.warnings).toEqual([]);
    expect(result.written).toEqual([
      "war3map.w3u",
      "war3mapSkin.w3u",
      "war3map.wts",
      table("deDE"),
      table("ptBR"),
      "war3map.imp",
    ]);
    expect(blocks(text(staged, table("ptBR")))).toContain(
      blocks(text(staged, "war3map.wts"))
        .find((block) => block.endsWith(": Sergeant"))
        ?.replace("Sergeant", "Sargento"),
    );
    expect(hashes(project.mapFolder)).toEqual(before);
  });
});

describe("Object adoption of a translated object", () => {
  it("writes a localized value, imports localized, and records the text per locale; then a sync writes no byte", () => {
    const project = mapProject("editor-locales.w3m");
    emptyLocaleFolders(project.mapFolder);

    const report = adoptObjects(project.mapFolder, project.root, ["h000"], {
      worldEditorCheck: { readWindowTitles: () => [] },
    });

    expect(report.files).toHaveLength(1);
    expect(fs.readFileSync(report.files[0], "utf8")).toBe(
      `import { defineUnit, localized } from "reforged-map/objects";

export const LocaleFootman_h000 = defineUnit({
  rawcode: "h000",
  base: FourCC("hfoo"),
  fields: {
    unam: localized("Locale Footman", { deDE: "Lokaler Fußsoldat", ptBR: "Soldado Local" }),
    utip: localized("Tooltip padrão", { deDE: "Übersetzter Tooltip", ptBR: "Dica traduzida" }),
  },
});
`,
    );
    const manifest = JSON.parse(text(project.root, MANIFEST)) as {
      owned: { modifications: unknown[] }[];
    };
    expect(manifest.owned[0].modifications).toEqual([
      {
        field: "unam",
        type: "string",
        value: "Locale Footman",
        translations: { deDE: "Lokaler Fußsoldat", ptBR: "Soldado Local" },
      },
      {
        field: "utip",
        type: "string",
        value: "Tooltip padrão",
        translations: { deDE: "Übersetzter Tooltip", ptBR: "Dica traduzida" },
      },
    ]);

    const before = hashes(project.root);
    const synced = sync(project);

    expect(synced.written).toEqual([]);
    expect(synced.manifestWritten).toBe(false);
    expect(synced.warnings).toEqual([]);
    expect(hashes(project.root)).toEqual(before);
  });
});

describe("the Object manifest's text per locale", () => {
  function withManifest(modification: unknown): MapProject {
    return mapProject("editor-objects.w3m", {
      [MANIFEST]: `${JSON.stringify(
        {
          format: 1,
          owned: [
            {
              kind: "unit",
              rawcode: "h002",
              base: "hfoo",
              modifications: [modification],
            },
          ],
          removed: [],
        },
        null,
        2,
      )}\n`,
    });
  }

  it("refuses translations that are not one text per locale of a string", () => {
    for (const modification of [
      { field: "unam", type: "string", value: "A", translations: "B" },
      { field: "unam", type: "string", value: "A", translations: { ptBR: 1 } },
      { field: "unam", type: "string", value: "A", translations: {} },
      { field: "uhpm", type: "int", value: 1, translations: { ptBR: "B" } },
    ]) {
      const error = thrown(() => sync(withManifest(modification)));

      expect((error as ObjectDefinitionsError).reason).toBe(
        "manifest-unreadable",
      );
    }
  });
});

describe("war3map.imp and the locale tables", () => {
  /** An import list of format 1 from its entries. */
  function imp(entries: readonly [number, string][]): Uint8Array {
    const head = Buffer.alloc(8);
    head.writeUInt32LE(1, 0);
    head.writeUInt32LE(entries.length, 4);
    return new Uint8Array(
      Buffer.concat([
        head,
        ...entries.map(([flag, name]) =>
          Buffer.concat([
            Buffer.from([flag]),
            Buffer.from(name, "latin1"),
            Buffer.from([0]),
          ]),
        ),
      ]),
    );
  }

  it("keeps every other entry where it is, and lists the tables in path order among theirs", () => {
    const read = imp([
      [0x0d, "war3mapImported/hero.mdx"],
      [0x15, table("ptBR")],
      [0x0d, "war3mapImported/icon.blp"],
    ]);

    expect(
      importListWith(read, new Set(["deDE", "ptBR", "zhTW"] as const)),
    ).toEqual(
      imp([
        [0x0d, "war3mapImported/hero.mdx"],
        [0x15, table("deDE")],
        [0x15, table("ptBR")],
        [0x15, table("zhTW")],
        [0x0d, "war3mapImported/icon.blp"],
      ]),
    );
    expect(importListWith(read, new Set())).toEqual(
      imp([
        [0x0d, "war3mapImported/hero.mdx"],
        [0x0d, "war3mapImported/icon.blp"],
      ]),
    );
  });

  it("makes no list for no table, and refuses one that is not of format 1", () => {
    expect(importListWith(undefined, new Set())).toBeUndefined();
    expect(
      importListWith(imp([[0x15, table("deDE")]]), new Set()),
    ).toBeUndefined();
    expect(
      importListWith(new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0]), new Set()),
    ).toBe("unreadable");
  });
});
