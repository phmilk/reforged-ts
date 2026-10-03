// The converter table of the Nullability sweep (src/nullability/converters.ts):
// how it reads the constants of `common.j`, and the checked-in module
// `probes/nullability/converter-constants.ts`, which must match what
// `probe:nullability-converters` renders from the Typings' Patch and the
// Overlay.

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main, type Context } from "../src/cli/nullability-converters.js";
import {
  CONVERTER_CONSTANTS_MODULE,
  OVERLAY_FOLDER,
  TYPINGS_MANIFEST,
  VENDOR_FOLDER,
} from "../src/folders.js";
import {
  converterTable,
  jassInteger,
  overlayConverters,
  renderConverterModule,
} from "../src/nullability/converters.js";

const SOURCES = {
  manifest: TYPINGS_MANIFEST,
  vendorFolder: VENDOR_FOLDER,
  overlayFolder: OVERLAY_FOLDER,
};

/** A `common.j` of two converters, one of whose types has no constant. */
const COMMON_J = [
  "constant native ConvertRace takes integer i returns race",
  "constant native ConvertMapSetting takes integer i returns mapsetting",
  "constant native ConvertFieldX takes integer i returns fieldx",
  "globals",
  "    constant race RACE_HUMAN = ConvertRace(1)",
  "    constant race RACE_ORC   = ConvertRace($02) // a comment",
  "    constant integer PLAYER_NEUTRAL_PASSIVE = GetPlayerNeutralPassive()",
  "    constant fieldx FIELD_A = ConvertFieldX('abpx')",
  "endglobals",
].join("\n");

describe("jassInteger", () => {
  it("reads decimals, hexadecimals, rawcodes and products", () => {
    expect(jassInteger("12", "A")).toBe(12);
    expect(jassInteger("-1", "A")).toBe(-1);
    expect(jassInteger("$0C", "A")).toBe(12);
    expect(jassInteger("0x0c", "A")).toBe(12);
    expect(jassInteger("'abpx'", "A")).toBe(0x61627078);
    expect(jassInteger("8192*16", "A")).toBe(131072);
  });

  it("fails on any other form, naming the constant", () => {
    expect(() => jassInteger("OTHER_CONSTANT", "A")).toThrow(
      "A = OTHER_CONSTANT: the converter table reads decimals, hexadecimals, rawcodes and products only.",
    );
  });
});

describe("converterTable", () => {
  it("lists the converters in common.j order, each with the constants of its type", () => {
    expect(
      converterTable(
        COMMON_J,
        new Set(["ConvertMapSetting", "ConvertRace", "ConvertFieldX"]),
      ),
    ).toEqual([
      {
        native: "ConvertRace",
        constants: [
          ["RACE_HUMAN", 1],
          ["RACE_ORC", 2],
        ],
      },
      { native: "ConvertMapSetting", constants: [] },
      { native: "ConvertFieldX", constants: [["FIELD_A", 0x61627078]] },
    ]);
  });

  it("fails on a converter common.j does not declare", () => {
    expect(() =>
      converterTable(COMMON_J, new Set(["ConvertRace", "ConvertNothing"])),
    ).toThrow("common.j declares no converter ConvertNothing.");
  });

  it("fails on two converters of one return type", () => {
    const commonJ = `constant native ConvertRaceAgain takes integer i returns race\n${COMMON_J}`;
    expect(() =>
      converterTable(commonJ, new Set(["ConvertRace", "ConvertRaceAgain"])),
    ).toThrow(
      "ConvertRace and ConvertRaceAgain both return race: the table cannot tell their constants apart.",
    );
  });

  it("fails on a constant of a converter's type made by another Native", () => {
    const commonJ = `${COMMON_J}\n    constant race RACE_ODD = ConvertOther(3)`;
    expect(() => converterTable(commonJ, new Set(["ConvertRace"]))).toThrow(
      "RACE_ODD is a race made by ConvertOther, not by ConvertRace.",
    );
  });
});

describe("the converter table of the Typings' Patch", () => {
  it("holds the 88 converters of the Overlay and their 1,724 constants", async () => {
    const { patch } = JSON.parse(await readFile(TYPINGS_MANIFEST, "utf8")) as {
      patch: string;
    };
    const commonJ = await readFile(
      join(VENDOR_FOLDER, patch, "common.j"),
      "utf8",
    );
    const table = converterTable(commonJ, overlayConverters(OVERLAY_FOLDER));
    expect(table).toHaveLength(88);
    expect(
      table.reduce((count, { constants }) => count + constants.length, 0),
    ).toBe(1724);
    expect(
      table
        .filter(({ constants }) => constants.length === 0)
        .map(({ native }) => native),
    ).toEqual([
      "ConvertMapVisibility",
      "ConvertMapSetting",
      "ConvertAbilityIntegerLevelArrayField",
      "ConvertAbilityRealLevelArrayField",
      "ConvertAbilityBooleanLevelArrayField",
      "ConvertAbilityStringLevelArrayField",
    ]);
  });

  it("is the checked-in module: run `pnpm probe:nullability-converters` when this fails", async () => {
    const checkedIn = await readFile(CONVERTER_CONSTANTS_MODULE, "utf8");
    expect(
      await renderConverterModule(SOURCES, CONVERTER_CONSTANTS_MODULE),
    ).toBe(checkedIn);
  });
});

describe("probe:nullability-converters", () => {
  it("writes the module and says where", async () => {
    const dir = await mkdtemp(join(tmpdir(), "probe-converters-"));
    try {
      const module = join(dir, "converter-constants.ts");
      const context: Context = { ...SOURCES, module };
      let stdout = "";
      const code = await main(
        [],
        {
          stdout: (text) => (stdout += text),
          stderr: () => undefined,
        },
        context,
      );
      expect(code).toBe(0);
      expect(stdout).toBe(`Wrote the converter table to ${module}\n`);
      expect(await readFile(module, "utf8")).toBe(
        await renderConverterModule(SOURCES, module),
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  /**
   * The command run on `context` in place of the real files: its exit code
   * and what it printed on stderr.
   */
  async function failingRun(
    context: Context,
  ): Promise<{ code: number; stderr: string }> {
    let stderr = "";
    const code = await main(
      [],
      { stdout: () => undefined, stderr: (text) => (stderr += text) },
      context,
    );
    return { code, stderr };
  }

  it("fails on one line when a source cannot be read", async () => {
    const dir = await mkdtemp(join(tmpdir(), "probe-converters-"));
    try {
      const module = join(dir, "converter-constants.ts");
      const manifest = join(dir, "manifest.json");
      const overlayFolder = join(dir, "overlay");
      const functions = join(overlayFolder, "common.j", "functions");
      await mkdir(functions, { recursive: true });

      expect(await failingRun({ ...SOURCES, manifest, module })).toEqual({
        code: 1,
        stderr: expect.stringMatching(
          /^probe:nullability-converters failed: [^\n]*manifest\.json could not be read as JSON[^\n]*\n$/,
        ),
      });

      await writeFile(manifest, JSON.stringify({ patch: "latest" }));
      expect(await failingRun({ ...SOURCES, manifest, module })).toEqual({
        code: 1,
        stderr: `probe:nullability-converters failed: ${manifest} names no Patch, such as 3.0.0.24268.\n`,
      });

      await writeFile(manifest, JSON.stringify({ patch: "9.9.9.1" }));
      expect(await failingRun({ ...SOURCES, manifest, module })).toEqual({
        code: 1,
        stderr: `probe:nullability-converters failed: ${join(VENDOR_FOLDER, "9.9.9.1", "common.j")} could not be read: the Patch 9.9.9.1 is not vendored.\n`,
      });

      const entry = join(functions, "ConvertRace.json");
      await writeFile(entry, "{ not json");
      expect(await failingRun({ ...SOURCES, overlayFolder, module })).toEqual({
        code: 1,
        stderr: expect.stringMatching(
          /^probe:nullability-converters failed: [^\n]*ConvertRace\.json could not be read as JSON[^\n]*\n$/,
        ),
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("refuses arguments", async () => {
    let stderr = "";
    const code = await main(["extra"], {
      stdout: () => undefined,
      stderr: (text) => (stderr += text),
    });
    expect(code).toBe(1);
    expect(stderr).toBe("Usage: probe:nullability-converters\n");
  });
});
