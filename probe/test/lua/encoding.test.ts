// The in-game module's encoding on the harness: which bytes of a value the
// writer escapes, which kinds and keys it writes, and how it splits a long
// line into continuation lines.

import { describe, expect, it } from "reforged-test/lua";
import {
  encodeValue,
  isSafeName,
  MAX_LINE_BYTES,
  recordLine,
  splitLine,
} from "../../game/encoding";

const PERCENT = string.char(37);

/** The `%XX` of a byte, as the reader expects it. */
function escaped(byte: number): string {
  return PERCENT + string.upper(string.format("%02x", byte));
}

/** The bytes of `from` to `to`, both included, as one string. */
function bytesBetween(from: number, to: number): string {
  let text = "";
  for (let byte = from; byte <= to; byte++) {
    text += string.char(byte);
  }
  return text;
}

describe("encodeValue", () => {
  it("escapes each control character", () => {
    for (let byte = 0; byte < 32; byte++) {
      expect(encodeValue(string.char(byte))).toEqual(escaped(byte));
    }
  });

  it("escapes space, =, %, the quote, the backslash and DEL", () => {
    for (const byte of [32, 61, 37, 34, 92, 127]) {
      expect(encodeValue(string.char(byte))).toEqual(escaped(byte));
    }
  });

  it("escapes each byte above ASCII", () => {
    for (let byte = 128; byte < 256; byte++) {
      expect(encodeValue(string.char(byte))).toEqual(escaped(byte));
    }
  });

  it("keeps every other printable ASCII byte as it is", () => {
    for (let byte = 33; byte < 127; byte++) {
      if (![61, 37, 34, 92].includes(byte)) {
        expect(encodeValue(string.char(byte))).toEqual(string.char(byte));
      }
    }
  });

  it("encodes a UTF-8 character as one escape per byte, in order", () => {
    expect(encodeValue("é ✓")).toEqual(
      `${PERCENT}C3${PERCENT}A9${PERCENT}20${PERCENT}E2${PERCENT}9C${PERCENT}93`,
    );
  });

  it("gives the empty string for the empty value", () => {
    expect(encodeValue("")).toEqual("");
  });

  it("leaves no byte outside the safe alphabet, whatever the value", () => {
    const encoded = encodeValue(bytesBetween(0, 255));
    // 166 bytes escaped, the 90 others kept.
    expect(encoded.length).toEqual(166 * 3 + 90);
    expect(string.find(encoded, "[^!-~]")[0]).toBeUndefined();
    expect(string.find(encoded, '["\\]')[0]).toBeUndefined();
  });
});

describe("isSafeName", () => {
  it("accepts each byte of printable ASCII but space, =, %, the quote and the backslash", () => {
    for (let byte = 33; byte < 127; byte++) {
      expect(isSafeName(string.char(byte))).toEqual(
        ![61, 37, 34, 92].includes(byte),
      );
    }
    expect(isSafeName("my-kind_2.x")).toEqual(true);
  });

  it("refuses the empty name, and a name holding space, a control character or a byte above ASCII", () => {
    expect(isSafeName("")).toEqual(false);
    expect(isSafeName("my kind")).toEqual(false);
    expect(isSafeName("a\nb")).toEqual(false);
    expect(isSafeName(string.char(127))).toEqual(false);
    expect(isSafeName("é")).toEqual(false);
  });
});

describe("recordLine", () => {
  it("writes the kind and the keys as they are, the fields sorted by key, each value encoded", () => {
    expect(recordLine(4, "msg", { b: "x y", a: 1, c: true })).toEqual(
      `4 msg a=1 b=x${PERCENT}20y c=true`,
    );
  });

  it("writes a record without fields as its seq and its kind", () => {
    expect(recordLine(1, "empty", {})).toEqual("1 empty");
  });

  it("raises an error for a kind outside the safe alphabet", () => {
    expect(() => recordLine(1, "my kind", {})).toThrow(
      `The kind "my${PERCENT}20kind", percent-encoded here, is not a Result file name`,
    );
    expect(() => recordLine(1, "", {})).toThrow('The kind ""');
  });

  it("raises an error for a key outside the safe alphabet", () => {
    expect(() => recordLine(1, "msg", { 'a"b': 1 })).toThrow(
      `The key "a${PERCENT}22b"`,
    );
    expect(() => recordLine(1, "msg", { "a=b": 1 })).toThrow(
      `The key "a${PERCENT}3Db"`,
    );
    expect(() => recordLine(1, "msg", { "": 1 })).toThrow('The key ""');
  });
});

describe("splitLine", () => {
  it("keeps a line of 200 bytes whole", () => {
    const line = `7 x v=${string.rep("a", MAX_LINE_BYTES - 6)}`;
    expect(line.length).toEqual(200);
    expect(splitLine(line, 7)).toEqual([line]);
  });

  it("splits a line of 201 bytes into 200 bytes and a continuation line", () => {
    const line = `7 x v=${string.rep("a", MAX_LINE_BYTES - 6)}b`;
    expect(splitLine(line, 7)).toEqual([string.sub(line, 1, 200), "7+ b"]);
  });

  it("splits a long record into continuation lines of at most 200 bytes, which join back to it", () => {
    const line = `12 x v=${encodeValue(bytesBetween(0, 255))}`;
    const parts = splitLine(line, 12);
    expect(parts.length).toEqual(4);
    let joined = parts[0] ?? "";
    for (const [index, part] of parts.entries()) {
      expect(part.length <= MAX_LINE_BYTES).toEqual(true);
      if (index > 0) {
        expect(string.sub(part, 1, 4)).toEqual("12+ ");
        joined += string.sub(part, 5);
      }
    }
    expect(joined).toEqual(line);
  });
});
