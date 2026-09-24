/**
 * Loads the Overlay: one JSON file per declaration, named after it, in the
 * folder of its source file (`<overlayDir>/common.j/CreateUnit.json`).
 *
 * Each field is read by one reader in `FIELDS`; a new Overlay field is one
 * more entry there and one more property on `OverlayEntry`.
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

export interface Overlay {
  /** Valid entries by `<source>/<name>`, in folder then file-name order. */
  entries: Map<string, OverlayEntry>;
  /** Keys of files that exist but are not valid entries. */
  rejected: Set<string>;
  diagnostics: Diagnostic[];
}

export function overlayKey(source: SourceName, name: string): string {
  return `${source}/${name}`;
}

export async function loadOverlay(overlayDir: string): Promise<Overlay> {
  const overlay: Overlay = {
    entries: new Map(),
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
    for (const fileName of await jsonFiles(join(overlayDir, source))) {
      const name = fileName.slice(0, -".json".length);
      const file = `${source}/${fileName}`;
      const text = await readFile(join(overlayDir, source, fileName), "utf8");
      const result = readEntry(file, source, name, text);
      if (typeof result === "string") {
        overlay.rejected.add(overlayKey(source, name));
        overlay.diagnostics.push({
          severity: "error",
          kind: "overlay-invalid",
          file,
          name,
          message: `${file}: ${result}`,
        });
      } else {
        overlay.entries.set(overlayKey(source, name), result);
      }
    }
  }
  return overlay;
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

/** The entry, or the first problem found as text. */
function readEntry(
  file: string,
  source: SourceName,
  name: string,
  text: string
): OverlayEntry | string {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return `invalid JSON: ${(error as Error).message}`;
  }
  if (!isObject(json)) return "an entry must be a JSON object";
  // A misspelt field would otherwise drop its fact silently.
  const unknown = unknownField(json, Object.keys(FIELDS));
  if (unknown) return `unknown field "${unknown}"`;

  const entry: Record<string, unknown> = { file };
  for (const [field, read] of Object.entries(FIELDS)) {
    const value = (read as Reader<unknown>)(json[field], { source, name });
    if (value instanceof Problem) return value.text;
    entry[field] = value;
  }
  return entry as unknown as OverlayEntry;
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
