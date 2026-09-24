/** @noSelfInFile */

// A pure System on the VM the game runs: base64 works on the bytes of Lua
// strings, so UTF-8 text goes through string.byte and string.char as the game
// sees it (pure logic on real Lua).

import { describe, expect, it } from "reforged-test/lua";
import { base64Decode, base64Encode } from "../src/system/base64";

describe("base64", () => {
  it("round-trips a UTF-8 string", () => {
    const text = "Olá, Azeroth! Lok'tar ogar ✓ 魔兽争霸";
    expect(base64Decode(base64Encode(text))).toEqual(text);
  });

  it("round-trips every length modulo 3", () => {
    for (const text of ["", "é", "ér", "éra"]) {
      expect(base64Decode(base64Encode(text))).toEqual(text);
    }
  });
});
