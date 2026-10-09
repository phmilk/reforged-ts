/**
 * Seam 1: the constant naming rules of #509 ("Constant names") on the
 * examples of #512, and the diagnostic of two constants with one name.
 */
import { describe, expect, it } from "vitest";
import { constantName, duplicateConstants } from "../src/names.js";

describe("constantName", () => {
  it.each([
    ["Footman", "hfoo", "Footman_hfoo"],
    ["|cffffcc00Paladin|r", "Hpal", "Paladin_Hpal"],
    ["Claws of Attack +15", "ratf", "ClawsOfAttack15_ratf"],
    ["Blizzard", "AHbz", "Blizzard_AHbz"],
    ["Timed Life", "BTLF", "TimedLife_BTLF"],
    ["Summer Tree Wall", "LTlt", "SummerTreeWall_LTlt"],
    ["Brazier", "LObr", "Brazier_LObr"],
    ["Iron Forged Swords", "Rhme", "IronForgedSwords_Rhme"],
    ["Défenseur Élite", "hacc", "DefenseurElite_hacc"],
    ["1st Legion", "h001", "_1stLegion_h001"],
    ["", "hemp", "Unnamed_hemp"],
    [undefined, "hnon", "Unnamed_hnon"],
    ["Mur'gul Slave", "nmrl", "MurgulSlave_nmrl"],
    ["Kel’Thuzad", "Uktl", "KelThuzad_Uktl"],
  ])("names %j %s as %s", (name, rawcode, constant) => {
    expect(constantName(name, rawcode)).toBe(constant);
  });
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
