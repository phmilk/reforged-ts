// The writer of the model's Object data files and war3map.wts (ADR 0015):
// the bytes of each, in the layout src/object-data.ts reads. A file is
// written in the format version it was read in, with its objects, their
// modifications, duplicates, set counts and flags, end markers, field ids
// and trailing bytes as the model holds them, so a file read and written
// with no edit comes back byte for byte. war3map.wts is written from its
// blocks' raw lines and the bytes between them.

import {
  VALUE_TYPES,
  type Modification,
  type ObjectDataFile,
  type ObjectEntry,
  type WtsFile,
} from "./model.js";
import { LEVELLED, NO_RAWCODE } from "./object-data.js";

const ENCODER = new TextEncoder();
const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);

/** The bytes of an Object data file. */
export function encodeObjectDataFile(file: ObjectDataFile): Uint8Array {
  const writer = new ByteWriter();
  const levelled = LEVELLED.has(file.kind);
  const withSets = file.version >= 3;
  writer.uint32(file.version);
  for (const [table, custom] of [
    [file.original, false],
    [file.custom, true],
  ] as const) {
    writer.uint32(table.length);
    for (const entry of table) {
      writeEntry(writer, entry, custom, levelled, withSets);
    }
  }
  if (file.trailing !== undefined) writer.raw(file.trailing);
  return writer.bytes();
}

function writeEntry(
  writer: ByteWriter,
  entry: ObjectEntry,
  custom: boolean,
  levelled: boolean,
  withSets: boolean,
): void {
  writer.rawcode(entry.original);
  writer.rawcode((custom ? entry.custom : entry.customSlot) ?? NO_RAWCODE);
  if (withSets) {
    writer.uint32(entry.sets.length);
    for (const set of entry.sets) {
      writer.uint32(set.flag ?? 0);
      writeModifications(writer, set.modifications, levelled);
    }
  } else {
    writeModifications(writer, entry.sets[0]?.modifications ?? [], levelled);
  }
}

function writeModifications(
  writer: ByteWriter,
  modifications: readonly Modification[],
  levelled: boolean,
): void {
  writer.uint32(modifications.length);
  for (const modification of modifications) {
    writer.rawcode(modification.field);
    writer.uint32(VALUE_TYPES.indexOf(modification.type));
    if (levelled) {
      writer.uint32(modification.level ?? 0);
      writer.uint32(modification.dataPointer ?? 0);
    }
    const { value } = modification;
    if (modification.type === "string") {
      writer.raw(modification.bytes ?? ENCODER.encode(String(value)));
      writer.raw(new Uint8Array([0]));
    } else if (modification.type === "int") {
      writer.int32(Number(value));
    } else if (modification.bits !== undefined) {
      writer.uint32(modification.bits);
    } else {
      writer.float32(Number(value));
    }
    writer.rawcode(modification.end);
  }
}

/** The bytes of war3map.wts: its byte order mark, each block's raw lines and the bytes between them. */
export function encodeWts(wts: WtsFile): Uint8Array {
  const writer = new ByteWriter();
  if (wts.bom) writer.raw(BOM);
  for (const block of wts.blocks) {
    writer.raw(block.before);
    writer.raw(block.header);
    writer.raw(block.comment);
    writer.raw(block.open);
    writer.raw(block.body);
    writer.raw(block.close);
  }
  writer.raw(wts.after);
  return writer.bytes();
}

/** Little-endian writes into a growing list of parts. */
class ByteWriter {
  readonly #parts: Uint8Array[] = [];
  #length = 0;

  uint32(value: number): void {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    this.raw(bytes);
  }

  int32(value: number): void {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setInt32(0, value, true);
    this.raw(bytes);
  }

  float32(value: number): void {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setFloat32(0, value, true);
    this.raw(bytes);
  }

  /** Four characters, each one byte of its code. */
  rawcode(text: string): void {
    this.raw(Uint8Array.from(text, (character) => character.charCodeAt(0)));
  }

  raw(bytes: Uint8Array): void {
    this.#parts.push(bytes);
    this.#length += bytes.length;
  }

  bytes(): Uint8Array {
    const bytes = new Uint8Array(this.#length);
    let offset = 0;
    for (const part of this.#parts) {
      bytes.set(part, offset);
      offset += part.length;
    }
    return bytes;
  }
}
