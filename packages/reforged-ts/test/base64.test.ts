/** @noSelfInFile */

// A pure System on the VM the game runs: base64 works on the bytes of Lua
// strings, so UTF-8 text goes through string.byte and string.char as the game
// sees it (pure logic on real Lua).

import { describe, expect, it } from "reforged-test/lua";
import { base64Decode, base64Encode } from "../src/system/base64";
import { withPrint } from "./support/print-capture";

// RFC 4648, section 10.
const vectors: [string, string][] = [
  ["", ""],
  ["f", "Zg=="],
  ["fo", "Zm8="],
  ["foo", "Zm9v"],
  ["foob", "Zm9vYg=="],
  ["fooba", "Zm9vYmE="],
  ["foobar", "Zm9vYmFy"],
];

describe("base64", () => {
  it("encodes the RFC 4648 test vectors", () => {
    for (const [text, encoded] of vectors) {
      expect(base64Encode(text)).toEqual(encoded);
    }
  });

  it("decodes the RFC 4648 test vectors", () => {
    for (const [text, encoded] of vectors) {
      expect(base64Decode(encoded)).toEqual(text);
    }
  });

  it("round-trips all 256 byte values", () => {
    const bytes: string[] = [];
    for (let value = 0; value <= 255; value++) {
      bytes.push(string.char(value));
    }
    const text = bytes.join("");
    const encoded = base64Encode(text);
    expect(encoded.length).toEqual(344);
    expect(base64Decode(encoded)).toEqual(text);
  });

  it("round-trips a UTF-8 string", () => {
    const text = "Olá, Azeroth! Lok'tar ogar ✓ 魔兽争霸";
    expect(base64Decode(base64Encode(text))).toEqual(text);
  });

  it("round-trips every length modulo 3", () => {
    for (const text of ["", "é", "ér", "éra"]) {
      expect(base64Decode(base64Encode(text))).toEqual(text);
    }
  });

  it("throws on a length that is not a multiple of four", () => {
    for (const input of ["Z", "Zg", "Zg=", "Zm9vY"]) {
      expect(() => base64Decode(input)).toThrow("not a multiple of four");
    }
  });

  it("throws on a character outside the alphabet", () => {
    // A raw byte is built with string.char: "\xff" in the source compiles to
    // the two UTF-8 bytes of U+00FF.
    const raw = [string.char(0), string.char(255)].map((byte) => `Zm9${byte}`);
    for (const input of ["Zm9v!A==", "Zm-v", "Zm9v\nA==", ...raw]) {
      expect(() => base64Decode(input)).toThrow("outside the alphabet");
    }
  });

  it("throws on padding in the wrong place", () => {
    for (const input of ["Zg==Zm9v", "Zm=v", "Z===", "====", "=m9v"]) {
      expect(() => base64Decode(input)).toThrow("padding in the wrong place");
    }
  });

  it("prints nothing, encoding or decoding, valid or not", () => {
    const lines = withPrint(() => {
      base64Decode(base64Encode("foobar"));
      pcall(() => base64Decode("Zg="));
      pcall(() => base64Decode("Zm-v"));
      pcall(() => base64Decode("Zm=v"));
    });
    expect(lines).toEqual([]);
  });
});
