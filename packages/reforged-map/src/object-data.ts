// The reader of the Object data files: war3map.w3u and its siblings, and
// their war3mapSkin counterparts. Only format version 3 is read, which the
// 3.0 World Editor writes, laid out as HiveWE's object data reader reads it
// (src/base/object_data/*.ixx) and wc3libs' notes give it:
//
//   int32    format version, 3
//   twice (the Built-in objects modified, then the Custom objects added):
//     int32    object count, then per object:
//       char[4]  original Rawcode (a Custom object's base)
//       char[4]  Custom Rawcode, or four NUL bytes
//       int32    set count, then per set:
//         int32    set flag
//         int32    modification count, then per modification:
//           char[4]  field id
//           int32    level (a doodad's variation)   } abilities, doodads
//           int32    data pointer                   } and upgrades only
//           int32    value type: 0 int, 1 real, 2 unreal, 3 string
//           int32, float32, float32 or a NUL-terminated UTF-8 string
//           char[4]  end marker
//
// Every modification is kept as read, for the writer of ADR 0015. Little-
// endian integers and reals.

import { readMapFile } from "./map-folder.js";
import {
  VALUE_TYPES,
  type MapFolderModel,
  type Modification,
  type ModificationSet,
  type ObjectDataFile,
  type ObjectEntry,
  type ObjectKind,
} from "./model.js";

/** The extension of each Object kind's file: `war3map.w3u`, `war3mapSkin.w3u`. */
const EXTENSIONS: Readonly<Record<ObjectKind, string>> = {
  unit: "w3u",
  item: "w3t",
  ability: "w3a",
  buff: "w3h",
  destructable: "w3b",
  doodad: "w3d",
  upgrade: "w3q",
};

/** The kinds whose modifications carry a level and a data pointer. */
const LEVELLED: ReadonlySet<ObjectKind> = new Set([
  "ability",
  "doodad",
  "upgrade",
]);

const FORMAT_VERSION = 3;
const UTF8 = new TextDecoder("utf-8", { fatal: false });

/** An Object data file the reader cannot read; its message says why, in a few words. */
class ObjectDataError extends Error {
  override name = "ObjectDataError";
}

/**
 * Reads the Object data files of `kinds` into the model: for each kind, its
 * base file, then its Skin file. A missing file holds no object, with no
 * warning; one the reader cannot read is left out with a warning naming it.
 */
export function readObjectData(
  mapFolder: string,
  kinds: readonly ObjectKind[],
  model: MapFolderModel,
): void {
  for (const kind of kinds) {
    for (const skin of [false, true]) {
      const name = `war3map${skin ? "Skin" : ""}.${EXTENSIONS[kind]}`;
      const bytes = readMapFile(mapFolder, name);
      if (bytes === undefined) continue;
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

function readObjectDataFile(
  bytes: Uint8Array,
  name: string,
  kind: ObjectKind,
  skin: boolean,
): ObjectDataFile {
  const reader = new ByteReader(bytes);
  const version = reader.uint32();
  if (version !== FORMAT_VERSION) {
    throw new ObjectDataError(`unknown format version ${String(version)}`);
  }
  const levelled = LEVELLED.has(kind);
  const original = readTable(reader, levelled, false);
  const custom = readTable(reader, levelled, true);
  return { name, kind, skin, version, original, custom };
}

function readTable(
  reader: ByteReader,
  levelled: boolean,
  custom: boolean,
): ObjectEntry[] {
  const count = reader.uint32();
  const entries: ObjectEntry[] = [];
  for (let index = 0; index < count; index++) {
    const original = reader.rawcode();
    const customRawcode = reader.rawcode();
    const setCount = reader.uint32();
    if (setCount > 1) {
      throw new ObjectDataError(
        `${custom ? customRawcode : original} has ${String(setCount)} sets, whose layout is not settled, #460`,
      );
    }
    const sets: ModificationSet[] = [];
    for (let set = 0; set < setCount; set++) {
      const flag = reader.uint32();
      sets.push({ flag, modifications: readModifications(reader, levelled) });
    }
    entries.push({
      original,
      ...(custom && { custom: customRawcode }),
      sets,
    });
  }
  return entries;
}

function readModifications(
  reader: ByteReader,
  levelled: boolean,
): Modification[] {
  const count = reader.uint32();
  const modifications: Modification[] = [];
  for (let index = 0; index < count; index++) {
    const field = reader.rawcode();
    const level = levelled ? reader.uint32() : undefined;
    const dataPointer = levelled ? reader.uint32() : undefined;
    const typeIndex = reader.uint32();
    const type = VALUE_TYPES.at(typeIndex);
    if (type === undefined) {
      throw new ObjectDataError(
        `the field ${field} has the unknown value type ${String(typeIndex)}`,
      );
    }
    const value =
      type === "int"
        ? reader.int32()
        : type === "string"
          ? reader.cString()
          : reader.float32();
    const end = reader.rawcode();
    modifications.push({
      field,
      type,
      ...(level !== undefined && { level }),
      ...(dataPointer !== undefined && { dataPointer }),
      value,
      end,
    });
  }
  return modifications;
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
    this.#need(4);
    const value = this.#view.getUint32(this.#offset, true);
    this.#offset += 4;
    return value;
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

  cString(): string {
    const end = this.#bytes.indexOf(0, this.#offset);
    if (end === -1) throw truncated();
    const text = UTF8.decode(this.#bytes.subarray(this.#offset, end));
    this.#offset = end + 1;
    return text;
  }

  #need(length: number): void {
    if (this.#offset + length > this.#bytes.byteLength) throw truncated();
  }
}

function truncated(): ObjectDataError {
  return new ObjectDataError("truncated");
}
