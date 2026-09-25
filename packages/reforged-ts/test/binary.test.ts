/** @noSelfInFile */

// A pure System on the VM the game runs: the writer packs and the reader
// unpacks with string.pack and string.unpack (pure logic on real Lua). The
// tests go through the typed methods and the position and remaining
// accessors only.

import { describe, expect, it } from "reforged-test/lua";
import { BinaryReader } from "../src/system/binaryreader";
import { BinaryWriter } from "../src/system/binarywriter";
import { raisedIn } from "./support/raised-in";

/** A reader over what `write` packed. */
function readerOf(write: (writer: BinaryWriter) => void): BinaryReader {
  const writer = new BinaryWriter();
  write(writer);
  return new BinaryReader(writer.toString());
}

describe("BinaryReader.readDouble", () => {
  it("leaves the reader after the eight bytes it read", () => {
    const writer = new BinaryWriter();
    writer.writeDouble(1.5);
    writer.writeUInt16(45000);
    const reader = new BinaryReader(writer.toString());
    expect(reader.readDouble()).toEqual(1.5);
    expect(reader.readUInt16()).toEqual(45000);
  });
});

describe("a round trip", () => {
  it("returns every width's extremes, in the order written", () => {
    const reader = readerOf((writer) => {
      writer.writeInt8(-128);
      writer.writeInt8(127);
      writer.writeUInt8(0);
      writer.writeUInt8(255);
      writer.writeInt16(-32768);
      writer.writeInt16(32767);
      writer.writeUInt16(0);
      writer.writeUInt16(65535);
      writer.writeInt32(-2147483648);
      writer.writeInt32(2147483647);
      writer.writeUInt32(0);
      writer.writeUInt32(2147483647);
      writer.writeFloat(-0.375);
      writer.writeDouble(0.1);
      writer.writeString("hello");
      writer.writeUInt8(42);
    });
    expect(reader.readInt8()).toEqual(-128);
    expect(reader.readInt8()).toEqual(127);
    expect(reader.readUInt8()).toEqual(0);
    expect(reader.readUInt8()).toEqual(255);
    expect(reader.readInt16()).toEqual(-32768);
    expect(reader.readInt16()).toEqual(32767);
    expect(reader.readUInt16()).toEqual(0);
    expect(reader.readUInt16()).toEqual(65535);
    expect(reader.readInt32()).toEqual(-2147483648);
    expect(reader.readInt32()).toEqual(2147483647);
    expect(reader.readUInt32()).toEqual(0);
    expect(reader.readUInt32()).toEqual(2147483647);
    expect(reader.readFloat()).toEqual(-0.375);
    expect(reader.readDouble()).toEqual(0.1);
    expect(reader.readString()).toEqual("hello");
    expect(reader.readUInt8()).toEqual(42);
    expect(reader.remaining).toEqual(0);
  });

  it("rounds a float to single precision and keeps a double whole", () => {
    const reader = readerOf((writer) => {
      writer.writeFloat(0.1);
      writer.writeDouble(0.1);
    });
    const single = reader.readFloat();
    expect(single === 0.1).toBeFalsy();
    expect(math.abs(single - 0.1) < 1e-8).toBeTruthy();
    expect(reader.readDouble()).toEqual(0.1);
  });

  it("returns a string with zero bytes byte for byte", () => {
    let everyByte = "";
    for (let byte = 0; byte <= 255; byte++) {
      everyByte += string.char(byte);
    }
    const reader = readerOf((writer) => {
      writer.writeString(`a${string.char(0)}b${string.char(0)}`);
      writer.writeString(string.char(0));
      writer.writeString("");
      writer.writeString(everyByte);
      writer.writeUInt8(7);
    });
    expect(reader.readString()).toEqual(`a${string.char(0)}b${string.char(0)}`);
    expect(reader.readString()).toEqual(string.char(0));
    expect(reader.readString()).toEqual("");
    expect(reader.readString()).toEqual(everyByte);
    expect(reader.readUInt8()).toEqual(7);
  });

  it("returns a string of the maximum length, 65,535 bytes", () => {
    const longest = string.rep("x", 65535);
    const reader = readerOf((writer) => {
      writer.writeString(longest);
      writer.writeUInt8(7);
    });
    expect(reader.readString()).toEqual(longest);
    expect(reader.readUInt8()).toEqual(7);
  });
});

describe("unsigned 32-bit values at and above 2^31", () => {
  it("round-trip, packed as the unsigned four bytes", () => {
    const writer = new BinaryWriter();
    writer.writeUInt32(2147483648);
    writer.writeUInt32(3000000000);
    writer.writeUInt32(4294967295);
    const packed = writer.toString();
    expect(packed).toEqual(
      string.char(0x80, 0, 0, 0) +
        string.char(0xb2, 0xd0, 0x5e, 0) +
        string.char(0xff, 0xff, 0xff, 0xff),
    );
    const reader = new BinaryReader(packed);
    expect(reader.readUInt32()).toEqual(2147483648);
    expect(reader.readUInt32()).toEqual(3000000000);
    expect(reader.readUInt32()).toEqual(4294967295);
  });

  it("round-trip where integers are 32-bit [32-bit]", () => {
    const reader = readerOf((writer) => {
      writer.writeUInt32(2147483648);
      writer.writeUInt32(3000000000);
      writer.writeUInt32(4294967295);
    });
    expect(reader.readUInt32()).toEqual(2147483648);
    expect(reader.readUInt32()).toEqual(3000000000);
    expect(reader.readUInt32()).toEqual(4294967295);
  });
});

describe("BinaryReader.position and remaining", () => {
  it("count the bytes each read consumed and the bytes left", () => {
    const reader = readerOf((writer) => {
      writer.writeUInt8(1);
      writer.writeUInt32(2);
      writer.writeString("ab");
      writer.writeDouble(3);
    });
    expect(reader.position).toEqual(0);
    expect(reader.remaining).toEqual(17);
    reader.readUInt8();
    expect(reader.position).toEqual(1);
    reader.readUInt32();
    expect(reader.position).toEqual(5);
    reader.readString();
    expect(reader.position).toEqual(9);
    expect(reader.remaining).toEqual(8);
    reader.readDouble();
    expect(reader.position).toEqual(17);
    expect(reader.remaining).toEqual(0);
  });
});

describe("reading past the end", () => {
  it("throws with the position and the width, at the reading line", () => {
    const reader = readerOf((writer) => {
      writer.writeUInt8(1);
      writer.writeUInt16(2);
    });
    reader.readUInt8();
    const message = raisedIn(() => {
      reader.readUInt32();
    });
    expect(message).toEqual(
      "reforged-ts: readUInt32 past the end: position 1, width 4, 2 remaining",
    );
    expect(reader.position).toEqual(1);
  });

  it("throws for every typed method at the end", () => {
    const reader = new BinaryReader("");
    const reads: [string, () => void][] = [
      ["readDouble", () => reader.readDouble()],
      ["readFloat", () => reader.readFloat()],
      ["readInt8", () => reader.readInt8()],
      ["readInt16", () => reader.readInt16()],
      ["readInt32", () => reader.readInt32()],
      ["readString", () => reader.readString()],
      ["readUInt8", () => reader.readUInt8()],
      ["readUInt16", () => reader.readUInt16()],
      ["readUInt32", () => reader.readUInt32()],
    ];
    for (const [method, read] of reads) {
      expect(read).toThrow(`reforged-ts: ${method} past the end: position 0`);
    }
  });

  it("throws for a string its bytes do not reach, with its full width", () => {
    const writer = new BinaryWriter();
    writer.writeString("hello");
    const truncated = new BinaryReader(string.sub(writer.toString(), 1, 4));
    expect(() => truncated.readString()).toThrow(
      "reforged-ts: readString past the end: position 0, width 7, 4 remaining",
    );
    const prefixOnly = new BinaryReader(string.char(0));
    expect(() => prefixOnly.readString()).toThrow(
      "reforged-ts: readString past the end: position 0, width 2, 1 remaining",
    );
  });
});

describe("BinaryWriter range checks", () => {
  it("throw for a string longer than 65,535 bytes, at the writing line", () => {
    const writer = new BinaryWriter();
    const message = raisedIn(() => {
      writer.writeString(string.rep("x", 65536));
    });
    expect(message).toEqual(
      "reforged-ts: writeString takes at most 65535 bytes, got 65536",
    );
  });

  it("throw for a writeInt32 value outside the signed range, at the writing line", () => {
    const writer = new BinaryWriter();
    expect(
      raisedIn(() => {
        writer.writeInt32(2147483648);
      }),
    ).toEqual(
      "reforged-ts: writeInt32 takes -2147483648 to 2147483647, got 2147483648",
    );
    expect(
      raisedIn(() => {
        writer.writeInt32(-2147483649);
      }),
    ).toEqual(
      "reforged-ts: writeInt32 takes -2147483648 to 2147483647, got -2147483649",
    );
  });

  it("throw for every integer width's first value out of range", () => {
    const writer = new BinaryWriter();
    const writes: [string, () => void][] = [
      [
        "writeInt8",
        () => {
          writer.writeInt8(128);
        },
      ],
      [
        "writeInt8",
        () => {
          writer.writeInt8(-129);
        },
      ],
      [
        "writeUInt8",
        () => {
          writer.writeUInt8(256);
        },
      ],
      [
        "writeUInt8",
        () => {
          writer.writeUInt8(-1);
        },
      ],
      [
        "writeInt16",
        () => {
          writer.writeInt16(32768);
        },
      ],
      [
        "writeInt16",
        () => {
          writer.writeInt16(-32769);
        },
      ],
      [
        "writeUInt16",
        () => {
          writer.writeUInt16(65536);
        },
      ],
      [
        "writeUInt16",
        () => {
          writer.writeUInt16(-1);
        },
      ],
      [
        "writeUInt32",
        () => {
          writer.writeUInt32(4294967296);
        },
      ],
      [
        "writeUInt32",
        () => {
          writer.writeUInt32(-1);
        },
      ],
    ];
    for (const [method, write] of writes) {
      expect(write).toThrow(`reforged-ts: ${method} takes`);
    }
    expect(writer.toString()).toEqual("");
  });
});
