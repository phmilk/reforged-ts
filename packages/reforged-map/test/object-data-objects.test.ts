// The Object data editor's object edits (#639): adding a Custom object,
// removing one, and resetting a Built-in object, in the Editor form, then
// saving and comparing bytes. The expected Object data files are built by
// the test-only encoder (test/support/object-data.ts), independent of the
// writer, and the expected war3map.wts by `wts` below, in the layout of the
// 3.0 World Editor's own save in test/fixtures/editor-objects.w3m. The
// field facts are those of reforged-builtins' field table of Game version
// 3.0.1, and the Built-in objects those of its index.

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
  makeTempDir,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";
import { snapshot } from "./support/object-project.js";
import {
  buildObjectData,
  type TestModification,
  type TestObject,
  type TestObjectData,
} from "./support/object-data.js";

afterAll(removeTemporary);

/** Save options whose World Editor check sees no window: the check's own tests are in world-editor.test.ts. */
const NO_WINDOW = { worldEditorCheck: { readWindowTitles: () => [] } };

const BOM = "﻿";

/** One block of `wts`: its number, its comment line or none, its text. */
type Block = readonly [number, string | undefined, string];

/** The text of a war3map.wts holding these blocks, each followed by a blank line, as the World Editor saves it. */
function wts(blocks: readonly Block[]): string {
  return (
    BOM +
    blocks
      .map(([number, comment, text]) =>
        [
          `STRING ${String(number)}`,
          ...(comment === undefined ? [] : [comment]),
          "{",
          ...text.split("\n"),
          "}",
          "",
          "",
        ].join("\r\n"),
      )
      .join("")
  );
}

/** Opens a map folder with reforged-builtins resolved from this package's installation. */
function open(folder: string): ObjectDataEditor {
  return openObjectData(folder, { projectRoot: PACKAGE_ROOT });
}

/** The bytes of a file of the folder, or undefined when it has none. */
function bytesOf(folder: string, name: string): number[] | undefined {
  const file = path.join(folder, name);
  return fs.existsSync(file) ? [...fs.readFileSync(file)] : undefined;
}

/** The text of a file of the folder, its bytes decoded as UTF-8 with a byte order mark kept. */
function textOf(folder: string, name: string): string | undefined {
  const file = path.join(folder, name);
  return fs.existsSync(file)
    ? new TextDecoder("utf-8", { ignoreBOM: true }).decode(
        fs.readFileSync(file),
      )
    : undefined;
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

/** One Object kind's case of adding a Custom object: its files, an object it holds already, the new one and its two strings. */
interface KindCase {
  readonly kind:
    | "unit"
    | "item"
    | "ability"
    | "buff"
    | "destructable"
    | "doodad"
    | "upgrade";
  readonly extension: string;
  readonly levels: boolean;
  readonly held: TestObject;
  readonly rawcode: string;
  readonly base: string;
  /** The localizable field, its text and the World Editor's comment of its string. */
  readonly name: { field: string; text: string; comment: string };
  /** The non-localizable field (a path) and its literal value. */
  readonly path: { field: string; value: string };
  /** The level both fields are set at, in a kind that has levels. */
  readonly level?: number;
  /** Whether the field table keeps both fields in the base file. */
  readonly inBase: boolean;
}

const KINDS: readonly KindCase[] = [
  {
    kind: "unit",
    extension: "w3u",
    levels: false,
    held: { original: "hfoo", custom: "h000" },
    rawcode: "h001",
    base: "hfoo",
    name: {
      field: "unam",
      text: "Major",
      comment: "// Units: h001 (Major), Name (Name)",
    },
    path: { field: "umdl", value: "units\\human\\Footman\\Footman.mdl" },
    inBase: false,
  },
  {
    kind: "item",
    extension: "w3t",
    levels: false,
    held: { original: "ratc", custom: "I000" },
    rawcode: "I001",
    base: "ratc",
    name: {
      field: "unam",
      text: "Sharp Claws",
      comment: "// Items: I001 (Sharp Claws), Name (Name)",
    },
    path: { field: "ifil", value: "Objects\\InventoryItems\\Claws.mdl" },
    inBase: false,
  },
  {
    kind: "ability",
    extension: "w3a",
    levels: true,
    held: { original: "AHbz", custom: "A000" },
    rawcode: "A001",
    base: "AHbz",
    name: {
      field: "anam",
      text: "Frost Storm",
      comment: "// Abilities: A001 (Frost Storm), Name (Name)",
    },
    path: { field: "aart", value: "ReplaceableTextures\\BTNBlizzard.blp" },
    inBase: false,
  },
  {
    kind: "buff",
    extension: "w3h",
    levels: false,
    held: { original: "Binf", custom: "B000" },
    rawcode: "B001",
    base: "Binf",
    name: {
      field: "ftip",
      text: "Holy Fire",
      comment: "// Buffs/Effects: B001 (), Bufftip (Tooltip)",
    },
    path: { field: "fart", value: "ReplaceableTextures\\BTNInnerFire.blp" },
    inBase: false,
  },
  {
    kind: "destructable",
    extension: "w3b",
    levels: false,
    held: { original: "LTlt", custom: "B002" },
    rawcode: "B003",
    base: "LTlt",
    name: {
      field: "bnam",
      text: "Gate",
      comment: "// Destructibles: B003 (Gate), Name (Name)",
    },
    path: { field: "bfil", value: "Doodads\\Gate.mdl" },
    inBase: false,
  },
  {
    kind: "doodad",
    extension: "w3d",
    levels: true,
    held: { original: "AOks", custom: "D000" },
    rawcode: "D001",
    base: "AOks",
    name: {
      field: "dnam",
      text: "Statue of the Major",
      comment: "// Doodads: D001 (Statue of the Major), Name (Name)",
    },
    path: { field: "dfil", value: "Doodads\\Statue.mdl" },
    inBase: true,
  },
  {
    kind: "upgrade",
    extension: "w3q",
    levels: true,
    held: { original: "Rhme", custom: "R000" },
    rawcode: "R001",
    base: "Rhme",
    name: {
      field: "gnam",
      text: "Sharper Swords",
      // A name at level 1 never names an upgrade: its base's names of every
      // level do (#654).
      comment:
        "// Upgrades: R001 (Iron Forged Swords,Steel Forged Swords,Mithril Forged Swords), Name (Name)",
    },
    path: { field: "gar1", value: "ReplaceableTextures\\BTNSword.blp" },
    level: 1,
    inBase: false,
  },
];

describe("adding a Custom object", () => {
  it("appends it to the Custom table of both files of each kind, a localizable string as a TRIGSTR and a path as literal text, in the file the World Editor keeps each", () => {
    const files: Record<string, Uint8Array | string> = {
      "war3map.wts": wts([[1, undefined, "first"]]),
    };
    for (const { extension, levels, held } of KINDS) {
      files[`war3map.${extension}`] = buildObjectData({
        levels,
        custom: [held],
      });
      files[`war3mapSkin.${extension}`] = buildObjectData({
        levels,
        custom: [held],
      });
    }
    const folder = mapFolder(files);
    const editor = open(folder);

    for (const { kind, rawcode, base, name, path: file, level } of KINDS) {
      editor.addObject({ kind, rawcode, base });
      editor.setField(
        {
          kind,
          rawcode,
          field: name.field,
          ...(level !== undefined && { level }),
        },
        name.text,
      );
      editor.setField(
        {
          kind,
          rawcode,
          field: file.field,
          ...(level !== undefined && { level }),
        },
        file.value,
      );
    }

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      ...KINDS.flatMap(({ extension }) => [
        `war3map.${extension}`,
        `war3mapSkin.${extension}`,
      ]),
      "war3map.wts",
    ]);
    KINDS.forEach(
      (
        {
          extension,
          levels,
          held,
          rawcode,
          base,
          name,
          path: file,
          level,
          inBase,
        },
        index,
      ) => {
        // Level 0 and data pointer 0 when left out, the field table's data
        // column of each field.
        const modifications: TestModification[] = [
          {
            field: name.field,
            value: `TRIGSTR_00${String(index + 2)}`,
            ...(level !== undefined && { level }),
          },
          {
            field: file.field,
            value: file.value,
            ...(level !== undefined && { level }),
          },
        ];
        const added = { original: base, custom: rawcode };
        expectFiles(folder, {
          [`war3map.${extension}`]: {
            levels,
            custom: [held, { ...added, ...(inBase && { modifications }) }],
          },
          [`war3mapSkin.${extension}`]: {
            levels,
            custom: [held, { ...added, ...(!inBase && { modifications }) }],
          },
        });
      },
    );
    expect(textOf(folder, "war3map.wts")).toBe(
      wts([
        [1, undefined, "first"],
        ...KINDS.map(({ name }, index): Block => [
          index + 2,
          name.comment,
          name.text,
        ]),
      ]),
    );
    const reopened = open(folder);
    expect(reopened.warnings).toEqual([]);
    expect(
      reopened
        .objects()
        .filter(({ rawcode }) => KINDS.some((kase) => kase.rawcode === rawcode))
        .map(({ kind, rawcode, base }) => [kind, rawcode, base]),
    ).toEqual(KINDS.map(({ kind, rawcode, base }) => [kind, rawcode, base]));
  });

  it("names a buff by its editor name and an upgrade by its name at level 0 in the comments, else as the index gives its base's, as the World Editor does (#654)", () => {
    const folder = mapFolder({ "war3map.wts": wts([[1, undefined, "first"]]) });
    const editor = open(folder);

    // A buff with an editor name; one from a base with an editor name, and
    // one from a base without, neither setting it; an upgrade named at
    // level 0, and one named at level 1 only.
    editor.addObject({ kind: "buff", rawcode: "B001", base: "Bslo" });
    editor.setField(
      { kind: "buff", rawcode: "B001", field: "fnam" },
      "Weakness",
    );
    editor.setField({ kind: "buff", rawcode: "B001", field: "ftip" }, "Weak");
    editor.addObject({ kind: "buff", rawcode: "B002", base: "BHbz" });
    editor.setField({ kind: "buff", rawcode: "B002", field: "ftip" }, "Frozen");
    editor.addObject({ kind: "buff", rawcode: "B003", base: "Binf" });
    editor.setField({ kind: "buff", rawcode: "B003", field: "ftip" }, "Fire");
    editor.addObject({ kind: "upgrade", rawcode: "R001", base: "Rhra" });
    editor.setField(
      { kind: "upgrade", rawcode: "R001", field: "gnam", level: 0 },
      "Sharper Powder",
    );
    editor.addObject({ kind: "upgrade", rawcode: "R002", base: "Rhra" });
    editor.setField(
      { kind: "upgrade", rawcode: "R002", field: "gnam", level: 1 },
      "Finer Powder",
    );
    editor.save(undefined, NO_WINDOW);

    expect(textOf(folder, "war3map.wts")).toBe(
      wts([
        [1, undefined, "first"],
        [
          2,
          "// Buffs/Effects: B001 (Weakness), EditorName (Name (Editor Only))",
          "Weakness",
        ],
        [3, "// Buffs/Effects: B001 (Weakness), Bufftip (Tooltip)", "Weak"],
        [
          4,
          "// Buffs/Effects: B002 (Blizzard (Caster)), Bufftip (Tooltip)",
          "Frozen",
        ],
        [5, "// Buffs/Effects: B003 (), Bufftip (Tooltip)", "Fire"],
        [
          6,
          "// Upgrades: R001 (Sharper Powder), Name (Name)",
          "Sharper Powder",
        ],
        [
          7,
          "// Upgrades: R002 (Black Gunpowder,Refined Gunpowder,Imbued Gunpowder), Name (Name)",
          "Finer Powder",
        ],
      ]),
    );
  });

  it("creates both files of a kind that had none, in format version 3, the object holding no modification", () => {
    const folder = mapFolder({});
    const editor = open(folder);

    editor.addObject({ kind: "unit", rawcode: "h000", base: "hfoo" });
    editor.addObject({ kind: "upgrade", rawcode: "R000", base: "Rhme" });

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      "war3map.w3u",
      "war3mapSkin.w3u",
      "war3map.w3q",
      "war3mapSkin.w3q",
    ]);
    const unit = { custom: [{ original: "hfoo", custom: "h000" }] };
    const upgrade = {
      levels: true,
      custom: [{ original: "Rhme", custom: "R000" }],
    };
    expectFiles(folder, {
      "war3map.w3u": unit,
      "war3mapSkin.w3u": unit,
      "war3map.w3q": upgrade,
      "war3mapSkin.w3q": upgrade,
      "war3map.wts": undefined,
    });
    expect(open(folder).objects()).toEqual([
      {
        kind: "unit",
        origin: "custom",
        rawcode: "h000",
        base: "hfoo",
        name: "Footman",
        modifications: [],
      },
      {
        kind: "upgrade",
        origin: "custom",
        rawcode: "R000",
        base: "Rhme",
        name: "Iron Forged Swords",
        modifications: [],
      },
    ]);
  });

  it("keeps the format version of a file the kind has, and creates the one it lacks in version 3", () => {
    const folder = mapFolder({
      "war3map.w3u": buildObjectData({
        version: 2,
        custom: [{ original: "hfoo", custom: "h000" }],
      }),
    });
    const editor = open(folder);

    editor.addObject({ kind: "unit", rawcode: "h001", base: "hkni" });
    editor.save(undefined, NO_WINDOW);

    expectFiles(folder, {
      "war3map.w3u": {
        version: 2,
        custom: [
          { original: "hfoo", custom: "h000" },
          { original: "hkni", custom: "h001" },
        ],
      },
      "war3mapSkin.w3u": { custom: [{ original: "hkni", custom: "h001" }] },
    });
  });

  it("allows B000 as a Custom destructable while a Custom buff holds it, as the World Editor makes them", () => {
    const buffs = { custom: [{ original: "Binf", custom: "B000" }] };
    const folder = mapFolder({
      "war3map.w3h": buildObjectData(buffs),
      "war3mapSkin.w3h": buildObjectData(buffs),
    });
    const editor = open(folder);

    editor.addObject({ kind: "destructable", rawcode: "B000", base: "LTlt" });
    editor.setField(
      { kind: "destructable", rawcode: "B000", field: "bfil" },
      "Doodads\\Gate.mdl",
    );

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      "war3map.w3b",
      "war3mapSkin.w3b",
    ]);
    expectFiles(folder, {
      "war3map.w3h": buffs,
      "war3mapSkin.w3h": buffs,
      "war3map.w3b": { custom: [{ original: "LTlt", custom: "B000" }] },
      "war3mapSkin.w3b": {
        custom: [
          {
            original: "LTlt",
            custom: "B000",
            modifications: [{ field: "bfil", value: "Doodads\\Gate.mdl" }],
          },
        ],
      },
    });
    expect(
      open(folder)
        .objects()
        .map(({ kind, rawcode }) => `${kind} ${rawcode}`),
    ).toEqual(["buff B000", "destructable B000"]);
  });
});

describe("removing an object", () => {
  // h000's name is its own; its tooltip it shares with h001. The Footman's
  // name is its own; its tooltip war3map.lua references too.
  const blocks: Block[] = [
    [1, "// Units: h000 (Captain), Name (Name)", "Captain"],
    [2, "// Units: h000 (Captain), Tip (Tooltip - Basic)", "Strong"],
    [3, "// Units: hfoo (Militia), Name (Name)", "Militia"],
    [4, "// Units: hfoo (Militia), Tip (Tooltip - Basic)", "Hold"],
  ];
  const h001: TestObject = {
    original: "hkni",
    custom: "h001",
    modifications: [{ field: "utip", value: "TRIGSTR_002" }],
  };

  function units(): string {
    return mapFolder({
      "war3map.w3u": buildObjectData({
        original: [
          { original: "hfoo", modifications: [{ field: "uhpm", value: 500 }] },
          { original: "hkni" },
        ],
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [{ field: "umvs", value: 320 }],
          },
          { original: "hkni", custom: "h001" },
        ],
      }),
      "war3mapSkin.w3u": buildObjectData({
        original: [
          {
            original: "hfoo",
            modifications: [
              { field: "unam", value: "TRIGSTR_003" },
              { field: "utip", value: "TRIGSTR_004" },
            ],
          },
          { original: "hkni" },
        ],
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [
              { field: "unam", value: "TRIGSTR_001" },
              { field: "utip", value: "TRIGSTR_002" },
            ],
          },
          h001,
        ],
      }),
      "war3map.wts": wts(blocks),
      "war3map.lua": 'local tip = GetLocalizedString("TRIGSTR_004")\n',
    });
  }

  it("removes a Custom object from both files, and resets a Built-in object, their unshared strings removed and a shared one kept", () => {
    const folder = units();
    const editor = open(folder);

    editor.removeObject({ kind: "unit", rawcode: "h000" });
    editor.removeObject({ kind: "unit", rawcode: "hfoo" });

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      "war3map.w3u",
      "war3mapSkin.w3u",
      "war3map.wts",
    ]);
    expectFiles(folder, {
      "war3map.w3u": {
        original: [{ original: "hkni" }],
        custom: [{ original: "hkni", custom: "h001" }],
      },
      "war3mapSkin.w3u": { original: [{ original: "hkni" }], custom: [h001] },
    });
    expect(textOf(folder, "war3map.wts")).toBe(wts([blocks[1], blocks[3]]));
    expect(
      open(folder)
        .objects("unit")
        .map(({ rawcode }) => rawcode),
    ).toEqual(["h001", "hkni"]);
  });

  it("is no change for a Built-in object the map does not modify", () => {
    const folder = units();
    const editor = open(folder);

    editor.removeObject({ kind: "unit", rawcode: "hpea" });

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([]);
  });

  it("removes an object added before the save, and adds back one removed", () => {
    const folder = units();
    const before = snapshot(folder);
    const editor = open(folder);

    editor.addObject({ kind: "unit", rawcode: "h002", base: "hfoo" });
    editor.removeObject({ kind: "unit", rawcode: "h002" });

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([]);
    expect(snapshot(folder)).toEqual(before);

    editor.removeObject({ kind: "unit", rawcode: "h001" });
    editor.addObject({ kind: "unit", rawcode: "h001", base: "hpea" });
    editor.save(undefined, NO_WINDOW);

    expect(
      open(folder)
        .objects("unit")
        .find(({ rawcode }) => rawcode === "h001"),
    ).toMatchObject({ base: "hpea", modifications: [] });
  });
});

describe("an object edit refused", () => {
  /** Expects the edit to throw the writer error, and a save after it to write nothing. */
  function expectRefused(
    folder: string,
    edit: (editor: ObjectDataEditor) => void,
    reason: ObjectDataWriterErrorReason,
    message: string,
    editor: ObjectDataEditor = open(folder),
  ): void {
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
  }

  const units = () =>
    mapFolder({
      "war3map.w3u": buildObjectData({
        // A Built-in Rawcode the index of reforged-builtins does not have.
        original: [{ original: "zzzz" }],
        custom: [{ original: "hfoo", custom: "h000" }],
      }),
      "war3mapSkin.w3u": buildObjectData({
        custom: [{ original: "hfoo", custom: "h000" }],
      }),
    });

  it.each([
    [
      "a Custom object of its kind holds",
      "h000",
      "already holds a Custom unit h000",
    ],
    [
      "the map modifies as a Built-in object",
      "zzzz",
      "already modifies the Built-in unit zzzz",
    ],
    [
      "a Built-in object of the index has",
      "hfoo",
      "hfoo is the Rawcode of the Built-in unit Footman",
    ],
    [
      "a Built-in object of another kind has",
      "AHbz",
      "AHbz is the Rawcode of the Built-in ability Blizzard",
    ],
  ])("a Rawcode %s", (_case, rawcode, message) => {
    expectRefused(
      units(),
      (editor) => {
        editor.addObject({ kind: "unit", rawcode, base: "hfoo" });
      },
      "rawcode-taken",
      message,
    );
  });

  it.each([
    [
      "no Built-in object has",
      "h000",
      "No Built-in unit of Game version 3.0.1 has the Rawcode h000",
    ],
    [
      "of another kind",
      "AHbz",
      "AHbz, the base given for h001, is a Built-in ability, not a unit",
    ],
  ])("a base %s", (_case, base, message) => {
    expectRefused(
      units(),
      (editor) => {
        editor.addObject({ kind: "unit", rawcode: "h001", base });
      },
      "unknown-base",
      message,
    );
  });

  it("a Rawcode or a base that is not four characters", () => {
    for (const object of [
      { kind: "unit", rawcode: "h01", base: "hfoo" },
      { kind: "unit", rawcode: "h001", base: "hfooo" },
    ] as const) {
      expectRefused(
        units(),
        (editor) => {
          editor.addObject(object);
        },
        "invalid-value",
        "is not four characters",
      );
    }
  });

  it("removing an object the kind does not hold, and no Built-in object has", () => {
    expectRefused(
      units(),
      (editor) => {
        editor.removeObject({ kind: "unit", rawcode: "h009" });
      },
      "unknown-object",
      "no Custom unit h009",
    );
  });

  it("an object edit of a kind whose file the readers left out", () => {
    const folder = mapFolder({
      "war3map.w3u": buildObjectData({
        custom: [{ original: "hfoo", custom: "h000" }],
      }),
      "war3mapSkin.w3u": buildObjectData({ version: 9 }),
    });

    for (const edit of [
      (editor: ObjectDataEditor) => {
        editor.addObject({ kind: "unit", rawcode: "h001", base: "hfoo" });
      },
      (editor: ObjectDataEditor) => {
        editor.removeObject({ kind: "unit", rawcode: "h000" });
      },
    ]) {
      expectRefused(
        folder,
        edit,
        "file-not-read",
        "war3mapSkin.w3u was not read",
      );
    }
  });

  it("an object edit without reforged-builtins", () => {
    const folder = units();
    const editor = openObjectData(folder);

    for (const edit of [
      (editor: ObjectDataEditor) => {
        editor.addObject({ kind: "unit", rawcode: "h001", base: "hfoo" });
      },
      (editor: ObjectDataEditor) => {
        editor.removeObject({ kind: "unit", rawcode: "h000" });
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
  });

  it("a second add of one Rawcode, the first kept", () => {
    const folder = path.join(makeTempDir(), "empty.w3m");
    fs.mkdirSync(folder);
    const editor = open(folder);

    expect(() => {
      editor.addObject({ kind: "unit", rawcode: "h000", base: "Hpal" });
      editor.addObject({ kind: "unit", rawcode: "h000", base: "hfoo" });
    }).toThrow(ObjectDataWriterError);
    editor.save(undefined, NO_WINDOW);

    expectFiles(folder, {
      "war3map.w3u": { custom: [{ original: "Hpal", custom: "h000" }] },
    });
  });
});
