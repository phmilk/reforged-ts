/**
 * Seam 3 of #632: the field table `builtins:generate` writes, from the
 * committed fixture input of `test/fixtures/fields/`, a small `*MetaData.slk`
 * per kind and the editor strings. Every byte of it is the tests' own,
 * modelled on the columns of 3.0.0.24268's metadata; `fields.json` there is
 * the table it gives.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/generate.js";
import {
  buildFieldTable,
  FIELD_OVERRIDES,
  serializeFields,
} from "../src/fields.js";
import { parseSlk } from "../src/slk.js";
import {
  base,
  NO_OTHER_KINDS,
  strings,
  tempDir,
  UNIT_DATA,
  unitDataSlk,
  WORLD_EDIT_STRINGS,
  writeStorage,
} from "./support/casc.js";

const fixture = (name: string) =>
  readFile(new URL(`fixtures/fields/${name}`, import.meta.url), "utf8");

/** The metadata files of the fixture input, by their CASC path. */
const META_DATA = {
  "Units/UnitMetaData.slk": "UnitMetaData.slk",
  "Units/AbilityMetaData.slk": "AbilityMetaData.slk",
  "Units/AbilityBuffMetaData.slk": "AbilityBuffMetaData.slk",
  "Units/DestructableMetaData.slk": "DestructableMetaData.slk",
  "Doodads/DoodadMetaData.slk": "DoodadMetaData.slk",
  "Units/UpgradeMetaData.slk": "UpgradeMetaData.slk",
};

/** A storage of no object, whose metadata and editor strings are the fixture input's, `extra` over them. */
async function fixtureStorage(extra: Record<string, string> = {}) {
  const files: Record<string, string> = {
    ...NO_OTHER_KINDS,
    [UNIT_DATA]: unitDataSlk([]),
    [strings("HumanUnitStrings.txt")]: "",
    [WORLD_EDIT_STRINGS]: await fixture("WorldEditStrings.txt"),
  };
  for (const [path, name] of Object.entries(META_DATA)) {
    files[base(path)] = await fixture(name);
  }
  return writeStorage({ files: { ...files, ...extra } });
}

async function run(installDir: string) {
  const outDir = await tempDir("out");
  let stdout = "";
  let stderr = "";
  const status = await main(
    ["--install", installDir, "--out", outDir],
    { stdout: (text) => (stdout += text), stderr: (text) => (stderr += text) },
    {
      machine: {
        platform: process.platform,
        wsl: false,
        env: {},
        isFile: (file) =>
          file.startsWith(installDir) && file.endsWith(".build.info"),
      },
      cwd: outDir,
      // The Build of the synthetic install (test/support/casc.ts).
      typingsBuild: "3.0.0.24268",
    },
  );
  const fields = await readFile(
    join(outDir, "3.0.0", "fields.json"),
    "utf8",
  ).catch(() => undefined);
  return { status, stdout, stderr, fields };
}

describe("builtins:generate's field table", () => {
  it("emits the table of the fixture input, the overrides applied", async () => {
    const storage = await fixtureStorage();

    const { status, stdout, stderr, fields } = await run(storage.installDir);

    expect(stderr).toBe("");
    expect(status).toBe(0);
    expect(fields).toBe(await fixture("fields.json"));
    expect(stdout).toContain(
      `- warning: ${base("Doodads/DoodadMetaData.slk")}: the doodad field dvr1 is labelled WESTRING_DEVAL_DVR1, which the editor strings do not hold: it has no label.\n`,
    );
    expect(stdout).toContain(
      `- warning: ${base("Units/AbilityMetaData.slk")}: the ability field Crs is specific to "ACcs.Afzy", not a Rawcode: the table keeps it as the metadata writes it.\n`,
    );
  });

  it("refuses a metadata type it does not know, writing nothing", async () => {
    const meta = (await fixture("UpgradeMetaData.slk")).replace(
      '"upgradeEffect"',
      '"upgradeFuture"',
    );
    const storage = await fixtureStorage({
      [base("Units/UpgradeMetaData.slk")]: meta,
    });

    const { status, stderr, fields } = await run(storage.installDir);

    expect(status).toBe(1);
    expect(fields).toBeUndefined();
    expect(stderr).toContain(
      `- error: ${base("Units/UpgradeMetaData.slk")}: the upgrade field gef1 is of type "upgradeFuture", which the generator does not know: add it to INT_TYPES or STRING_TYPES in src/fields.ts.\n`,
    );
  });

  it("refuses editor strings without a kind's label", async () => {
    const editorStrings = (await fixture("WorldEditStrings.txt")).replace(
      "WESTRING_OBJTAB_BUFFS=Buffs/Effects\n",
      "",
    );
    const storage = await fixtureStorage({
      [WORLD_EDIT_STRINGS]: editorStrings,
    });

    const { status, stderr, fields } = await run(storage.installDir);

    expect(status).toBe(1);
    expect(fields).toBeUndefined();
    expect(stderr).toContain(
      "- error: The editor strings hold no WESTRING_OBJTAB_BUFFS, the label of the buffs in the editor's comments.\n",
    );
  });

  it("records each override with the fixture that shows it", () => {
    expect(
      FIELD_OVERRIDES.map(({ kind, id, file, localizable }) => ({
        kind,
        id,
        file,
        localizable,
      })),
    ).toEqual([
      { kind: "doodad", id: "dnam", file: "base", localizable: undefined },
    ]);
    for (const override of FIELD_OVERRIDES) {
      expect(override.evidence).toMatch(/^packages\/[^ ]+\/test\/fixtures\//);
    }
  });

  it("refuses an override of a field the metadata does not have", async () => {
    const result = buildFieldTable(
      [
        {
          kind: "doodad",
          path: "DoodadMetaData.slk",
          table: parseSlk(
            (await fixture("DoodadMetaData.slk")).replace('K"dnam"', 'K"dnaX"'),
          ),
        },
      ],
      (text) => text,
      "3.0.0.24268",
      "3.0.0",
    );

    expect(result.errors).toEqual([
      "The override of the doodad field dnam (src/fields.ts) names a field the metadata does not have.",
    ]);
  });

  it("writes the same bytes for a table however its fields were ordered", async () => {
    const text = await fixture("fields.json");
    const table = JSON.parse(text) as Parameters<typeof serializeFields>[0];
    const reversed = {
      ...table,
      fields: Object.fromEntries(
        Object.entries(table.fields).map(([kind, byId]) => [
          kind,
          Object.fromEntries(Object.entries(byId).reverse()),
        ]),
      ) as typeof table.fields,
    };

    expect(serializeFields(reversed)).toBe(text);
  });
});
