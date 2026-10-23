// The checks of Object definitions (#700, "Validation"): their identity
// (Rawcode, kind, base, no Rawcode defined twice in one kind), checked on
// every load, and their fields (known for the kind, of the field's
// category, 32-bit integers, levels only where the field has them,
// base-specific fields only on those bases), checked before an edit. The
// fields' check turns each value into the edits the Object data editor
// makes: the writer's own checks then still apply.

import type { BuiltinsIndex, FieldEntry, FieldTable } from "./builtins.js";
import {
  localizedRecord,
  type DefinitionRecord,
} from "./definition-registry.js";
import {
  ObjectDefinitionsError,
  type ObjectDefinitionProblem,
} from "./definitions-error.js";
import { displayPath, type LoadedDefinition } from "./definitions-loader.js";
import { VALUE_TYPES, type ObjectKind, type ValueType } from "./model.js";

/** A definition whose identity is checked. */
export interface CheckedDefinition {
  readonly kind: ObjectKind;
  readonly rawcode: string;
  /** A Custom object's base; undefined for a change to a Built-in object. */
  readonly base: string | undefined;
  /** The definition file that exports it, an absolute path. */
  readonly file: string;
  readonly record: DefinitionRecord;
}

/** One edit of a field, as the Object data editor takes it. */
export interface FieldEdit {
  readonly field: string;
  readonly level?: number;
  readonly dataPointer?: number;
  readonly value: number | string;
  /** The value type of a field the field table does not know (the raw escape). */
  readonly type?: ValueType;
}

/** The kinds whose modifications store a level and a data pointer. */
const LEVELLED_KINDS: ReadonlySet<ObjectKind> = new Set([
  "ability",
  "doodad",
  "upgrade",
]);

const INT32_MIN = -0x80000000;
const INT32_MAX = 0x7fffffff;
const UINT32_MAX = 0xffffffff;

/** Whether a string is a Rawcode: four printable ASCII characters. */
export function isRawcode(value: unknown): value is string {
  return typeof value === "string" && /^[\x20-\x7e]{4}$/.test(value);
}

/** The four characters of a Rawcode's integer, as `FourCC` makes it; undefined when it is not one of four printable characters. */
export function rawcodeOfInteger(value: unknown): string | undefined {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < INT32_MIN ||
    value > UINT32_MAX
  ) {
    return undefined;
  }
  const bits = value >>> 0;
  const code = String.fromCharCode(
    bits >>> 24,
    (bits >>> 16) & 0xff,
    (bits >>> 8) & 0xff,
    bits & 0xff,
  );
  return isRawcode(code) ? code : undefined;
}

/** The prefix of a problem's message: the file, the definition, and the field. */
function where(
  projectRoot: string,
  file: string,
  kind: ObjectKind,
  rawcode: string,
  field?: string,
): string {
  return `${displayPath(projectRoot, file)}, ${kind} ${rawcode}${field === undefined ? "" : `, field ${field}`}`;
}

/** A value as a message shows it. */
function show(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === undefined) return "undefined";
  if (localizedRecord(value) !== undefined) return "a localized value";
  if (typeof value !== "object") return typeof value;
  try {
    return JSON.stringify(value);
  } catch {
    return typeof value;
  }
}

/**
 * Checks the identity of each definition: a Rawcode of four printable
 * characters; a Custom object's base, a Built-in object of its kind, and
 * its Rawcode, no Built-in object's; a changed Built-in object's Rawcode,
 * one of its kind; no Rawcode defined twice in one kind.
 */
export function checkIdentity(
  loaded: readonly LoadedDefinition[],
  builtins: BuiltinsIndex,
  projectRoot: string,
): CheckedDefinition[] {
  const problems: ObjectDefinitionProblem[] = [];
  const checked: CheckedDefinition[] = [];
  for (const { record, file } of loaded) {
    const { kind } = record;
    const shown = displayPath(projectRoot, file);
    if (!isRawcode(record.rawcode)) {
      problems.push({
        file,
        rawcode: undefined,
        field: undefined,
        message: `${shown}: a ${kind} definition's Rawcode, ${show(record.rawcode)}, is not four printable ASCII characters, such as "h000".`,
      });
      continue;
    }
    const { rawcode } = record;
    const at = where(projectRoot, file, kind, rawcode);
    const problem = (message: string) =>
      problems.push({ file, rawcode, field: undefined, message });
    const builtin = Object.hasOwn(builtins.objects, rawcode)
      ? builtins.objects[rawcode]
      : undefined;
    let base: string | undefined;
    if (record.custom) {
      base = rawcodeOfInteger(record.base);
      const baseObject =
        base !== undefined && Object.hasOwn(builtins.objects, base)
          ? builtins.objects[base]
          : undefined;
      if (base === undefined) {
        problem(
          `${at}: the base, ${show(record.base)}, is not a Rawcode. Give the Built-in ${kind} it derives from with FourCC, such as FourCC("${baseExample(kind)}").`,
        );
        continue;
      }
      if (baseObject?.kind !== kind) {
        problem(
          `${at}: the base ${base} is not a Built-in ${kind} of Game version ${builtins.gameVersion}${baseObject === undefined ? "" : ` (it is a ${baseObject.kind})`}: a Custom object derives from a Built-in object of its kind. Check the base's Rawcode.`,
        );
        continue;
      }
      if (builtin !== undefined) {
        problem(
          `${at}: ${rawcode} is the Rawcode of the Built-in ${builtin.kind}${builtin.name === undefined ? "" : ` ${builtin.name}`} in Game version ${builtins.gameVersion}, and a Custom object never takes a Built-in Rawcode. Choose another Rawcode, or leave the base out to change the Built-in object.`,
        );
        continue;
      }
    } else if (builtin?.kind !== kind) {
      problem(
        `${at}: the definition gives no base, so it changes a Built-in ${kind}, and Game version ${builtins.gameVersion} has no Built-in ${kind} ${rawcode}${builtin === undefined ? "" : ` (it is a ${builtin.kind})`}. Give a base to define a Custom ${kind}, or check the Rawcode.`,
      );
      continue;
    }
    checked.push({ kind, rawcode, base, file, record });
  }
  if (problems.length > 0) {
    throw new ObjectDefinitionsError("invalid-definition", problems);
  }
  const owners = new Map<string, CheckedDefinition>();
  const twice: ObjectDefinitionProblem[] = [];
  for (const definition of checked) {
    const key = `${definition.kind} ${definition.rawcode}`;
    const owner = owners.get(key);
    if (owner === undefined) {
      owners.set(key, definition);
      continue;
    }
    const first = displayPath(projectRoot, owner.file);
    const second = displayPath(projectRoot, definition.file);
    twice.push({
      file: definition.file,
      rawcode: definition.rawcode,
      field: undefined,
      message:
        first === second
          ? `${first} defines the ${key} twice: one object has one definition. Keep one.`
          : `${first} and ${second} both define the ${key}: one object has one definition. Keep one, or give the other another Rawcode.`,
    });
  }
  if (twice.length > 0) {
    throw new ObjectDefinitionsError("defined-twice", twice);
  }
  return checked;
}

/** A Built-in object of each kind, for a message's example. */
function baseExample(kind: ObjectKind): string {
  return {
    unit: "hfoo",
    item: "ratc",
    ability: "AHbz",
    buff: "Binf",
    destructable: "LTlt",
    doodad: "AOks",
    upgrade: "Rhme",
  }[kind];
}

/** What checking a definition's fields gives: its edits, in the order to make them, and the warnings. */
export interface CheckedFields {
  readonly edits: FieldEdit[];
  readonly warnings: string[];
}

/** The name field of each kind, set first so that a string's comment in war3map.wts names the object by the name the definition gives it. */
export const NAME_FIELDS: ReadonlySet<string> = new Set([
  "unam",
  "anam",
  "fnam",
  "bnam",
  "dnam",
  "gnam",
]);

/**
 * Checks the fields and the raw escape of each definition against the
 * field table, and gives each one's edits: the name first, then the fields
 * by field id and level, then the raw escape in its order.
 */
export function checkFields(
  definitions: readonly CheckedDefinition[],
  table: FieldTable,
  projectRoot: string,
): Map<CheckedDefinition, CheckedFields> {
  const problems: ObjectDefinitionProblem[] = [];
  const result = new Map<CheckedDefinition, CheckedFields>();
  for (const definition of definitions) {
    const checked = checkDefinitionFields(
      definition,
      table,
      projectRoot,
      problems,
    );
    result.set(definition, checked);
  }
  if (problems.length > 0) {
    throw new ObjectDefinitionsError("invalid-definition", problems);
  }
  return result;
}

function checkDefinitionFields(
  definition: CheckedDefinition,
  table: FieldTable,
  projectRoot: string,
  problems: ObjectDefinitionProblem[],
): CheckedFields {
  const { kind, rawcode, file, record } = definition;
  const edits: FieldEdit[] = [];
  const warnings: string[] = [];
  const fields = table.fields[kind] ?? {};
  const levelled = LEVELLED_KINDS.has(kind);
  const ids = Object.keys(record.fields)
    .filter((id) => record.fields[id] !== undefined)
    .sort((a, b) => {
      const name = Number(NAME_FIELDS.has(b)) - Number(NAME_FIELDS.has(a));
      return name !== 0 ? name : a < b ? -1 : a > b ? 1 : 0;
    });
  for (const id of ids) {
    const at = where(projectRoot, file, kind, rawcode, id);
    const problem = (message: string) =>
      problems.push({ file, rawcode, field: id, message: `${at}: ${message}` });
    const entry = Object.hasOwn(fields, id) ? fields[id] : undefined;
    if (entry === undefined) {
      problem(
        `the field table of reforged-builtins (Game version ${table.gameVersion}) has no ${kind} field ${JSON.stringify(id)}. Check the field id, or set a field the game's metadata does not know through the raw escape, with its value type.`,
      );
      continue;
    }
    const subject = definition.base ?? rawcode;
    const { specific } = entry;
    if (specific !== undefined && !specific.includes(subject)) {
      problem(
        `the field is specific to ${specific.join(", ")}, and ${definition.base === undefined ? `the Built-in ${kind} ${rawcode} is` : `the base ${subject} is`} not one of them. Leave it out, or derive from one of those.`,
      );
      continue;
    }
    const given = record.fields[id];
    const isLevelRecord =
      typeof given === "object" &&
      given !== null &&
      !Array.isArray(given) &&
      localizedRecord(given) === undefined;
    if (entry.levels) {
      if (!isLevelRecord) {
        problem(
          `the field holds a value per ${kind === "doodad" ? "variation" : "level"}: give a record from ${kind === "doodad" ? "variation" : "level"} to value, such as { 1: ... }, not ${show(given)}.`,
        );
        continue;
      }
      const levels = Object.keys(given)
        .map((key) => ({ key, level: Number(key) }))
        .sort((a, b) => a.level - b.level);
      for (const { key, level } of levels) {
        if (!/^(?:0|[1-9]\d*)$/.test(key) || level > UINT32_MAX) {
          problem(
            `the level ${JSON.stringify(key)} is not an integer from 0 to ${String(UINT32_MAX)}.`,
          );
          continue;
        }
        const value = (given as Record<string, unknown>)[key];
        if (value === undefined) continue;
        const stored = storedValue(entry, table, value, warnings, at, (m) =>
          problem(`at level ${key}, ${m}`),
        );
        if (stored !== undefined)
          edits.push({ field: id, level, value: stored });
      }
      continue;
    }
    if (isLevelRecord) {
      problem(
        `the field holds one value, not a value per level: give it as a value, not ${show(given)}.`,
      );
      continue;
    }
    const stored = storedValue(entry, table, given, warnings, at, problem);
    if (stored !== undefined) edits.push({ field: id, value: stored });
  }
  record.raw.forEach((raw, index) => {
    const id = typeof raw.field === "string" ? raw.field : undefined;
    const at = where(
      projectRoot,
      file,
      kind,
      rawcode,
      id ?? `raw[${String(index)}]`,
    );
    const problem = (message: string) =>
      problems.push({ file, rawcode, field: id, message: `${at}: ${message}` });
    if (id === undefined || !/^[\x20-\x7e]{3,4}$/.test(id)) {
      problem(
        `the raw escape's field id, ${show(raw.field)}, is not three or four printable ASCII characters.`,
      );
      return;
    }
    if (Object.hasOwn(fields, id)) {
      problem(
        `the field table of reforged-builtins knows the ${kind} field ${id}: set it in fields, not through the raw escape.`,
      );
      return;
    }
    if (!VALUE_TYPES.includes(raw.type as ValueType)) {
      problem(
        `the raw escape's value type, ${show(raw.type)}, is not one of ${VALUE_TYPES.map((type) => `"${type}"`).join(", ")}.`,
      );
      return;
    }
    const type = raw.type as ValueType;
    if (
      !levelled &&
      (raw.level !== undefined || raw.dataPointer !== undefined)
    ) {
      problem(
        `a ${kind}'s modification has no level and no data pointer: leave them out of the raw escape.`,
      );
      return;
    }
    for (const [what, number] of [
      ["level", raw.level],
      ["data pointer", raw.dataPointer],
    ] as const) {
      if (
        number !== undefined &&
        (typeof number !== "number" ||
          !Number.isInteger(number) ||
          number < 0 ||
          number > UINT32_MAX)
      ) {
        problem(
          `the raw escape's ${what}, ${show(number)}, is not an integer from 0 to ${String(UINT32_MAX)}.`,
        );
        return;
      }
    }
    const value = checkNumberOrString(type, raw.value, problem);
    if (value === undefined) return;
    edits.push({
      field: id,
      ...(levelled && {
        level: (raw.level as number | undefined) ?? 0,
        dataPointer: (raw.dataPointer as number | undefined) ?? 0,
      }),
      value,
      type,
    });
  });
  return { edits, warnings };
}

/** A value of the raw escape checked against its value type. */
function checkNumberOrString(
  type: ValueType,
  value: unknown,
  problem: (message: string) => void,
): number | string | undefined {
  if (type === "string") {
    if (typeof value !== "string" || value.includes("\0")) {
      problem(`a string without a NUL byte is expected, not ${show(value)}.`);
      return undefined;
    }
    return value;
  }
  if (type === "int") return checkInteger(value, problem);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    problem(`a finite real is expected, not ${show(value)}.`);
    return undefined;
  }
  return value;
}

/** An integer of 32 bits, or a problem. */
function checkInteger(
  value: unknown,
  problem: (message: string) => void,
): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    problem(`an integer is expected, not ${show(value)}.`);
    return undefined;
  }
  if (value < INT32_MIN || value > INT32_MAX) {
    problem(
      `${String(value)} is outside the 32-bit integers, ${String(INT32_MIN)} to ${String(INT32_MAX)}.`,
    );
    return undefined;
  }
  return value;
}

/**
 * The value a modification stores for one value of a field, by the field's
 * category; undefined, with a problem, when it is not one of the category.
 */
function storedValue(
  entry: FieldEntry,
  table: FieldTable,
  value: unknown,
  warnings: string[],
  at: string,
  problem: (message: string) => void,
): number | string | undefined {
  const enumeration =
    entry.metaType === undefined
      ? undefined
      : table.enumerations?.[entry.metaType];
  switch (entry.category) {
    case "boolean":
      if (typeof value !== "boolean") {
        problem(`a boolean is expected, not ${show(value)}.`);
        return undefined;
      }
      return value ? 1 : 0;
    case "enumeration": {
      if (enumeration === undefined) {
        return checkNumberOrString(entry.type, value, problem);
      }
      const allowed: readonly unknown[] =
        entry.type === "string" ? ["", ...enumeration] : enumeration;
      if (!allowed.includes(value)) {
        problem(
          `${show(value)} is not a value of the enumeration ${entry.metaType ?? ""}: ${allowed.map(show).join(", ")}.`,
        );
        return undefined;
      }
      return value as number | string;
    }
    case "rawcode": {
      if (value === "") return "";
      const code = rawcodeOfInteger(value);
      if (code === undefined) {
        problem(
          `a Rawcode${entry.of === undefined ? "" : ` of a ${entry.of}`} is expected, given with FourCC (such as FourCC("A000")), or "" for none, not ${show(value)}.`,
        );
        return undefined;
      }
      return code;
    }
    case "rawcodeList": {
      if (!Array.isArray(value)) {
        problem(
          `a list of Rawcodes${entry.of === undefined ? "" : ` of ${entry.of}s`} is expected, each given with FourCC, not ${show(value)}.`,
        );
        return undefined;
      }
      const codes: string[] = [];
      for (const item of value as unknown[]) {
        const code = rawcodeOfInteger(item);
        if (code === undefined) {
          problem(
            `${show(item)} in the list is not a Rawcode: give each with FourCC, such as FourCC("A000").`,
          );
          return undefined;
        }
        codes.push(code);
      }
      return codes.join(",");
    }
    case "stringList": {
      if (
        !Array.isArray(value) ||
        (value as unknown[]).some((item) => typeof item !== "string")
      ) {
        problem(`a list of strings is expected, not ${show(value)}.`);
        return undefined;
      }
      const items = value as string[];
      const comma = items.find((item) => item.includes(","));
      if (comma !== undefined) {
        problem(
          `${show(comma)} holds a comma, which separates the items of a list.`,
        );
        return undefined;
      }
      if (enumeration !== undefined) {
        const wrong = items.find(
          (item) => !(enumeration as readonly unknown[]).includes(item),
        );
        if (wrong !== undefined) {
          problem(
            `${show(wrong)} is not a value of the enumeration ${entry.metaType ?? ""}: ${enumeration.map(show).join(", ")}.`,
          );
          return undefined;
        }
      }
      return items.join(",");
    }
    case "text": {
      const localized = entry.localizable ? localizedRecord(value) : undefined;
      if (localized !== undefined) {
        if (typeof localized.text !== "string") {
          problem(
            `the default text of the localized value is not a string: ${show(localized.text)}.`,
          );
          return undefined;
        }
        const locales = Object.keys(localized.translations);
        if (locales.length > 0) {
          warnings.push(
            `${at}: the translations of its localized value (${locales.join(", ")}) are not written yet (#712): the map holds its default text in every locale.`,
          );
        }
        return localized.text;
      }
      if (typeof value !== "string") {
        problem(
          `a string${entry.localizable ? " or a localized value" : ""} is expected, not ${show(value)}.`,
        );
        return undefined;
      }
      return value;
    }
    case "number":
    case undefined:
    default:
      if (entry.type === "string") {
        return checkNumberOrString("string", value, problem);
      }
      if (entry.type === "int") return checkInteger(value, problem);
      if (typeof value !== "number" || !Number.isFinite(value)) {
        problem(`a finite number is expected, not ${show(value)}.`);
        return undefined;
      }
      return value;
  }
}
