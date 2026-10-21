// The reader of the Object data files: war3map.w3u and its siblings, and
// their war3mapSkin counterparts, in format versions 1, 2 and 3, laid out as
// HiveWE reads them (src/utilities/modification_tables.ixx,
// load_modification_table, at stijnherfst/HiveWE commit cd6d61a) and as
// wc3libs reads and writes them (ObjMod.java, Obj.read_0x1, read_0x2 and
// read_0x3, at inwc3/wc3libs commit 0542c41):
//
//   int32    format version: 1, 2 or 3
//   twice (the Built-in objects modified, then the Custom objects added):
//     int32    object count, then per object:
//       char[4]  original Rawcode (a Custom object's base)
//       char[4]  Custom Rawcode, or four NUL bytes
//       version 3 only:
//         int32    set count, then per set:
//           int32    set flag
//           (the modifications below)
//       versions 1 and 2: the modifications alone, once
//       int32    modification count, then per modification:
//         char[4]  field id
//         int32    value type: 0 int, 1 real, 2 unreal, 3 string
//         int32    level (a doodad's variation)   } abilities, doodads
//         int32    data pointer                   } and upgrades only
//         int32, float32, float32 or a NUL-terminated UTF-8 string
//         char[4]  end marker
//   any bytes after the last table
//
// Versions 1 and 2 share one layout in both readers. Every file is kept as
// read, losslessly, for the writer of ADR 0015 (src/object-data-writer.ts):
// every modification, a string's bytes and a NaN's bits where the value
// cannot carry them, and the bytes after the last table. Little-endian
// integers and reals.

import { Buffer } from "node:buffer";
import { readMapFile } from "./map-folder.js";
import {
  OBJECT_KINDS,
  VALUE_TYPES,
  type MapFolderModel,
  type Modification,
  type ModificationSet,
  type ObjectDataFile,
  type ObjectEntry,
  type ObjectKind,
} from "./model.js";

/** The extension of each Object kind's file: `war3map.w3u`, `war3mapSkin.w3u`. */
export const EXTENSIONS: Readonly<Record<ObjectKind, string>> = {
  unit: "w3u",
  item: "w3t",
  ability: "w3a",
  buff: "w3h",
  destructable: "w3b",
  doodad: "w3d",
  upgrade: "w3q",
};

/** The kinds whose modifications carry a level and a data pointer. */
export const LEVELLED: ReadonlySet<ObjectKind> = new Set([
  "ability",
  "doodad",
  "upgrade",
]);

/** The four NUL bytes of a Built-in object's entry where a Custom Rawcode goes. */
export const NO_RAWCODE = "\0\0\0\0";

/** The format versions the reader reads; version 3 adds the sets. */
const FORMAT_VERSIONS: ReadonlySet<number> = new Set([1, 2, 3]);
const UTF8 = new TextDecoder("utf-8", { fatal: false });
const ENCODER = new TextEncoder();

/** An Object data file the reader cannot read; its message says why, in a few words. */
export class ObjectDataError extends Error {
  override name = "ObjectDataError";
}

/** Names the Object data file of a kind: `war3map.w3u`, or `war3mapSkin.w3u` for its Skin file. */
export function objectDataFileName(kind: ObjectKind, skin: boolean): string {
  return `war3map${skin ? "Skin" : ""}.${EXTENSIONS[kind]}`;
}

/** Lists the Object data files of every Object kind, each kind's base file then its Skin file. */
export function objectDataFileNames(): string[] {
  return OBJECT_KINDS.flatMap((kind) =>
    [false, true].map((skin) => objectDataFileName(kind, skin)),
  );
}

/**
 * Reads the Object data files of `kinds` into the model: for each kind, its
 * base file, then its Skin file, their bytes into the model's files. A
 * missing file holds no object, with no warning; one the reader cannot read
 * is left out with a warning naming it.
 */
export function readObjectData(
  mapFolder: string,
  kinds: readonly ObjectKind[],
  model: MapFolderModel,
): void {
  for (const kind of kinds) {
    for (const skin of [false, true]) {
      const name = objectDataFileName(kind, skin);
      const bytes = readMapFile(mapFolder, name);
      if (bytes === undefined) continue;
      model.files.set(name, bytes);
      try {
        model.objectData.push(readObjectDataFile(bytes, name, kind, skin));
      } catch (error) {
        if (!(error instanceof ObjectDataError)) throw error;
        model.warnings.push(
          `${name} not read (${error.message}): its objects are left out. Save the map with the World Editor of 3.0.`,
        );
      }
    }
  }
}

/** Reads the bytes of one Object data file; throws an `ObjectDataError` when it cannot. */
export function readObjectDataFile(
  bytes: Uint8Array,
  name: string,
  kind: ObjectKind,
  skin: boolean,
): ObjectDataFile {
  const reader = new ByteReader(bytes);
  const version = reader.uint32();
  if (!FORMAT_VERSIONS.has(version)) {
    throw new ObjectDataError(`unknown format version ${String(version)}`);
  }
  const levelled = LEVELLED.has(kind);
  const withSets = version >= 3;
  const original = readTable(reader, levelled, withSets, false);
  const custom = readTable(reader, levelled, withSets, true);
  const trailing = reader.rest();
  return {
    name,
    kind,
    skin,
    version,
    original,
    custom,
    ...(trailing.length > 0 && { trailing }),
  };
}

function readTable(
  reader: ByteReader,
  levelled: boolean,
  withSets: boolean,
  custom: boolean,
): ObjectEntry[] {
  const count = reader.uint32();
  const entries: ObjectEntry[] = [];
  for (let index = 0; index < count; index++) {
    const original = reader.rawcode();
    const customRawcode = reader.rawcode();
    entries.push({
      original,
      ...(custom && { custom: customRawcode }),
      ...(!custom &&
        customRawcode !== NO_RAWCODE && { customSlot: customRawcode }),
      sets: withSets
        ? readSets(reader, levelled, custom ? customRawcode : original)
        : [{ modifications: readModifications(reader, levelled) }],
    });
  }
  return entries;
}

/** The sets of an object of format version 3; more than one is not read (#460). */
function readSets(
  reader: ByteReader,
  levelled: boolean,
  rawcode: string,
): ModificationSet[] {
  const setCount = reader.uint32();
  if (setCount > 1) {
    throw new ObjectDataError(
      `${rawcode} has ${String(setCount)} sets, whose layout is not settled, #460`,
    );
  }
  const sets: ModificationSet[] = [];
  for (let set = 0; set < setCount; set++) {
    const flag = reader.uint32();
    sets.push({ flag, modifications: readModifications(reader, levelled) });
  }
  return sets;
}

function readModifications(
  reader: ByteReader,
  levelled: boolean,
): Modification[] {
  const count = reader.uint32();
  const modifications: Modification[] = [];
  for (let index = 0; index < count; index++) {
    const field = reader.rawcode();
    const typeIndex = reader.uint32();
    const type = VALUE_TYPES.at(typeIndex);
    if (type === undefined) {
      throw new ObjectDataError(
        `the field ${field} has the unknown value type ${String(typeIndex)}`,
      );
    }
    const level = levelled ? reader.uint32() : undefined;
    const dataPointer = levelled ? reader.uint32() : undefined;
    let value: number | string;
    let bytes: Uint8Array | undefined;
    let bits: number | undefined;
    if (type === "int") {
      value = reader.int32();
    } else if (type === "string") {
      const raw = reader.cString();
      value = UTF8.decode(raw);
      if (!sameBytes(ENCODER.encode(value), raw)) bytes = raw;
    } else {
      bits = reader.peekUint32();
      value = reader.float32();
      if (!Number.isNaN(value)) bits = undefined;
    }
    const end = reader.rawcode();
    modifications.push({
      field,
      type,
      ...(level !== undefined && { level }),
      ...(dataPointer !== undefined && { dataPointer }),
      value,
      end,
      ...(bytes !== undefined && { bytes }),
      ...(bits !== undefined && { bits }),
    });
  }
  return modifications;
}

/** Whether two byte arrays hold the same bytes. */
export function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && Buffer.compare(a, b) === 0;
}

/** Little-endian reads over the bytes; reading past the end throws "truncated". */
class ByteReader {
  readonly #view: DataView;
  readonly #bytes: Uint8Array;
  #offset = 0;

  constructor(bytes: Uint8Array) {
    this.#bytes = bytes;
    this.#view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  uint32(): number {
    const value = this.peekUint32();
    this.#offset += 4;
    return value;
  }

  /** The next four bytes as an unsigned integer, without moving past them. */
  peekUint32(): number {
    this.#need(4);
    return this.#view.getUint32(this.#offset, true);
  }

  int32(): number {
    this.#need(4);
    const value = this.#view.getInt32(this.#offset, true);
    this.#offset += 4;
    return value;
  }

  float32(): number {
    this.#need(4);
    const value = this.#view.getFloat32(this.#offset, true);
    this.#offset += 4;
    return value;
  }

  /** Four bytes, each one character of its code. */
  rawcode(): string {
    this.#need(4);
    const text = String.fromCharCode(
      ...this.#bytes.subarray(this.#offset, this.#offset + 4),
    );
    this.#offset += 4;
    return text;
  }

  /** The bytes up to the next NUL byte, which it moves past. */
  cString(): Uint8Array {
    const end = this.#bytes.indexOf(0, this.#offset);
    if (end === -1) throw truncated();
    const bytes = this.#bytes.slice(this.#offset, end);
    this.#offset = end + 1;
    return bytes;
  }

  /** The bytes not read yet. */
  rest(): Uint8Array {
    const bytes = this.#bytes.slice(this.#offset);
    this.#offset = this.#bytes.byteLength;
    return bytes;
  }

  #need(length: number): void {
    if (this.#offset + length > this.#bytes.byteLength) throw truncated();
  }
}

function truncated(): ObjectDataError {
  return new ObjectDataError("truncated");
}
