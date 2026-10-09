/**
 * Seam 1, the check: `builtins:check` on a package folder that
 * `builtins:generate` wrote from a synthetic CASC storage, and on the
 * committed package. It emits every artefact from each index again and fails
 * on any difference, on an index of the wrong shape, on a Game version
 * without its provenance and on `exports` that the Game versions do not call
 * for. Also the artefacts emitted from an index the storage helpers cannot
 * express yet: Game data sets and names with TSDoc's special characters.
 */
import { appendFile, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main as check } from "../src/cli/check.js";
import { main as generate } from "../src/cli/generate.js";
import { emit } from "../src/emit.js";
import type { BuiltinsIndex } from "../src/model.js";
import {
  strings,
  tempDir,
  UNIT_DATA,
  UNIT_META_DATA,
  unitDataSlk,
  unitMetaDataSlk,
  unitStrings,
  NO_OTHER_KINDS,
  writeStorage,
} from "./support/casc.js";

const UNITS = [
  { id: "hfoo", race: "human", name: "Footman" },
  { id: "Hpal", race: "human", name: "Paladin" },
];

/** The `exports` of a package whose one Game version, 3.0.0, holds units. */
const EXPORTS = {
  "./3.0.0": { types: "./3.0.0.d.ts" },
  "./3.0.0/index.json": "./3.0.0/index.json",
  "./units": { types: "./3.0.0/units.d.ts", tstl: "./3.0.0/units" },
  "./package.json": "./package.json",
};

/** Writes the generator's output for `UNITS` into `root`, over what is there. */
async function regenerate(root: string): Promise<void> {
  const storage = await writeStorage({
    files: {
      ...NO_OTHER_KINDS,
      [UNIT_DATA]: unitDataSlk(UNITS),
      [UNIT_META_DATA]: unitMetaDataSlk(),
      [strings("HumanUnitStrings.txt")]: unitStrings(UNITS),
    },
  });
  const status = await generate(
    ["--install", storage.installDir, "--out", root],
    { stdout: () => undefined, stderr: () => undefined },
    {
      machine: {
        platform: process.platform,
        wsl: false,
        env: {},
        isFile: (file) =>
          file.startsWith(storage.installDir) && file.endsWith(".build.info"),
      },
      cwd: root,
    },
  );
  expect(status).toBe(0);
}

/** A package folder: the generator's output and a manifest with `EXPORTS`. */
async function packageFolder(): Promise<string> {
  const root = await tempDir("package");
  await regenerate(root);
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ name: "reforged-builtins", exports: EXPORTS }),
  );
  return root;
}

async function runCheck(root: string) {
  let stdout = "";
  let stderr = "";
  const status = await check(
    ["--root", root],
    { stdout: (text) => (stdout += text), stderr: (text) => (stderr += text) },
    root,
  );
  return { status, stdout, stderr };
}

/** The check's message on drift, before its problems. */
const DRIFT =
  "Run `pnpm builtins:generate` on the adopted Build, or fix the index, and commit the result.\n\n";

describe("builtins:check", () => {
  it("passes on the generator's output", async () => {
    const root = await packageFolder();

    const { status, stdout, stderr } = await runCheck(root);

    expect(stderr).toBe("");
    expect(stdout).toBe(
      "Built-in objects match: 3 artefacts of Game version 3.0.0 are exactly what the committed index emits.\n",
    );
    expect(status).toBe(0);
  });

  it("fails on a hand-edited artefact, and passes once it is emitted again", async () => {
    const root = await packageFolder();
    await appendFile(
      join(root, "3.0.0.d.ts"),
      'declare function FourCC(id: "hkni"): Rawcode<"unit">;\n',
    );
    const lua = join(root, "3.0.0", "units.lua");
    await writeFile(
      lua,
      (await readFile(lua, "utf8")).replace("1751543663", "1751543664"),
    );

    const edited = await runCheck(root);

    expect(edited.status).toBe(1);
    expect(edited.stdout).toBe("");
    expect(edited.stderr).toBe(
      "Built-in objects drift: 2 problems. " +
        DRIFT +
        "- [ ] 3.0.0.d.ts: differs from what 3.0.0/index.json emits.\n" +
        "- [ ] 3.0.0/units.lua: differs from what 3.0.0/index.json emits.\n",
    );

    await regenerate(root);
    expect((await runCheck(root)).status).toBe(0);
  });

  it("fails on a missing artefact, a stale one and a Game version without its provenance", async () => {
    const root = await packageFolder();
    await rm(join(root, "3.0.0", "units.d.ts"));
    await rm(join(root, "3.0.0", "provenance.json"));
    await writeFile(join(root, "3.0.0", "items.lua"), "return {}\n");

    const { status, stderr } = await runCheck(root);

    expect(status).toBe(1);
    expect(stderr).toBe(
      "Built-in objects drift: 3 problems. " +
        DRIFT +
        "- [ ] 3.0.0/provenance.json: missing.\n" +
        "- [ ] 3.0.0/units.d.ts: emitted from 3.0.0/index.json but not committed.\n" +
        "- [ ] 3.0.0/items.lua: committed but no longer emitted.\n",
    );
  });

  it("fails on an index of the wrong shape, naming each problem, and compares nothing of it", async () => {
    const root = await packageFolder();
    const path = join(root, "3.0.0", "index.json");
    const index = JSON.parse(await readFile(path, "utf8")) as BuiltinsIndex;
    const objects = index.objects as Record<string, unknown>;
    objects.hfoo = { ...index.objects.hfoo, kind: "hero", sets: ["campaign"] };
    objects.Hpal = { ...index.objects.Hpal, constant: "Footman_hfoo" };
    objects["h-1"] = { kind: "unit", sets: ["default"], constant: "X_h-1" };
    await writeFile(
      path,
      JSON.stringify({ ...index, format: 2, gameVersion: "3.0.1" }),
    );

    const { status, stderr } = await runCheck(root);

    expect(status).toBe(1);
    expect(stderr).toBe(
      "Built-in objects drift: 8 problems. " +
        DRIFT +
        [
          "format is 2, not 1.",
          'gameVersion is "3.0.1", not the Game version of the Build 3.0.0.24268.',
          'gameVersion is "3.0.1", not 3.0.0, its folder.',
          'objects.Hpal.constant is "Footman_hfoo", not an identifier ending in _Hpal.',
          'objects.hfoo.kind is "hero", not an Object kind.',
          'objects.hfoo.sets is ["campaign"], not a list of the index\'s Game data sets.',
          "objects.h-1: not a Rawcode of four characters of [A-Za-z0-9].",
          'objects.h-1.constant is "X_h-1", not an identifier ending in _h-1.',
        ]
          .map((problem) => `- [ ] 3.0.0/index.json: ${problem}\n`)
          .join(""),
    );
  });

  it("fails on an index not written as the generator writes it", async () => {
    const root = await packageFolder();
    const path = join(root, "3.0.0", "index.json");
    const index = JSON.parse(await readFile(path, "utf8")) as BuiltinsIndex;
    await writeFile(path, JSON.stringify(index, null, 2));

    const { status, stderr } = await runCheck(root);

    expect(status).toBe(1);
    expect(stderr).toBe(
      "Built-in objects drift: 1 problem. " +
        DRIFT +
        "- [ ] 3.0.0/index.json: not written as the generator writes it (one object per line, in code-point order).\n",
    );
  });

  it("fails when the exports do not point the kind entry points at the newest Game version", async () => {
    const root = await packageFolder();
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        exports: {
          ...EXPORTS,
          "./units": { types: "./3.0.0/units.d.ts", tstl: "./3.0.0/units.lua" },
        },
      }),
    );

    const { status, stderr } = await runCheck(root);

    expect(status).toBe(1);
    expect(stderr).toContain(
      "- [ ] package.json: exports is not what the Game versions call for: ",
    );
    expect(stderr).toContain('"tstl": "./3.0.0/units"');
  });

  it("fails on a package with no Game version", async () => {
    const root = await tempDir("empty");

    const { status, stderr } = await runCheck(root);

    expect(status).toBe(1);
    expect(stderr).toContain(`- [ ] ${root} holds no Game version folder.\n`);
  });

  it("rejects an unknown argument with the usage", async () => {
    let stderr = "";
    const status = await check(["--out", "x"], {
      stdout: () => undefined,
      stderr: (text) => (stderr += text),
    });

    expect(status).toBe(2);
    expect(stderr).toBe("Usage: builtins:check [--root <folder>]\n");
  });

  it("passes on the committed package", async () => {
    let stderr = "";
    const status = await check([], {
      stdout: () => undefined,
      stderr: (text) => (stderr += text),
    });

    expect(stderr).toBe("");
    expect(status).toBe(0);
  });
});

describe("the artefacts of an index", () => {
  const index: BuiltinsIndex = {
    format: 1,
    build: "3.0.0.24268",
    gameVersion: "3.0.0",
    gameDataSets: [
      { id: "default", label: "Default" },
      { id: "custom", label: "Custom" },
      { id: "melee", label: "Melee" },
    ],
    objects: {
      hfoo: {
        kind: "unit",
        name: "Footman",
        race: "human",
        sets: ["default", "custom", "melee"],
        constant: "Footman_hfoo",
      },
      sfoo: {
        kind: "unit",
        name: "Footman",
        race: "human",
        sets: ["default", "custom"],
        constant: "Footman_sfoo",
      },
      ncop: {
        kind: "unit",
        name: "Circle of Power {large} @ */",
        sets: ["melee"],
        constant: "CircleOfPowerLarge_ncop",
      },
      nxxx: { kind: "unit", sets: ["default"], constant: "Unnamed_nxxx" },
    },
  };
  const constants = emit(index).get("3.0.0/units.d.ts") ?? "";

  it("say nothing of the Game data sets of an object in every one", () => {
    expect(constants).toContain(
      "   * Footman (`hfoo`), a Built-in unit of Patch 3.0.0, race human.\n   */\n",
    );
  });

  it("name the Game data sets that hold an object and those that do not", () => {
    expect(constants).toContain(
      "   * Footman (`sfoo`), a Built-in unit of Patch 3.0.0, race human.\n" +
        "   *\n" +
        "   * In the Default and Custom Game data sets. Not in the Melee Game data set.\n" +
        "   */\n",
    );
  });

  it("escape TSDoc's special characters and the comment's end, and leave out a race the index lacks", () => {
    expect(constants).toContain(
      "   * Circle of Power \\{large\\} \\@ *\\/ (`ncop`), a Built-in unit of Patch 3.0.0.\n" +
        "   *\n" +
        "   * In the Melee Game data set. Not in the Default and Custom Game data sets.\n",
    );
  });

  it("show an unnamed object by its Rawcode", () => {
    expect(constants).toContain(
      "   * `nxxx`, unnamed, a Built-in unit of Patch 3.0.0.\n",
    );
  });
});
