// The binary reader's generic read and the writer's accumulated values are
// private, and the reader's position and remaining are read-only: the public
// surface is the typed methods.
import { BinaryReader, BinaryWriter } from "reforged-ts";

declare const reader: BinaryReader;
declare const writer: BinaryWriter;

// eslint-disable-next-line @typescript-eslint/unbound-method -- Negative: the member is private, never called
export const read = reader.read; // error TS2341

export const values = writer.values; // error TS2341

export function rewind(): void {
  reader.position = 0; // error TS2540
  reader.remaining = 0; // error TS2540
}
