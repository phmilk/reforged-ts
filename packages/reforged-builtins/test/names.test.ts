/**
 * Seam 1: the constant naming rules of #509 ("Constant names") on the
 * shared table of names (test/fixtures/constant-names.json), and the diagnostic of two constants with one name.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { constantName, duplicateConstants } from "../src/names.js";

/** The table of names and constants `reforged-map`'s tests run too, so both packages name a constant alike. */
const CONSTANT_NAMES = JSON.parse(
  readFileSync(
    new URL("../../../test/fixtures/constant-names.json", import.meta.url),
    "utf8",
  ),
) as { name: string | null; rawcode: string; constant: string }[];

describe("constantName", () => {
  it.each(CONSTANT_NAMES)(
    "names $name $rawcode as $constant",
    ({ name, rawcode, constant }) => {
      expect(constantName(name ?? undefined, rawcode)).toBe(constant);
    },
  );
});

describe("duplicateConstants", () => {
  it("names each constant that two objects of one kind share, with their Rawcodes", () => {
    expect(
      duplicateConstants({
        hfoo: { kind: "unit", sets: [], constant: "Footman_hfoo" },
        hfo2: { kind: "unit", sets: [], constant: "Footman_hfoo" },
        Afoo: { kind: "ability", sets: [], constant: "Footman_hfoo" },
        hkni: { kind: "unit", sets: [], constant: "Knight_hkni" },
      }),
    ).toEqual([
      "The units hfo2 and hfoo share the constant Units.Footman_hfoo.",
    ]);
  });

  it("finds none in distinct constants", () => {
    expect(
      duplicateConstants({
        hfoo: { kind: "unit", sets: [], constant: "Footman_hfoo" },
      }),
    ).toEqual([]);
  });
});
