/**
 * The committed 3.0.0 index and provenance, extracted by `builtins:generate`
 * from an install of 3.0.0.24268: the facts of the Patch they pin, and that
 * the published files hold the index alone.
 */
import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  serializeIndex,
  serializeProvenance,
  type BuiltinsIndex,
  type Provenance,
} from "../src/model.js";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

describe("the 3.0.0 index", () => {
  it("holds the 928 units of the base layer of 3.0.0.24268", async () => {
    const index = JSON.parse(await read("3.0.0/index.json")) as BuiltinsIndex;

    expect(index.format).toBe(1);
    expect(index.build).toBe("3.0.0.24268");
    expect(index.gameVersion).toBe("3.0.0");
    expect(index.gameDataSets).toEqual([{ id: "default", label: "Default" }]);
    const entries = Object.values(index.objects);
    expect(entries).toHaveLength(928);
    expect(entries.every((entry) => entry.kind === "unit")).toBe(true);
    expect(index.objects.hfoo).toEqual({
      kind: "unit",
      name: "Footman",
      race: "human",
      sets: ["default"],
      constant: "Footman_hfoo",
    });
    expect(index.objects.Hpal.constant).toBe("Paladin_Hpal");
  });

  it("is written as the generator writes it", async () => {
    const text = await read("3.0.0/index.json");
    expect(serializeIndex(JSON.parse(text) as BuiltinsIndex)).toBe(text);
  });

  it("has its provenance, of the same Build, written as the generator writes it", async () => {
    const text = await read("3.0.0/provenance.json");
    const provenance = JSON.parse(text) as Provenance;

    expect(serializeProvenance(provenance)).toBe(text);
    expect(provenance.build).toBe("3.0.0.24268");
    expect(provenance.buildConfig).toBe("3a9d8f26806936764d2d9ad526a65e04");
    expect(provenance.inputs.map((input) => input.path)).toContain(
      "War3.w3mod:Units/UnitData.slk",
    );
  });
});

describe("the package", () => {
  it("publishes the index, and nothing of the generator, the provenance or the raw files", () => {
    const packed = JSON.parse(
      execSync("pnpm pack --dry-run --json", {
        cwd: packageRoot,
        encoding: "utf8",
      }),
    ) as { files: { path: string }[] };

    expect(packed.files.map((file) => file.path).sort()).toEqual([
      "3.0.0/index.json",
      "LICENSE",
      "README.md",
      "package.json",
    ]);
  });
});
