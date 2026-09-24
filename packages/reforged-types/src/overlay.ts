/**
 * Loads the Overlay: one JSON file per declaration, named after it, in the
 * kind folder of its source file (`<overlayDir>/common.j/functions/CreateUnit.json`,
 * `.../globals/bj_FORCE_PLAYER.json`, `.../types/unit.json`).
 *
 * Each field is read by one reader in `FIELDS`; a new Overlay field is one
 * more entry there and one more property on `OverlayEntry`. Global and type
 * entries reuse those readers for the fields they share.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Diagnostic } from "./diagnostics.js";
import { SOURCES, type SourceName } from "./model.js";

export interface OverlayParam {
  name: string;
  nullable: boolean;
  /** TypeScript type text that replaces the parameter's mapped Jass type. */
  type?: string;
}

/** The only `origin` an entry may name: seeded from war3-types-strict. */
export const SEED_ORIGIN = "war3-types-strict";

export interface OverlayEntry {
  /** Path relative to the Overlay folder, `/`-separated. */
  file: string;
  name: string;
  source: SourceName;
  returns: { nullable: boolean };
  params: OverlayParam[];
  /** The value is only valid for the local player; `false` when absent. */
  async: boolean;
  deprecated?: string;
  /** Rendered as `@remarks`. */
  notes?: string;
  /** The Patch build that introduced the declaration; rendered as `@patch`. */
  since?: string;
  /** Absent for hand-written entries. */
  origin?: typeof SEED_ORIGIN;
}

/**
 * A global's entry (mandatory for every global): `name`, `source`,
 * `nullable`, and the optional `deprecated`, `notes`, `since` and `origin`.
 * It has no `returns` or `params`: `nullable` is the global's own nullability,
 * and for an array the nullability of its elements.
 */
export interface GlobalEntry {
  /** Path relative to the Overlay folder, `/`-separated. */
  file: string;
  name: string;
  source: SourceName;
  nullable: boolean;
  deprecated?: string;
  /** Rendered as `@remarks`. */
  notes?: string;
  /** The Patch build that introduced the global; rendered as `@patch`. */
  since?: string;
  /** Absent for hand-written entries. */
  origin?: typeof SEED_ORIGIN;
}

/** A type's optional entry: `name`, `source`, `deprecated` and `notes` only. */
export interface TypeEntry {
  /** Path relative to the Overlay folder, `/`-separated. */
  file: string;
  name: string;
  source: SourceName;
  deprecated?: string;
  /** Rendered as `@remarks`. */
  notes?: string;
}

/**
 * The kind folders inside a source folder and the entries each holds:
 * `functions` for natives and Jass functions, `globals`, `types`. The folder
 * decides an entry's kind. Kinds live apart because names of different kinds
 * collide case-insensitively within one source file (type `location` and
 * native `Location` in common.j, native `Sleep` and global `SLEEP` in
 * common.ai), and Windows and macOS file systems are case-insensitive.
 */
export const KIND_FOLDERS = ["functions", "globals", "types"] as const;

export type KindFolder = (typeof KIND_FOLDERS)[number];

export interface Overlay {
  /** Function entries by `<source>/<name>`, in folder then file-name order. */
  entries: Map<string, OverlayEntry>;
  /** Global entries, keyed and ordered as `entries`. */
  globals: Map<string, GlobalEntry>;
  /** Type entries, keyed and ordered as `entries`. */
  types: Map<string, TypeEntry>;
  /** Paths (as `entryPath` spells them) of files that are not valid entries. */
  rejected: Set<string>;
  diagnostics: Diagnostic[];
}

export function overlayKey(source: SourceName, name: string): string {
  return `${source}/${name}`;
}

/** Where a declaration's entry lives, relative to the Overlay folder. */
export function entryPath(
  source: SourceName,
  folder: KindFolder,
  name: string
): string {
  return `${source}/${folder}/${name}.json`;
}

export async function loadOverlay(overlayDir: string): Promise<Overlay> {
  const overlay: Overlay = {
    entries: new Map(),
    globals: new Map(),
    types: new Map(),
    rejected: new Set(),
    diagnostics: [],
  };
  if (!(await isDirectory(overlayDir))) {
    overlay.diagnostics.push({
      severity: "error",
      kind: "overlay-invalid",
      message: `${overlayDir}: the Overlay folder does not exist`,
    });
    return overlay;
  }
  for (const source of SOURCES) {
    overlay.diagnostics.push(...(await strayFiles(overlayDir, source)));
    for (const folder of KIND_FOLDERS) {
      const fileNames = await jsonFiles(join(overlayDir, source, folder));
      const clashes = caseClashes(fileNames);
      for (const fileName of fileNames) {
        const name = fileName.slice(0, -".json".length);
        const file = `${source}/${folder}/${fileName}`;
        const clash = clashes.get(fileName);
        if (clash) {
          overlay.rejected.add(file);
          // One error per group of clashing names, on its first file.
          if (clash[0] === fileName) {
            overlay.diagnostics.push(caseClash(source, folder, clash));
          }
          continue;
        }
        const text = await readFile(join(overlayDir, file), "utf8");
        const result = readEntry(FOLDER_FIELDS[folder], file, source, name, text);
        if (typeof result === "string") {
          overlay.rejected.add(file);
          overlay.diagnostics.push({
            severity: "error",
            kind: "overlay-invalid",
            file,
            name,
            message: `${file}: ${result}`,
          });
          continue;
        }
        const entries: Map<string, unknown> =
          folder === "functions"
            ? overlay.entries
            : folder === "globals"
              ? overlay.globals
              : overlay.types;
        entries.set(overlayKey(source, name), result);
      }
    }
  }
  return overlay;
}

/**
 * The groups of file names that differ only by case, by each member. A
 * case-insensitive file system cannot hold such a group, so it is an error
 * wherever the Overlay is checked out.
 */
function caseClashes(fileNames: readonly string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const fileName of fileNames) {
    const folded = fileName.toLowerCase();
    groups.set(folded, [...(groups.get(folded) ?? []), fileName]);
  }
  const clashes = new Map<string, string[]>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (const fileName of group) clashes.set(fileName, group);
  }
  return clashes;
}

function caseClash(
  source: SourceName,
  folder: KindFolder,
  group: readonly string[]
): Diagnostic {
  const files = group.map((fileName) => `${source}/${folder}/${fileName}`);
  return {
    severity: "error",
    kind: "overlay-invalid",
    file: files[0]!,
    message:
      `${files.join(", ")}: entry file names differ only by case, ` +
      "which a case-insensitive file system cannot hold",
  };
}

/**
 * JSON files and folders in a source folder outside the kind folders: an
 * entry there would be ignored silently, so each is an error.
 */
async function strayFiles(
  overlayDir: string,
  source: SourceName
): Promise<Diagnostic[]> {
  const folder = join(overlayDir, source);
  if (!(await isDirectory(folder))) return [];
  const stray: Diagnostic[] = [];
  const items = await readdir(folder, { withFileTypes: true });
  for (const item of items.sort((a, b) => byCodePoint(a.name, b.name))) {
    const kindFolder = (KIND_FOLDERS as readonly string[]).includes(item.name);
    if (item.isDirectory() ? kindFolder : !item.name.endsWith(".json")) {
      continue;
    }
    const file = `${source}/${item.name}${item.isDirectory() ? "/" : ""}`;
    stray.push({
      severity: "error",
      kind: "overlay-invalid",
      file,
      message: `${file}: not an entry location; entries live in ${source}/${KIND_FOLDERS.join(
        `, ${source}/`
      )}`,
    });
  }
  return stray;
}

/** What a field reader returns when the value is not valid. */
class Problem {
  constructor(readonly text: string) {}
}

/** A field reader returns the value, or the problem. */
type Reader<T> = (
  value: unknown,
  expected: { source: SourceName; name: string }
) => T | Problem;

const FIELDS = {
  name: (value, expected) =>
    value === expected.name
      ? expected.name
      : new Problem(
          `name must be "${expected.name}" (the file name), found ${show(
            value
          )}`
        ),
  source: (value, expected) =>
    value === expected.source
      ? expected.source
      : new Problem(
          `source must be "${expected.source}" (the folder), found ${show(
            value
          )}`
        ),
  returns: (value) => {
    if (!isObject(value) || typeof value.nullable !== "boolean") {
      return new Problem("returns.nullable must be a boolean");
    }
    return { nullable: value.nullable };
  },
  params: (value) => {
    if (!Array.isArray(value)) return new Problem("params must be an array");
    const params: OverlayParam[] = [];
    for (const [index, param] of value.entries()) {
      const field = `params[${index}]`;
      if (!isObject(param) || typeof param.name !== "string") {
        return new Problem(`${field}.name must be a string`);
      }
      const unknown = unknownField(param, PARAM_FIELDS);
      if (unknown) return new Problem(`unknown field "${field}.${unknown}"`);
      if (typeof param.nullable !== "boolean") {
        return new Problem(`${field}.nullable must be a boolean`);
      }
      const read: OverlayParam = { name: param.name, nullable: param.nullable };
      if (param.type !== undefined) {
        if (typeof param.type !== "string" || param.type.trim() === "") {
          return new Problem(
            `${field}.type must be non-empty TypeScript type text, found ${show(
              param.type
            )}`
          );
        }
        read.type = param.type;
      }
      params.push(read);
    }
    return params;
  },
  async: (value) =>
    value === undefined || typeof value === "boolean"
      ? value === true
      : new Problem(`async must be a boolean, found ${show(value)}`),
  deprecated: (value) => docText("deprecated", value),
  notes: (value) => docText("notes", value),
  since: (value) =>
    value === undefined || (typeof value === "string" && BUILD.test(value))
      ? value
      : new Problem(
          `since must be a Patch build such as "3.0.0.24268", found ${show(
            value
          )}`
        ),
  origin: (value) =>
    value === undefined || value === SEED_ORIGIN
      ? value
      : new Problem(
          `origin must be "${SEED_ORIGIN}" or absent, found ${show(value)}`
        ),
} satisfies {
  [K in keyof Omit<OverlayEntry, "file">]: Reader<OverlayEntry[K]>;
};

/** A global entry's fields: the function entry's readers, and `nullable`. */
const GLOBAL_FIELDS = {
  name: FIELDS.name,
  source: FIELDS.source,
  nullable: (value) =>
    typeof value === "boolean"
      ? value
      : new Problem(`nullable must be a boolean, found ${show(value)}`),
  deprecated: FIELDS.deprecated,
  notes: FIELDS.notes,
  since: FIELDS.since,
  origin: FIELDS.origin,
} satisfies {
  [K in keyof Omit<GlobalEntry, "file">]: Reader<GlobalEntry[K]>;
};

/** A type entry carries `deprecated` and `notes` only. */
const TYPE_FIELDS = {
  name: FIELDS.name,
  source: FIELDS.source,
  deprecated: FIELDS.deprecated,
  notes: FIELDS.notes,
} satisfies {
  [K in keyof Omit<TypeEntry, "file">]: Reader<TypeEntry[K]>;
};

/** The fields an entry may carry, by the kind folder it lives in. */
const FOLDER_FIELDS: Record<KindFolder, Record<string, Reader<unknown>>> = {
  functions: FIELDS,
  globals: GLOBAL_FIELDS,
  types: TYPE_FIELDS,
};

/** The entry read with `fields`, or the first problem found as text. */
function readEntry(
  fields: Record<string, Reader<unknown>>,
  file: string,
  source: SourceName,
  name: string,
  text: string
): OverlayEntry | GlobalEntry | TypeEntry | string {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return `invalid JSON: ${(error as Error).message}`;
  }
  if (!isObject(json)) return "an entry must be a JSON object";
  // A misspelt field would otherwise drop its fact silently.
  const unknown = unknownField(json, Object.keys(fields));
  if (unknown) return `unknown field "${unknown}"`;

  const entry: Record<string, unknown> = { file };
  for (const [field, read] of Object.entries(fields)) {
    const value = read(json[field], { source, name });
    if (value instanceof Problem) return value.text;
    entry[field] = value;
  }
  return entry as unknown as OverlayEntry | GlobalEntry | TypeEntry;
}

const PARAM_FIELDS: readonly string[] = ["name", "nullable", "type"];

/** A full Patch build: version and build number. */
const BUILD = /^\d+\.\d+\.\d+\.\d+$/;

/**
 * Free text a header renders. It may link with `{@link ...}` but neither
 * start another TSDoc tag nor close the comment, so a header only ever
 * carries the declared tags.
 */
function docText(field: string, value: unknown): string | undefined | Problem {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    return new Problem(`${field} must be non-empty text, found ${show(value)}`);
  }
  if (value.includes("*/")) {
    return new Problem(`${field} must not contain "*/"`);
  }
  if (value.replace(/\{@link\s[^}]*\}/g, "").includes("@")) {
    return new Problem(
      `${field} must not contain "@" outside {@link ...}, which would start a TSDoc tag`
    );
  }
  return value;
}

/** The first key of `object` that is not in `known`. */
function unknownField(
  object: Record<string, unknown>,
  known: readonly string[]
): string | undefined {
  return Object.keys(object).find((key) => !known.includes(key));
}

async function jsonFiles(folder: string): Promise<string[]> {
  if (!(await isDirectory(folder))) return [];
  const names = await readdir(folder);
  // Code-point order, independent of locale and file system.
  return names.filter((n) => n.endsWith(".json")).sort(byCodePoint);
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

export function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function show(value: unknown): string {
  return value === undefined ? "nothing" : JSON.stringify(value);
}
