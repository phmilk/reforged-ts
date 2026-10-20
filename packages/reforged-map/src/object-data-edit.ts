// The edits of the Object data editor (ADR 0015, #632): setting and
// removing a field of an object, in the Editor form, the form the 3.0 World
// Editor saves, so that its next save leaves the edit where it is (#460,
// #475). An edit is checked whole before it changes the model, and it
// changes only the entries of the object it edits: every other object,
// modification and byte stays as read.
//
// - A field is set in the file the field table names (base or Skin): in
//   place when the object holds it there (position, value type, level, data
//   pointer and end marker kept), else appended with the field table's value
//   type and the end marker the 3.0 editor writes: the object's own
//   Rawcode, a Built-in object's or a Custom object's. #460 (section 4)
//   gives four NUL bytes for a Custom object, but the 3.0 editor's own save
//   in test/fixtures/editor-objects.w3m ends every Custom object's
//   modification with its Custom Rawcode, the names it moved into the Skin
//   files included, as wc3libs' war3mapReforged.w3u does but for two; the
//   editor's behaviour wins (#637). The field held in the other file (a
//   foreign layout) is removed from there.
// - The object is added to both files of its kind when either lacks it, with
//   one set of flag 0 (none in format versions 1 and 2); a file the kind
//   did not have is created in format version 3.
// - A value equal to its base's is kept as a modification (#460).

import type { BuiltinsIndex, FieldEntry, FieldTable } from "./builtins.js";
import {
  OBJECT_KINDS,
  type MapFolderModel,
  type Modification,
  type ModificationSet,
  type ObjectDataFile,
  type ObjectEntry,
  type ObjectKind,
  type ValueType,
} from "./model.js";
import {
  LEVELLED,
  objectDataFileName,
  objectDataFileNames,
} from "./object-data.js";
import { ObjectDataWriterError } from "./writer-error.js";

/** What an edit reads besides the model: reforged-builtins' field table and index, or why they are missing. */
export type EditTables =
  | { readonly fields: FieldTable; readonly builtins: BuiltinsIndex }
  | { readonly missing: string };

/** The field of an object an edit addresses, as the caller gives it. */
export interface FieldAddress {
  readonly kind: ObjectKind;
  readonly rawcode: string;
  readonly field: string;
  readonly level?: number;
  readonly dataPointer?: number;
}

/** The object an edit addresses: a Custom object of the map, with its base, or a Built-in object. */
type Target =
  | { readonly custom: true; readonly rawcode: string; readonly base: string }
  | { readonly custom: false; readonly rawcode: string };

/** Where a modification is: its entry in its file's table, its set and its index there. */
interface Place {
  readonly entry: number;
  readonly set: number;
  readonly index: number;
  readonly modification: Modification;
}

/** The format version of a file the kind did not have. */
const NEW_FILE_VERSION = 3;

const INT32_MIN = -0x80000000;
const INT32_MAX = 0x7fffffff;
const UINT32_MAX = 0xffffffff;

/**
 * Sets a field of an object in the model, in the Editor form; `type` is the
 * value type of a field the field table does not know.
 */
export function setField(
  model: MapFolderModel,
  tables: EditTables,
  address: FieldAddress,
  value: unknown,
  type: ValueType | undefined,
): void {
  const { fields, builtins } = requireTables(tables);
  const { kind } = address;
  const files = kindFiles(model, address);
  const target = findTarget(files, builtins, address);
  const entry = fields.fields[kind]?.[address.field];
  if (entry === undefined && type === undefined) {
    throw new ObjectDataWriterError(
      "unknown-field",
      `The field table of reforged-builtins (Game version ${fields.gameVersion}) does not know the ${kind} field ${printable(address.field)}: give its value type to set it.`,
    );
  }
  if (entry !== undefined && type !== undefined && type !== entry.type) {
    invalid(
      `The ${kind} field ${address.field} stores a value of type ${entry.type} (the field table of Game version ${fields.gameVersion}), not ${type}: leave its type out.`,
    );
  }
  if (entry?.localizable === true) {
    invalid(
      `The ${kind} field ${address.field} is a localizable string, which the World Editor keeps in war3map.wts: this version of reforged-map does not write one yet.`,
    );
  }
  const { level, dataPointer } = levelOf(address, entry);
  const places = files.map((file) =>
    file === undefined
      ? undefined
      : findField(file, target, address.field, level, dataPointer),
  );
  const [baseHeld, skinHeld] = places;
  const skin =
    entry === undefined
      ? skinHeld !== undefined && baseHeld === undefined
      : entry.file === "skin";
  const held = places[skin ? 1 : 0];
  const valueType = held?.modification.type ?? entry?.type ?? type;
  if (valueType === undefined) throw new Error("unreachable: no value type");
  const stored = checkValue(address, valueType, value);

  for (const inSkin of [false, true]) {
    const name = objectDataFileName(kind, inSkin);
    let file = files[inSkin ? 1 : 0] ?? newFile(name, kind, inSkin);
    file = withEntry(file, target);
    const place = inSkin ? skinHeld : baseHeld;
    if (inSkin === skin) {
      file =
        place === undefined
          ? appendModification(file, target, {
              field: address.field,
              type: valueType,
              ...(LEVELLED.has(kind) && { level, dataPointer }),
              value: stored,
              end: target.rawcode,
            })
          : replaceModification(file, target, place, {
              ...place.modification,
              value: stored,
              bytes: undefined,
              bits: undefined,
            });
    } else if (place !== undefined) {
      file = removeModification(file, target, place);
    }
    putFile(model, file);
  }
}

/** Removes a field of an object from the model, from both files of its kind. */
export function removeField(
  model: MapFolderModel,
  tables: EditTables,
  address: FieldAddress,
): void {
  const { fields, builtins } = requireTables(tables);
  const files = kindFiles(model, address);
  const target = findTarget(files, builtins, address);
  const entry = fields.fields[address.kind]?.[address.field];
  const { level, dataPointer } = levelOf(address, entry);
  const places = files.map((file) =>
    file === undefined
      ? undefined
      : findField(file, target, address.field, level, dataPointer),
  );
  files.forEach((file, index) => {
    const place = places[index];
    if (file !== undefined && place !== undefined) {
      putFile(model, removeModification(file, target, place));
    }
  });
}

function requireTables(tables: EditTables): {
  fields: FieldTable;
  builtins: BuiltinsIndex;
} {
  if ("missing" in tables) {
    throw new ObjectDataWriterError(
      "builtins-missing",
      `reforged-builtins ${tables.missing}: an edit of Object data needs its field table. Install reforged-builtins in the Map project (pnpm add -D reforged-builtins), or pass the Map project's root as projectRoot.`,
    );
  }
  return tables;
}

/**
 * The base file and the Skin file of the address's kind, undefined when the
 * map folder lacks it; refuses a file the readers left out, and a Rawcode
 * or field id that is not four bytes.
 */
function kindFiles(
  model: MapFolderModel,
  { kind, rawcode, field }: FieldAddress,
): (ObjectDataFile | undefined)[] {
  if (!OBJECT_KINDS.includes(kind)) {
    invalid(`${kind} is not an Object kind.`);
  }
  for (const [what, code] of [
    ["Rawcode", rawcode],
    ["field id", field],
  ] as const) {
    if (!isFourBytes(code)) {
      invalid(
        `The ${what} ${JSON.stringify(code)} is not four characters of one byte each.`,
      );
    }
  }
  return [false, true].map((skin) => {
    const name = objectDataFileName(kind, skin);
    const file = model.objectData.find((other) => other.name === name);
    if (file === undefined && model.files.has(name)) {
      throw new ObjectDataWriterError(
        "file-not-read",
        `${name} was not read (see the editor's warnings), so its ${kind}s cannot be edited: nothing is changed. Save the map with the World Editor of 3.0, then open it again.`,
        name,
      );
    }
    return file;
  });
}

/** The object of the address: a Custom object either file adds, else a Built-in object either file modifies or the index holds. */
function findTarget(
  files: readonly (ObjectDataFile | undefined)[],
  builtins: BuiltinsIndex,
  { kind, rawcode }: FieldAddress,
): Target {
  for (const file of files) {
    const custom = file?.custom.find((entry) => entry.custom === rawcode);
    if (custom !== undefined) {
      return { custom: true, rawcode, base: custom.original };
    }
  }
  const modified = files.some((file) =>
    file?.original.some((entry) => entry.original === rawcode),
  );
  if (
    modified ||
    (Object.hasOwn(builtins.objects, rawcode) &&
      builtins.objects[rawcode].kind === kind)
  ) {
    return { custom: false, rawcode };
  }
  throw new ObjectDataWriterError(
    "unknown-object",
    `The map holds no Custom ${kind} ${printable(rawcode)}, and no Built-in ${kind} of Game version ${builtins.gameVersion} has that Rawcode: check the Rawcode and the Object kind.`,
  );
}

/** The level and data pointer of the address, checked against its kind and field. */
function levelOf(
  address: FieldAddress,
  entry: FieldEntry | undefined,
): { level: number; dataPointer: number } {
  const { kind, field } = address;
  if (!LEVELLED.has(kind)) {
    if (address.level !== undefined || address.dataPointer !== undefined) {
      invalid(
        `A ${kind}'s modification has no level and no data pointer: leave them out of ${field}.`,
      );
    }
    return { level: 0, dataPointer: 0 };
  }
  if (address.level === undefined && entry?.levels === true) {
    invalid(
      `The ${kind} field ${field} holds a value per level: give the level to edit.`,
    );
  }
  const level = address.level ?? 0;
  const dataPointer = address.dataPointer ?? entry?.data ?? 0;
  for (const [what, number] of [
    ["level", level],
    ["data pointer", dataPointer],
  ] as const) {
    if (!Number.isInteger(number) || number < 0 || number > UINT32_MAX) {
      invalid(
        `The ${what} ${String(number)} of ${field} is not an integer from 0 to ${String(UINT32_MAX)}.`,
      );
    }
  }
  return { level, dataPointer };
}

/**
 * Where the object's entries of a file hold the field at the level and data
 * pointer: undefined when they do not; refused when they hold it twice.
 */
function findField(
  file: ObjectDataFile,
  target: Target,
  field: string,
  level: number,
  dataPointer: number,
): Place | undefined {
  const places: Place[] = [];
  const table = target.custom ? file.custom : file.original;
  table.forEach((entry, entryIndex) => {
    if (!isTarget(entry, target)) return;
    entry.sets.forEach((set, setIndex) => {
      set.modifications.forEach((modification, index) => {
        if (
          modification.field === field &&
          (modification.level ?? 0) === level &&
          (modification.dataPointer ?? 0) === dataPointer
        ) {
          places.push({
            entry: entryIndex,
            set: setIndex,
            index,
            modification,
          });
        }
      });
    });
  });
  if (places.length > 1) {
    throw new ObjectDataWriterError(
      "field-held-twice",
      `${file.name} holds the field ${printable(field)} of ${target.rawcode} ${String(places.length)} times${LEVELLED.has(file.kind) ? ` at level ${String(level)} and data pointer ${String(dataPointer)}` : ""}: reforged-map does not guess which one to edit. Save the map with the World Editor, which keeps one, then open it again.`,
      file.name,
    );
  }
  return places[0];
}

/** The value checked against its type, a real as its nearest 32-bit value; refused when a file cannot hold it. */
function checkValue(
  { kind, field }: FieldAddress,
  type: ValueType,
  value: unknown,
): number | string {
  if (type === "int") {
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < INT32_MIN ||
      value > INT32_MAX
    ) {
      invalid(
        `The ${kind} field ${field} stores an integer of 32 bits, from ${String(INT32_MIN)} to ${String(INT32_MAX)}: ${describe(value)} is not one.`,
      );
    }
    return value;
  }
  if (type === "string") {
    if (typeof value !== "string" || value.includes("\0")) {
      invalid(
        `The ${kind} field ${field} stores a string without a NUL byte: ${describe(value)} is not one.`,
      );
    }
    return value;
  }
  const real = typeof value === "number" ? Math.fround(value) : Number.NaN;
  if (!Number.isFinite(real)) {
    invalid(
      `The ${kind} field ${field} stores a finite real of 32 bits: ${describe(value)} is not one.`,
    );
  }
  return real;
}

/** A file the kind did not have, empty, in format version 3. */
function newFile(
  name: string,
  kind: ObjectKind,
  skin: boolean,
): ObjectDataFile {
  return {
    name,
    kind,
    skin,
    version: NEW_FILE_VERSION,
    original: [],
    custom: [],
  };
}

/** The file with an entry of the object, appended to its table when it has none. */
function withEntry(file: ObjectDataFile, target: Target): ObjectDataFile {
  const table = target.custom ? file.custom : file.original;
  if (table.some((entry) => isTarget(entry, target))) return file;
  const set: ModificationSet =
    file.version >= 3 ? { flag: 0, modifications: [] } : { modifications: [] };
  const entry: ObjectEntry = target.custom
    ? { original: target.base, custom: target.rawcode, sets: [set] }
    : { original: target.rawcode, sets: [set] };
  return target.custom
    ? { ...file, custom: [...file.custom, entry] }
    : { ...file, original: [...file.original, entry] };
}

/** The file with the modification appended to the object's first entry, in its last set. */
function appendModification(
  file: ObjectDataFile,
  target: Target,
  modification: Modification,
): ObjectDataFile {
  const table = target.custom ? file.custom : file.original;
  const entryIndex = table.findIndex((entry) => isTarget(entry, target));
  return withTableEntry(file, target, entryIndex, (entry) => {
    const sets =
      entry.sets.length > 0
        ? entry.sets
        : [
            file.version >= 3
              ? { flag: 0, modifications: [] }
              : { modifications: [] },
          ];
    const last = sets.length - 1;
    return {
      ...entry,
      sets: sets.map((set, index) =>
        index === last
          ? { ...set, modifications: [...set.modifications, modification] }
          : set,
      ),
    };
  });
}

/** The file with the modification at `place` replaced. */
function replaceModification(
  file: ObjectDataFile,
  target: Target,
  place: Place,
  modification: Modification,
): ObjectDataFile {
  return editAt(file, target, place, (modifications) =>
    modifications.map((other, index) =>
      index === place.index ? withoutUndefined(modification) : other,
    ),
  );
}

/** The file without the modification at `place`. */
function removeModification(
  file: ObjectDataFile,
  target: Target,
  place: Place,
): ObjectDataFile {
  return editAt(file, target, place, (modifications) =>
    modifications.filter((_, index) => index !== place.index),
  );
}

function editAt(
  file: ObjectDataFile,
  target: Target,
  place: Place,
  edit: (modifications: readonly Modification[]) => Modification[],
): ObjectDataFile {
  return withTableEntry(file, target, place.entry, (entry) => ({
    ...entry,
    sets: entry.sets.map((set, index) =>
      index === place.set
        ? { ...set, modifications: edit(set.modifications) }
        : set,
    ),
  }));
}

/** The file with one entry of the object's table changed. */
function withTableEntry(
  file: ObjectDataFile,
  target: Target,
  entryIndex: number,
  edit: (entry: ObjectEntry) => ObjectEntry,
): ObjectDataFile {
  const table = (target.custom ? file.custom : file.original).map(
    (entry, index) => (index === entryIndex ? edit(entry) : entry),
  );
  return target.custom
    ? { ...file, custom: table }
    : { ...file, original: table };
}

/** Puts the file into the model, in the place of the one of its name, else in the readers' order of file names. */
function putFile(model: MapFolderModel, file: ObjectDataFile): void {
  const index = model.objectData.findIndex((other) => other.name === file.name);
  if (index !== -1) {
    model.objectData[index] = file;
    return;
  }
  const order = objectDataFileNames();
  const rank = order.indexOf(file.name);
  const after = model.objectData.findIndex(
    (other) => order.indexOf(other.name) > rank,
  );
  model.objectData.splice(
    after === -1 ? model.objectData.length : after,
    0,
    file,
  );
}

function isTarget(entry: ObjectEntry, target: Target): boolean {
  return target.custom
    ? entry.custom === target.rawcode
    : entry.original === target.rawcode;
}

/** A modification without the keys an edit cleared: a string's bytes and a real's bits that no longer match its value. */
function withoutUndefined(modification: Modification): Modification {
  return Object.fromEntries(
    Object.entries(modification).filter(([, value]) => value !== undefined),
  ) as unknown as Modification;
}

/** Whether a Rawcode or a field id is four characters of one byte each, as a file stores it. */
function isFourBytes(code: unknown): code is string {
  return typeof code === "string" && /^[\0-\xff]{4}$/.test(code);
}

/** A Rawcode or field id as a message shows it: a three-character id's NUL byte escaped. */
function printable(code: string): string {
  return /^[\x20-\x7e]{4}$/.test(code) ? code : JSON.stringify(code);
}

/** A value as a message shows it. */
function describe(value: unknown): string {
  return typeof value === "string"
    ? JSON.stringify(value)
    : typeof value === "number" || typeof value === "bigint"
      ? String(value)
      : `a ${typeof value}`;
}

function invalid(message: string): never {
  throw new ObjectDataWriterError("invalid-value", message);
}
