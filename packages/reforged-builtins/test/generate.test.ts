/**
 * Seam 1: `builtins:generate` on synthetic CASC storages the helpers write
 * in a temporary folder, with synthetic SLK and `.txt` files. The tests
 * assert the files it writes, its output and its exit code.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readFully } from "../src/casc/storage.js";
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

/**
 * A machine with no game where the lookup would look on its own. Its
 * platform is the host's: the tests pass real temporary folders, which
 * resolve by the host's path rules (drive letters on Windows).
 */
const NO_GAME: InstallMachine = {
  platform: process.platform,
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
        "Wrote 3.0.0/index.json, 3.0.0/provenance.json, 3.0.0.d.ts, 3.0.0/units.d.ts and 3.0.0/units.lua.\n",
    );
    expect(await readdir(outDir)).toEqual(["3.0.0", "3.0.0.d.ts"]);
    expect(await readdir(join(outDir, "3.0.0"))).toEqual([
      "index.json",
      "provenance.json",
      "units.d.ts",
      "units.lua",
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

  it("emits the units' FourCC overloads, constants' declarations and Lua module from the index", async () => {
    const storage = await writeStorage(unitStorage(HUMAN, CAMPAIGN));
    const outDir = await tempDir("out");
    expect((await run(storage.installDir, outDir)).status).toBe(0);
    const read = (path: string) => readFile(join(outDir, path), "utf8");
    const banner = (marker: string) =>
      [
        "Generated by reforged-builtins from the Built-in objects of Game version 3.0.0 (3.0.0/index.json).",
        "Derived identifiers only: Rawcodes, Object kinds, races, enUS names and Game data sets.",
        "Not affiliated with or endorsed by Blizzard Entertainment. Warcraft is a trademark of Blizzard Entertainment.",
        "The names and Rawcodes are derived from the game's data and are not licensed by this package.",
        "Never edited by hand: `pnpm builtins:generate` writes it and `pnpm builtins:check` compares it.",
      ].map((line) => `${marker} ${line}\n`);
    const overload = (rawcode: string, name: string, constant: string) =>
      `\n/**\n` +
      ` * ${name} (\`${rawcode}\`), a Built-in unit of Patch 3.0.0, race human.\n` +
      ` *\n` +
      ` * Its constant is \`Units.${constant}\`, from \`reforged-builtins/units\`.\n` +
      ` */\n` +
      `declare function FourCC(id: "${rawcode}"): Rawcode<"unit">;\n`;

    expect(await read("3.0.0.d.ts")).toBe(
      "/** @noSelfInFile */\n" +
        banner("//").join("") +
        "// The string overload, which returns UnknownRawcode, is reforged-types'.\n" +
        "\n// Units.\n" +
        overload("Hpal", "Paladin", "Paladin_Hpal") +
        overload("hfoo", "Footman", "Footman_hfoo") +
        overload("hkni", "Knight", "Knight_hkni") +
        overload("nmrl", "Mur'gul Slave", "MurgulSlave_nmrl").replace(
          "race human",
          "race naga",
        ) +
        overload("sfoo", "Footman", "Footman_sfoo"),
    );
    expect(await read("3.0.0/units.d.ts")).toBe(
      banner("//").join("") +
        `
/**
 * The Built-in units of Patch 3.0.0, each named by its enUS name and Rawcode, such as \`Units.Paladin_Hpal\`.
 */
export declare const Units: {
  /**
   * Paladin (\`Hpal\`), a Built-in unit of Patch 3.0.0, race human.
   */
  readonly Paladin_Hpal: Rawcode<"unit">;

  /**
   * Footman (\`hfoo\`), a Built-in unit of Patch 3.0.0, race human.
   */
  readonly Footman_hfoo: Rawcode<"unit">;

  /**
   * Knight (\`hkni\`), a Built-in unit of Patch 3.0.0, race human.
   */
  readonly Knight_hkni: Rawcode<"unit">;

  /**
   * Mur'gul Slave (\`nmrl\`), a Built-in unit of Patch 3.0.0, race naga.
   */
  readonly MurgulSlave_nmrl: Rawcode<"unit">;

  /**
   * Footman (\`sfoo\`), a Built-in unit of Patch 3.0.0, race human.
   */
  readonly Footman_sfoo: Rawcode<"unit">;
};
`,
    );
    // Each integer is the big-endian value of the four bytes: hfoo is
    // 0x68 0x66 0x6f 0x6f, 1751543663.
    expect(await read("3.0.0/units.lua")).toBe(
      banner("--").join("") +
        `-- Each value is the big-endian integer of the Rawcode's four bytes, what FourCC returns.
return {
  Units = {
    Paladin_Hpal = 1215324524,
    Footman_hfoo = 1751543663,
    Knight_hkni = 1751871081,
    MurgulSlave_nmrl = 1852666476,
    Footman_sfoo = 1936093039,
  },
}
`,
    );
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

  const LOWER_CASE_STRINGS =
    "War3.w3mod:_locales/enus.w3mod:units/campaignunitstrings.txt";

  it("matches a name's key and the names files without regard to case", async () => {
    const storage = await writeStorage({
      files: {
        [UNIT_DATA]: unitDataSlk([{ id: "Hpal", race: "human" }]),
        [UNIT_META_DATA]: unitMetaDataSlk(),
        // Read second: "_locales" comes after "_Locales" in code-point order.
        [LOWER_CASE_STRINGS]: "[Hpal]\r\nname=New\r\n",
        [strings("HumanUnitStrings.txt")]: "[Hpal]\r\nName=Old\r\n",
      },
    });
    const outDir = await tempDir("out");

    const { status, stdout } = await run(storage.installDir, outDir);

    expect(status).toBe(0);
    expect(stdout).toContain(
      `- warning: The unit Hpal is named "Old", then "New" in ${LOWER_CASE_STRINGS}: the last name wins.\n`,
    );
    expect(
      await readFile(join(outDir, "3.0.0", "index.json"), "utf8"),
    ).toContain('"Hpal": {"kind":"unit","name":"New"');
  });

  it("finds every file of a storage whose encoding file spans many pages", async () => {
    const filler = Object.fromEntries(
      Array.from({ length: 120 }, (_, i) => [
        `War3.w3mod:Filler/f${String(i)}.txt`,
        `filler ${String(i)}`,
      ]),
    );
    const storage = await writeStorage(
      unitStorage(HUMAN, CAMPAIGN, { files: filler }),
    );
    const outDir = await tempDir("out");

    const { status, stdout } = await run(storage.installDir, outDir);

    expect(status).toBe(0);
    expect(stdout).toContain(": 5 units.\n");
  });

  it("skips the -- that pnpm passes before the arguments", async () => {
    const storage = await writeStorage(unitStorage(HUMAN));
    const outDir = await tempDir("out");

    const status = await main(
      ["--", "--install", storage.installDir, "--out", outDir],
      { stdout: () => undefined, stderr: () => undefined },
      {
        machine: {
          ...NO_GAME,
          isFile: (file) =>
            file.startsWith(storage.installDir) && file.endsWith(".build.info"),
        },
        cwd: outDir,
      },
    );

    expect(status).toBe(0);
    expect(await readdir(join(outDir, "3.0.0"))).toEqual([
      "index.json",
      "provenance.json",
      "units.d.ts",
      "units.lua",
    ]);
  });
});

describe("readFully", () => {
  it("reads on after a short read, and stops at the end of the file", async () => {
    const content = Uint8Array.from({ length: 10 }, (_, i) => i + 1);
    const calls: number[] = [];
    // A file that returns at most 3 bytes per read.
    const file = {
      read: (
        buffer: Uint8Array,
        offset: number,
        length: number,
        position: number,
      ) => {
        calls.push(position);
        const chunk = content.subarray(
          position,
          Math.min(position + Math.min(length, 3), content.byteLength),
        );
        buffer.set(chunk, offset);
        return Promise.resolve({ bytesRead: chunk.byteLength });
      },
    };

    const whole = new Uint8Array(8);
    expect(await readFully(file, whole, 2)).toBe(8);
    expect([...whole]).toEqual([3, 4, 5, 6, 7, 8, 9, 10]);
    expect(calls).toEqual([2, 5, 8]);

    expect(await readFully(file, new Uint8Array(8), 6)).toBe(4);
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

  it("a storage with no names file, rather than unnamed units", async () => {
    const { stderr } = await refused({
      files: {
        [UNIT_DATA]: unitDataSlk(HUMAN),
        [UNIT_META_DATA]: unitMetaDataSlk(),
        [strings("UnitSkinStrings.txt")]: "[hfoo]\r\nName=Skin\r\n",
      },
    });

    expect(stderr).toContain(
      "- error: The root lists no names file War3.w3mod:_Locales/enUS.w3mod:Units/*UnitStrings.txt: every unit would be unnamed.\n",
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
