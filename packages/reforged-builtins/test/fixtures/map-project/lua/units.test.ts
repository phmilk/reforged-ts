// Compiled into one typescript-to-lua bundle with the units' module and run on
// the reforged-test harness: the constants are the integers FourCC gives.
import { describe, expect, it } from "reforged-test/lua";
import { Units } from "reforged-builtins/units";

describe("reforged-builtins/units", () => {
  it("holds the integer FourCC gives for each Rawcode", () => {
    expect(Units.Footman_hfoo).toBe(FourCC("hfoo"));
    expect(Units.Paladin_Hpal).toBe(FourCC("Hpal"));
  });
});
