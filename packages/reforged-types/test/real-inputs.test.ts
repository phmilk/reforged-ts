/**
 * Seam 1 on real inputs: the vendored 3.0.0.24268 Patch and the real Overlay.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { generate, type GenerateSuccess } from "../src/index.js";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const patchDir = join(packageRoot, "vendor", "3.0.0.24268");
const overlayDir = join(packageRoot, "overlay");

let result: GenerateSuccess;
let commonJ: string;
let blizzardJ: string;
let commonAi: string;

beforeAll(async () => {
  const generated = await generate({ patchDir, overlayDir });
  if (!generated.ok) {
    throw new Error(generated.diagnostics.map((d) => d.message).join("\n"));
  }
  result = generated;
  commonJ = result.files.get("3.0.0/common.j.d.ts")!;
  blizzardJ = result.files.get("3.0.0/blizzard.j.d.ts")!;
  commonAi = result.files.get("3.0.0/common.ai.d.ts")!;
}, 60_000);

/** Occurrences of a line pattern in a generated file. */
function count(text: string, pattern: RegExp): number {
  return text.match(new RegExp(pattern.source, "gm"))?.length ?? 0;
}

const FUNCTION = /^declare function /;
const TYPE = /^declare interface /;
const GLOBAL = /^declare (const|let) /;

describe("Patch 3.0.0.24268 with the real Overlay", () => {
  it("generates the three files without a diagnostic", () => {
    expect(result.patch).toBe("3.0.0.24268");
    expect([...result.files.keys()]).toEqual([
      "3.0.0/common.j.d.ts",
      "3.0.0/blizzard.j.d.ts",
      "3.0.0/common.ai.d.ts",
      "3.0.0/manifest.json",
      "3.0.0.d.ts",
      "async-natives.json",
    ]);
    expect(result.diagnostics).toEqual([]);
  });

  it("declares every declaration the inventory counts", async () => {
    // 1,681 natives and 139 types (plus the `handle` root) in common.j.
    expect(count(commonJ, FUNCTION)).toBe(1681);
    expect(count(commonJ, TYPE)).toBe(139 + 1);
    expect(count(commonJ, GLOBAL)).toBe(1738);
    // 1,056 functions in Blizzard.j.
    expect(count(blizzardJ, FUNCTION)).toBe(1056);
    expect(count(blizzardJ, TYPE)).toBe(0);
    expect(count(blizzardJ, GLOBAL)).toBe(522);
    // 123 natives and 120 functions in common.ai: the output does not tell
    // them apart, so the split is read from the vendored file.
    const ai = await readFile(join(patchDir, "common.ai"), "utf8");
    expect(count(ai, /^\s*(constant\s+)?native\s/)).toBe(123);
    expect(count(ai, /^\s*function\s/)).toBe(120);
    expect(count(commonAi, FUNCTION)).toBe(123 + 120);
    expect(count(commonAi, GLOBAL)).toBe(472);
  });

  it("re-parents framehandle to agent", () => {
    expect(commonJ).toContain(
      "declare interface framehandle extends agent { __framehandle: never }",
    );
  });

  it("types CreateUnit as returning unit | undefined", () => {
    expect(commonJ).toContain(
      "declare function CreateUnit(id: player, unitid: number, x: number, y: number, face: number): unit | undefined;",
    );
  });

  it("gives Condition and Filter the boolean callback alias", () => {
    expect(commonJ).toContain("type boolcode = (this: void) => boolean;");
    expect(commonJ).toContain(
      "declare function Condition(func: boolcode): conditionfunc;",
    );
    expect(commonJ).toContain(
      "declare function Filter(func: boolcode): filterfunc;",
    );
  });

  it("marks GetLocalPlayer @async, and 56 Natives in all", () => {
    expect(commonJ).toContain(
      [
        "/**",
        " * @returns player",
        " * @async",
        " * @see {@link https://lep.duckdns.org/jassbot/doc/GetLocalPlayer}",
        " */",
        "declare function GetLocalPlayer(): player;",
      ].join("\n"),
    );
    expect(count(commonJ, /^ \* @async$/)).toBe(56);
    expect(count(blizzardJ + commonAi, /^ \* @async$/)).toBe(0);
  });

  it("does not declare the four removed RequestExtra*Data Natives", () => {
    for (const text of [commonJ, blizzardJ, commonAi]) {
      expect(text).not.toMatch(/RequestExtra(Boolean|Integer|Real|String)Data/);
    }
  });

  it("types bj_FORCE_PLAYER as a Record", () => {
    expect(blizzardJ).toContain(
      "declare let bj_FORCE_PLAYER: Record<number, force | undefined>;",
    );
  });

  it("tags the 137 new Natives and the 51 new constants with @patch, nothing else", () => {
    const since = / \* @patch 3\.0\.0\.24268$/;
    expect(count(commonJ, since)).toBe(137 + 51);
    expect(count(blizzardJ + commonAi, since)).toBe(0);
    expect(count(commonJ + blizzardJ + commonAi, /@patch /)).toBe(188);
    expect(commonJ).toMatch(
      / \* @patch 3\.0\.0\.24268\n \* @see \{@link https:\/\/lep\.duckdns\.org\/jassbot\/doc\/BlzGetUnitAbilityCooldownPercent\}\n \*\/\ndeclare function BlzGetUnitAbilityCooldownPercent\(/,
    );
    // StartSoundEx predates 3.0.0 and only lacked a seeded record.
    expect(commonJ).toContain(
      [
        " * @returns nothing",
        " * @see {@link https://lep.duckdns.org/jassbot/doc/StartSoundEx}",
        " */",
        "declare function StartSoundEx(soundHandle: sound, fadeIn: boolean): void;",
      ].join("\n"),
    );
  });

  it("references the common.j and blizzard.j outputs from the 3.0.0 entry, never common.ai", () => {
    const references = result.files
      .get("3.0.0.d.ts")!
      .match(/^\/\/\/ <reference .*\/>$/gm);
    expect(references).toEqual([
      '/// <reference types="lua-types/5.3" resolution-mode="require" />',
      '/// <reference path="./lua-runtime.d.ts" />',
      '/// <reference path="./3.0.0/common.j.d.ts" />',
      '/// <reference path="./3.0.0/blizzard.j.d.ts" />',
    ]);
  });

  it("lists the 56 async Natives in async-natives.json, sorted", () => {
    const names: string[] = JSON.parse(result.files.get("async-natives.json")!);
    expect(names).toHaveLength(56);
    expect(names).toContain("GetLocalPlayer");
    expect(names).toEqual([...names].sort());
    expect(new Set(names).size).toBe(56);
    for (const name of names) {
      expect(commonJ).toContain(`declare function ${name}(`);
    }
  });

  it("lists every function and global in the manifest", () => {
    const manifest = JSON.parse(result.files.get("3.0.0/manifest.json")!);
    const declared = [commonJ, blizzardJ, commonAi].reduce(
      (sum, text) => sum + count(text, FUNCTION) + count(text, GLOBAL),
      0,
    );
    expect(manifest.patch).toBe("3.0.0.24268");
    expect(manifest.entries).toHaveLength(declared);
    expect(manifest.entries).toHaveLength(
      1681 + 1738 + 1056 + 522 + 123 + 120 + 472,
    );
    expect(
      manifest.entries.find((e: { name: string }) => e.name === "CreateUnit"),
    ).toEqual({
      name: "CreateUnit",
      source: "common.j",
      kind: "native",
      constant: false,
      params: [
        { name: "id", type: "player", nullable: false },
        { name: "unitid", type: "integer", nullable: false },
        { name: "x", type: "real", nullable: false },
        { name: "y", type: "real", nullable: false },
        { name: "face", type: "real", nullable: false },
      ],
      returns: { type: "unit", nullable: true },
      async: false,
      since: null,
      deprecated: null,
    });
    expect(
      manifest.entries.filter((e: { async?: boolean }) => e.async),
    ).toHaveLength(56);
  });

  it("equals the committed output (the drift gate)", async () => {
    for (const [path, text] of result.files) {
      expect(
        await readFile(join(packageRoot, path), "utf8"),
        `${path} differs from the generated file; run typings:generate`,
      ).toBe(text);
    }
  });
});
