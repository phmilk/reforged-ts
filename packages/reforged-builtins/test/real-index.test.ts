/**
 * The committed 3.0.0 index and provenance, extracted by `builtins:generate`
 * from an install of 3.0.0.24268, and the artefacts emitted from the index:
 * the facts of the Patch they pin, that the artefacts are what the index
 * emits, that the package carries the Patch of reforged-types, and which
 * files it publishes.
 */
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { checkArtefacts } from "../src/check.js";
import { packageRoot, typingsBuild } from "../src/cli/generate.js";
import {
  serializeIndex,
  serializeProvenance,
  type BuiltinsIndex,
  type Provenance,
} from "../src/model.js";

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

describe("the 3.0.0 artefacts", () => {
  it("are what the committed index emits: builtins:check passes on the package", async () => {
    const result = await checkArtefacts(packageRoot);

    expect(result.problems).toEqual([]);
    expect(result.gameVersions).toEqual(["3.0.0"]);
    expect(result.files).toBe(4);
  });

  it("hold the 928 units' overloads and constants, the Footman's among them", async () => {
    const overloads = await read("3.0.0.d.ts");
    const declarations = await read("3.0.0/units.d.ts");
    const lua = await read("3.0.0/units.lua");

    expect(overloads.match(/^declare function FourCC\(/gm)).toHaveLength(928);
    expect(
      declarations.match(/^ {2}readonly \w+: Rawcode<"unit">;$/gm),
    ).toHaveLength(928);
    expect(lua.match(/^ {2}\w+ = \d+,$/gm)).toHaveLength(928);
    expect(overloads).toContain(
      [
        "/**",
        " * Footman (`hfoo`), a Built-in unit of Patch 3.0.0, race human.",
        " *",
        " * Its constant is `Units.Footman_hfoo`, from `reforged-builtins/units`.",
        " */",
        'declare function FourCC(id: "hfoo"): Rawcode<"unit">;',
      ].join("\n"),
    );
    expect(lua).toContain(`  Footman_hfoo = ${String(0x68666f6f)},`);
  });
});

describe("the package", () => {
  const manifest = async () =>
    JSON.parse(await read("package.json")) as {
      files: string[];
      reforged: { patch: string };
    };

  it("carries the Patch of reforged-types and of its index", async () => {
    const { reforged } = await manifest();
    const index = JSON.parse(await read("3.0.0/index.json")) as BuiltinsIndex;

    expect(reforged.patch).toBe(typingsBuild());
    expect(index.build).toBe(reforged.patch);
  });

  // npm always adds package.json; the provenance file, the generator (src/,
  // build/) and the tests match none of these patterns. map-project.test.ts
  // packs the package and lists the tarball.
  it("publishes the index and its artefacts, and nothing of the generator, the provenance or the raw files", async () => {
    expect((await manifest()).files).toEqual([
      "/[0-9]*.d.ts",
      "/[0-9]*/*.d.ts",
      "/[0-9]*/*.lua",
      "/[0-9]*/index.json",
      "/LICENSE",
      "/README.md",
    ]);
  });
});
