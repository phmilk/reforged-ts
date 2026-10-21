// The Object data editor over a map folder on disk (#633): open, read and
// save, then compare bytes; its edits are in object-data-edit.test.ts. A save with no edit writes no file and leaves
// every file byte for byte, on the map folders the World Editor saved, on
// wc3libs' fixtures (test/fixtures/wc3libs, Apache-2.0) and on edge cases
// the test-only encoder builds; a save to another folder copies every file
// byte for byte. Each test runs on a copy in a temporary folder.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  ObjectDataWriterError,
  openObjectData,
  type ObjectDataEditor,
  type ObjectDataObject,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";
import { buildObjectData, buildWts } from "./support/object-data.js";

afterAll(removeTemporary);

/** Save options whose World Editor check sees no window: the check's own tests are in world-editor.test.ts. */
const NO_WINDOW = { worldEditorCheck: { readWindowTitles: () => [] } };

/** A copy of the committed fixture map folder `name` in a temporary folder. */
function copyFixture(name: string): string {
  const folder = path.join(makeTempDir(), name);
  fs.cpSync(fixtureMap(name), folder, { recursive: true });
  return folder;
}

/** Every file of a folder, by name, with the SHA-256 of its bytes: compared at once, however large. */
function snapshot(folder: string): Map<string, string> {
  return new Map(
    fs
      .readdirSync(folder)
      .sort()
      .map((name) => [name, digest(path.join(folder, name))]),
  );
}

/** The SHA-256 of a file's bytes, in hex. */
function digest(file: string): string {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

/** The warnings of the files the readers left out, so that a round trip is known to go through the writer. */
function filesNotRead(folder: string): string[] {
  return openObjectData(folder, { projectRoot: PACKAGE_ROOT }).warnings.filter(
    (warning) => warning.includes(" not read ("),
  );
}

/** Opens the map folder, saves it to itself with no edit, and expects no file written and every file's bytes unchanged. */
function expectNoOpSave(folder: string): void {
  const before = snapshot(folder);
  const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });

  expect(editor.save(undefined, NO_WINDOW)).toEqual({
    written: [],
    worldEditor: "no-window",
  });
  expect(snapshot(folder)).toEqual(before);
}

/** Opens the map folder, saves it to a new folder, and expects every file the editor covers copied byte for byte. */
function expectCopy(folder: string, names: readonly string[]): void {
  const target = path.join(makeTempDir(), "copy.w3m");
  const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });

  expect(editor.save(target, NO_WINDOW)).toEqual({
    written: names,
    worldEditor: "no-window",
  });
  for (const name of names) {
    expect(digest(path.join(target, name)), name).toBe(
      digest(path.join(folder, name)),
    );
  }
  expect(fs.readdirSync(target).sort()).toEqual([...names].sort());
}

/** The Object data files and war3map.wts of a folder, in the editor's order: each kind's base file then its Skin file, then war3map.wts. */
const EDITOR_ORDER = [
  "war3map.w3u",
  "war3mapSkin.w3u",
  "war3map.w3t",
  "war3mapSkin.w3t",
  "war3map.w3a",
  "war3mapSkin.w3a",
  "war3map.w3h",
  "war3mapSkin.w3h",
  "war3map.w3b",
  "war3mapSkin.w3b",
  "war3map.w3d",
  "war3mapSkin.w3d",
  "war3map.w3q",
  "war3mapSkin.w3q",
  "war3map.wts",
];

function editorFiles(folder: string): string[] {
  return EDITOR_ORDER.filter((name) => fs.existsSync(path.join(folder, name)));
}

/** wc3libs' fixtures, each under the name the game gives its file. */
const WC3LIBS: readonly [fixture: string, name: string][] = [
  ["war3map.w3a", "war3map.w3a"],
  ["war3map_format3.w3a", "war3map.w3a"],
  ["war3map_large_v3.w3a", "war3map.w3a"],
  ["threeLetterId.w3a", "war3map.w3a"],
  ["war3mapSkin.w3a", "war3mapSkin.w3a"],
  ["war3map.w3b", "war3map.w3b"],
  ["war3map.w3d", "war3map.w3d"],
  ["war3map.w3h", "war3map.w3h"],
  ["war3map.w3q", "war3map.w3q"],
  ["war3map.w3t", "war3map.w3t"],
  ["war3map.w3u", "war3map.w3u"],
  ["war3map_v3_lumber_bounty.w3u", "war3map.w3u"],
  ["war3mapSkin_v3_lumber_bounty.w3u", "war3mapSkin.w3u"],
  ["war3mapReforged.w3u", "war3map.w3u"],
  ["war3map_v3_filled.wts", "war3map.wts"],
];

/** A map folder holding wc3libs' fixture under its game name. */
function wc3libsFolder(fixture: string, name: string): string {
  return mapFolder({
    [name]: fs.readFileSync(path.join(fixtureMap("wc3libs"), fixture)),
  });
}

describe("a save with no edit", () => {
  it.each(["editor-objects.w3m", "editor-variables.w3m"])(
    "writes no file of %s and leaves every file byte for byte",
    (name) => {
      expectNoOpSave(copyFixture(name));
    },
  );

  it.each(WC3LIBS)(
    "writes no file of wc3libs' %s, which the readers read, and leaves it byte for byte",
    (fixture, name) => {
      const folder = wc3libsFolder(fixture, name);

      expect(filesNotRead(folder)).toEqual([]);
      expectNoOpSave(folder);
    },
  );
});

describe("a save to another folder", () => {
  it.each(["editor-objects.w3m", "editor-variables.w3m"])(
    "copies every Object data file, Skin file and war3map.wts of %s byte for byte",
    (name) => {
      const folder = copyFixture(name);
      expectCopy(folder, editorFiles(folder));
    },
  );

  it.each(WC3LIBS)("copies wc3libs' %s byte for byte", (fixture, name) => {
    expectCopy(wc3libsFolder(fixture, name), [name]);
  });

  it("copies the bytes of a file the readers left out, and writes no other file there", () => {
    const folder = mapFolder({
      "war3map.w3u": buildObjectData({
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [{ field: "umvs", value: 300 }],
          },
        ],
      }),
      // Truncated, an unknown format version, a set count above 1.
      "war3map.w3a": buildObjectData({}).subarray(0, 6),
      "war3map.w3h": buildObjectData({ version: 4 }),
      "war3map.w3q": buildObjectData({
        custom: [
          {
            original: "Rhme",
            custom: "R000",
            sets: [
              { flag: 0, modifications: [] },
              { flag: 1, modifications: [] },
            ],
          },
        ],
        levels: true,
      }),
      "war3map.lua": "",
    });

    expect(
      openObjectData(folder, { projectRoot: PACKAGE_ROOT }).warnings,
    ).toHaveLength(3);
    expectCopy(folder, [
      "war3map.w3u",
      "war3map.w3a",
      "war3map.w3h",
      "war3map.w3q",
    ]);
  });

  it("writes only the files whose bytes differ from the target's", () => {
    const folder = copyFixture("editor-objects.w3m");
    const target = path.join(makeTempDir(), "copy.w3m");
    fs.cpSync(folder, target, { recursive: true });
    fs.writeFileSync(path.join(target, "war3map.w3u"), "stale");
    fs.rmSync(path.join(target, "war3mapSkin.w3h"));
    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });

    expect(editor.save(target, NO_WINDOW)).toEqual({
      worldEditor: "no-window",
      written: ["war3map.w3u", "war3mapSkin.w3h"],
    });
    expect(snapshot(target)).toEqual(snapshot(folder));
  });
});

describe("the edge cases a save keeps byte for byte", () => {
  const levelled = (version: number) =>
    buildObjectData({
      version,
      levels: true,
      original: [
        {
          original: "AHbz",
          modifications: [
            { field: "Hbz1", level: 2, dataPointer: 1, value: 8 },
          ],
        },
      ],
      custom: [
        {
          original: "AHhb",
          custom: "A000",
          modifications: [
            { field: "anam", value: "Holy Fire" },
            { field: "Hhb1", level: 1, dataPointer: 1, type: 2, value: 1.5 },
          ],
        },
      ],
    });

  it.each([1, 2, 3])("format version %i, levelled and not", (version) => {
    expectNoOpSave(
      mapFolder({
        "war3map.w3a": levelled(version),
        "war3map.w3u": buildObjectData({
          version,
          original: [
            {
              original: "hfoo",
              modifications: [{ field: "umvs", value: 300 }],
            },
          ],
          custom: [
            {
              original: "hfoo",
              custom: "h000",
              modifications: [{ field: "unam", value: "Captain" }],
            },
          ],
        }),
      }),
    );
  });

  it.each([
    [
      "a Built-in object with zero end markers and one with non-standard markers",
      buildObjectData({
        original: [
          {
            original: "hfoo",
            modifications: [{ field: "umvs", value: 300, end: "\0\0\0\0" }],
          },
          {
            original: "hkni",
            modifications: [
              { field: "umvs", value: 320, end: "xyzw" },
              { field: "uhpm", value: 900, end: "hfoo" },
            ],
          },
        ],
      }),
    ],
    [
      "a Built-in object's entry with a Custom Rawcode",
      buildObjectData({
        original: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [{ field: "umvs", value: 300 }],
          },
        ],
      }),
    ],
    [
      "duplicate objects and fields, an object with no set and a set flag",
      buildObjectData({
        original: [
          { original: "hfoo", modifications: [{ field: "umvs", value: 1 }] },
          {
            original: "hfoo",
            modifications: [
              { field: "umvs", value: 2 },
              { field: "umvs", value: 3 },
            ],
          },
        ],
        custom: [
          { original: "hfoo", custom: "h000", sets: [] },
          {
            original: "hfoo",
            custom: "h000",
            sets: [{ flag: 7, modifications: [{ field: "unam", value: "A" }] }],
          },
        ],
      }),
    ],
    [
      "a three-character field id",
      buildObjectData({
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [{ field: "Crs\0", value: 1 }],
          },
        ],
      }),
    ],
    [
      "a NaN real with a payload, a negative zero and an infinity",
      buildObjectData({
        original: [
          {
            original: "hfoo",
            modifications: [
              { field: "uacq", type: 1, value: 0, bits: 0x7fa00001 },
              { field: "uacq", type: 2, value: 0, bits: 0xffc00000 },
              { field: "usca", type: 1, value: -0 },
              { field: "ussc", type: 2, value: Infinity },
            ],
          },
        ],
      }),
    ],
    [
      "a string that is not valid UTF-8, and one with a byte order mark",
      buildObjectData({
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [
              {
                field: "unam",
                value: "",
                bytes: new Uint8Array([0x43, 0xff, 0xc3, 0x28, 0x80]),
              },
              { field: "utip", value: "﻿Tip" },
            ],
          },
        ],
      }),
    ],
    [
      "bytes after the last table",
      buildObjectData({
        custom: [{ original: "hfoo", custom: "h000" }],
        trailing: new Uint8Array([1, 2, 3, 0, 0xff]),
      }),
    ],
  ])("%s", (_case, bytes) => {
    const folder = mapFolder({ "war3map.w3u": bytes });

    expect(filesNotRead(folder)).toEqual([]);
    expectNoOpSave(folder);
  });

  it.each([
    ["with LF line ends and no byte order mark", buildWts({ 1: "A", 2: "B" })],
    [
      "with CRLF, a byte order mark and comments",
      buildWts(
        { 1: "A", 2: "B\nC" },
        { bom: true, crlf: true, comments: true },
      ),
    ],
    [
      "with a comment inside a body, out of order, and no final line end",
      "STRING 9\n{\n// not a comment\nNine\n}\n\nSTRING 2\n// Units: h000 (Captain), Name (Name)\n{\nTwo\n}",
    ],
    [
      "with blank lines, stray text, a header without a body and an unterminated body",
      "\r\n\r\njunk\r\nSTRING 4\r\nSTRING 5\r\n {\r\nFive\r\n}\r\nmore\r\nSTRING 6\r\n{\r\nsix",
    ],
    ["with bytes that are not valid UTF-8", Buffer.from([0x53, 0xff, 0x0a])],
    ["empty", ""],
  ])("a war3map.wts %s", (_case, text) => {
    expectNoOpSave(mapFolder({ "war3map.wts": text }));
  });

  it.each([
    ["truncated", buildObjectData({}).subarray(0, 6)],
    ["of an unknown format version", buildObjectData({ version: 4 })],
    [
      "with a set count above 1",
      buildObjectData({
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            sets: [
              { flag: 0, modifications: [] },
              { flag: 1, modifications: [] },
            ],
          },
        ],
      }),
    ],
  ])(
    "a file %s, which the readers leave out, is not rewritten",
    (_case, bytes) => {
      expectNoOpSave(mapFolder({ "war3map.w3u": bytes }));
    },
  );
});

describe("read", () => {
  const folder = fixtureMap("editor-objects.w3m");

  /** One object of the editor's list, by Object kind and Rawcode. */
  function object(
    objects: readonly ObjectDataObject[],
    kind: string,
    rawcode: string,
  ): ObjectDataObject {
    const found = objects.find(
      (candidate) => candidate.kind === kind && candidate.rawcode === rawcode,
    );
    if (found === undefined) throw new Error(`no ${kind} ${rawcode}`);
    return found;
  }

  it("lists each object as the Object Editor shows it: base and Skin merged, names resolved", () => {
    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });

    expect(editor.warnings).toEqual([]);
    expect(
      editor
        .objects()
        .map(({ kind, origin, rawcode, base, name }) => [
          kind,
          origin,
          rawcode,
          base,
          name,
        ]),
    ).toEqual([
      ["unit", "custom", "h000", "hfoo", "Captain"],
      ["unit", "custom", "h001", "hkni", "Chevalier Élu"],
      ["unit", "modified", "hfoo", undefined, "Militia"],
      ["item", "custom", "I000", "ratc", "Captain's Claws"],
      ["item", "modified", "ratc", undefined, "Claws of Attack +12"],
      ["ability", "custom", "A000", "AHbz", "Arctic Blizzard"],
      ["ability", "modified", "AHhb", undefined, "Holy Light"],
      ["buff", "custom", "B000", "Binf", "Holy Fire"],
      ["buff", "modified", "Binf", undefined, "Burning Fire"],
      ["destructable", "custom", "B000", "LTlt", "Gate"],
      ["destructable", "modified", "LTlt", undefined, "Summer Tree Wall"],
      ["doodad", "modified", "AObr", undefined, "Skull Brazier"],
      ["doodad", "custom", "D000", "AOks", "Statue of the Captain"],
      ["upgrade", "custom", "R000", "Rhme", "Sharper Swords"],
      ["upgrade", "modified", "Rhar", undefined, "Iron Plating"],
    ]);
    expect(editor.objects("buff").map(({ rawcode }) => rawcode)).toEqual([
      "B000",
      "Binf",
    ]);
  });

  it("gives each modification its field, level, data pointer, value and file, a TRIGSTR resolved", () => {
    const ability = object(
      openObjectData(folder, { projectRoot: PACKAGE_ROOT }).objects(),
      "ability",
      "A000",
    );

    expect(
      ability.modifications.filter(({ field }) => field === "amcs"),
    ).toEqual(
      [1, 2, 3].map((level) => ({
        field: "amcs",
        type: "int",
        level,
        dataPointer: 0,
        value: 60 + level * 20,
        stored: 60 + level * 20,
        file: "war3map.w3a",
      })),
    );
    expect(
      ability.modifications.find(({ field }) => field === "anam"),
    ).toMatchObject({
      type: "string",
      value: "Arctic Blizzard",
      stored: expect.stringMatching(/^TRIGSTR_\d+$/) as unknown,
      file: "war3mapSkin.w3a",
    });
  });

  it("keeps a TRIGSTR war3map.wts lacks as stored, and gives a unit's modification no level", () => {
    const editor = openObjectData(
      mapFolder({
        "war3map.w3u": buildObjectData({
          custom: [
            {
              original: "hfoo",
              custom: "h000",
              modifications: [
                { field: "unam", value: "TRIGSTR_042" },
                { field: "umvs", value: 300 },
              ],
            },
          ],
        }),
      }),
    );

    expect(editor.objects("unit")).toEqual([
      {
        kind: "unit",
        origin: "custom",
        rawcode: "h000",
        base: "hfoo",
        name: undefined,
        modifications: [
          {
            field: "unam",
            type: "string",
            value: "TRIGSTR_042",
            stored: "TRIGSTR_042",
            file: "war3map.w3u",
          },
          {
            field: "umvs",
            type: "int",
            value: 300,
            stored: 300,
            file: "war3map.w3u",
          },
        ],
      },
    ]);
  });
});

describe("a file changed on disk since it was read", () => {
  /** A map folder of a Custom unit h000 in both units files, and a Custom item I000 in the base items file. */
  const unitsAndItems = () =>
    mapFolder({
      "war3map.w3u": buildObjectData({
        custom: [{ original: "hfoo", custom: "h000" }],
      }),
      "war3mapSkin.w3u": buildObjectData({
        custom: [{ original: "hfoo", custom: "h000" }],
      }),
      "war3map.w3t": buildObjectData({
        custom: [{ original: "ratc", custom: "I000" }],
      }),
    });

  /** The editor of the folder, with h000's speed set in war3map.w3u and I000's gold cost in war3map.w3t and a new war3mapSkin.w3t. */
  function edited(folder: string): ObjectDataEditor {
    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });
    editor.setField({ kind: "unit", rawcode: "h000", field: "umvs" }, 320);
    editor.setField({ kind: "item", rawcode: "I000", field: "igol" }, 600);
    return editor;
  }

  /** Expects the save to be refused as changed on disk, naming the file, with every file as before. */
  function expectChangedOnDisk(
    folder: string,
    editor: ObjectDataEditor,
    file: string,
  ): void {
    const before = snapshot(folder);
    let error: unknown;
    try {
      editor.save(undefined, NO_WINDOW);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ObjectDataWriterError);
    expect(error).toMatchObject({
      name: "ObjectDataWriterError",
      reason: "changed-on-disk",
      file,
    });
    expect(String(error)).toContain("Open the map folder again");
    expect(snapshot(folder)).toEqual(before);
  }

  it("is refused with the writer error, and nothing is written", () => {
    const folder = unitsAndItems();
    const editor = edited(folder);
    fs.writeFileSync(path.join(folder, "war3map.w3t"), new Uint8Array([9]));

    expectChangedOnDisk(folder, editor, "war3map.w3t");
  });

  it("is refused when it was deleted, and when a file appeared where none was read", () => {
    const deleted = unitsAndItems();
    const editor = edited(deleted);
    fs.rmSync(path.join(deleted, "war3map.w3u"));
    expectChangedOnDisk(deleted, editor, "war3map.w3u");

    const appeared = unitsAndItems();
    const other = edited(appeared);
    fs.writeFileSync(path.join(appeared, "war3mapSkin.w3t"), "new");
    expectChangedOnDisk(appeared, other, "war3mapSkin.w3t");
  });

  it("is written when unchanged, only the files whose bytes change", () => {
    const folder = unitsAndItems();
    const skin = digest(path.join(folder, "war3mapSkin.w3u"));

    expect(edited(folder).save(undefined, NO_WINDOW)).toEqual({
      written: ["war3map.w3u", "war3map.w3t", "war3mapSkin.w3t"],
      worldEditor: "no-window",
    });
    expect(digest(path.join(folder, "war3mapSkin.w3u"))).toBe(skin);
  });

  it("is not checked for a file the save does not rewrite", () => {
    const folder = unitsAndItems();
    const editor = openObjectData(folder, { projectRoot: PACKAGE_ROOT });
    editor.setField({ kind: "unit", rawcode: "h000", field: "umvs" }, 320);
    fs.writeFileSync(path.join(folder, "war3map.w3t"), new Uint8Array([9]));

    expect(editor.save(undefined, NO_WINDOW).written).toEqual(["war3map.w3u"]);
  });
});
