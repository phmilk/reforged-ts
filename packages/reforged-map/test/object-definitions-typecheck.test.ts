// The types of Object definitions (#703): a temporary Map project whose
// src/objects/ imports reforged-map/objects, as a Map project installs it
// (its emitted declarations, so `pnpm build` runs first), type-checked
// with the workspace's reforged-types and reforged-builtins. A definition
// with a wrong value, field id or level fails, by error code and line.

import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PACKAGE_ROOT,
  makeTempDir,
  removeTemporary,
} from "./support/map-folder.js";
import { typecheck } from "./support/map-project.js";

afterAll(removeTemporary);

const IMPORT = `import { defineAbility, defineBuff, defineDestructable, defineDoodad, defineItem, defineUnit, defineUpgrade, localized } from "reforged-map/objects";`;

/** Definitions of every kind that type-check. */
const VALID = `${IMPORT}

export const Sergeant = defineUnit({
  rawcode: "h002",
  base: FourCC("hfoo"),
  fields: {
    unam: localized("Sergeant", { deDE: "Feldwebel" }),
    umvs: 320,
    ua1t: "pierce",
    ucs2: "",
    udaa: "",
    uabi: [FourCC("AHbz"), FourCC("A001")],
    utyp: ["giant", "mechanical"],
    upro: ["Jon", "Ann"],
  },
  raw: [{ field: "Xfoo", type: "int", value: 1 }],
});
export const Knight = defineUnit({ rawcode: "hkni", fields: { uhpm: 900 } });
export const Blade = defineItem({ rawcode: "I001", base: FourCC("ratc"), fields: { unam: "Blade", igol: 100 } });
export const Storm = defineAbility({
  rawcode: "A001",
  base: FourCC("AHbz"),
  fields: { anam: "Storm", Hbz1: { 1: 3, 3: 5 }, aher: false, abuf: { 1: [FourCC("B001")] } },
});
export const Holy = defineBuff({ rawcode: "B001", base: FourCC("Binf"), fields: { ftip: "Holy" } });
export const Wall = defineDestructable({ rawcode: "B001", base: FourCC("LTlt"), fields: { bhps: 80.5 } });
export const Pillar = defineDoodad({ rawcode: "D001", base: FourCC("AOks"), fields: { dvr1: { 0: 10 } } });
export const Sharper = defineUpgrade({ rawcode: "R001", base: FourCC("Rhme"), fields: { gnam: { 1: "Sharpest" } } });
`;

/** One wrong definition per line, from line 3: a wrong value, field id, level, kind of base and kind of Rawcode in a list. */
const WRONG = `${IMPORT}

export const a = defineUnit({ rawcode: "h003", base: FourCC("hfoo"), fields: { umvs: "fast" } });
export const b = defineUnit({ rawcode: "h004", base: FourCC("hfoo"), fields: { zzzz: 1 } });
export const c = defineAbility({ rawcode: "A002", base: FourCC("AHbz"), fields: { alev: { 1: 3 } } });
export const d = defineAbility({ rawcode: "A003", base: FourCC("AHbz"), fields: { amcs: 90 } });
export const e = defineUnit({ rawcode: "h005", base: FourCC("hfoo"), fields: { ua1t: "laser" } });
export const f = defineUnit({ rawcode: "h006", base: FourCC("hfoo"), fields: { uabi: [FourCC("hfoo") as Rawcode<"unit">] } });
export const g = defineUnit({ rawcode: "h007", base: FourCC("AHbz") as Rawcode<"ability"> });
export const h = defineUnit({ rawcode: "h008", base: FourCC("hfoo"), fields: { ua1t: localized("pierce") } });
`;

describe("the types of Object definitions in a Map project", () => {
  let diagnostics: string[];

  beforeAll(() => {
    if (
      !fs.existsSync(path.join(PACKAGE_ROOT, "dist", "object-definitions.d.ts"))
    ) {
      throw new Error(
        "reforged-map has no emitted declarations: run `pnpm build` first.",
      );
    }
    const root = makeTempDir();
    for (const [name, target] of [
      [
        "reforged-types",
        path.join(PACKAGE_ROOT, "node_modules", "reforged-types"),
      ],
      [
        "reforged-builtins",
        path.join(PACKAGE_ROOT, "node_modules", "reforged-builtins"),
      ],
      ["reforged-map", PACKAGE_ROOT],
    ] as const) {
      const link = path.join(root, "node_modules", name);
      fs.mkdirSync(path.dirname(link), { recursive: true });
      fs.symlinkSync(fs.realpathSync(target), link, "junction");
    }
    const objects = path.join(root, "src", "objects");
    fs.mkdirSync(objects, { recursive: true });
    fs.writeFileSync(path.join(objects, "valid.ts"), VALID);
    fs.writeFileSync(path.join(objects, "wrong.ts"), WRONG);
    const tsconfig = path.join(root, "tsconfig.json");
    fs.writeFileSync(
      tsconfig,
      JSON.stringify({
        compilerOptions: {
          target: "ES2023",
          lib: ["ES2023"],
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          noEmit: true,
          types: ["reforged-types/3.0.1"],
        },
        include: ["src"],
      }),
    );
    diagnostics = typecheck(tsconfig);
  }, 60_000);

  it("accepts a definition of every kind, the empty value, a localized value, levels and the raw escape", () => {
    expect(
      diagnostics.filter((line) => !line.startsWith("src/objects/wrong.ts:")),
    ).toEqual([]);
  });

  it("fails a wrong value, field id or level, by code and line", () => {
    expect(diagnostics).toEqual([
      "src/objects/wrong.ts:10 TS2322",
      "src/objects/wrong.ts:3 TS2322",
      "src/objects/wrong.ts:4 TS2353",
      "src/objects/wrong.ts:5 TS2322",
      "src/objects/wrong.ts:6 TS2322",
      "src/objects/wrong.ts:7 TS2322",
      "src/objects/wrong.ts:8 TS2322",
      "src/objects/wrong.ts:9 TS2322",
    ]);
  });
});
