/**
 * Seam 3 of #632: the field table `builtins:generate` writes, from the
 * committed fixture input of `test/fixtures/fields/`, a small `*MetaData.slk`
 * per kind, the editor strings and the editor data. Every byte of it is the
 * tests' own, modelled on the columns of 3.0.0.24268's metadata and the
 * sections of 3.0.1.24370's editor data; `fields.json` there is the table it
 * gives, in format 2 (#702), and `fields.d.ts` its declarations.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/generate.js";
import {
  buildFieldTable,
  EDITOR_DATA,
  FIELD_OVERRIDES,
  serializeFields,
  type FieldTable,
} from "../src/fields.js";
import { parseSlk } from "reforged-studio";
import {
  base,
  NO_OTHER_KINDS,
  strings,
  tempDir,
  UNIT_DATA,
  unitDataSlk,
  WORLD_EDIT_STRINGS,
  writeStorage,
} from "../../reforged-studio/test/support/casc.js";

/** The editor data's path in the storage. */
const EDITOR_DATA_PATH = base(EDITOR_DATA);

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
    [EDITOR_DATA_PATH]: await fixture("UnitEditorData.txt"),
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
      // The Build of the synthetic install (reforged-studio's test/support/casc.ts).
      typingsBuild: "3.0.0.24268",
    },
  );
  const output = (name: string) =>
    readFile(join(outDir, "3.0.0", name), "utf8").catch(() => undefined);
  const fields = await output("fields.json");
  const declarations = await output("fields.d.ts");
  return { status, stdout, stderr, fields, declarations };
}

describe("builtins:generate's field table", () => {
  it("emits the table of the fixture input in format 2, the overrides applied, and its declarations", async () => {
    const storage = await fixtureStorage();

    const { status, stdout, stderr, fields, declarations } = await run(
      storage.installDir,
    );

    expect(stderr).toBe("");
    expect(status).toBe(0);
    expect(fields).toBe(await fixture("fields.json"));
    expect(declarations).toBe(await fixture("fields.d.ts"));
    expect(stdout).not.toContain("METADATA_CATEGORIES");
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

  it("gives a metadata type no category maps its value type's category, and warns of it", async () => {
    const meta = (await fixture("DoodadMetaData.slk")).replace(
      '"model"',
      '"doodadCategory"',
    );
    const storage = await fixtureStorage({
      [base("Doodads/DoodadMetaData.slk")]: meta,
    });

    const { status, stdout, fields } = await run(storage.installDir);

    expect(status).toBe(0);
    expect(
      (JSON.parse(fields ?? "{}") as FieldTable).fields.doodad.dfil,
    ).toMatchObject({
      type: "string",
      metaType: "doodadCategory",
      category: "text",
    });
    expect(stdout).toContain(
      `- warning: The metadata type "doodadCategory" (doodad dfil) has no category in METADATA_CATEGORIES (src/fields.ts): its fields take their value type's, text.\n`,
    );
  });

  it("reads an enumeration's raw values from the editor data, integers for one stored as int", async () => {
    const { fields } = await run((await fixtureStorage()).installDir);
    const table = JSON.parse(fields ?? "{}") as FieldTable;

    expect(table.enumerations).toEqual({
      targetList: ["air", "alive", "ground"],
      teamColor: [-1, 0, 1],
      upgradeEffect: ["rarm", "ratt", "rhpx"],
    });
    expect(table.fields.unit.utco).toMatchObject({
      type: "int",
      metaType: "teamColor",
      category: "enumeration",
    });
    expect(table.fields.unit.uabi).toMatchObject({
      category: "rawcodeList",
      of: "ability",
    });
  });

  it("refuses an enumeration the editor data does not hold, writing nothing", async () => {
    const editorData = (await fixture("UnitEditorData.txt")).replace(
      "[teamColor]",
      "[teamColour]",
    );
    const storage = await fixtureStorage({ [EDITOR_DATA_PATH]: editorData });

    const { status, stderr, fields } = await run(storage.installDir);

    expect(status).toBe(1);
    expect(fields).toBeUndefined();
    expect(stderr).toContain(
      `- error: ${base("Units/UnitMetaData.slk")}: the unit field utco is of type teamColor, an enumeration, and the editor data (UI/UnitEditorData.txt) has no values of it.\n`,
    );
  });

  it("refuses an enumeration stored as int whose raw values are not integers", async () => {
    const editorData = (await fixture("UnitEditorData.txt")).replace(
      "01=0,WESTRING_UE_TEAMCOLOR_00",
      "01=red,WESTRING_UE_TEAMCOLOR_00",
    );
    const storage = await fixtureStorage({ [EDITOR_DATA_PATH]: editorData });

    const { status, stderr } = await run(storage.installDir);

    expect(status).toBe(1);
    expect(stderr).toContain(
      `- error: ${base("Units/UnitMetaData.slk")}: the unit field utco is of type teamColor, an enumeration stored as int, and the editor data gives it "red", not integers.\n`,
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
