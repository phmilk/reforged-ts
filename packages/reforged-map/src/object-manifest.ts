// The Object manifest (#700, "The Object manifest"; ADR 0015 and its
// amendment #475): a JSON file at the Map project's root, outside the map
// folder, recording each object the code owns and its snapshot, what the
// last Object sync wrote, and each object a sync removed with what it last
// held. Object sync writes it; the build's merge, and
// every other reader, only reads it. It is written byte-stably, so that two
// branches syncing different objects merge without a conflict.

import fs from "node:fs";
import path from "node:path";
import { definitionsError } from "./definitions-error.js";
import { displayPath } from "./definitions-loader.js";
import {
  LOCALES,
  OBJECT_KINDS,
  VALUE_TYPES,
  type Locale,
  type ObjectKind,
  type ValueType,
} from "./model.js";
import type { ObjectDataObject } from "./object-data-editor.js";
import { realText } from "./object-data-text.js";

/** The Object manifest's path under the Map project's root when none is given. */
export const DEFAULT_OBJECT_MANIFEST = "object-manifest.json";

/** The format of the Object manifest this package reads and writes. */
const MANIFEST_FORMAT = 1;

/** One modification of a snapshot: field id, level and data pointer where the kind stores them, value type and value. */
export interface SnapshotModification {
  readonly field: string;
  readonly level?: number;
  readonly dataPointer?: number;
  readonly type: ValueType;
  /** An integer, a real as the shortest decimal that reads back to its 32 bits (its bits in hex, a string, when not finite), or a string, a `TRIGSTR` resolved to its text. */
  readonly value: number | string;
  /** A `TRIGSTR`'s text per locale whose table translates it, by locale in order; absent when no locale does. */
  readonly translations?: Readonly<Partial<Record<Locale, string>>>;
}

/**
 * An object as the Object Editor shows it, base and Skin files merged: its
 * kind, its Rawcode, a Custom object's base, and its modifications sorted
 * by field id, then level and data pointer. File placement, end markers
 * and sets are the writer's, not the snapshot's.
 */
export interface ObjectSnapshot {
  readonly kind: ObjectKind;
  readonly rawcode: string;
  readonly base?: string;
  readonly modifications: readonly SnapshotModification[];
}

/** The Object manifest as read: the objects the code owns, and those a sync removed, each by Object kind then Rawcode. */
export interface ObjectManifest {
  /** The objects the code owns, each with what the last sync wrote. */
  readonly owned: readonly ObjectSnapshot[];
  /** The objects a sync removed because no definition defined them any more, each with what it last held. */
  readonly removed: readonly ObjectSnapshot[];
}

/** The key of an object of one kind: its kind and Rawcode. */
export function objectKey(object: {
  readonly kind: ObjectKind;
  readonly rawcode: string;
}): string {
  return `${object.kind} ${object.rawcode}`;
}

/** Compares two strings by UTF-16 code unit, as the manifest sorts them. */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Orders objects by Object kind, in the order of the kinds, then by Rawcode. */
export function byKindThenRawcode(
  a: { readonly kind: ObjectKind; readonly rawcode: string },
  b: { readonly kind: ObjectKind; readonly rawcode: string },
): number {
  return (
    OBJECT_KINDS.indexOf(a.kind) - OBJECT_KINDS.indexOf(b.kind) ||
    compare(a.rawcode, b.rawcode)
  );
}

/** A snapshot's value of a modification: reals as their shortest decimal. */
function snapshotValue(
  type: ValueType,
  value: number | string,
): number | string {
  if (typeof value === "string" || type === "int") return value;
  const text = realText(value, undefined);
  return Number.isFinite(value) ? Number(text) : text;
}

/** Translations with their locales in order; undefined when there is none. */
function sortedTranslations(
  translations: Readonly<Partial<Record<Locale, string>>> | undefined,
): Partial<Record<Locale, string>> | undefined {
  const entries = Object.entries(translations ?? {}).sort(([a], [b]) =>
    compare(a, b),
  );
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

/** The snapshot of an object of the Object data editor. */
export function snapshotOf(object: ObjectDataObject): ObjectSnapshot {
  const modifications = object.modifications
    .map(
      ({
        field,
        level,
        dataPointer,
        type,
        value,
        translations,
      }): SnapshotModification => {
        const sorted = sortedTranslations(translations);
        return {
          field,
          ...(level !== undefined && { level }),
          ...(dataPointer !== undefined && { dataPointer }),
          type,
          value: snapshotValue(type, value),
          ...(sorted !== undefined && { translations: sorted }),
        };
      },
    )
    .sort(
      (a, b) =>
        compare(a.field, b.field) ||
        (a.level ?? 0) - (b.level ?? 0) ||
        (a.dataPointer ?? 0) - (b.dataPointer ?? 0) ||
        compare(a.type, b.type) ||
        compare(JSON.stringify(a.value), JSON.stringify(b.value)) ||
        compare(
          JSON.stringify(a.translations ?? {}),
          JSON.stringify(b.translations ?? {}),
        ),
    );
  return {
    kind: object.kind,
    rawcode: object.rawcode,
    ...(object.base !== undefined && { base: object.base }),
    modifications,
  };
}

/** A snapshot with its keys in the manifest's order, whatever order it was built or read in. */
function canonical(entry: ObjectSnapshot): ObjectSnapshot {
  return {
    kind: entry.kind,
    rawcode: entry.rawcode,
    ...(entry.base !== undefined && { base: entry.base }),
    modifications: entry.modifications.map((modification) => ({
      field: modification.field,
      ...(modification.level !== undefined && { level: modification.level }),
      ...(modification.dataPointer !== undefined && {
        dataPointer: modification.dataPointer,
      }),
      type: modification.type,
      value: modification.value,
      ...(modification.translations !== undefined && {
        translations: sortedTranslations(modification.translations),
      }),
    })),
  };
}

/** Whether two snapshots hold the same object. */
export function sameSnapshot(a: ObjectSnapshot, b: ObjectSnapshot): boolean {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

/** The manifest's text: format, then the owned entries and the removed ones, each by Object kind then Rawcode, two-space indentation, a final newline. */
export function manifestText(manifest: ObjectManifest): string {
  const owned = [...manifest.owned].sort(byKindThenRawcode).map(canonical);
  const removed = [...manifest.removed].sort(byKindThenRawcode).map(canonical);
  return `${JSON.stringify({ format: MANIFEST_FORMAT, owned, removed }, null, 2)}\n`;
}

/**
 * Reads the Object manifest: no object owned when the file does not exist.
 * Anything else than a manifest this package writes is refused.
 */
export function readObjectManifest(
  file: string,
  projectRoot: string,
): ObjectManifest {
  let text: string;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return { owned: [], removed: [] };
    throw unreadable(file, projectRoot, (error as Error).message);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw unreadable(file, projectRoot, (error as Error).message);
  }
  const problem = manifestProblem(json);
  if (problem !== undefined) throw unreadable(file, projectRoot, problem);
  return json as ObjectManifest;
}

/**
 * Writes the Object manifest when its bytes change, and says whether it
 * did. A manifest that neither owns nor removed anything is not created.
 */
export function writeObjectManifest(
  file: string,
  manifest: ObjectManifest,
): boolean {
  const text = manifestText(manifest);
  let current: string | undefined;
  try {
    current = fs.readFileSync(file, "utf8");
  } catch {
    current = undefined;
  }
  if (current === text) return false;
  if (
    current === undefined &&
    manifest.owned.length === 0 &&
    manifest.removed.length === 0
  ) {
    return false;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return true;
}

function unreadable(file: string, projectRoot: string, detail: string): Error {
  const name = displayPath(projectRoot, file);
  return definitionsError(
    "manifest-unreadable",
    `The Object manifest ${name} cannot be read (${detail}): nothing was written. Object sync writes it, and it is never edited by hand: restore it from git (git checkout -- ${name}), or resolve its merge conflict by keeping each side's entries, then run pnpm objects:sync again.`,
    { file },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUint32(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 0xffffffff
  );
}

function hasOnly(
  record: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  return Object.keys(record).find((key) => !keys.includes(key));
}

/** What is wrong with a parsed manifest, in a few words; undefined when nothing is. */
function manifestProblem(json: unknown): string | undefined {
  if (!isRecord(json)) return "it is not a JSON object";
  const extra = hasOnly(json, ["format", "owned", "removed"]);
  if (extra !== undefined) return `unknown key ${JSON.stringify(extra)}`;
  if (json.format !== MANIFEST_FORMAT) {
    return `its format is ${JSON.stringify(json.format)}, not ${String(MANIFEST_FORMAT)}`;
  }
  const owned = new Set<string>();
  return (
    entriesProblem(json, "owned", owned, new Set()) ??
    entriesProblem(json, "removed", new Set(), owned)
  );
}

/**
 * What is wrong with a list of entries of a parsed manifest: `seen`
 * collects their keys, and a key of `others`, the owned entries', is
 * refused in the removed ones.
 */
function entriesProblem(
  json: Record<string, unknown>,
  list: "owned" | "removed",
  seen: Set<string>,
  others: ReadonlySet<string>,
): string | undefined {
  const listed: unknown = json[list];
  if (!Array.isArray(listed)) return `"${list}" is not a list`;
  for (const [index, entry] of (listed as unknown[]).entries()) {
    const at = `${list}[${String(index)}]`;
    if (!isRecord(entry)) return `${at} is not an object`;
    const key = hasOnly(entry, ["kind", "rawcode", "base", "modifications"]);
    if (key !== undefined)
      return `${at} has an unknown key ${JSON.stringify(key)}`;
    if (!OBJECT_KINDS.includes(entry.kind as ObjectKind)) {
      return `${at} has no Object kind`;
    }
    if (typeof entry.rawcode !== "string" || entry.rawcode.length !== 4) {
      return `${at} has no Rawcode`;
    }
    if (
      entry.base !== undefined &&
      (typeof entry.base !== "string" || entry.base.length !== 4)
    ) {
      return `${at} has a base that is not a Rawcode`;
    }
    const id = objectKey(entry as { kind: ObjectKind; rawcode: string });
    if (others.has(id)) return `the ${id} is both owned and removed`;
    if (seen.has(id)) return `the ${id} is ${list} twice`;
    seen.add(id);
    if (!Array.isArray(entry.modifications)) {
      return `${at} has no list of modifications`;
    }
    for (const modification of entry.modifications as unknown[]) {
      const problem = modificationProblem(modification);
      if (problem !== undefined) return `${at}: ${problem}`;
    }
  }
  return undefined;
}

function modificationProblem(modification: unknown): string | undefined {
  if (!isRecord(modification)) return "a modification is not an object";
  const key = hasOnly(modification, [
    "field",
    "level",
    "dataPointer",
    "type",
    "value",
    "translations",
  ]);
  if (key !== undefined) {
    return `a modification has an unknown key ${JSON.stringify(key)}`;
  }
  const { field, level, dataPointer, type, value, translations } = modification;
  if (typeof field !== "string" || field.length === 0) {
    return "a modification has no field id";
  }
  if (level !== undefined && !isUint32(level)) {
    return `the level of ${field} is not an integer`;
  }
  if (dataPointer !== undefined && !isUint32(dataPointer)) {
    return `the data pointer of ${field} is not an integer`;
  }
  if (!VALUE_TYPES.includes(type as ValueType)) {
    return `the value type of ${field} is not one of ${VALUE_TYPES.join(", ")}`;
  }
  const valid =
    type === "string"
      ? typeof value === "string"
      : type === "int"
        ? typeof value === "number" && Number.isInteger(value)
        : typeof value === "number" ||
          (typeof value === "string" && /^0x[0-9a-f]{8}$/.test(value));
  if (!valid) return `the value of ${field} is not one of type ${String(type)}`;
  return translations === undefined
    ? undefined
    : translationsProblem(field, type, translations);
}

/** What is wrong with a modification's text per locale: one text per locale of the game, of a string, at least one. */
function translationsProblem(
  field: string,
  type: unknown,
  translations: unknown,
): string | undefined {
  if (type !== "string") {
    return `${field} has translations, and its value is not a string`;
  }
  if (!isRecord(translations)) {
    return `the translations of ${field} are not an object`;
  }
  const locales = Object.keys(translations);
  if (locales.length === 0) return `the translations of ${field} are empty`;
  for (const locale of locales) {
    if (!LOCALES.includes(locale as Locale)) {
      return `the translations of ${field} name ${JSON.stringify(locale)}, not a locale of the game`;
    }
    if (typeof translations[locale] !== "string") {
      return `the ${locale} translation of ${field} is not a string`;
    }
  }
  return undefined;
}
