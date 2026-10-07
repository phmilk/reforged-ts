/**
 * Seam 1: `builtins:generate` on synthetic CASC storages the helpers write
 * in a temporary folder, with synthetic SLK and `.txt` files. The tests
 * assert the files it writes, its output and its exit code.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main, typingsBuild } from "../src/cli/generate.js";
import type { InstallMachine } from "../src/install.js";
import {
  contentKey,
  sha256,
  strings,
  tempDir,
  UNIT_DATA,
  UNIT_META_DATA,
  unitDataSlk,
  unitMetaDataSlk,
  unitStrings,
  writeStorage,
  type StorageOptions,
  type SyntheticUnit,
} from "./support/casc.js";

/** A machine with no game where the lookup would look on its own. */
const NO_GAME: InstallMachine = {
  platform: "linux",
  wsl: false,
  env: {},
  isFile: () => false,
};

async function run(installDir: string, outDir: string) {
  let stdout = "";
  let stderr = "";
  const status = await main(
    ["--install", installDir, "--out", outDir],
    { stdout: (text) => (stdout += text), stderr: (text) => (stderr += text) },
    {
      machine: {
        ...NO_GAME,
        isFile: (file) =>
          file.startsWith(installDir) && file.endsWith(".build.info"),
      },
      cwd: outDir,
    },
  );
  return { status, stdout, stderr };
}

/** The storage of a units-only Patch: data, metadata and two strings files. */
function unitStorage(
  human: readonly SyntheticUnit[],
  campaign: readonly SyntheticUnit[] = [],
  extra: Partial<StorageOptions> = {},
): StorageOptions {
  return {
    ...extra,
    files: {
      [UNIT_DATA]: unitDataSlk([...human, ...campaign]),
      [UNIT_META_DATA]: unitMetaDataSlk(),
      [strings("HumanUnitStrings.txt")]: unitStrings(human),
      [strings("CampaignUnitStrings.txt")]: unitStrings(campaign),
      // Not a unit names file: never read.
      [strings("UnitSkinStrings.txt")]: "[hfoo]\r\nName=Skin\r\n",
      ...extra.files,
    },
  };
}

const HUMAN: readonly SyntheticUnit[] = [
  { id: "hfoo", race: "human", name: "Footman" },
  { id: "Hpal", race: "human", name: "|cffffcc00Paladin|r" },
  { id: "hkni", race: "Human", name: '"Knight"' },
];
const CAMPAIGN: readonly SyntheticUnit[] = [
  { id: "sfoo", race: "human", name: "Footman" },
  { id: "nmrl", race: "naga", name: "Mur'gul Slave " },
];

describe("builtins:generate", () => {
  it("writes the units' index and provenance from the storage", async () => {
    const storage = await writeStorage(unitStorage(HUMAN, CAMPAIGN));
    const outDir = await tempDir("out");

    const { status, stdout, stderr } = await run(storage.installDir, outDir);

    expect(stderr).toBe("");
    expect(status).toBe(0);
    expect(stdout).toBe(
      `Read the install at ${storage.installDir} (Build 3.0.0.24268): 5 units.\n` +
        "Wrote 3.0.0/index.json and 3.0.0/provenance.json.\n",
    );
    expect(await readdir(join(outDir, "3.0.0"))).toEqual([
      "index.json",
      "provenance.json",
    ]);
    expect(await readFile(join(outDir, "3.0.0", "index.json"), "utf8")).toBe(
      `{
  "format": 1,
  "build": "3.0.0.24268",
  "gameVersion": "3.0.0",
  "gameDataSets": [
    {"id":"default","label":"Default"}
  ],
  "objects": {
    "Hpal": {"kind":"unit","name":"Paladin","race":"human","sets":["default"],"constant":"Paladin_Hpal"},
    "hfoo": {"kind":"unit","name":"Footman","race":"human","sets":["default"],"constant":"Footman_hfoo"},
    "hkni": {"kind":"unit","name":"Knight","race":"human","sets":["default"],"constant":"Knight_hkni"},
    "nmrl": {"kind":"unit","name":"Mur'gul Slave","race":"naga","sets":["default"],"constant":"MurgulSlave_nmrl"},
    "sfoo": {"kind":"unit","name":"Footman","race":"human","sets":["default"],"constant":"Footman_sfoo"}
  }
}
`,
    );

    const files = unitStorage(HUMAN, CAMPAIGN).files;
    const input = (path: string) => {
      const text = files[path] as string;
      return {
        path,
        contentKey: contentKey(text),
        sha256: sha256(text),
        size: Buffer.byteLength(text),
      };
    };
    expect(
      JSON.parse(
        await readFile(join(outDir, "3.0.0", "provenance.json"), "utf8"),
      ),
    ).toEqual({
      build: "3.0.0.24268",
      buildConfig: storage.buildConfigKey,
      inputs: [
        input(UNIT_DATA),
        input(UNIT_META_DATA),
        input(strings("CampaignUnitStrings.txt")),
        input(strings("HumanUnitStrings.txt")),
      ],
    });
  });

  it("reads files in plain, zlib and mixed BLTE frames alike", async () => {
    const all = (framing: string) => {
      const options = unitStorage(HUMAN, CAMPAIGN);
      return {
        ...options,
        framing: Object.fromEntries(
          Object.keys(options.files).map((p) => [p, framing]),
        ),
      };
    };
    const outputs = [];
    for (const framing of ["plain", "zlib", "mixed"]) {
      const storage = await writeStorage(all(framing));
      const outDir = await tempDir("out");
      expect((await run(storage.installDir, outDir)).status).toBe(0);
      outputs.push(await readFile(join(outDir, "3.0.0", "index.json"), "utf8"));
    }
    expect(outputs[1]).toBe(outputs[0]);
    expect(outputs[2]).toBe(outputs[0]);
  });

  it("writes the same bytes when the inputs are unchanged", async () => {
    const storage = await writeStorage(unitStorage(HUMAN, CAMPAIGN));
    const outDir = await tempDir("out");
    expect((await run(storage.installDir, outDir)).status).toBe(0);
    const first = await Promise.all(
      ["index.json", "provenance.json"].map((file) =>
        readFile(join(outDir, "3.0.0", file)),
      ),
    );

    expect((await run(storage.installDir, outDir)).status).toBe(0);
    const second = await Promise.all(
      ["index.json", "provenance.json"].map((file) =>
        readFile(join(outDir, "3.0.0", file)),
      ),
    );
    expect(second).toEqual(first);

    // The same inputs framed and ordered otherwise give the same index.
    const reordered = await writeStorage({
      ...unitStorage(HUMAN, CAMPAIGN),
      framing: { [UNIT_DATA]: "plain", [UNIT_META_DATA]: "mixed" },
    });
    const otherOut = await tempDir("out");
    expect((await run(reordered.installDir, otherOut)).status).toBe(0);
    expect(await readFile(join(otherOut, "3.0.0", "index.json"))).toEqual(
      first[0],
    );
  });

  it("names the constants by the rules, and an unnamed unit Unnamed with a warning", async () => {
    const storage = await writeStorage(
      unitStorage([
        { id: "Hpal", race: "human", name: "Paladin" },
        { id: "hapo", race: "human", name: "Paladin's Steed" },
        { id: "hacc", race: "human", name: "Défenseur Élite" },
        { id: "h001", race: "human", name: "1st Legion" },
        { id: "hAoE", race: "human", name: "AoE  sentry|nof the gate" },
        { id: "hcol", race: "human", name: "|cff00ff00Captain|r of the Watch" },
        { id: "hnon", race: "human" },
        { id: "hemp", race: "human", name: "" },
        { id: "hnor", name: "Raceless" },
      ]),
    );
    const outDir = await tempDir("out");

    const { status, stdout } = await run(storage.installDir, outDir);

    expect(status).toBe(0);
    const index = JSON.parse(
      await readFile(join(outDir, "3.0.0", "index.json"), "utf8"),
    ) as {
      objects: Record<
        string,
        { name?: string; race?: string; constant: string }
      >;
    };
    const entries = Object.fromEntries(
      Object.entries(index.objects).map(([id, entry]) => [
        id,
        [entry.name, entry.race, entry.constant],
      ]),
    );
    expect(entries).toEqual({
      Hpal: ["Paladin", "human", "Paladin_Hpal"],
      h001: ["1st Legion", "human", "_1stLegion_h001"],
      hAoE: ["AoE sentry of the gate", "human", "AoESentryOfTheGate_hAoE"],
      hacc: ["Défenseur Élite", "human", "DefenseurElite_hacc"],
      hapo: ["Paladin's Steed", "human", "PaladinsSteed_hapo"],
      hcol: ["Captain of the Watch", "human", "CaptainOfTheWatch_hcol"],
      hemp: [undefined, "human", "Unnamed_hemp"],
      hnon: [undefined, "human", "Unnamed_hnon"],
      hnor: ["Raceless", undefined, "Raceless_hnor"],
    });
    expect(stdout).toContain(
      "- warning: The unit hnon has no enUS name; its constant is Unnamed_hnon.\n" +
        "- warning: The unit hemp has no enUS name; its constant is Unnamed_hemp.\n",
    );
  });

  it("keeps the last name a unit is given, with a warning", async () => {
    const storage = await writeStorage(
      unitStorage([{ id: "Ubtr", race: "undead", name: "Noble" }], [], {
        files: {
          [strings("HumanUnitStrings.txt")]:
            "[Ubtr]\r\nName=Noble\r\n\r\n[Ubtr]\r\nName=Death Knight\r\n",
        },
      }),
    );
    const outDir = await tempDir("out");

    const { status, stdout } = await run(storage.installDir, outDir);

    expect(status).toBe(0);
    expect(stdout).toContain(
      `- warning: The unit Ubtr is named "Noble", then "Death Knight" in ${strings("HumanUnitStrings.txt")}: the last name wins.\n`,
    );
    expect(
      await readFile(join(outDir, "3.0.0", "index.json"), "utf8"),
    ).toContain(
      '"Ubtr": {"kind":"unit","name":"Death Knight","race":"undead","sets":["default"],"constant":"DeathKnight_Ubtr"}',
    );
  });
});

describe("builtins:generate refuses, writing nothing", () => {
  async function refused(options: StorageOptions) {
    const storage = await writeStorage(options);
    const outDir = await tempDir("out");
    const result = await run(storage.installDir, outDir);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(await readdir(outDir)).toEqual([]);
    return { ...result, storage };
  }

  it("an install on another Build than reforged-types', naming both", async () => {
    expect(typingsBuild()).toBe("3.0.0.24268");
    const { stderr, storage } = await refused(
      unitStorage(HUMAN, [], { build: "3.0.1.25000" }),
    );

    expect(stderr).toBe(
      "Generation failed. No file was written.\n\n" +
        `- error: The install at ${storage.installDir} is on Build 3.0.1.25000 (${join(storage.installDir, ".build.info")}), not on 3.0.0.24268, the Patch of reforged-types (its reforged.patch): the Built-in objects and the Typings would come from different Builds.\n`,
    );
  });

  it("a BLTE frame of a mode other than plain and zlib, naming the file", async () => {
    const { stderr } = await refused({
      ...unitStorage(HUMAN),
      framing: { [UNIT_DATA]: "4" },
    });

    expect(stderr).toContain(
      `- error: ${UNIT_DATA}: BLTE frame 0 has mode "4"; the reader decodes "N" (plain) and "Z" (zlib) only.\n`,
    );
  });

  it("a file the root does not list, naming its path", async () => {
    const files = Object.fromEntries(
      Object.entries(unitStorage(HUMAN).files).filter(
        ([path]) => path !== UNIT_META_DATA,
      ),
    );
    const { stderr, storage } = await refused({ files });

    expect(stderr).toContain(
      `- error: ${UNIT_META_DATA} is not in the root of the storage at ${storage.installDir}.\n`,
    );
  });

  it("a content key the encoding file does not resolve, naming the path", async () => {
    const options = unitStorage(HUMAN);
    const { stderr, storage } = await refused({
      ...options,
      notInEncoding: [UNIT_DATA],
    });

    expect(stderr).toContain(
      `- error: ${UNIT_DATA}: its content key ${storage.contentKeys[UNIT_DATA]} is in no entry of the encoding file.\n`,
    );
  });

  it("a unit whose Rawcode is not four letters or digits", async () => {
    const { stderr } = await refused(
      unitStorage([...HUMAN, { id: "h-oo", race: "human", name: "Hyphen" }]),
    );

    expect(stderr).toContain(
      `- error: ${UNIT_DATA}: the unit "h-oo" is not a Rawcode of four characters of [A-Za-z0-9].\n`,
    );
  });

  it("a unit with two rows", async () => {
    const { stderr } = await refused(
      unitStorage([...HUMAN, { id: "hfoo", race: "human", name: "Footman" }]),
    );

    expect(stderr).toContain(
      `- error: ${UNIT_DATA}: the unit hfoo has two rows.\n`,
    );
  });

  it("a name field the metadata places outside the profile files", async () => {
    const { stderr } = await refused({
      ...unitStorage(HUMAN),
      files: {
        ...unitStorage(HUMAN).files,
        [UNIT_META_DATA]: unitMetaDataSlk("Name", "UnitUI"),
      },
    });

    expect(stderr).toContain(
      `- error: ${UNIT_META_DATA}: the field unam is in "UnitUI", not in the profile files the names are read from.\n`,
    );
  });

  it("a folder that holds no storage", async () => {
    const installDir = await tempDir("empty");
    const outDir = await tempDir("out");
    let stderr = "";
    const status = await main(
      ["--install", installDir, "--out", outDir],
      { stdout: () => undefined, stderr: (text) => (stderr += text) },
      { machine: NO_GAME, cwd: outDir },
    );

    expect(status).toBe(1);
    expect(stderr).toBe(
      `--install is set to "${installDir}", and no .build.info is at or above ${installDir}.\n`,
    );
  });
});
