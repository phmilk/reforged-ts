/**
 * Seam 1: adopting a Build into a package root, the parts the generator's
 * tests leave out: the version pair of the next major, and rename entries
 * of two Patches within one unreleased major.
 */
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  mergeRenameEntries,
  nextMajorPair,
  RENAMES_FILE,
} from "../src/adopt.js";
import type { RenameEntry } from "../src/record.js";

async function root(version: string) {
  const dir = await mkdtemp(join(tmpdir(), "reforged-builtins-adopt-"));
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({ name: "reforged-builtins", version }),
  );
  return dir;
}

const PAIR = { from: "reforged-builtins@1", to: "reforged-builtins@2" };

function entry(old: string, replacement: string | null): RenameEntry {
  return {
    old,
    new: replacement,
    kind: "member",
    versions: PAIR,
    oneToOne: replacement !== null,
    note: `${old} changed.`,
  };
}

describe("the version pair of the next major", () => {
  it.each([
    ["1.2.0", PAIR],
    ["1.2.0-alpha.3", PAIR],
    // A prerelease of a major is that major already: its pair is the previous one's.
    ["2.0.0-alpha.0", PAIR],
  ])("from %s is %o", async (version, pair) => {
    expect(await nextMajorPair(await root(version))).toEqual(pair);
  });

  it.each(["0.0.0", "0.4.1", "1.0.0-alpha.2"])(
    "is none below 1.0.0 (%s): no released major to migrate from",
    async (version) => {
      expect(await nextMajorPair(await root(version))).toBeUndefined();
    },
  );
});

describe("the rename entries of two Patches within one major", () => {
  const read = async (dir: string) =>
    JSON.parse(
      await readFile(join(dir, RENAMES_FILE), "utf8"),
    ) as RenameEntry[];

  it("chain into one entry from the released name to the newest", async () => {
    const dir = await root("1.2.0");
    await mergeRenameEntries(dir, [
      entry("Units.Footman_hfoo", "Units.Militia_hfoo"),
    ]);
    await mergeRenameEntries(dir, [
      entry("Units.Militia_hfoo", "Units.Guard_hfoo"),
    ]);

    expect((await read(dir)).map((e) => [e.old, e.new])).toEqual([
      ["Units.Footman_hfoo", "Units.Guard_hfoo"],
    ]);
  });

  it("drop an entry renamed back to its released name, and keep a removal removed", async () => {
    const dir = await root("1.2.0");
    await mergeRenameEntries(dir, [
      entry("Units.Footman_hfoo", "Units.Militia_hfoo"),
      entry("Units.Knight_hkni", "Units.Rider_hkni"),
    ]);
    await mergeRenameEntries(dir, [
      entry("Units.Militia_hfoo", "Units.Footman_hfoo"),
      entry("Units.Rider_hkni", null),
    ]);

    expect((await read(dir)).map((e) => [e.old, e.new, e.oneToOne])).toEqual([
      ["Units.Knight_hkni", null, false],
    ]);
  });

  it("replace the pair's no-renames marker, which a pair cannot hold with entries", async () => {
    const dir = await root("1.2.0");
    await mkdir(join(dir, "migration"));
    await writeFile(
      join(dir, RENAMES_FILE),
      JSON.stringify([
        { kind: "noRenames", versions: PAIR, note: "Renames nothing." },
      ]),
    );
    await mergeRenameEntries(dir, [entry("Units.Knight_hkni", null)]);

    expect((await read(dir)).map((e) => e.old)).toEqual(["Units.Knight_hkni"]);
  });
});
