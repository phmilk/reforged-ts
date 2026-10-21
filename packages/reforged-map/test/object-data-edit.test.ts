// The Object data editor's edits (#637): setting and removing a field in
// the Editor form, then saving and comparing bytes. Each rule's expected
// file is built by the test-only encoder (test/support/object-data.ts),
// independent of the writer; the field facts are those of reforged-builtins'
// field table of Game version 3.0.1 (umvs and uacq in the units' base file,
// umdl and usca in their Skin file, unam a localizable string).

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  ObjectDataWriterError,
  openObjectData,
  type ObjectDataEditor,
  type ObjectDataWriterErrorReason,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";
import { buildObjectData, type TestObjectData } from "./support/object-data.js";

afterAll(removeTemporary);

/** Save options whose World Editor check sees no window: the check's own tests are in world-editor.test.ts. */
const NO_WINDOW = { worldEditorCheck: { readWindowTitles: () => [] } };

const NUL = "\0\0\0\0";

/** Opens a map folder with reforged-builtins resolved from this package's installation. */
function open(folder: string): ObjectDataEditor {
  return openObjectData(folder, { projectRoot: PACKAGE_ROOT });
}

/** The bytes of a file of the folder, or undefined when it has none. */
function bytesOf(folder: string, name: string): number[] | undefined {
  const file = path.join(folder, name);
  return fs.existsSync(file) ? [...fs.readFileSync(file)] : undefined;
}

/** Expects the folder's files to hold what the encoder builds of each, `undefined` for a file it lacks. */
function expectFiles(
  folder: string,
  files: Readonly<Record<string, TestObjectData | undefined>>,
): void {
  for (const [name, data] of Object.entries(files)) {
    expect(bytesOf(folder, name), name).toEqual(
      data === undefined ? undefined : [...buildObjectData(data)],
    );
  }
}

/** Every file of a folder, by name, with the SHA-256 of its bytes. */
function snapshot(folder: string): Map<string, string> {
  return new Map(
    fs
      .readdirSync(folder)
      .sort()
      .map((name) => [
        name,
        createHash("sha256")
          .update(fs.readFileSync(path.join(folder, name)))
          .digest("hex"),
      ]),
  );
}

/** A Custom unit h000 from hfoo, holding these modifications. */
function captain(
  modifications: NonNullable<TestObjectData["custom"]>[number]["modifications"],
): TestObjectData {
  return { custom: [{ original: "hfoo", custom: "h000", modifications }] };
}

describe("setting a field", () => {
  it("writes it into the file the field table names, and leaves the other file's bytes", () => {
    const base = captain([{ field: "umvs", value: 300 }]);
    const skin = captain([]);
    const folder = mapFolder({
      "war3map.w3u": buildObjectData(base),
      "war3mapSkin.w3u": buildObjectData(skin),
    });
    const editor = open(folder);

    editor.setField(
      { kind: "unit", rawcode: "h000", field: "umdl" },
      "units\\human\\Footman\\Footman.mdl",
    );

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      "war3mapSkin.w3u",
    ]);
    expectFiles(folder, {
      "war3map.w3u": base,
      "war3mapSkin.w3u": captain([
        {
          field: "umdl",
          value: "units\\human\\Footman\\Footman.mdl",
        },
      ]),
    });
  });

  it("replaces a value in place: position, value type, level, data pointer and end marker kept", () => {
    const folder = mapFolder({
      "war3map.w3u": buildObjectData(
        captain([
          { field: "umvs", value: 300, end: "xyzw" },
          // A real where the table has an unreal: its type is kept.
          { field: "uacq", type: 1, value: 500, end: "h000" },
          { field: "uhpm", value: 420 },
        ]),
      ),
      "war3mapSkin.w3u": buildObjectData(captain([])),
      "war3map.w3a": buildObjectData({
        levels: true,
        original: [
          {
            original: "AHbz",
            modifications: [
              { field: "Hbz1", level: 2, dataPointer: 1, value: 6, end: NUL },
              { field: "Hbz1", level: 3, dataPointer: 1, value: 8 },
            ],
          },
        ],
      }),
      "war3mapSkin.w3a": buildObjectData({
        levels: true,
        original: [{ original: "AHbz" }],
      }),
    });
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "h000", field: "umvs" }, 320);
    editor.setField({ kind: "unit", rawcode: "h000", field: "uacq" }, 0.1);
    editor.setField(
      { kind: "ability", rawcode: "AHbz", field: "Hbz1", level: 2 },
      7,
    );

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      "war3map.w3u",
      "war3map.w3a",
    ]);
    expectFiles(folder, {
      "war3map.w3u": captain([
        { field: "umvs", value: 320, end: "xyzw" },
        { field: "uacq", type: 1, value: Math.fround(0.1), end: "h000" },
        { field: "uhpm", value: 420 },
      ]),
      "war3map.w3a": {
        levels: true,
        original: [
          {
            original: "AHbz",
            modifications: [
              { field: "Hbz1", level: 2, dataPointer: 1, value: 7, end: NUL },
              { field: "Hbz1", level: 3, dataPointer: 1, value: 8 },
            ],
          },
        ],
      },
    });
  });

  it("appends a new modification with the table's value type and the editor's end marker: the Rawcode of a Built-in object, its own Rawcode for a Custom one", () => {
    const folder = mapFolder({
      "war3map.w3u": buildObjectData({
        original: [
          { original: "hfoo", modifications: [{ field: "uhpm", value: 500 }] },
        ],
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [{ field: "uhpm", value: 600, end: NUL }],
          },
        ],
      }),
      "war3mapSkin.w3u": buildObjectData({
        original: [{ original: "hfoo" }],
        custom: [{ original: "hfoo", custom: "h000" }],
      }),
      "war3map.w3a": buildObjectData({
        levels: true,
        original: [{ original: "AHbz" }],
      }),
      "war3mapSkin.w3a": buildObjectData({
        levels: true,
        original: [{ original: "AHbz" }],
      }),
    });
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "hfoo", field: "uacq" }, 600.5);
    editor.setField({ kind: "unit", rawcode: "h000", field: "umvs" }, 350);
    editor.setField(
      { kind: "ability", rawcode: "AHbz", field: "Hbz1", level: 1 },
      5,
    );
    editor.save(undefined, NO_WINDOW);

    expectFiles(folder, {
      "war3map.w3u": {
        original: [
          {
            original: "hfoo",
            modifications: [
              { field: "uhpm", value: 500 },
              { field: "uacq", type: 2, value: 600.5, end: "hfoo" },
            ],
          },
        ],
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [
              { field: "uhpm", value: 600, end: NUL },
              { field: "umvs", value: 350, end: "h000" },
            ],
          },
        ],
      },
      // The data pointer is the field table's data column, 1 for Hbz1.
      "war3map.w3a": {
        levels: true,
        original: [
          {
            original: "AHbz",
            modifications: [
              {
                field: "Hbz1",
                level: 1,
                dataPointer: 1,
                value: 5,
                end: "AHbz",
              },
            ],
          },
        ],
      },
    });
  });

  it("appends the modification the 3.0 World Editor itself saved, byte for byte, in editor-objects.w3m", () => {
    // The last modification of a Custom and of a Built-in ability in the
    // fixture's war3map.w3a, as the World Editor wrote them: removed, then
    // set again, they are appended with the same end markers, A000 and AHhb.
    const folder = path.join(makeTempDir(), "editor-objects.w3m");
    fs.cpSync(fixtureMap("editor-objects.w3m"), folder, { recursive: true });
    const editor = open(folder);
    const custom = {
      kind: "ability",
      rawcode: "A000",
      field: "amcs",
      level: 3,
    } as const;
    const builtin = {
      kind: "ability",
      rawcode: "AHhb",
      field: "amcs",
      level: 1,
    } as const;

    editor.removeField(custom);
    editor.removeField(builtin);
    editor.setField(custom, 120);
    editor.setField(builtin, 70);

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([]);
    expect(bytesOf(folder, "war3map.w3a")).toEqual([
      ...fs.readFileSync(
        path.join(fixtureMap("editor-objects.w3m"), "war3map.w3a"),
      ),
    ]);
  });

  it("moves the field out of the other file, the object's other modifications there kept as read", () => {
    const folder = mapFolder({
      "war3map.w3u": buildObjectData(captain([{ field: "uhpm", value: 420 }])),
      // A foreign layout: umvs in the Skin file.
      "war3mapSkin.w3u": buildObjectData(
        captain([
          { field: "umdl", value: "a.mdl", end: "h000" },
          { field: "umvs", value: 300, end: "h000" },
          { field: "usca", type: 1, value: 1.5, end: "h000" },
        ]),
      ),
    });
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "h000", field: "umvs" }, 320);
    editor.save(undefined, NO_WINDOW);

    expectFiles(folder, {
      "war3map.w3u": captain([
        { field: "uhpm", value: 420 },
        { field: "umvs", value: 320 },
      ]),
      "war3mapSkin.w3u": captain([
        { field: "umdl", value: "a.mdl", end: "h000" },
        { field: "usca", type: 1, value: 1.5, end: "h000" },
      ]),
    });
  });

  it.each([1, 2, 3])(
    "adds the object to the other file of its kind, which lacks it, in the form of format version %i",
    (version) => {
      const folder = mapFolder({
        "war3map.w3u": buildObjectData({
          version,
          custom: [{ original: "hfoo", custom: "h000" }],
        }),
        "war3mapSkin.w3u": buildObjectData({
          version,
          custom: [{ original: "hkni", custom: "h001" }],
        }),
      });
      const editor = open(folder);

      editor.setField({ kind: "unit", rawcode: "h000", field: "umvs" }, 320);
      editor.save(undefined, NO_WINDOW);

      expectFiles(folder, {
        "war3map.w3u": {
          version,
          custom: [
            {
              original: "hfoo",
              custom: "h000",
              modifications: [{ field: "umvs", value: 320 }],
            },
          ],
        },
        "war3mapSkin.w3u": {
          version,
          custom: [
            { original: "hkni", custom: "h001" },
            { original: "hfoo", custom: "h000" },
          ],
        },
      });
    },
  );

  it("creates a file the kind did not have in format version 3, and keeps a value equal to its base's", () => {
    const folder = mapFolder({
      "war3map.w3u": buildObjectData({ version: 2 }),
    });
    const editor = open(folder);

    // The Footman's speed is 270 in the game: it is kept as a modification.
    editor.setField({ kind: "unit", rawcode: "hfoo", field: "umvs" }, 270);
    // A Built-in item no file of the map folder has.
    editor.setField({ kind: "item", rawcode: "ratc", field: "igol" }, 600);

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      "war3map.w3u",
      "war3mapSkin.w3u",
      "war3map.w3t",
      "war3mapSkin.w3t",
    ]);
    expectFiles(folder, {
      "war3map.w3u": {
        version: 2,
        original: [
          { original: "hfoo", modifications: [{ field: "umvs", value: 270 }] },
        ],
      },
      "war3mapSkin.w3u": { original: [{ original: "hfoo" }] },
      "war3map.w3t": {
        original: [
          { original: "ratc", modifications: [{ field: "igol", value: 600 }] },
        ],
      },
      "war3mapSkin.w3t": { original: [{ original: "ratc" }] },
    });
  });

  it("sets a field the table does not know with its value type given, in the base file", () => {
    const folder = mapFolder({
      "war3map.w3u": buildObjectData(captain([])),
      "war3mapSkin.w3u": buildObjectData(captain([])),
    });
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "h000", field: "zzzz" }, "raw", {
      type: "string",
    });
    editor.save(undefined, NO_WINDOW);

    expectFiles(folder, {
      "war3map.w3u": captain([{ field: "zzzz", value: "raw" }]),
      "war3mapSkin.w3u": captain([]),
    });
  });

  it("writes a string as literal UTF-8, and a real as its nearest 32-bit value", () => {
    const folder = mapFolder({
      "war3map.w3u": buildObjectData(captain([])),
      "war3mapSkin.w3u": buildObjectData(captain([])),
    });
    const editor = open(folder);

    editor.setField(
      { kind: "unit", rawcode: "h000", field: "umdl" },
      "Élu\\Chevalier.mdl",
    );
    editor.setField({ kind: "unit", rawcode: "h000", field: "usca" }, 1.1);
    editor.save(undefined, NO_WINDOW);

    expectFiles(folder, {
      "war3mapSkin.w3u": captain([
        { field: "umdl", value: "Élu\\Chevalier.mdl" },
        { field: "usca", type: 1, value: 1.1 },
      ]),
    });
    expect(
      open(folder)
        .objects("unit")[0]
        ?.modifications.find(({ field }) => field === "usca")?.value,
    ).toBe(Math.fround(1.1));
  });
});

describe("removing a field", () => {
  it("removes its modification from both files, the object's other modifications kept as read", () => {
    const folder = mapFolder({
      "war3map.w3u": buildObjectData(
        captain([
          { field: "uhpm", value: 420 },
          { field: "umvs", value: 300, end: "xyzw" },
          { field: "uacq", type: 2, value: 600 },
        ]),
      ),
      "war3mapSkin.w3u": buildObjectData(
        captain([
          { field: "umvs", value: 310 },
          { field: "umdl", value: "a.mdl" },
        ]),
      ),
      "war3map.w3a": buildObjectData({
        levels: true,
        original: [
          {
            original: "AHbz",
            modifications: [
              { field: "Hbz1", level: 1, dataPointer: 1, value: 6 },
              { field: "Hbz1", level: 2, dataPointer: 1, value: 7 },
            ],
          },
        ],
      }),
    });
    const editor = open(folder);

    editor.removeField({ kind: "unit", rawcode: "h000", field: "umvs" });
    editor.removeField({
      kind: "ability",
      rawcode: "AHbz",
      field: "Hbz1",
      level: 1,
    });
    // A field the object does not hold: no change.
    editor.removeField({ kind: "unit", rawcode: "h000", field: "ua1b" });

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      "war3map.w3u",
      "war3mapSkin.w3u",
      "war3map.w3a",
    ]);
    expectFiles(folder, {
      "war3map.w3u": captain([
        { field: "uhpm", value: 420 },
        { field: "uacq", type: 2, value: 600 },
      ]),
      "war3mapSkin.w3u": captain([{ field: "umdl", value: "a.mdl" }]),
      "war3map.w3a": {
        levels: true,
        original: [
          {
            original: "AHbz",
            modifications: [
              { field: "Hbz1", level: 2, dataPointer: 1, value: 7 },
            ],
          },
        ],
      },
    });
  });
});

describe("a save after edits", () => {
  it("reads back through the readers with the edits and every other modification as before", () => {
    const folder = path.join(makeTempDir(), "editor-objects.w3m");
    fs.cpSync(fixtureMap("editor-objects.w3m"), folder, { recursive: true });
    const before = open(folder).objects();
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "h000", field: "umvs" }, 320);
    editor.setField({ kind: "unit", rawcode: "hfoo", field: "usca" }, 1.25);
    editor.setField(
      { kind: "ability", rawcode: "A000", field: "amcs", level: 2 },
      95,
    );
    editor.removeField({ kind: "item", rawcode: "ratc", field: "igol" });
    const edited = editor.objects();
    editor.save(undefined, NO_WINDOW);
    const after = open(folder);

    expect(after.warnings).toEqual([]);
    expect(after.objects()).toEqual(edited);
    const touched = new Set([
      "unit h000",
      "unit hfoo",
      "ability A000",
      "item ratc",
    ]);
    expect(
      after
        .objects()
        .filter(({ kind, rawcode }) => !touched.has(`${kind} ${rawcode}`)),
    ).toEqual(
      before.filter(({ kind, rawcode }) => !touched.has(`${kind} ${rawcode}`)),
    );
    const h000 = after
      .objects("unit")
      .find(({ rawcode }) => rawcode === "h000");
    expect(h000?.modifications).toEqual([
      ...(before
        .find(({ rawcode }) => rawcode === "h000")
        ?.modifications.filter(({ file }) => file === "war3map.w3u") ?? []),
      {
        field: "umvs",
        type: "int",
        value: 320,
        stored: 320,
        file: "war3map.w3u",
      },
      ...(before
        .find(({ rawcode }) => rawcode === "h000")
        ?.modifications.filter(({ file }) => file === "war3mapSkin.w3u") ?? []),
    ]);
    expect(
      after
        .objects("ability")
        .find(({ rawcode }) => rawcode === "A000")
        ?.modifications.filter(({ field }) => field === "amcs")
        .map(({ level, value }) => [level, value]),
    ).toEqual([
      [1, 80],
      [2, 95],
      [3, 120],
    ]);
    expect(
      after
        .objects("item")
        .find(({ rawcode }) => rawcode === "ratc")
        ?.modifications.some(({ field }) => field === "igol"),
    ).toBe(false);
  });
});

describe("an edit refused", () => {
  /** Expects the edit to throw the writer error, and a save after it to write nothing. */
  function expectRefused(
    folder: string,
    edit: (editor: ObjectDataEditor) => void,
    reason: ObjectDataWriterErrorReason,
    message: string,
    editor: ObjectDataEditor = open(folder),
  ): ObjectDataWriterError {
    const before = snapshot(folder);
    let error: unknown;
    try {
      edit(editor);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ObjectDataWriterError);
    expect(error).toMatchObject({ name: "ObjectDataWriterError", reason });
    expect(String(error)).toContain(message);
    expect(editor.save(undefined, NO_WINDOW).written).toEqual([]);
    expect(snapshot(folder)).toEqual(before);
    return error as ObjectDataWriterError;
  }

  const units = () =>
    mapFolder({
      "war3map.w3u": buildObjectData(captain([{ field: "umvs", value: 300 }])),
      "war3mapSkin.w3u": buildObjectData(captain([])),
    });

  it("a field the table does not know, without a value type", () => {
    expectRefused(
      units(),
      (editor) => {
        editor.setField({ kind: "unit", rawcode: "h000", field: "zzzz" }, 1);
      },
      "unknown-field",
      "zzzz: give its value type",
    );
  });

  it("a field the object holds twice in one file, named", () => {
    const folder = mapFolder({
      "war3map.w3u": buildObjectData(
        captain([
          { field: "umvs", value: 300 },
          { field: "umvs", value: 310 },
        ]),
      ),
    });

    for (const edit of [
      (editor: ObjectDataEditor) => {
        editor.setField({ kind: "unit", rawcode: "h000", field: "umvs" }, 1);
      },
      (editor: ObjectDataEditor) => {
        editor.removeField({ kind: "unit", rawcode: "h000", field: "umvs" });
      },
    ]) {
      const error = expectRefused(
        folder,
        edit,
        "field-held-twice",
        "war3map.w3u holds the field umvs of h000 2 times",
      );
      expect(error.file).toBe("war3map.w3u");
    }
  });

  it.each([
    [
      "an integer outside 32 bits",
      "umvs",
      2 ** 31,
      "stores an integer of 32 bits",
    ],
    ["a fraction for an integer", "umvs", 1.5, "stores an integer of 32 bits"],
    ["a string for an integer", "umvs", "300", "stores an integer of 32 bits"],
    ["a string with a NUL byte", "umdl", "a\0b", "without a NUL byte"],
    ["a real outside 32 bits", "usca", 1e39, "finite real of 32 bits"],
    [
      "a real that is not a number",
      "usca",
      Number.NaN,
      "finite real of 32 bits",
    ],
  ])("%s", (_case, field, value, message) => {
    expectRefused(
      units(),
      (editor) => {
        editor.setField({ kind: "unit", rawcode: "h000", field }, value);
      },
      "invalid-value",
      message,
    );
  });

  it.each([
    [
      "a value type other than the table's",
      { kind: "unit", rawcode: "h000", field: "umvs" },
      { type: "real" },
      "stores a value of type int",
    ],
    [
      "a level in a kind that stores none",
      { kind: "unit", rawcode: "h000", field: "umvs", level: 1 },
      {},
      "has no level and no data pointer",
    ],
    [
      "no level for a field with levels",
      { kind: "ability", rawcode: "AHbz", field: "amcs" },
      {},
      "give the level",
    ],
    [
      "a negative level",
      { kind: "ability", rawcode: "AHbz", field: "amcs", level: -1 },
      {},
      "is not an integer from 0",
    ],
    [
      "a field id that is not four characters",
      { kind: "unit", rawcode: "h000", field: "umv" },
      {},
      "is not four characters",
    ],
  ] as const)("%s", (_case, field, options, message) => {
    expectRefused(
      units(),
      (editor) => {
        editor.setField(field, 1, options);
      },
      "invalid-value",
      message,
    );
  });

  it("an object the kind does not hold, and no Built-in object has", () => {
    for (const rawcode of ["h009", "AHbz"]) {
      expectRefused(
        units(),
        (editor) => {
          editor.setField({ kind: "unit", rawcode, field: "umvs" }, 1);
        },
        "unknown-object",
        `no Custom unit ${rawcode}`,
      );
    }
  });

  it("an edit of a kind whose file the readers left out, named", () => {
    const folder = mapFolder({
      "war3map.w3u": buildObjectData(captain([])),
      "war3mapSkin.w3u": buildObjectData({ version: 9 }),
    });

    const error = expectRefused(
      folder,
      (editor) => {
        editor.setField({ kind: "unit", rawcode: "h000", field: "umvs" }, 1);
      },
      "file-not-read",
      "war3mapSkin.w3u was not read",
    );
    expect(error.file).toBe("war3mapSkin.w3u");
  });

  it("any edit without reforged-builtins, while a save with no edit still works", () => {
    const folder = units();
    // Resolved from the map folder, in a temporary directory: no installation.
    const editor = openObjectData(folder);

    expect(editor.objects("unit").map(({ rawcode }) => rawcode)).toEqual([
      "h000",
    ]);
    for (const edit of [
      (editor: ObjectDataEditor) => {
        editor.setField({ kind: "unit", rawcode: "h000", field: "umvs" }, 1);
      },
      (editor: ObjectDataEditor) => {
        editor.removeField({ kind: "unit", rawcode: "h000", field: "umvs" });
      },
    ]) {
      expectRefused(
        folder,
        edit,
        "builtins-missing",
        "reforged-builtins is not installed",
        editor,
      );
    }
    const target = path.join(makeTempDir(), "copy.w3m");
    expect(editor.save(target, NO_WINDOW).written).toEqual([
      "war3map.w3u",
      "war3mapSkin.w3u",
    ]);
  });

  it("an edit with a reforged-builtins older than its field table", () => {
    const project = makeTempDir();
    const installed = path.join(project, "node_modules", "reforged-builtins");
    fs.mkdirSync(path.join(installed, "3.0.0"), { recursive: true });
    fs.writeFileSync(
      path.join(installed, "package.json"),
      JSON.stringify({
        exports: { "./units": { types: "./3.0.0/units.d.ts" } },
      }),
    );
    fs.copyFileSync(
      path.join(
        PACKAGE_ROOT,
        "node_modules",
        "reforged-builtins",
        "3.0.0",
        "index.json",
      ),
      path.join(installed, "3.0.0", "index.json"),
    );
    const folder = units();

    expectRefused(
      folder,
      (editor) => {
        editor.setField({ kind: "unit", rawcode: "h000", field: "umvs" }, 1);
      },
      "builtins-missing",
      "reforged-builtins has no fields.json for its Game version 3.0.0",
      openObjectData(folder, { projectRoot: project }),
    );
  });
});
