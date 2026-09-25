/**
 * Reading the compatibility matrix's inputs from the workspace: the
 * packages and the Typings' Patches (through the `reforged.patch` check's
 * reader), the catalog of `pnpm-workspace.yaml`, the pre state, the
 * systems list and the committed matrix, each validated.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { readPreMode } from "./changesets.js";
import { readPatchInputs } from "./check-patches.js";
import {
  canonicalRow,
  MATRIX_FILE,
  MATRIX_FORMAT,
  ROW_FIELDS,
  SYSTEMS_FILE,
  type Matrix,
  type MatrixInput,
  type MatrixRow,
  type SystemsList,
} from "./matrix-model.js";
import { errorMessage, isRecord, isStringList } from "./unknown.js";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MINOR = /^(\d+)\.(\d+)$/;

/** Inputs the generator cannot read, naming the file at fault. */
export class MatrixInputError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MatrixInputError";
  }
}

/**
 * The `catalog:` map of a `pnpm-workspace.yaml`: the top-level `catalog`
 * key's entries, one `name: specifier` per line, quotes and comments
 * dropped. Only the flat form the workspace uses is read.
 */
export function parseCatalog(yaml: string): Record<string, string> {
  const catalog: Record<string, string> = {};
  const lines = yaml.split(/\r?\n/);
  const start = lines.findIndex((line) => /^catalog:\s*(#.*)?$/.test(line));
  if (start === -1) return catalog;
  const entry =
    /^\s+(?:"([^"]+)"|'([^']+)'|([^\s:#"']+)):\s*(?:"([^"]*)"|'([^']*)'|([^\s#]+))\s*(?:#.*)?$/;
  for (const line of lines.slice(start + 1)) {
    if (/^\s*(#.*)?$/.test(line)) continue;
    if (!/^\s/.test(line)) break;
    const match = entry.exec(line);
    if (match === null) continue;
    const groups: (string | undefined)[] = match.slice(1);
    const name = groups[0] ?? groups[1] ?? groups[2] ?? "";
    catalog[name] = groups[3] ?? groups[4] ?? groups[5] ?? "";
  }
  return catalog;
}

/**
 * The parsed JSON file at `path` under `root`; `missing` when there is no
 * such file.
 */
async function readJson(
  root: string,
  path: string,
  missing?: unknown,
): Promise<unknown> {
  let text: string;
  try {
    text = await readFile(join(root, path), "utf8");
  } catch (error) {
    if (
      missing !== undefined &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return missing;
    }
    throw new MatrixInputError(`${path}: ${errorMessage(error)}`, {
      cause: error,
    });
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new MatrixInputError(`${path}: ${errorMessage(error)}`, {
      cause: error,
    });
  }
}

/** The systems list of `systems.json`: `{ "minors": { "1.0": [...] } }`. */
export function parseSystems(value: unknown): SystemsList {
  const minors = isRecord(value) ? value.minors : undefined;
  if (!isRecord(minors)) {
    throw new MatrixInputError(
      `${SYSTEMS_FILE}: expected { "minors": { "<major>.<minor>": [<3.0.0 system>, ...] } }.`,
    );
  }
  for (const [label, systems] of Object.entries(minors)) {
    if (!MINOR.test(label) || !isStringList(systems)) {
      throw new MatrixInputError(
        `${SYSTEMS_FILE}: "${label}" must be a library minor such as "1.0" listing the 3.0.0 systems it adds as strings.`,
      );
    }
  }
  return minors as SystemsList;
}

/** The committed matrix, validated field by field. */
export function parseMatrix(value: unknown): Matrix {
  const invalid = (why: string) =>
    new MatrixInputError(`${MATRIX_FILE}: ${why}`);
  if (!isRecord(value) || value.format !== MATRIX_FORMAT) {
    throw invalid(
      `expected { "format": ${String(MATRIX_FORMAT)}, "rows": [...] }.`,
    );
  }
  if (!Array.isArray(value.rows)) throw invalid(`"rows" must be an array.`);
  const rows = value.rows.map((row: unknown, index): MatrixRow => {
    if (!isRecord(row)) throw invalid(`row ${String(index)} is not an object.`);
    for (const field of ROW_FIELDS) {
      const ok =
        field === "systems"
          ? isStringList(row[field])
          : typeof row[field] === "string";
      if (!ok) throw invalid(`row ${String(index)} has no valid "${field}".`);
    }
    const typed = row as unknown as MatrixRow;
    if (!DATE.test(typed.cutDate)) {
      throw invalid(
        `row ${String(index)} has cutDate ${typed.cutDate}, not YYYY-MM-DD.`,
      );
    }
    return canonicalRow(typed);
  });
  return { format: MATRIX_FORMAT, rows };
}

/** The date of `now` as a cut date, `YYYY-MM-DD` in UTC. */
export function cutDateOf(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * The inputs of `buildMatrix` for the workspace at `root`, with the cut
 * date of `now`. A missing matrix file is an empty matrix; a missing
 * systems list is an error.
 */
export async function readMatrixInputs(
  root: string,
  now: Date,
): Promise<MatrixInput> {
  const { packages, entries } = await readPatchInputs(root);
  let yaml: string;
  try {
    yaml = await readFile(join(root, "pnpm-workspace.yaml"), "utf8");
  } catch (error) {
    throw new MatrixInputError(`pnpm-workspace.yaml: ${errorMessage(error)}`, {
      cause: error,
    });
  }
  return {
    packages,
    entries,
    catalog: parseCatalog(yaml),
    preMode: await readPreMode(root),
    systems: parseSystems(await readJson(root, SYSTEMS_FILE)),
    // No matrix yet: the first stable release writes it.
    existing: parseMatrix(
      await readJson(root, MATRIX_FILE, { format: MATRIX_FORMAT, rows: [] }),
    ),
    cutDate: cutDateOf(now),
  };
}
