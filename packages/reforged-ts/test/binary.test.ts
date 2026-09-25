/** @noSelfInFile */

// A pure System on the VM the game runs: the writer packs and the reader
// unpacks with string.pack and string.unpack (pure logic on real Lua).

import { describe, expect, it } from "reforged-test/lua";
import { BinaryReader } from "../src/system/binaryreader";
import { BinaryWriter } from "../src/system/binarywriter";

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
