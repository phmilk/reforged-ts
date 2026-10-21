// The Object data editor's localizable strings (#638): a name or a tooltip
// set is written as a `TRIGSTR_nnn` and its `STRING n` block in
// war3map.wts, in the Editor form, then saved and compared byte for byte.
// The expected Object data files are built by the test-only encoder
// (test/support/object-data.ts), and the expected war3map.wts by `wts`
// below, in the layout of the 3.0 World Editor's own save in
// test/fixtures/editor-objects.w3m: each block followed by a blank line,
// its comment `// <kind label>: <rawcode> (<object's name>), <field>
// (<field's label>)`. The field facts are those of reforged-builtins' field
// table of Game version 3.0.1 (unam and utip localizable in the units' Skin
// file, umvs in their base file).

import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  ObjectDataWriterError,
  openObjectData,
  type ObjectDataEditor,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";
import {
  buildObjectData,
  type TestModification,
  type TestObjectData,
} from "./support/object-data.js";

afterAll(removeTemporary);

/** Save options whose World Editor check sees no window: the check's own tests are in world-editor.test.ts. */
const NO_WINDOW = { worldEditorCheck: { readWindowTitles: () => [] } };

const BOM = "﻿";
const FIXTURE = "editor-objects.w3m";

/** One block of `wts`: its number, its comment line or none, its text. */
type Block = readonly [number, string | undefined, string];

/** The text of a war3map.wts holding these blocks, each followed by a blank line, as the World Editor saves it. */
function wts(
  blocks: readonly Block[],
  { bom = true, eol = "\r\n" }: { bom?: boolean; eol?: string } = {},
): string {
  return (
    (bom ? BOM : "") +
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
        ].join(eol),
      )
      .join("")
  );
}

/** Opens a map folder with reforged-builtins resolved from this package's installation. */
function open(folder: string): ObjectDataEditor {
  return openObjectData(folder, { projectRoot: PACKAGE_ROOT });
}

/** The text of a file of the folder, its bytes decoded as UTF-8 with a byte order mark kept; undefined when it has none. */
function textOf(folder: string, name: string): string | undefined {
  const file = path.join(folder, name);
  return fs.existsSync(file)
    ? new TextDecoder("utf-8", { ignoreBOM: true }).decode(
        fs.readFileSync(file),
      )
    : undefined;
}

/** The bytes of a file of the folder. */
function bytesOf(folder: string, name: string): number[] {
  return [...fs.readFileSync(path.join(folder, name))];
}

/** Expects the folder's Object data files to hold what the encoder builds of each. */
function expectObjectData(
  folder: string,
  files: Readonly<Record<string, TestObjectData>>,
): void {
  for (const [name, data] of Object.entries(files)) {
    expect(bytesOf(folder, name), name).toEqual([...buildObjectData(data)]);
  }
}

/** A Custom unit h000 from hfoo, holding these modifications. */
function captain(modifications: TestModification[]): TestObjectData {
  return { custom: [{ original: "hfoo", custom: "h000", modifications }] };
}

/** Units in base and Skin files, with these modifications of h000 in each. */
function units(
  base: TestModification[],
  skin: TestModification[],
  more: Readonly<Record<string, string | Uint8Array>> = {},
): string {
  return mapFolder({
    "war3map.w3u": buildObjectData(captain(base)),
    "war3mapSkin.w3u": buildObjectData(captain(skin)),
    ...more,
  });
}

/** A copy of the World Editor's fixture, to edit. */
function fixtureCopy(): string {
  const folder = path.join(makeTempDir(), FIXTURE);
  fs.cpSync(fixtureMap(FIXTURE), folder, { recursive: true });
  return folder;
}

const CAPTAIN_NAME = "// Units: h000 (Captain), Name (Name)";
const CAPTAIN_TIP = "// Units: h000 (Captain), Tip (Tooltip - Basic)";

describe("a new string", () => {
  it("is numbered one above every STRING n and every TRIGSTR of the Object data, an orphan and a reference to a missing string included, never filling a gap", () => {
    const blocks: Block[] = [
      [1, CAPTAIN_NAME, "Captain"],
      [3, undefined, "kept"],
      // An orphan: nothing references it.
      [9, undefined, "orphan"],
    ];
    const folder = mapFolder({
      "war3map.w3u": buildObjectData({
        original: [{ original: "hfoo" }],
        ...captain([]),
      }),
      "war3mapSkin.w3u": buildObjectData({
        // A reference to a missing string, above every block.
        original: [
          {
            original: "hfoo",
            modifications: [{ field: "utip", value: "TRIGSTR_12" }],
          },
        ],
        ...captain([{ field: "unam", value: "TRIGSTR_001" }]),
      }),
      "war3map.wts": wts(blocks),
    });
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "h000", field: "utip" }, "Strong");

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      "war3mapSkin.w3u",
      "war3map.wts",
    ]);
    expectObjectData(folder, {
      "war3mapSkin.w3u": {
        original: [
          {
            original: "hfoo",
            modifications: [{ field: "utip", value: "TRIGSTR_12" }],
          },
        ],
        ...captain([
          { field: "unam", value: "TRIGSTR_001" },
          { field: "utip", value: "TRIGSTR_013" },
        ]),
      },
    });
    expect(textOf(folder, "war3map.wts")).toBe(
      wts([...blocks, [13, CAPTAIN_TIP, "Strong"]]),
    );
  });

  it("is appended in the Editor form with the editor's comment, the object's name from its own, its base's or the game's, the rest of war3map.wts byte for byte", () => {
    const folder = fixtureCopy();
    const original = textOf(folder, "war3map.wts") ?? "";
    const editor = open(folder);

    editor.setField(
      { kind: "unit", rawcode: "hfoo", field: "utip" },
      "Hold the line.",
    );
    editor.setField(
      { kind: "ability", rawcode: "AHhb", field: "anam" },
      "Lesser Light",
    );
    editor.setField(
      { kind: "ability", rawcode: "A000", field: "atp1", level: 2 },
      "Blizzard - [|cffffcc00Level 2|r]\nCalls down waves.",
    );
    editor.setField({ kind: "buff", rawcode: "B000", field: "fube" }, "Burns.");
    editor.setField({ kind: "item", rawcode: "ratc", field: "utip" }, "Claws");

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      "war3mapSkin.w3u",
      "war3mapSkin.w3t",
      "war3mapSkin.w3a",
      "war3mapSkin.w3h",
      "war3map.wts",
    ]);
    expect(textOf(folder, "war3map.wts")).toBe(
      original +
        wts(
          [
            [
              18,
              "// Units: hfoo (Militia), Tip (Tooltip - Basic)",
              "Hold the line.",
            ],
            [
              19,
              "// Abilities: AHhb (Lesser Light), Name (Name)",
              "Lesser Light",
            ],
            [
              20,
              "// Abilities: A000 (Arctic Blizzard), Tip (Tooltip - Normal)",
              "Blizzard - [|cffffcc00Level 2|r]\nCalls down waves.",
            ],
            [
              21,
              "// Buffs/Effects: B000 (), Buffubertip (Tooltip - Extended)",
              "Burns.",
            ],
            [
              22,
              "// Items: ratc (Claws of Attack +12), Tip (Tooltip - Basic)",
              "Claws",
            ],
          ],
          { bom: false },
        ),
    );
    const reopened = open(folder);
    expect(reopened.warnings).toEqual([]);
    expect(
      reopened
        .objects("ability")
        .find(({ rawcode }) => rawcode === "A000")
        ?.modifications.find(({ field }) => field === "atp1"),
    ).toEqual({
      field: "atp1",
      type: "string",
      level: 2,
      dataPointer: 0,
      value: "Blizzard - [|cffffcc00Level 2|r]\nCalls down waves.",
      stored: "TRIGSTR_020",
      file: "war3mapSkin.w3a",
    });
  });

  it("is numbered above a TRIGSTR another file of the map folder holds, so that a reference to a missing string never names it", () => {
    const folder = units([], [], {
      "war3map.wts": wts([[1, undefined, "first"]]),
      "war3map.lua": 'local s = "TRIGSTR_040"\n',
    });
    const editor = open(folder);

    editor.setField(
      { kind: "unit", rawcode: "h000", field: "unam" },
      "Captain",
    );
    editor.save(undefined, NO_WINDOW);

    expectObjectData(folder, {
      "war3mapSkin.w3u": captain([{ field: "unam", value: "TRIGSTR_041" }]),
    });
  });

  it("is listed resolved before the save", () => {
    const editor = open(units([], []));

    editor.setField(
      { kind: "unit", rawcode: "h000", field: "unam" },
      "Captain",
    );

    expect(editor.objects("unit")).toEqual([
      {
        kind: "unit",
        origin: "custom",
        rawcode: "h000",
        base: "hfoo",
        name: "Captain",
        modifications: [
          {
            field: "unam",
            type: "string",
            value: "Captain",
            stored: "TRIGSTR_001",
            file: "war3mapSkin.w3u",
          },
        ],
      },
    ]);
  });
});

describe("a changed string", () => {
  it("goes into its own STRING n when nothing else references it, its comment rewritten, every other byte kept", () => {
    const folder = fixtureCopy();
    const original = textOf(folder, "war3map.wts") ?? "";
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "h000", field: "unam" }, "Major");

    expect(editor.save(undefined, NO_WINDOW).written).toEqual(["war3map.wts"]);
    expect(textOf(folder, "war3map.wts")).toBe(
      original.replace(
        "STRING 8\r\n// Units: h000 (Captain), Name (Name)\r\n{\r\nCaptain\r\n}",
        "STRING 8\r\n// Units: h000 (Major), Name (Name)\r\n{\r\nMajor\r\n}",
      ),
    );
  });

  it("goes into a new STRING n when another modification references its number, in any zero padding", () => {
    const blocks: Block[] = [[1, CAPTAIN_NAME, "Captain"]];
    const folder = mapFolder({
      "war3map.w3u": buildObjectData({
        custom: [
          { original: "hfoo", custom: "h000" },
          { original: "hfoo", custom: "h001" },
        ],
      }),
      "war3mapSkin.w3u": buildObjectData({
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [{ field: "unam", value: "TRIGSTR_001" }],
          },
          {
            original: "hfoo",
            custom: "h001",
            modifications: [{ field: "unam", value: "TRIGSTR_1" }],
          },
        ],
      }),
      "war3map.wts": wts(blocks),
    });
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "h000", field: "unam" }, "Major");
    editor.save(undefined, NO_WINDOW);

    expect(textOf(folder, "war3map.wts")).toBe(
      wts([...blocks, [2, "// Units: h000 (Major), Name (Name)", "Major"]]),
    );
    expect(
      open(folder)
        .objects("unit")
        .map(({ name }) => name),
    ).toEqual(["Major", "Captain"]);
  });

  it.each([
    ["war3map.lua", 'local s = GetLocalizedString("TRIGSTR_1")\n'],
    ["war3map.wtg", "\0TRIGSTR_00001\0"],
  ])("goes into a new STRING n when %s holds its TRIGSTR", (file, contents) => {
    const blocks: Block[] = [[1, CAPTAIN_NAME, "Captain"]];
    const folder = units([], [{ field: "unam", value: "TRIGSTR_001" }], {
      "war3map.wts": wts(blocks),
      [file]: contents,
    });
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "h000", field: "unam" }, "Major");
    editor.save(undefined, NO_WINDOW);

    expectObjectData(folder, {
      "war3mapSkin.w3u": captain([{ field: "unam", value: "TRIGSTR_002" }]),
    });
    expect(textOf(folder, "war3map.wts")).toBe(
      wts([...blocks, [2, "// Units: h000 (Major), Name (Name)", "Major"]]),
    );
  });

  it("TRIGSTR_1000 and above are written with their own digits", () => {
    const folder = units([], [{ field: "unam", value: "TRIGSTR_999" }], {
      "war3map.wts": wts([[999, CAPTAIN_NAME, "Captain"]]),
      "war3map.lua": "TRIGSTR_999",
    });
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "h000", field: "unam" }, "Major");
    editor.save(undefined, NO_WINDOW);

    expectObjectData(folder, {
      "war3mapSkin.w3u": captain([{ field: "unam", value: "TRIGSTR_1000" }]),
    });
  });
});

describe("a string an edit leaves unreferenced", () => {
  const blocks: Block[] = [
    [1, undefined, "first"],
    [2, CAPTAIN_NAME, "Captain"],
    [3, CAPTAIN_TIP, "Strong"],
  ];

  it.each([
    ["unam", [blocks[0], blocks[2]]],
    ["utip", [blocks[0], blocks[1]]],
  ] as const)(
    "is removed, %s's block and the blank line before it",
    (field, kept) => {
      const folder = units(
        [],
        [
          { field: "unam", value: "TRIGSTR_002" },
          { field: "utip", value: "TRIGSTR_003" },
        ],
        { "war3map.wts": wts(blocks) },
      );
      const editor = open(folder);

      editor.removeField({ kind: "unit", rawcode: "h000", field });
      editor.save(undefined, NO_WINDOW);

      expect(textOf(folder, "war3map.wts")).toBe(wts(kept));
    },
  );

  it("is removed when it was the first block, the file's head kept", () => {
    const folder = units([], [{ field: "unam", value: "TRIGSTR_001" }], {
      "war3map.wts": wts([
        [1, CAPTAIN_NAME, "Captain"],
        [2, undefined, "second"],
      ]),
      "war3map.lua": "TRIGSTR_002",
    });
    const editor = open(folder);

    editor.removeField({ kind: "unit", rawcode: "h000", field: "unam" });
    editor.save(undefined, NO_WINDOW);

    expect(textOf(folder, "war3map.wts")).toBe(wts([[2, undefined, "second"]]));
  });

  it("is removed when a set replaces its reference with a new one, as in a foreign layout", () => {
    const folder = units(
      [{ field: "unam", value: "TRIGSTR_001" }],
      [{ field: "unam", value: "TRIGSTR_002" }],
      {
        "war3map.wts": wts([
          [1, CAPTAIN_NAME, "Captain"],
          [2, CAPTAIN_NAME, "Captain"],
        ]),
      },
    );
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "h000", field: "unam" }, "Major");
    editor.save(undefined, NO_WINDOW);

    expectObjectData(folder, {
      "war3map.w3u": captain([]),
      "war3mapSkin.w3u": captain([{ field: "unam", value: "TRIGSTR_002" }]),
    });
    expect(textOf(folder, "war3map.wts")).toBe(
      wts([[2, "// Units: h000 (Major), Name (Name)", "Major"]]),
    );
  });

  it.each([
    ["war3map.lua", "TRIGSTR_02"],
    [
      "war3map.w3i",
      new Uint8Array([
        1,
        0,
        0,
        0,
        ...new TextEncoder().encode("TRIGSTR_002"),
        0,
        7,
      ]),
    ],
  ] as const)("is kept when %s holds its TRIGSTR", (file, contents) => {
    const folder = units(
      [],
      [
        { field: "unam", value: "TRIGSTR_002" },
        { field: "utip", value: "TRIGSTR_003" },
      ],
      { "war3map.wts": wts(blocks), [file]: contents },
    );
    const editor = open(folder);

    editor.removeField({ kind: "unit", rawcode: "h000", field: "unam" });

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      "war3mapSkin.w3u",
    ]);
    expect(textOf(folder, "war3map.wts")).toBe(wts(blocks));
  });
});

describe("a foreign literal", () => {
  it("is converted to a TRIGSTR and moved to the Skin file when its field is set, the object's other modifications kept as read", () => {
    const folder = units(
      [
        { field: "umvs", value: 300 },
        { field: "unam", value: "Captain" },
        { field: "uhpm", value: 420 },
      ],
      [{ field: "utip", value: "A literal tip" }],
      { "war3map.wts": wts([[1, undefined, "first"]]) },
    );
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "h000", field: "unam" }, "Major");

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      "war3map.w3u",
      "war3mapSkin.w3u",
      "war3map.wts",
    ]);
    expectObjectData(folder, {
      "war3map.w3u": captain([
        { field: "umvs", value: 300 },
        { field: "uhpm", value: 420 },
      ]),
      "war3mapSkin.w3u": captain([
        { field: "utip", value: "A literal tip" },
        { field: "unam", value: "TRIGSTR_002" },
      ]),
    });
    expect(textOf(folder, "war3map.wts")).toBe(
      wts([
        [1, undefined, "first"],
        [2, "// Units: h000 (Major), Name (Name)", "Major"],
      ]),
    );
  });

  it("is converted in place when it is in the right file", () => {
    const folder = units(
      [],
      [
        { field: "unam", value: "Captain" },
        { field: "umdl", value: "units\\Footman.mdl" },
      ],
      { "war3map.wts": wts([[1, undefined, "first"]]) },
    );
    const editor = open(folder);

    editor.setField({ kind: "unit", rawcode: "h000", field: "unam" }, "Major");
    editor.save(undefined, NO_WINDOW);

    expectObjectData(folder, {
      "war3mapSkin.w3u": captain([
        { field: "unam", value: "TRIGSTR_002" },
        { field: "umdl", value: "units\\Footman.mdl" },
      ]),
    });
  });
});

describe("war3map.wts", () => {
  it("is created with a byte order mark and CRLF when the map folder lacks it", () => {
    const folder = units([{ field: "umvs", value: 300 }], []);
    const editor = open(folder);

    editor.setField(
      { kind: "unit", rawcode: "h000", field: "unam" },
      "Captain",
    );

    expect(editor.save(undefined, NO_WINDOW).written).toEqual([
      "war3mapSkin.w3u",
      "war3map.wts",
    ]);
    expect(textOf(folder, "war3map.wts")).toBe(
      wts([[1, CAPTAIN_NAME, "Captain"]]),
    );
    expectObjectData(folder, {
      "war3mapSkin.w3u": captain([{ field: "unam", value: "TRIGSTR_001" }]),
    });
  });

  it("keeps its LF line ends and its lack of a byte order mark when a block is added", () => {
    const layout = { bom: false, eol: "\n" };
    const blocks: Block[] = [[1, undefined, "first"]];
    const folder = units([], [], { "war3map.wts": wts(blocks, layout) });
    const editor = open(folder);

    editor.setField(
      { kind: "unit", rawcode: "h000", field: "unam" },
      "Captain",
    );
    editor.save(undefined, NO_WINDOW);

    expect(textOf(folder, "war3map.wts")).toBe(
      wts([...blocks, [2, CAPTAIN_NAME, "Captain"]], layout),
    );
  });

  it("gets a blank line before a new block when it ends without one", () => {
    const folder = units([], [], {
      "war3map.wts": "STRING 1\r\n{\r\nfirst\r\n}",
    });
    const editor = open(folder);

    editor.setField(
      { kind: "unit", rawcode: "h000", field: "unam" },
      "Captain",
    );
    editor.save(undefined, NO_WINDOW);

    expect(textOf(folder, "war3map.wts")).toBe(
      "STRING 1\r\n{\r\nfirst\r\n}\r\n\r\n" +
        wts([[2, CAPTAIN_NAME, "Captain"]], { bom: false }),
    );
  });
});

describe("a localizable string refused", () => {
  it.each([
    ["a NUL byte", "a\0b"],
    ["a carriage return", "a\r\nb"],
    ["a line of a closing brace alone", "a\n}\nb"],
    ["a number", 7],
  ])("%s", (_case, value) => {
    const folder = units([], [], { "war3map.wts": wts([[1, undefined, "x"]]) });
    const editor = open(folder);
    let error: unknown;
    try {
      editor.setField({ kind: "unit", rawcode: "h000", field: "unam" }, value);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ObjectDataWriterError);
    expect(error).toMatchObject({ reason: "invalid-value" });
    expect(editor.save(undefined, NO_WINDOW).written).toEqual([]);
  });
});
