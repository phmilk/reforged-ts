// Values packed into one binary string and read back in the order they were
// written: each read returns what the matching write took.
import { BinaryReader, BinaryWriter } from "reforged-ts";

const writer = new BinaryWriter();
writer.writeUInt8(5);
writer.writeUInt32(12345678);
writer.writeDouble(0.1);
writer.writeString("hello");
writer.writeUInt16(45000);

const reader = new BinaryReader(writer.toString());
print(reader.readUInt8()); // 5
print(reader.readUInt32()); // 12345678
print(reader.readDouble()); // 0.1
print(reader.readString()); // hello
print(reader.readUInt16()); // 45000
print(reader.remaining); // 0
