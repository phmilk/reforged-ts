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
}

export interface OverlayEntry {
  /** Path relative to the Overlay folder, `/`-separated. */
  file: string;
  name: string;
  source: SourceName;
  returns: { nullable: boolean };
  params: OverlayParam[];
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
      if (!isObject(param) || typeof param.name !== "string") {
        return new Problem(`params[${index}].name must be a string`);
      }
      if (typeof param.nullable !== "boolean") {
        return new Problem(`params[${index}].nullable must be a boolean`);
      }
      params.push({ name: param.name, nullable: param.nullable });
    }
    return params;
  },
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

  const entry: Record<string, unknown> = { file };
  for (const [field, read] of Object.entries(FIELDS)) {
    const value = (read as Reader<unknown>)(json[field], { source, name });
    if (value instanceof Problem) return value.text;
    entry[field] = value;
  }
  return entry as unknown as OverlayEntry;
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
