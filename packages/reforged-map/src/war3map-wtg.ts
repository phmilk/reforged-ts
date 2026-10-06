// The reader of war3map.wtg: types the `udg_` variables of an object type
// (a unit type, an ability, ...) by the Object kind their Variable Editor type
// names, which war3map.lua does not say (its header holds `0`, `__jarray(0)`,
// or HiveWE's `nil` and `__jarray("")`).
//
// Only the 1.31+ format is read (`WTG!`, format 0x80000004, sub-version 7),
// which the 3.0 World Editor and HiveWE `main` write, and of it only the header
// and the variables block, laid out as HiveWE's `Triggers::load_version_31`
// reads it (src/base/triggers/triggers.ixx):
//
//   char[4]  "WTG!"
//   int32    format, 0x80000004
//   int32    sub-version, 7
//   7 times (maps, libraries, categories, triggers, comments, scripts,
//            variables): int32 count, int32 deleted, int32 id[deleted]
//   int32    unknown, int32 unknown, int32 trigger data version
//   int32    variable count, then per variable:
//     cstring name (without `udg_`), cstring type, int32 unknown (1),
//     int32 is array, int32 array size, int32 is initialized,
//     cstring initial value, int32 id, int32 parent id
//
// The trigger elements after it are never parsed, so no TriggerData.txt is
// needed. Little-endian integers, UTF-8 null-terminated strings.

import type { EditorGlobalsModel } from "./model.js";
import { findGlobal } from "./model.js";

/** The triggers file of a map folder: the Variable Editor's variables and the triggers. */
export const WTG_FILE = "war3map.wtg";

const MAGIC = "WTG!";
const FORMAT = 0x80000004;
const SUB_VERSION = 7;
/** Maps, libraries, categories, triggers, comments, scripts, variables. */
const ID_LISTS = 7;

/** The Variable Editor's object types and the type their variable is declared with. */
const OBJECT_TYPES: Readonly<Partial<Record<string, string>>> = {
  unitcode: 'Rawcode<"unit">',
  itemcode: 'Rawcode<"item">',
  abilcode: 'Rawcode<"ability">',
  buffcode: 'Rawcode<"buff">',
  destructablecode: 'Rawcode<"destructable">',
  techcode: 'Rawcode<"unit" | "upgrade">',
  ordercode: "number",
};

/** One variable of the Variable Editor, as war3map.wtg declares it. */
export interface WtgVariable {
  /** Its name, without `udg_`. */
  readonly name: string;
  /** Its Variable Editor type (`unitcode`, `integer`, `group`). */
  readonly type: string;
  readonly array: boolean;
  /** The array's size in the Variable Editor; 1 for a scalar. */
  readonly arraySize: number;
}

/** A war3map.wtg the reader cannot read; its message says why, in a few words. */
export class WtgFormatError extends Error {
  override name = "WtgFormatError";
}

/** The variables of a 1.31+ war3map.wtg. Throws a `WtgFormatError`. */
export function readWtgVariables(bytes: Uint8Array): WtgVariable[] {
  const reader = new ByteReader(bytes);
  const magic = reader.fixedString(MAGIC.length);
  if (magic !== MAGIC) throw new WtgFormatError("not a triggers file");
  const format = reader.uint32();
  if (format !== FORMAT) {
    throw new WtgFormatError(`unknown format version ${hex(format)}`);
  }
  const subVersion = reader.uint32();
  if (subVersion !== SUB_VERSION) {
    throw new WtgFormatError(
      `unknown format version ${hex(format)}, sub-version ${String(subVersion)}`,
    );
  }
  for (let list = 0; list < ID_LISTS; list++) {
    reader.uint32(); // count
    reader.skip(4 * reader.uint32()); // deleted ids
  }
  reader.skip(3 * 4); // two unknowns, the trigger data version

  const count = reader.uint32();
  const variables: WtgVariable[] = [];
  for (let index = 0; index < count; index++) {
    const name = reader.cString();
    const type = reader.cString();
    reader.uint32(); // unknown, 1
    const array = reader.uint32() !== 0;
    const arraySize = reader.uint32();
    reader.uint32(); // is initialized
    reader.cString(); // initial value
    reader.skip(2 * 4); // id, parent id
    variables.push({ name, type, array, arraySize });
  }
  return variables;
}

/**
 * Refines the model's `udg_` globals with the variables of war3map.wtg's
 * bytes, or `undefined` when the map folder has none: an object-type
 * variable gets the type of its Object kind. Every failure is a warning.
 */
export function readWar3mapWtg(
  bytes: Uint8Array | undefined,
  model: EditorGlobalsModel,
): void {
  const fallback =
    "object-type variables (unit-type, ability, item-type...) are declared as war3map.lua types them.";
  if (bytes === undefined) {
    model.warnings.push(`${WTG_FILE} not found: ${fallback}`);
    return;
  }
  let variables: WtgVariable[];
  try {
    variables = readWtgVariables(bytes);
  } catch (error) {
    if (!(error instanceof WtgFormatError)) throw error;
    model.warnings.push(`${WTG_FILE} not read (${error.message}): ${fallback}`);
    return;
  }
  for (const variable of variables) {
    const global = findGlobal(model, `udg_${variable.name}`);
    if (global === undefined) continue;
    if (global.array !== variable.array) {
      const shape = (array: boolean) => (array ? "an array" : "not an array");
      model.warnings.push(
        `${global.name}: ${WTG_FILE} declares it ${shape(variable.array)}, war3map.lua ${shape(global.array)}; declared as war3map.lua types it.`,
      );
      continue;
    }
    const type = OBJECT_TYPES[variable.type];
    if (type === undefined) continue;
    global.type = variable.array ? `Record<number, ${type}>` : type;
  }
}

function hex(value: number): string {
  return `0x${value.toString(16).padStart(8, "0")}`;
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

  skip(length: number): void {
    this.#need(length);
    this.#offset += length;
  }

  fixedString(length: number): string {
    this.#need(length);
    const text = String.fromCharCode(
      ...this.#bytes.subarray(this.#offset, this.#offset + length),
    );
    this.#offset += length;
    return text;
  }

  cString(): string {
    const end = this.#bytes.indexOf(0, this.#offset);
    if (end === -1) throw truncated();
    const text = new TextDecoder("utf-8").decode(
      this.#bytes.subarray(this.#offset, end),
    );
    this.#offset = end + 1;
    return text;
  }

  #need(length: number): void {
    if (this.#offset + length > this.#bytes.byteLength) throw truncated();
  }
}

function truncated(): WtgFormatError {
  return new WtgFormatError("truncated");
}
