/**
 * Seam 1 on real inputs: the vendored 3.0.0.24268 Patch and the real Overlay.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { generate, type GenerateSuccess } from "../src/index.js";
import { generatedFile } from "./support/fixture.js";

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
  commonJ = generatedFile(result, "3.0.0/common.j.d.ts");
  blizzardJ = generatedFile(result, "3.0.0/blizzard.j.d.ts");
  commonAi = generatedFile(result, "3.0.0/common.ai.d.ts");
}, 60_000);

/** Occurrences of a line pattern in a generated file. */
function count(text: string, pattern: RegExp): number {
  return text.match(new RegExp(pattern.source, "gm"))?.length ?? 0;
}

/** `Rawcode<"unit" | "upgrade">` as `unit | upgrade`, `Rawcode` as `any`. */
function kindOf(type: string): string {
  return type === "Rawcode" ? "any" : type.slice(8, -1).replaceAll('"', "");
}

const RAWCODE = /Rawcode(?:<[^>]*>)?/;

/**
 * The Rawcodes a generated file declares, counted per Object kind: the
 * parameters, the returns and the globals (an array's elements).
 */
function rawcodes(text: string) {
  const tally = {
    params: {} as Record<string, number>,
    returns: {} as Record<string, number>,
    globals: {} as Record<string, number>,
  };
  const add = (into: Record<string, number>, type: string) => {
    const kind = kindOf(type);
    into[kind] = (into[kind] ?? 0) + 1;
  };
  for (const line of text.split("\n")) {
    const fn = /^declare function \w+\((.*)\): (.+);$/.exec(line);
    if (fn) {
      for (const [type] of fn[1].matchAll(
        new RegExp(`: (${RAWCODE.source})`, "g"),
      )) {
        add(tally.params, type.slice(2));
      }
      if (new RegExp(`^${RAWCODE.source}$`).test(fn[2])) {
        add(tally.returns, fn[2]);
      }
      continue;
    }
    const global = new RegExp(
      `^declare (?:const|let) \\w+: (?:Record<number, )?(${RAWCODE.source})`,
    ).exec(line);
    if (global) add(tally.globals, global[1]);
  }
  return tally;
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
      'declare function CreateUnit(id: player, unitid: Rawcode<"unit">, x: number, y: number, face: number): unit | undefined;',
    );
  });

  it("types every Rawcode by Object kind, none left unclassified", () => {
    // The generator fails on an unclassified Rawcode, so a diagnostic-free
    // run (above) is zero unclassified items; these counts pin the curation.
    expect(rawcodes(commonJ)).toEqual({
      params: {
        ability: 62,
        destructable: 48,
        unit: 22,
        item: 15,
        "unit | upgrade": 7,
        doodad: 4,
        any: 3,
        upgrade: 2,
        buff: 1,
      },
      returns: {
        unit: 6,
        item: 5,
        ability: 4,
        destructable: 1,
        doodad: 1,
        upgrade: 1,
      },
      globals: {},
    });
    expect(rawcodes(blizzardJ)).toEqual({
      params: {
        unit: 30,
        item: 17,
        ability: 15,
        "unit | upgrade": 5,
        doodad: 4,
        buff: 3,
        upgrade: 3,
        destructable: 2,
        any: 1,
      },
      returns: { unit: 3, item: 3, ability: 1, any: 1 },
      globals: { destructable: 3, any: 1 },
    });
    expect(rawcodes(commonAi)).toEqual({
      params: { unit: 80, upgrade: 7, any: 1 },
      returns: { unit: 2, ability: 1 },
      // 382 four-character globals and 16 aliases, plus 7 arrays.
      globals: { unit: 246, ability: 68, upgrade: 90, any: 1 },
    });
  });

  it("types a returned Rawcode and a common.ai global by kind", () => {
    expect(commonJ).toContain(
      'declare function GetSpellAbilityId(): Rawcode<"ability">;',
    );
    expect(commonAi).toContain('declare const FOOTMAN: Rawcode<"unit">;');
    expect(commonAi).toContain('declare const FOOTMEN: Rawcode<"unit">;');
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

  it("marks GetLocalPlayer @async, and 67 Natives in all", () => {
    expect(commonJ).toContain(
      [
        "/**",
        " * @returns player",
        " * @async",
        " * @remarks Returned a handle in every case of the nullability sweep (one call) on 3.0.0.24268; evidence, not proof.",
        " * @see {@link https://lep.duckdns.org/jassbot/doc/GetLocalPlayer}",
        " */",
        "declare function GetLocalPlayer(): player;",
      ].join("\n"),
    );
    expect(count(commonJ, /^ \* @async$/)).toBe(67);
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

  it("references the Rawcode types and the common.j and blizzard.j outputs from the 3.0.0 entry, never common.ai", () => {
    const references = generatedFile(result, "3.0.0.d.ts").match(
      /^\/\/\/ <reference .*\/>$/gm,
    );
    expect(references).toEqual([
      '/// <reference types="lua-types/5.3" resolution-mode="require" />',
      '/// <reference path="./rawcode.d.ts" />',
      '/// <reference path="./lua-runtime.d.ts" />',
      '/// <reference path="./3.0.0/common.j.d.ts" />',
      '/// <reference path="./3.0.0/blizzard.j.d.ts" />',
    ]);
  });

  it("lists the 67 async Natives in async-natives.json, sorted", () => {
    const names = JSON.parse(
      generatedFile(result, "async-natives.json"),
    ) as string[];
    expect(names).toHaveLength(67);
    expect(names).toContain("GetLocalPlayer");
    expect(names).toEqual([...names].sort());
    expect(new Set(names).size).toBe(67);
    for (const name of names) {
      expect(commonJ).toContain(`declare function ${name}(`);
    }
  });

  it("lists every function and global in the manifest", () => {
    const manifest = JSON.parse(
      generatedFile(result, "3.0.0/manifest.json"),
    ) as { patch: string; entries: { name: string; async?: boolean }[] };
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
    ).toHaveLength(67);
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
