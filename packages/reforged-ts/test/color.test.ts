/** @noSelfInFile */

// Pure logic on real Lua: an alpha of 0 is kept (0 is truthy in Lua), and
// only an alpha left out gives an opaque color.

import { describe, expect, it } from "reforged-test/lua";
import { Color, color } from "../src/utils/color";

describe("Color", () => {
  it("keeps an alpha of 0", () => {
    const transparent = new Color(255, 0, 0, 0);
    expect(transparent.alpha).toEqual(0);
    expect(transparent.code).toEqual("|c00ff0000");
  });

  it("is opaque when the alpha is left out", () => {
    const opaque = new Color(255, 0, 0);
    expect(opaque.alpha).toEqual(255);
    expect(opaque.code).toEqual("|cffff0000");
  });

  it("forwards the alpha through the color factory", () => {
    expect(color(255, 0, 0, 0).alpha).toEqual(0);
    expect(color(255, 0, 0).alpha).toEqual(255);
  });
});
