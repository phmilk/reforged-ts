import { access, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { generate } from "../src/index.js";
import {
  entry,
  globalEntry,
  typeEntry,
  writeFixture,
} from "./support/fixture.js";

/** Whether the temporary folder fixtures live in ignores case in names. */
async function caseInsensitiveTemp(): Promise<boolean> {
  const folder = await mkdtemp(join(tmpdir(), "reforged-types-case-"));
  await writeFile(join(folder, "probe"), "");
  try {
    await access(join(folder, "PROBE"));
    return true;
  } catch {
    return false;
  }
}

const caseInsensitive = await caseInsensitiveTemp();

async function run(...args: Parameters<typeof writeFixture>) {
  return generate(await writeFixture(...args));
}

async function generateOk(...args: Parameters<typeof writeFixture>) {
  const result = await run(...args);
  if (!result.ok) {
    throw new Error(
      "generation failed:\n" +
        result.diagnostics.map((d) => d.message).join("\n"),
    );
  }
  return result;
}

/** The generated text after the banner (and, for common.j, the prelude). */
function body(text: string | undefined): string {
  const blocks = (text ?? "").split("\n\n");
  const prelude = blocks[1]?.startsWith("declare interface handle ") ? 1 : 0;
  return blocks.slice(1 + prelude).join("\n\n");
}

describe("generate: the four global forms", () => {
  it("emits declare const, declare let and Record with a header carrying the Jass type and initializer", async () => {
    const blizzardJ = [
      "globals",
      "    // Misc constants",
      "    constant integer   bj_MAX_PLAYERS = 24 // trailing",
      "    real               bj_lastDuration = 0.00",
      "    itemtype           bj_stockPickedItemType",
      "    force array        bj_FORCE_PLAYER",
      "endglobals",
    ].join("\n");

    const result = await generateOk({ "blizzard.j": blizzardJ }, [
      globalEntry("blizzard.j", "bj_MAX_PLAYERS"),
      globalEntry("blizzard.j", "bj_lastDuration"),
      globalEntry("blizzard.j", "bj_stockPickedItemType"),
      globalEntry("blizzard.j", "bj_FORCE_PLAYER"),
    ]);

    expect(body(result.files.get("3.0.0/blizzard.j.d.ts"))).toBe(
      [
        "/**",
        " * Jass: constant integer (32-bit)",
        " * @defaultValue `24`",
        " * @see {@link https://lep.duckdns.org/jassbot/doc/bj_MAX_PLAYERS}",
        " */",
        "declare const bj_MAX_PLAYERS: number;",
        "",
        "/**",
        " * Jass: real",
        " * @defaultValue `0.00`",
        " * @see {@link https://lep.duckdns.org/jassbot/doc/bj_lastDuration}",
        " */",
        "declare let bj_lastDuration: number;",
        "",
        "/**",
        " * Jass: itemtype",
        " * @see {@link https://lep.duckdns.org/jassbot/doc/bj_stockPickedItemType}",
        " */",
        "declare let bj_stockPickedItemType: itemtype;",
        "",
        "/**",
        " * Jass: force array",
        " * @see {@link https://lep.duckdns.org/jassbot/doc/bj_FORCE_PLAYER}",
        " */",
        "declare let bj_FORCE_PLAYER: Record<number, force>;",
        "",
      ].join("\n"),
    );
    expect(result.diagnostics).toEqual([]);
  });

  it("types constants with the primitive or handle type, never a literal", async () => {
    const commonJ = [
      "type race extends handle",
      "globals",
      "    constant boolean   TRUE_FLAG = true",
      '    constant string    LABEL = "a // not a comment"',
      "    constant integer   RAW = 'hfoo'",
      "    constant real      PI = 3.14159",
      "    constant race      RACE_HUMAN = ConvertRace(1)",
      "endglobals",
    ].join("\n");

    const result = await generateOk(
      { "common.j": commonJ },
      ["TRUE_FLAG", "LABEL", "RAW", "PI", "RACE_HUMAN"].map((name) =>
        globalEntry("common.j", name),
      ),
    );

    const text = result.files.get("3.0.0/common.j.d.ts")!;
    expect(text).toContain("declare const TRUE_FLAG: boolean;");
    expect(text).toContain("declare const LABEL: string;");
    expect(text).toContain("declare const RAW: number;");
    expect(text).toContain("declare const PI: number;");
    expect(text).toContain("declare const RACE_HUMAN: race;");
    expect(text).toContain(' * @defaultValue `"a // not a comment"`\n');
    expect(text).toContain(" * @defaultValue `'hfoo'`\n");
    expect(text).toContain(
      " * Jass: constant race\n * @defaultValue `ConvertRace(1)`\n",
    );
  });

  it("keeps a comment terminator in an initializer from closing the header", async () => {
    const result = await generateOk(
      { "common.j": 'globals\nconstant string S = "*/"\nendglobals\n' },
      [globalEntry("common.j", "S")],
    );

    expect(result.files.get("3.0.0/common.j.d.ts")).toContain(
      ' * @defaultValue `"*\\/"`\n',
    );
  });
});

describe("generate: global Overlay facts", () => {
  const commonJ = [
    "type unit extends handle",
    "globals",
    "    unit          LAST = null",
    "    unit array    GHOULS",
    "    constant unit NONE = null",
    "endglobals",
  ].join("\n");

  it("types a nullable global as T | undefined and a nullable array's elements as T | undefined", async () => {
    const result = await generateOk({ "common.j": commonJ }, [
      globalEntry("common.j", "LAST", true),
      globalEntry("common.j", "GHOULS", true),
      globalEntry("common.j", "NONE", true),
    ]);

    const text = result.files.get("3.0.0/common.j.d.ts")!;
    expect(text).toContain("declare let LAST: unit | undefined;");
    expect(text).toContain(
      "declare let GHOULS: Record<number, unit | undefined>;",
    );
    expect(text).toContain("declare const NONE: unit | undefined;");
  });

  it("keeps a non-nullable global plain", async () => {
    const result = await generateOk({ "common.j": commonJ }, [
      globalEntry("common.j", "LAST"),
      globalEntry("common.j", "GHOULS"),
      globalEntry("common.j", "NONE"),
    ]);

    const text = result.files.get("3.0.0/common.j.d.ts")!;
    expect(text).toContain("declare let LAST: unit;");
    expect(text).toContain("declare let GHOULS: Record<number, unit>;");
    expect(text).toContain("declare const NONE: unit;");
  });

  it("renders since, deprecated and notes in the header, and never origin", async () => {
    const result = await generateOk({ "common.j": commonJ }, [
      globalEntry("common.j", "LAST", true, {
        since: "3.0.0.24268",
        deprecated: "Use the return value instead.",
        notes: "Set by CreateUnit wrappers.\nCleared on removal.",
        origin: "war3-types-strict",
      }),
      globalEntry("common.j", "GHOULS"),
      globalEntry("common.j", "NONE"),
    ]);

    expect(result.files.get("3.0.0/common.j.d.ts")).toContain(
      [
        "/**",
        " * Jass: unit",
        " * @defaultValue `null`",
        " * @patch 3.0.0.24268",
        " * @deprecated Use the return value instead.",
        " * @remarks Set by CreateUnit wrappers.",
        " * Cleared on removal.",
        " * @see {@link https://lep.duckdns.org/jassbot/doc/LAST}",
        " */",
        "declare let LAST: unit | undefined;",
      ].join("\n"),
    );
    expect(result.files.get("3.0.0/common.j.d.ts")).not.toContain(
      "war3-types-strict",
    );
  });
});

describe("generate: optional type entries", () => {
  const commonJ = [
    "type agent extends handle",
    "type unit extends agent",
    "type item extends agent",
  ].join("\n");

  it("renders deprecated and notes on the interface", async () => {
    const result = await generateOk({ "common.j": commonJ }, [
      typeEntry("common.j", "unit", {
        deprecated: "Not really.",
        notes: "A unit handle.",
      }),
    ]);

    expect(body(result.files.get("3.0.0/common.j.d.ts"))).toBe(
      [
        "declare interface agent extends handle { __agent: never }",
        "",
        "/**",
        " * @deprecated Not really.",
        " * @remarks A unit handle.",
        " */",
        "declare interface unit extends agent { __unit: never }",
        "",
        "declare interface item extends agent { __item: never }",
        "",
      ].join("\n"),
    );
    expect(result.diagnostics).toEqual([]);
  });

  it("keeps a type without an entry, or with an empty one, on one line", async () => {
    const result = await generateOk({ "common.j": commonJ }, [
      typeEntry("common.j", "item"),
    ]);

    expect(body(result.files.get("3.0.0/common.j.d.ts"))).toBe(
      [
        "declare interface agent extends handle { __agent: never }",
        "declare interface unit extends agent { __unit: never }",
        "declare interface item extends agent { __item: never }",
        "",
      ].join("\n"),
    );
  });
});

describe("generate: a file mixing every declaration kind", () => {
  it("generates types, globals, natives and functions in source order", async () => {
    const commonAi = [
      "type unit extends handle",
      "globals",
      "    constant integer GOLD = 0",
      "    unit             target = null",
      "endglobals",
      "native GetGold takes nothing returns integer",
      "function Main takes nothing returns nothing",
      "    set target = null",
      "endfunction",
    ].join("\n");

    const result = await generateOk({ "common.ai": commonAi }, [
      globalEntry("common.ai", "GOLD"),
      globalEntry("common.ai", "target", true),
      entry("common.ai", "GetGold"),
      entry("common.ai", "Main"),
    ]);

    const text = result.files.get("3.0.0/common.ai.d.ts")!;
    const order = [
      "declare interface unit extends handle",
      "declare const GOLD: number;",
      "declare let target: unit | undefined;",
      "declare function GetGold(): number;",
      "declare function Main(): void;",
    ].map((line) => text.indexOf(line));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

describe("generate: missing and invalid global entries", () => {
  it("lists each global without an entry with its source and declaration", async () => {
    const result = await run({
      "blizzard.j": [
        "globals",
        "    constant integer   bj_MAX_PLAYERS = 24",
        "    unit               bj_lastCreatedUnit = null",
        "    itemtype           bj_stockPickedItemType",
        "    unit array         bj_ghoul",
        "endglobals",
      ].join("\n"),
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual(
      [
        [2, "bj_MAX_PLAYERS", "constant integer bj_MAX_PLAYERS = 24"],
        [3, "bj_lastCreatedUnit", "unit bj_lastCreatedUnit = null"],
        [4, "bj_stockPickedItemType", "itemtype bj_stockPickedItemType"],
        [5, "bj_ghoul", "unit array bj_ghoul"],
      ].map(([line, name, declaration]) => ({
        severity: "error",
        kind: "missing-entry",
        file: "blizzard.j",
        line,
        name,
        message: `blizzard.j: no Overlay entry for global ${declaration}; expected blizzard.j/globals/${name}.json`,
      })),
    );
  });

  it("warns about an orphan global or type entry", async () => {
    const result = await run({ "common.j": "type unit extends handle\n" }, [
      globalEntry("common.j", "GONE"),
      typeEntry("common.j", "gone", { notes: "x" }),
    ]);

    expect(result.ok).toBe(true);
    expect(result.diagnostics.map((d) => [d.kind, d.file])).toEqual([
      ["orphan", "common.j/globals/GONE.json"],
      ["orphan", "common.j/types/gone.json"],
    ]);
  });

  it.each([
    [
      "a non-boolean nullable",
      { nullable: "yes" },
      "nullable must be a boolean",
    ],
    ["an empty deprecated", { deprecated: "" }, "deprecated must be"],
    ["a non-string notes", { notes: 3 }, "notes must be"],
    ["a non-string since", { since: 3 }, "since must be"],
    [
      "a since that is no Build",
      { since: "3.0" },
      "since must be a Patch build",
    ],
    [
      "notes starting a TSDoc tag",
      { notes: "see @foo" },
      'notes must not contain "@"',
    ],
    ["an unknown origin", { origin: "jassdoc" }, "origin must be"],
    ["an unknown field", { async: true }, 'unknown field "async"'],
  ])(
    "fails on a global entry with %s, naming the field",
    async (_case, patch, problem) => {
      const json = { ...globalEntry("common.j", "A"), ...patch };
      const result = await run(
        { "common.j": "globals\ninteger A = 0\nendglobals\n" },
        [],
        { rawOverlay: { "common.j/globals/A.json": JSON.stringify(json) } },
      );

      expect(result.ok).toBe(false);
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]).toMatchObject({
        severity: "error",
        kind: "overlay-invalid",
        file: "common.j/globals/A.json",
      });
      expect(result.diagnostics[0]?.message).toContain(
        `common.j/globals/A.json: ${problem}`,
      );
    },
  );

  it.each([
    ["since", { since: "3.0.0.24268" }],
    ["nullable", { nullable: true }],
    ["async", { async: true }],
  ])("fails on a type entry carrying %s", async (field, patch) => {
    const json = { ...typeEntry("common.j", "unit"), ...patch };
    const result = await run({ "common.j": "type unit extends handle\n" }, [], {
      rawOverlay: { "common.j/types/unit.json": JSON.stringify(json) },
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        kind: "overlay-invalid",
        file: "common.j/types/unit.json",
        name: "unit",
        message: `common.j/types/unit.json: unknown field "${field}"`,
      },
    ]);
  });

  it("reads an entry by its folder: a function entry in globals is rejected", async () => {
    const result = await run(
      { "common.j": "globals\ninteger A = 0\nendglobals\n" },
      [],
      {
        rawOverlay: {
          "common.j/globals/A.json": JSON.stringify(entry("common.j", "A")),
        },
      },
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        kind: "overlay-invalid",
        file: "common.j/globals/A.json",
        name: "A",
        message: 'common.j/globals/A.json: unknown field "returns"',
      },
    ]);
  });

  it("does not match an entry in another kind's folder", async () => {
    const result = await run(
      {
        "common.j":
          "globals\ninteger A = 0\nendglobals\nnative F takes nothing returns nothing\n",
      },
      [entry("common.j", "F")],
      {
        rawOverlay: {
          "common.j/functions/A.json": JSON.stringify(entry("common.j", "A")),
        },
      },
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => [d.kind, d.file])).toEqual([
      ["missing-entry", "common.j"],
      ["orphan", "common.j/functions/A.json"],
    ]);
    expect(result.diagnostics[0]?.message).toBe(
      "common.j: no Overlay entry for global integer A = 0; expected common.j/globals/A.json",
    );
  });
});

describe("generate: Overlay layout", () => {
  it("keeps names that differ only by case apart when their kinds differ", async () => {
    const commonAi = [
      "globals",
      "    constant integer SLEEP = 1",
      "endglobals",
      "native Sleep takes real seconds returns nothing",
    ].join("\n");
    const commonJ = [
      "type location extends handle",
      "native Location takes real x, real y returns location",
    ].join("\n");

    const result = await generateOk(
      { "common.ai": commonAi, "common.j": commonJ },
      [
        globalEntry("common.ai", "SLEEP"),
        entry("common.ai", "Sleep", ["seconds"]),
        typeEntry("common.j", "location", { notes: "A point." }),
        entry("common.j", "Location", ["x", "y"]),
      ],
    );

    expect(result.files.get("3.0.0/common.ai.d.ts")).toContain(
      "declare const SLEEP: number;",
    );
    expect(result.files.get("3.0.0/common.ai.d.ts")).toContain(
      "declare function Sleep(seconds: number): void;",
    );
    expect(result.files.get("3.0.0/common.j.d.ts")).toContain(
      " * @remarks A point.\n */\ndeclare interface location extends handle",
    );
  });

  // Such a pair can only exist on a case-sensitive file system (Linux CI).
  it.skipIf(caseInsensitive)(
    "fails on entry files in one folder whose names differ only by case",
    async () => {
      const json = (name: string) =>
        JSON.stringify(globalEntry("common.ai", name));
      const result = await run(
        {
          "common.ai":
            "globals\ninteger Sleep = 0\ninteger SLEEP = 0\nendglobals\n",
        },
        [],
        {
          rawOverlay: {
            "common.ai/globals/SLEEP.json": json("SLEEP"),
            "common.ai/globals/Sleep.json": json("Sleep"),
          },
        },
      );

      expect(result.ok).toBe(false);
      expect(result.diagnostics).toEqual([
        {
          severity: "error",
          kind: "overlay-invalid",
          file: "common.ai/globals/SLEEP.json",
          message:
            "common.ai/globals/SLEEP.json, common.ai/globals/Sleep.json: entry file names differ only by case, which a case-insensitive file system cannot hold",
        },
      ]);
    },
  );

  it("fails on a JSON file or folder outside the kind folders", async () => {
    const result = await run(
      { "common.j": "native A takes nothing returns nothing\n" },
      [entry("common.j", "A")],
      {
        rawOverlay: {
          "common.j/B.json": "{}",
          "common.j/natives/C.json": "{}",
          "common.j/README.txt": "notes",
        },
      },
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => d.message)).toEqual([
      "common.j/B.json: not an entry location; entries live in common.j/functions, common.j/globals, common.j/types",
      "common.j/natives/: not an entry location; entries live in common.j/functions, common.j/globals, common.j/types",
    ]);
  });
});

describe("generate: globals block errors", () => {
  it("reports a second globals block with file and line", async () => {
    const result = await run({
      "common.j": [
        "globals",
        "integer A = 0",
        "endglobals",
        "",
        "globals // again",
        "integer B = 0",
        "endglobals",
      ].join("\n"),
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual({
      severity: "error",
      kind: "parse",
      file: "common.j",
      line: 5,
      message: "common.j:5: a second globals block (the first is at line 1)",
    });
  });

  it.each([
    ["a constant without initializer", "constant integer A"],
    ["a constant array", "constant integer array A"],
    ["an array with an initializer", "integer array A = 0"],
    ["a statement", "set A = 1"],
    ["a local", "local integer A = 1"],
    ["a native", "native F takes nothing returns nothing"],
    ["a malformed declaration", "integer = 1"],
    ["a stray keyword", "constant"],
  ])("reports %s inside the block with file and line", async (_case, line) => {
    const result = await run({
      "common.j": `// header\nglobals\n    integer OK = 0\n    ${line}\nendglobals\n`,
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual({
      severity: "error",
      kind: "parse",
      file: "common.j",
      line: 4,
      message: `common.j:4: unknown line: ${line}`,
    });
  });

  it("reports a globals block that never ends at its first line", async () => {
    const result = await run({
      "common.j": "\nglobals\ninteger A = 0\n",
    });

    expect(result.diagnostics).toContainEqual({
      severity: "error",
      kind: "parse",
      file: "common.j",
      line: 2,
      message: "common.j:2: globals block has no endglobals",
    });
  });

  it("reads on at top level after endglobals", async () => {
    const result = await run({
      "common.j": "globals\nendglobals\njunk\n",
    });

    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        kind: "parse",
        file: "common.j",
        line: 3,
        message: "common.j:3: unknown line: junk",
      },
    ]);
  });
});

describe("generate: the vendored Patch files", () => {
  const patchDir = fileURLToPath(
    new URL("../vendor/3.0.0.24268", import.meta.url),
  );
  const emptyOverlay = fileURLToPath(
    new URL("./fixtures/cli/overlay", import.meta.url),
  );

  it("parses all three files without a parse error and asks for every global", async () => {
    const result = await generate({ patchDir, overlayDir: emptyOverlay });

    expect(result.diagnostics.filter((d) => d.kind === "parse")).toEqual([]);
    const missingGlobals = (source: string) =>
      result.diagnostics.filter(
        (d) =>
          d.kind === "missing-entry" &&
          d.file === source &&
          d.message.includes("for global "),
      ).length;
    expect(missingGlobals("common.j")).toBe(1738);
    expect(missingGlobals("blizzard.j")).toBe(522);
    expect(missingGlobals("common.ai")).toBe(472);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        name: "bj_FORCE_PLAYER",
        message:
          "blizzard.j: no Overlay entry for global force array bj_FORCE_PLAYER; expected blizzard.j/globals/bj_FORCE_PLAYER.json",
      }),
    );
  });
});
