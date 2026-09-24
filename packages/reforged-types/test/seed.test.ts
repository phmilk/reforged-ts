import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { ASYNC_NATIVES, seed } from "../scripts/seed-from-war3-types-strict.ts";
import { generate } from "../src/index.js";
import { entry, writeFixture } from "./support/fixture.js";

/** A war3-types-strict native or function record, with its types. */
function fnRecord(
  source: string,
  name: string,
  takes: [string, string, boolean][],
  returns: string,
  isNullable: boolean,
) {
  return {
    name,
    description: null,
    takes: takes.map(([type, param, nullable]) => ({
      description: null,
      name: param,
      type,
      isNullable: nullable,
    })),
    returns,
    isNullable,
    source,
  };
}

function globalRecord(
  source: string,
  name: string,
  type: string,
  isNullable: boolean,
) {
  return {
    name,
    description: null,
    isConstant: false,
    type,
    isArray: false,
    value: "null",
    isNullable,
    source,
  };
}

/** Writes a war3-types-strict layer set: records by `<layer>/<folder>/<Name>.json`. */
async function writeCheckout(
  records: Record<string, unknown>,
): Promise<string> {
  const checkout = await mkdtemp(join(tmpdir(), "war3-types-strict-"));
  for (const [path, record] of Object.entries(records)) {
    await mkdir(dirname(join(checkout, path)), { recursive: true });
    await writeFile(join(checkout, path), JSON.stringify(record, null, 2));
  }
  return checkout;
}

const PATCH = {
  "common.j": [
    "type unit extends handle",
    "type group extends handle",
    "type player extends handle",
    "globals",
    "constant integer PLAYER_NEUTRAL_AGGRESSIVE = 12",
    "endglobals",
    "native GroupAddUnit takes group whichGroup, unit whichUnit returns boolean",
    "native GetLocalPlayer takes nothing returns player",
    "native BlzQueueBuildOrderById takes unit whichPeon, integer unitId, real x, real y returns boolean",
    "native Reshaped takes unit u, integer n returns nothing",
    "native CreateUnit takes player id, integer unitid, real x, real y, real face returns unit",
    "native BlzNewIn300 takes nothing returns nothing",
  ].join("\n"),
  "blizzard.j": [
    "globals",
    "unit bj_lastCreatedUnit = null",
    "endglobals",
    "function BJDebugMsg takes string msg returns nothing",
    "endfunction",
  ].join("\n"),
};

const CHECKOUT = {
  // A type record: ignored, the Patch is the only source of types.
  "1.29.2/types/unit.json": {
    description: null,
    name: "unit",
    extends: "handle",
    source: "common.j",
  },
  // Overridden by 1.32.10.
  "1.29.2/natives/GroupAddUnit.json": fnRecord(
    "common.j",
    "GroupAddUnit",
    [
      ["group", "whichGroup", false],
      ["unit", "whichUnit", false],
    ],
    "void",
    false,
  ),
  "1.32.10/natives/GroupAddUnit.json": fnRecord(
    "common.j",
    "GroupAddUnit",
    [
      ["group", "whichGroup", true],
      ["unit", "whichUnit", false],
    ],
    "boolean",
    true,
  ),
  "1.29.2/natives/GetLocalPlayer.json": fnRecord(
    "common.j",
    "GetLocalPlayer",
    [],
    "player",
    false,
  ),
  // The record names parameter 0 `whichUnit`, the Patch `whichPeon`.
  "1.33.0/natives/BlzQueueBuildOrderById.json": fnRecord(
    "common.j",
    "BlzQueueBuildOrderById",
    [
      ["unit", "whichUnit", false],
      ["number", "unitId", false],
      ["number", "x", false],
      ["number", "y", false],
    ],
    "boolean",
    false,
  ),
  // Absent from the Patch.
  "1.29.2/natives/RequestExtraBooleanData.json": fnRecord(
    "common.j",
    "RequestExtraBooleanData",
    [["number", "dataType", false]],
    "boolean",
    false,
  ),
  // One parameter where the Patch has two.
  "1.29.2/natives/Reshaped.json": fnRecord(
    "common.j",
    "Reshaped",
    [["unit", "u", false]],
    "void",
    false,
  ),
  // A hand-written entry exists for it.
  "1.29.2/natives/CreateUnit.json": fnRecord(
    "common.j",
    "CreateUnit",
    [
      ["player", "id", false],
      ["number", "unitid", false],
      ["number", "x", false],
      ["number", "y", false],
      ["number", "face", false],
    ],
    "unit",
    false,
  ),
  "1.29.2/globals/PLAYER_NEUTRAL_AGGRESSIVE.json": globalRecord(
    "common.j",
    "PLAYER_NEUTRAL_AGGRESSIVE",
    "number",
    false,
  ),
  "1.29.2/globals/bj_lastCreatedUnit.json": globalRecord(
    "blizzard.j",
    "bj_lastCreatedUnit",
    "unit",
    true,
  ),
  "1.29.2/functions/BJDebugMsg.json": fnRecord(
    "blizzard.j",
    "BJDebugMsg",
    [["string", "msg", false]],
    "void",
    false,
  ),
};

const handWritten = entry(
  "common.j",
  "CreateUnit",
  ["id", "unitid", "x", "y", "face"],
  true,
);

async function runSeed() {
  const checkout = await writeCheckout(CHECKOUT);
  const { patchDir, overlayDir } = await writeFixture(PATCH, [handWritten]);
  const report = await seed({
    checkout,
    commit: "0123456789abcdef0123456789abcdef01234567",
    patchDir,
    overlayDir,
    asyncNames: ["GetLocalPlayer", "BlzNewIn300"],
  });
  const read = async (path: string) => readFile(join(overlayDir, path), "utf8");
  return { report, patchDir, overlayDir, read };
}

describe("seed from war3-types-strict", () => {
  it("writes one entry per covered function with nullability, Patch parameter names and origin", async () => {
    const { read } = await runSeed();

    expect(await read("common.j/functions/GroupAddUnit.json")).toBe(
      [
        "{",
        '  "name": "GroupAddUnit",',
        '  "source": "common.j",',
        '  "returns": {',
        '    "nullable": true',
        "  },",
        '  "params": [',
        "    {",
        '      "name": "whichGroup",',
        '      "nullable": true',
        "    },",
        "    {",
        '      "name": "whichUnit",',
        '      "nullable": false',
        "    }",
        "  ],",
        '  "origin": "war3-types-strict"',
        "}",
        "",
      ].join("\n"),
    );
    expect(
      JSON.parse(await read("common.j/functions/BlzQueueBuildOrderById.json")),
    ).toEqual({
      name: "BlzQueueBuildOrderById",
      source: "common.j",
      returns: { nullable: false },
      params: [
        { name: "whichPeon", nullable: false },
        { name: "unitId", nullable: false },
        { name: "x", nullable: false },
        { name: "y", nullable: false },
      ],
      origin: "war3-types-strict",
    });
    expect(
      JSON.parse(await read("blizzard.j/functions/BJDebugMsg.json")),
    ).toEqual({
      name: "BJDebugMsg",
      source: "blizzard.j",
      returns: { nullable: false },
      params: [{ name: "msg", nullable: false }],
      origin: "war3-types-strict",
    });
  });

  it("writes global entries and ignores type records", async () => {
    const { read, overlayDir } = await runSeed();

    expect(await read("blizzard.j/globals/bj_lastCreatedUnit.json")).toBe(
      '{\n  "name": "bj_lastCreatedUnit",\n  "source": "blizzard.j",\n  "nullable": true,\n  "origin": "war3-types-strict"\n}\n',
    );
    expect(
      JSON.parse(await read("common.j/globals/PLAYER_NEUTRAL_AGGRESSIVE.json")),
    ).toEqual({
      name: "PLAYER_NEUTRAL_AGGRESSIVE",
      source: "common.j",
      nullable: false,
      origin: "war3-types-strict",
    });
    expect(await readdir(join(overlayDir, "common.j"))).toEqual([
      "functions",
      "globals",
    ]);
  });

  it("sets async only on the listed Natives it seeds", async () => {
    const { read, report } = await runSeed();

    expect(
      JSON.parse(await read("common.j/functions/GetLocalPlayer.json")),
    ).toEqual({
      name: "GetLocalPlayer",
      source: "common.j",
      returns: { nullable: false },
      params: [],
      async: true,
      origin: "war3-types-strict",
    });
    expect(report.asyncUnseeded).toEqual(["BlzNewIn300"]);
  });

  it("skips and reports absent, reshaped and hand-written records", async () => {
    const { report, overlayDir, read } = await runSeed();

    expect(report.skipped).toEqual([
      {
        kind: "functions",
        source: "common.j",
        name: "CreateUnit",
        reason: "a hand-written entry exists",
      },
      {
        kind: "functions",
        source: "common.j",
        name: "RequestExtraBooleanData",
        reason: "no declaration in common.j of the Patch",
      },
      {
        kind: "functions",
        source: "common.j",
        name: "Reshaped",
        reason: "the record has 1 parameters, the Patch 2",
      },
    ]);
    expect(
      (await readdir(join(overlayDir, "common.j", "functions"))).sort(),
    ).toEqual([
      "BlzQueueBuildOrderById.json",
      "CreateUnit.json",
      "GetLocalPlayer.json",
      "GroupAddUnit.json",
    ]);
    expect(
      JSON.parse(await read("common.j/functions/CreateUnit.json")),
    ).toEqual(handWritten);
    expect(report.written).toEqual({
      "blizzard.j/functions": 1,
      "blizzard.j/globals": 1,
      "common.j/functions": 3,
      "common.j/globals": 1,
    });
    expect(report.commit).toBe("0123456789abcdef0123456789abcdef01234567");
  });

  it("leaves the generator only the declarations without a record to report", async () => {
    const { patchDir, overlayDir } = await runSeed();

    const result = await generate({ patchDir, overlayDir });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((d) => [d.kind, d.name])).toEqual([
      ["missing-entry", "Reshaped"],
      ["missing-entry", "BlzNewIn300"],
    ]);
  });

  it("lists the 56 async Natives sorted", () => {
    expect(ASYNC_NATIVES).toHaveLength(56);
    expect(new Set(ASYNC_NATIVES).size).toBe(56);
    expect([...ASYNC_NATIVES].sort()).toEqual(ASYNC_NATIVES);
    expect(ASYNC_NATIVES).toContain("GetUnitName");
  });
});
