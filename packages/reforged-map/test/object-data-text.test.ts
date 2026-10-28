// The git textconv driver (#635): the text of one Object data file, from
// the exported function on every fixture and on the edge cases the
// test-only encoder builds; the command (dist/cli.js, so `pnpm build` runs
// first) on a file and on one it cannot read; and `git diff` in a temporary
// git repository with the attributes and the configuration the Template
// sets (phmilk/reforged-ts-template#97).

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { objectDataText } from "../src/index.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  makeTempDir,
  removeTemporary,
} from "./support/map-folder.js";
import { buildObjectData, type TestObjectData } from "./support/object-data.js";

afterAll(removeTemporary);

/** The text of the encoder's file, under the name the game gives it. */
function text(name: string, data: TestObjectData): string {
  return objectDataText(buildObjectData(data), name);
}

/** The lines of a text, each with its LF. */
function lines(...each: string[]): string {
  return each.map((line) => `${line}\n`).join("");
}

/** One line of a hex dump, as `hexdump -C` prints it. */
function dumpLine(offset: string, columns: string, ascii: string): string {
  return `${offset}  ${columns.padEnd(48)}  |${ascii}|`;
}

describe("the text of an Object data file", () => {
  const abilities = (version: number): TestObjectData => ({
    version,
    levels: true,
    original: [
      {
        original: "AHbz",
        modifications: [{ field: "Hbz1", level: 2, dataPointer: 1, value: 8 }],
      },
    ],
    custom: [
      {
        original: "AHhb",
        custom: "A000",
        modifications: [
          { field: "anam", value: "Holy Fire" },
          {
            field: "Hhb1",
            level: 1,
            dataPointer: 1,
            type: 2,
            value: 1.5,
          },
        ],
      },
    ],
  });

  it.each([1, 2, 3])(
    "of format version %i names the file, the version and the counts, then each object and its modifications",
    (version) => {
      expect(text("war3map.w3a", abilities(version))).toBe(
        lines(
          `war3map.w3a, format version ${String(version)}: 1 builtin, 1 custom`,
          "builtin AHbz",
          "  Hbz1 int level 2 data 1 = 8",
          "custom A000 from AHhb",
          '  anam string level 0 data 0 = "Holy Fire"',
          "  Hhb1 unreal level 1 data 1 = 1.5",
        ),
      );
    },
  );

  it("gives a unit's modification no level and no data pointer", () => {
    expect(
      text("war3map.w3u", {
        version: 2,
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [
              { field: "umvs", value: 300 },
              { field: "unam", value: "TRIGSTR_001" },
            ],
          },
        ],
      }),
    ).toBe(
      lines(
        "war3map.w3u, format version 2: 0 builtin, 1 custom",
        "custom h000 from hfoo",
        "  umvs int = 300",
        '  unam string = "TRIGSTR_001"',
      ),
    );
  });

  it("shows an end marker other than the object's own Rawcode, which the 3.0 World Editor writes", () => {
    expect(
      text("war3map.w3u", {
        original: [
          {
            original: "hfoo",
            modifications: [
              { field: "umvs", value: 300 },
              { field: "uhpm", value: 420, end: "\0\0\0\0" },
            ],
          },
          {
            original: "hkni",
            modifications: [{ field: "umvs", value: 320, end: "xyzw" }],
          },
        ],
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [
              { field: "umvs", value: 1 },
              { field: "uhpm", value: 2, end: "\0\0\0\0" },
              { field: "uhpm", value: 3, end: "hfoo" },
            ],
          },
        ],
      }),
    ).toBe(
      lines(
        "war3map.w3u, format version 3: 2 builtin, 1 custom",
        "builtin hfoo",
        "  umvs int = 300",
        '  uhpm int = 420, end "\\u0000\\u0000\\u0000\\u0000"',
        "builtin hkni",
        "  umvs int = 320, end xyzw",
        "custom h000 from hfoo",
        "  umvs int = 1",
        '  uhpm int = 2, end "\\u0000\\u0000\\u0000\\u0000"',
        "  uhpm int = 3, end hfoo",
      ),
    );
  });

  it("shows a set count and flags other than one set of flag 0, and a Built-in object's Custom slot", () => {
    expect(
      text("war3map.w3u", {
        original: [
          { original: "hfoo", custom: "h009" },
          { original: "hkni", sets: [{ flag: 7, modifications: [] }] },
        ],
        custom: [
          { original: "hfoo", custom: "h000", sets: [] },
          { original: "hfoo", custom: "h000" },
        ],
      }),
    ).toBe(
      lines(
        "war3map.w3u, format version 3: 2 builtin, 2 custom",
        "builtin hfoo, slot h009",
        "builtin hkni, 1 set, flag 7",
        "custom h000 from hfoo, 0 sets",
        "custom h000 from hfoo",
      ),
    );
  });

  it("JSON-quotes a field id that is not four printable characters", () => {
    expect(
      text("war3map.w3u", {
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [{ field: "Crs\0", value: 1 }],
          },
        ],
      }),
    ).toBe(
      lines(
        "war3map.w3u, format version 3: 0 builtin, 1 custom",
        "custom h000 from hfoo",
        '  "Crs\\u0000" int = 1',
      ),
    );
  });

  it("gives a real as the shortest decimal of its 32 bits, and its bits in hex when it is not finite", () => {
    expect(
      text("war3map.w3u", {
        original: [
          {
            original: "hfoo",
            modifications: [
              { field: "ucs1", type: 1, value: 0.1 },
              { field: "ucs2", type: 2, value: 3.4028234663852886e38 },
              { field: "ucs3", type: 1, value: 1e-7 },
              { field: "ucs4", type: 1, value: -2.5 },
              { field: "ucs5", type: 1, value: -0 },
              { field: "uacq", type: 1, value: 0, bits: 0x7fa00001 },
              { field: "uacq", type: 2, value: 0, bits: 0xffc00000 },
              { field: "ussc", type: 2, value: Infinity },
              { field: "ussc", type: 1, value: -Infinity },
            ],
          },
        ],
      }),
    ).toBe(
      lines(
        "war3map.w3u, format version 3: 1 builtin, 0 custom",
        "builtin hfoo",
        "  ucs1 real = 0.1",
        "  ucs2 unreal = 3.4028235e+38",
        "  ucs3 real = 1e-7",
        "  ucs4 real = -2.5",
        "  ucs5 real = -0",
        "  uacq real = 0x7fa00001",
        "  uacq unreal = 0xffc00000",
        "  ussc unreal = 0x7f800000",
        "  ussc real = 0xff800000",
      ),
    );
  });

  it("JSON-quotes a string, escaping what a reader cannot see, and gives its bytes in hex when they are not valid UTF-8", () => {
    expect(
      text("war3map.w3u", {
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [
              { field: "unam", value: "Chevalier Élu" },
              { field: "utip", value: 'Line 1\nLine "2"' },
              { field: "ub1a", value: "\ufeffTip" },
              { field: "ub1b", value: "" },
              {
                field: "ub1c",
                value: "",
                bytes: new Uint8Array([0x43, 0xff, 0xc3, 0x28, 0x80]),
              },
            ],
          },
        ],
      }),
    ).toBe(
      lines(
        "war3map.w3u, format version 3: 0 builtin, 1 custom",
        "custom h000 from hfoo",
        '  unam string = "Chevalier Élu"',
        '  utip string = "Line 1\\nLine \\"2\\""',
        '  ub1a string = "\\ufeffTip"',
        '  ub1b string = ""',
        "  ub1c string = 0x43ffc32880",
      ),
    );
  });

  it("gives the bytes after the last table as a hex dump", () => {
    expect(
      text("war3map.w3u", {
        custom: [{ original: "hfoo", custom: "h000" }],
        trailing: Uint8Array.from(
          { length: 18 },
          (_, index) => [0x41, 0, 0xff][index % 3] ?? 0,
        ),
      }),
    ).toBe(
      lines(
        "war3map.w3u, format version 3: 0 builtin, 1 custom",
        "custom h000 from hfoo",
        "trailing 18 bytes",
        `  ${dumpLine("00000000", "41 00 ff 41 00 ff 41 00  ff 41 00 ff 41 00 ff 41", "A..A..A..A..A..A")}`,
        `  ${dumpLine("00000010", "00 ff", "..")}`,
      ),
    );
  });

  it.each([
    ["war3mapSkin.w3a", "war3mapSkin.w3a"],
    ["/tmp/Xq3Ab1_war3mapSkin.w3a", "war3mapSkin.w3a"],
    ["C:\\maps\\my.w3m\\WAR3MAPSKIN.W3A", "war3mapSkin.w3a"],
    ["/tmp/Xq3Ab1_war3map.w3d", "war3map.w3d"],
    ["war3map.w3q", "war3map.w3q"],
  ])(
    "takes the Object kind and the Skin flag from the end of %s",
    (fileName, name) => {
      const levelled = !name.endsWith(".w3u");
      expect(
        objectDataText(
          buildObjectData({
            levels: levelled,
            original: [
              {
                original: "Aabc",
                modifications: [{ field: "anam", value: 1 }],
              },
            ],
          }),
          fileName,
        ),
      ).toBe(
        lines(
          `${name}, format version 3: 1 builtin, 0 custom`,
          "builtin Aabc",
          "  anam int level 0 data 0 = 1",
        ),
      );
    },
  );

  it.each([
    [
      "truncated",
      "war3map.w3u",
      buildObjectData({}).subarray(0, 6),
      "war3map.w3u: not read (truncated)",
    ],
    [
      "of an unknown format version",
      "war3mapSkin.w3t",
      buildObjectData({ version: 4 }),
      "war3mapSkin.w3t: not read (unknown format version 4)",
    ],
    [
      "with a set count above 1",
      "war3map.w3u",
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
      "war3map.w3u: not read (h000 has 2 sets, whose layout is not settled, #460)",
    ],
    [
      "named after no Object kind",
      "/tmp/war3map.w3e",
      new Uint8Array([3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      "war3map.w3e: not read (its name ends in none of .w3u, .w3t, .w3a, .w3h, .w3b, .w3d, .w3q)",
    ],
  ])(
    "of a file %s gives the reason, then a hex dump of the file",
    (_case, name, bytes, reason) => {
      const [first, ...dump] = objectDataText(bytes, name)
        .split("\n")
        .slice(0, -1);

      expect(first).toBe(reason);
      // The dump's hex columns, read back, are the file's bytes.
      expect(
        dump.flatMap((line, index) => {
          expect(line.slice(0, 8)).toBe(
            (index * 16).toString(16).padStart(8, "0"),
          );
          return line
            .slice(10, 58)
            .trim()
            .split(/ +/)
            .map((byte) => Number.parseInt(byte, 16));
        }),
      ).toEqual([...bytes]);
    },
  );

  it("gives a truncated file's reason and its whole dump", () => {
    expect(
      objectDataText(new Uint8Array([3, 0, 0, 0, 1, 0]), "war3map.w3u"),
    ).toBe(
      lines(
        "war3map.w3u: not read (truncated)",
        dumpLine("00000000", "03 00 00 00 01 00", "......"),
      ),
    );
  });
});

describe("the text of the fixtures", () => {
  /** The text of a committed fixture file, under the name the game gives it. */
  function fixtureText(folder: string, file: string, name = file): string {
    return objectDataText(
      fs.readFileSync(path.join(fixtureMap(folder), file)),
      name,
    );
  }

  // Saved by the 3.0 World Editor (test/fixtures/editor-objects.md): its
  // end markers are the objects' own Rawcodes, so none shows.
  it.each([
    [
      "war3map.w3u",
      [
        "war3map.w3u, format version 3: 1 builtin, 2 custom",
        "builtin hfoo",
        "custom h000 from hfoo",
        "custom h001 from hkni",
      ],
    ],
    [
      "war3mapSkin.w3u",
      [
        "war3mapSkin.w3u, format version 3: 1 builtin, 2 custom",
        "builtin hfoo",
        '  unam string = "TRIGSTR_007"',
        "custom h000 from hfoo",
        '  unam string = "TRIGSTR_008"',
        "custom h001 from hkni",
        '  unam string = "TRIGSTR_009"',
      ],
    ],
    [
      "war3map.w3t",
      [
        "war3map.w3t, format version 3: 1 builtin, 1 custom",
        "builtin ratc",
        "  igol int = 600",
        "custom I000 from ratc",
      ],
    ],
    [
      "war3mapSkin.w3t",
      [
        "war3mapSkin.w3t, format version 3: 1 builtin, 1 custom",
        "builtin ratc",
        "custom I000 from ratc",
        '  unam string = "TRIGSTR_010"',
      ],
    ],
    [
      "war3map.w3a",
      [
        "war3map.w3a, format version 3: 1 builtin, 1 custom",
        "builtin AHhb",
        "  amcs int level 1 data 0 = 70",
        "custom A000 from AHbz",
        "  amcs int level 1 data 0 = 80",
        "  amcs int level 2 data 0 = 100",
        "  amcs int level 3 data 0 = 120",
      ],
    ],
    [
      "war3mapSkin.w3a",
      [
        "war3mapSkin.w3a, format version 3: 1 builtin, 1 custom",
        "builtin AHhb",
        "custom A000 from AHbz",
        '  anam string level 0 data 0 = "TRIGSTR_014"',
      ],
    ],
    [
      "war3map.w3h",
      [
        "war3map.w3h, format version 3: 1 builtin, 1 custom",
        "builtin Binf",
        "custom B000 from Binf",
      ],
    ],
    [
      "war3mapSkin.w3h",
      [
        "war3mapSkin.w3h, format version 3: 1 builtin, 1 custom",
        "builtin Binf",
        '  ftip string = "TRIGSTR_015"',
        "custom B000 from Binf",
        '  ftip string = "TRIGSTR_016"',
      ],
    ],
    [
      "war3map.w3b",
      [
        "war3map.w3b, format version 3: 1 builtin, 1 custom",
        "builtin LTlt",
        "  bhps unreal = 80",
        "custom B000 from LTlt",
      ],
    ],
    [
      "war3mapSkin.w3b",
      [
        "war3mapSkin.w3b, format version 3: 1 builtin, 1 custom",
        "builtin LTlt",
        "custom B000 from LTlt",
        '  bnam string = "TRIGSTR_011"',
      ],
    ],
    [
      "war3map.w3d",
      [
        "war3map.w3d, format version 3: 1 builtin, 1 custom",
        "builtin AObr",
        '  dnam string level 0 data 0 = "TRIGSTR_012"',
        "custom D000 from AOks",
        '  dnam string level 0 data 0 = "TRIGSTR_013"',
      ],
    ],
    [
      "war3mapSkin.w3d",
      [
        "war3mapSkin.w3d, format version 3: 1 builtin, 1 custom",
        "builtin AObr",
        "custom D000 from AOks",
      ],
    ],
    [
      "war3map.w3q",
      [
        "war3map.w3q, format version 3: 1 builtin, 1 custom",
        "builtin Rhar",
        "  gglb int level 0 data 0 = 200",
        "custom R000 from Rhme",
      ],
    ],
    [
      "war3mapSkin.w3q",
      [
        "war3mapSkin.w3q, format version 3: 1 builtin, 1 custom",
        "builtin Rhar",
        "custom R000 from Rhme",
        '  gnam string level 0 data 0 = "TRIGSTR_017"',
      ],
    ],
  ])("of editor-objects.w3m's %s", (file, expected) => {
    expect(fixtureText("editor-objects.w3m", file)).toBe(lines(...expected));
  });

  it.each(["w3u", "w3t", "w3b", "w3d", "w3h", "w3q"])(
    "of wc3libs' empty war3map.%s",
    (extension) => {
      expect(fixtureText("wc3libs", `war3map.${extension}`)).toBe(
        lines(`war3map.${extension}, format version 2: 0 builtin, 0 custom`),
      );
    },
  );

  // Its Custom object's modifications end with four NUL bytes, which the
  // 3.0 World Editor does not write: each shows.
  it("of wc3libs' lumber bounty units, base and Skin file", () => {
    expect(
      fixtureText("wc3libs", "war3map_v3_lumber_bounty.w3u", "war3map.w3u"),
    ).toBe(
      lines(
        "war3map.w3u, format version 3: 1 builtin, 1 custom",
        "builtin hfoo",
        "  ulba int = 1",
        "  ulbd int = 2",
        "  ulbs int = 3",
        "custom h000 from hfoo",
        '  ulba int = 1, end "\\u0000\\u0000\\u0000\\u0000"',
        '  ulbd int = 2, end "\\u0000\\u0000\\u0000\\u0000"',
        '  ulbs int = 3, end "\\u0000\\u0000\\u0000\\u0000"',
      ),
    );
    expect(
      fixtureText(
        "wc3libs",
        "war3mapSkin_v3_lumber_bounty.w3u",
        "war3mapSkin.w3u",
      ),
    ).toBe(
      lines(
        "war3mapSkin.w3u, format version 3: 1 builtin, 1 custom",
        "builtin hfoo",
        "custom h000 from hfoo",
        '  unam string = "TRIGSTR_003", end "\\u0000\\u0000\\u0000\\u0000"',
      ),
    );
  });

  // Too large to spell out: the header, the first object, the counts of
  // lines and of end markers shown, and the text's SHA-256, which any change
  // to the text changes.
  it.each([
    [
      "war3map.w3a",
      "war3map.w3a",
      ["war3map.w3a, format version 2: 117 builtin, 0 custom", "builtin ADaA"],
      1983,
      1865,
      "acf46c072690079c527fd0783fb75a0f80b4b501a6fef9bdf525413e4e63dbe1",
    ],
    [
      "war3map_format3.w3a",
      "war3map.w3a",
      [
        "war3map.w3a, format version 3: 1 builtin, 45 custom",
        "builtin Ahrp",
        "  aran unreal level 1 data 0 = 5",
        "custom A000 from Ahar",
        "  Har2 int level 1 data 2 = 3, end Ahar",
      ],
      267,
      219,
      "f1f25a841d6ee6f841f852d400a21321ea19223e37912e349d0b83faf0be3fb5",
    ],
    [
      "war3map_large_v3.w3a",
      "war3map.w3a",
      ["war3map.w3a, format version 3: 34 builtin, 906 custom", "builtin ANcs"],
      14219,
      13278,
      "6ed1ce78c934431a28ffed55c4bb1b681c2c6640056b39a5d71fca06b7d7c32e",
    ],
    [
      "threeLetterId.w3a",
      "war3map.w3a",
      [
        "war3map.w3a, format version 3: 33 builtin, 1377 custom",
        "builtin Atdg",
        '  atar string level 1 data 0 = "air,enemies,ground", end "\\u0000\\u0000\\u0000\\u0000"',
      ],
      20004,
      157,
      "a568e0d96b57aee17c5458011850f80cc45fba6f7721b58892420ab963d02555",
    ],
    [
      "war3mapSkin.w3a",
      "war3mapSkin.w3a",
      [
        "war3mapSkin.w3a, format version 3: 34 builtin, 906 custom",
        "builtin ANcs",
        '  aub1 string level 1 data 0 = "TRIGSTR_6122", end "\\u0000\\u0000\\u0000\\u0000"',
      ],
      9801,
      8860,
      "15dbb47484ddac1fde7f3127d8dcc78ec2f29aec24ef93c08db8af9e00c3bfea",
    ],
    [
      "war3mapReforged.w3u",
      "war3map.w3u",
      [
        "war3map.w3u, format version 3: 0 builtin, 464 custom",
        "custom n000 from ngme",
        "  ucol unreal = 30",
        '  upat string = "PathTextures\\\\4x4unbuildable.tga"',
      ],
      8885,
      2,
      "d184d08411b1e23d8913617ba42b8f4e0b0358a31f3a2849c328456db8fccc41",
    ],
  ])("of wc3libs' %s", (fixture, name, first, lineCount, endsShown, digest) => {
    const result = fixtureText("wc3libs", fixture, name);
    const all = result.split("\n").slice(0, -1);

    expect(all.slice(0, first.length)).toEqual(first);
    expect(all).toHaveLength(lineCount);
    expect(all.filter((line) => line.includes(", end "))).toHaveLength(
      endsShown,
    );
    expect(result.endsWith("\n")).toBe(true);
    expect(sha256(result)).toBe(digest);
  });

  it("of a fixture does not depend on the path git gives the file", () => {
    expect(
      fixtureText(
        "editor-objects.w3m",
        "war3mapSkin.w3a",
        "/tmp/a1B2c3_war3mapSkin.w3a",
      ),
    ).toBe(fixtureText("editor-objects.w3m", "war3mapSkin.w3a"));
  });
});

/** The SHA-256 of a text, in hex. */
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** The package's command, as built by `pnpm build`. */
const CLI = path.join(PACKAGE_ROOT, "dist", "cli.js");

/** Runs `reforged-map` with these arguments, and gives its exit code and output. */
function run(...args: string[]): {
  status: number | null;
  stdout: string;
  stderr: string;
} {
  const { status, stdout, stderr } = spawnSync(
    process.execPath,
    [CLI, ...args],
    { encoding: "utf8" },
  );
  return { status, stdout, stderr };
}

describe("reforged-map textconv", () => {
  it("prints the function's text of a file, and exits 0", () => {
    const file = path.join(makeTempDir(), "war3mapSkin.w3a");
    fs.copyFileSync(path.join(fixtureMap("wc3libs"), "war3mapSkin.w3a"), file);

    expect(run("textconv", file)).toEqual({
      status: 0,
      stdout: objectDataText(fs.readFileSync(file), file),
      stderr: "",
    });
  });

  it("prints the reason and a hex dump of a truncated file, and exits 0", () => {
    const file = path.join(makeTempDir(), "war3map.w3u");
    fs.writeFileSync(file, new Uint8Array([3, 0, 0, 0, 1, 0]));

    expect(run("textconv", file)).toEqual({
      status: 0,
      stdout: lines(
        "war3map.w3u: not read (truncated)",
        dumpLine("00000000", "03 00 00 00 01 00", "......"),
      ),
      stderr: "",
    });
  });

  it("prints its usage and exits 2 without a subcommand and a file", () => {
    for (const args of [[], ["textconv"], ["diff", "war3map.w3u"]]) {
      expect(run(...args)).toEqual({
        status: 2,
        stdout: "",
        stderr: "Usage: reforged-map textconv <file>\n",
      });
    }
  });

  it("loads only the reader: no generator, no lookup, no reforged-builtins", () => {
    const loaded = new Set<string>();
    const visit = (file: string): void => {
      if (loaded.has(file)) return;
      loaded.add(file);
      const source = fs.readFileSync(
        path.join(PACKAGE_ROOT, "dist", file),
        "utf8",
      );
      for (const [, specifier] of source.matchAll(
        /^(?:import|export)\b[^;]*?from "([^"]+)"/gms,
      )) {
        if (specifier.startsWith("./"))
          visit(path.posix.join(path.posix.dirname(file), specifier));
        else loaded.add(specifier);
      }
      expect(source).not.toMatch(/\bimport\(|\brequire\(/);
    };
    visit("cli.js");

    expect([...loaded].sort()).toEqual([
      "cli.js",
      "map-folder.js",
      "model.js",
      "node:buffer",
      "node:fs",
      "node:path",
      "node:process",
      "object-data-text.js",
      "object-data.js",
    ]);
  });

  it("names a file it cannot open, and exits 1", () => {
    const missing = path.join(makeTempDir(), "war3map.w3u");
    const result = run("textconv", missing);

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(`cannot open ${missing}`);
  });
});

describe("git diff of the map folder", () => {
  /** Runs git in a folder, with no user or system configuration. */
  function git(cwd: string, ...args: string[]): string {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: path.join(PACKAGE_ROOT, "no-global-git-config"),
        GIT_AUTHOR_NAME: "Test",
        GIT_AUTHOR_EMAIL: "test@example.com",
        GIT_COMMITTER_NAME: "Test",
        GIT_COMMITTER_EMAIL: "test@example.com",
      },
    });
  }

  /** The units file of the test, the Captain moving at `speed`. */
  const units = (speed: number): Uint8Array =>
    buildObjectData({
      original: [
        { original: "hfoo", modifications: [{ field: "uhpm", value: 500 }] },
      ],
      custom: [
        {
          original: "hfoo",
          custom: "h000",
          modifications: [
            { field: "unam", value: "TRIGSTR_001" },
            { field: "uhpm", value: 800 },
            { field: "umpm", value: 100 },
            { field: "udef", value: 4 },
            { field: "umvs", value: speed },
            { field: "usid", value: 1200 },
          ],
        },
      ],
    });

  // Nine git processes and the two textconv runs of node they start. On
  // the windows runner, in `pnpm run test` of ci.yml: 1.2 s (median of 60
  // green runs, 2.2 s at most), and 6.4 s, past vitest's 5 s, in a run
  // where the runner stalled (#658).
  it("prints the one line of the field a commit changed in war3map.w3u, under its object", () => {
    const repository = path.join(makeTempDir(), "my-map");
    const mapFolder = path.join(repository, "maps", "my-map.w3m");
    fs.mkdirSync(mapFolder, { recursive: true });
    // The Map project's installation of reforged-map.
    fs.mkdirSync(path.join(repository, "node_modules"));
    fs.symlinkSync(
      PACKAGE_ROOT,
      path.join(repository, "node_modules", "reforged-map"),
      "junction",
    );
    // The attributes and the configuration of the README's setup, which
    // the Template sets.
    fs.writeFileSync(
      path.join(repository, ".gitattributes"),
      [
        "**/*.w3m/** -text",
        "**/*.w3m/war3map.w3[utahbdq] diff=reforged-object-data",
        "**/*.w3m/war3mapSkin.w3[utahbdq] diff=reforged-object-data",
        "",
      ].join("\n"),
    );
    fs.writeFileSync(path.join(repository, ".gitignore"), "node_modules/\n");
    git(repository, "init", "--quiet");
    git(
      repository,
      "config",
      "diff.reforged-object-data.textconv",
      "node node_modules/reforged-map/dist/cli.js textconv",
    );
    git(
      repository,
      "config",
      "diff.reforged-object-data.cachetextconv",
      "true",
    );
    fs.writeFileSync(path.join(mapFolder, "war3map.w3u"), units(300));
    git(repository, "add", ".");
    git(repository, "commit", "--quiet", "-m", "The Captain");
    fs.writeFileSync(path.join(mapFolder, "war3map.w3u"), units(320));
    git(repository, "commit", "--quiet", "-am", "A faster Captain");

    // From the map folder: git runs the driver at the work tree's top.
    const diff = git(mapFolder, "diff", "--no-color", "HEAD~1", "HEAD");

    expect(diff).not.toContain("Binary files");
    expect(
      diff.split("\n").filter((line) => /^[-+](?![-+]{2} )/.test(line)),
    ).toEqual(["-  umvs int = 300", "+  umvs int = 320"]);
    expect(diff).toMatch(/^@@ .* @@ custom h000 from hfoo$/m);
    // The text of each blob is cached in git's notes.
    expect(
      git(
        repository,
        "for-each-ref",
        "refs/notes/textconv/reforged-object-data",
      ),
    ).not.toBe("");
    // Every Object data file and Skin file of the map folder has the driver,
    // and every file of the map folder is -text.
    const attributes = git(
      repository,
      "check-attr",
      "diff",
      "text",
      "--",
      ...["war3map.w3u", "war3mapSkin.w3q", "war3map.wts"].map(
        (name) => `maps/my-map.w3m/${name}`,
      ),
    );
    expect(attributes).toBe(
      lines(
        "maps/my-map.w3m/war3map.w3u: diff: reforged-object-data",
        "maps/my-map.w3m/war3map.w3u: text: unset",
        "maps/my-map.w3m/war3mapSkin.w3q: diff: reforged-object-data",
        "maps/my-map.w3m/war3mapSkin.w3q: text: unset",
        "maps/my-map.w3m/war3map.wts: diff: unspecified",
        "maps/my-map.w3m/war3map.wts: text: unset",
      ),
    );
  }, 30_000);
});
