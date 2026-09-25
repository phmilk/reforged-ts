// The loader of the rename map, migration/renames.json: parses the file and
// validates it against migration/renames.schema.json next to it, so a
// malformed entry fails the test that loads it.

import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Ajv2020, type SchemaObject } from "ajv/dist/2020";
import { packageRoot } from "./package-root";

const mapFile = fileURLToPath(
  new URL("../../../migration/renames.json", import.meta.url),
);
const schemaFile = fileURLToPath(
  new URL("../../../migration/renames.schema.json", import.meta.url),
);

/** One entry of the rename map, as renames.schema.json describes it. */
export interface RenameEntry {
  old: string;
  new: string | string[] | null;
  kind:
    | "constructor"
    | "member"
    | "accessor"
    | "function"
    | "class"
    | "type"
    | "entryPoint"
    | "package";
  versions: { from: string; to: string };
  oneToOne: boolean;
  note: string;
}

/**
 * The no-renames marker: the major of the version pair removes and renames
 * nothing. It stands in for the pair's entries.
 */
export interface NoRenamesMarker {
  kind: "noRenames";
  versions: { from: string; to: string };
  note: string;
}

/** One item of the rename map: an entry, or the marker of a pair. */
export type RenameMapItem = RenameEntry | NoRenamesMarker;

export function isNoRenamesMarker(
  item: RenameMapItem,
): item is NoRenamesMarker {
  return item.kind === "noRenames";
}

const validate = new Ajv2020({ allErrors: true }).compile<RenameMapItem[]>(
  JSON.parse(readFileSync(schemaFile, "utf8")) as SchemaObject,
);

/** Parses the text of a rename map; throws when it does not match the schema. */
export function parseRenames(text: string): RenameMapItem[] {
  const map: unknown = JSON.parse(text);
  if (!validate(map)) {
    const errors = (validate.errors ?? [])
      .map((error) => `${error.instancePath || "/"} ${error.message ?? ""}`)
      .join("\n");
    throw new Error(`The rename map does not match its schema:\n${errors}`);
  }
  return map;
}

/** Reads and validates the package's migration/renames.json, markers included. */
export async function loadRenameMap(): Promise<RenameMapItem[]> {
  return parseRenames(await readFile(mapFile, "utf8"));
}

/** The entries of the package's migration/renames.json, without the markers. */
export async function loadRenames(): Promise<RenameEntry[]> {
  return (await loadRenameMap()).filter(
    (item): item is RenameEntry => !isNoRenamesMarker(item),
  );
}

/**
 * The replacement symbols of an entry: none, one, or several. A `package`
 * entry names a package, not a symbol, and has none.
 */
export function replacements(entry: RenameEntry): string[] {
  if (entry.new === null || entry.kind === "package") return [];
  return typeof entry.new === "string" ? [entry.new] : entry.new;
}

/** A symbol of the map: a class, or a static or instance member of one. */
export interface SymbolName {
  className: string;
  member: string | undefined;
}

const SYMBOL =
  /^(?:new )?([A-Za-z_$][\w$]*)(?:\.([A-Za-z_$][\w$]*))?(?:\(\.\.\.\))?$/;

/** `new Unit(...)` and `Unit` name the class, `Unit.create(...)` its member. */
export function parseSymbol(symbol: string): SymbolName {
  const match = SYMBOL.exec(symbol);
  if (match?.[1] === undefined) {
    throw new Error(`"${symbol}" is not a symbol of the rename map`);
  }
  return { className: match[1], member: match[2] };
}

/**
 * The files `pnpm pack` puts in the package, relative to its root. Under
 * `pnpm test` the pnpm that runs the script is reused through node;
 * otherwise `pnpm` is looked up by the shell (pnpm.cmd on Windows).
 */
export function publishedFiles(): string[] {
  const options = { cwd: packageRoot, encoding: "utf8" } as const;
  const execPath = process.env.npm_execpath;
  const output =
    execPath !== undefined && /pnpm\.c?js$/.test(execPath)
      ? execFileSync(
          process.execPath,
          [execPath, "pack", "--dry-run", "--json"],
          options,
        )
      : execSync("pnpm pack --dry-run --json", options);
  const packed = JSON.parse(output) as { files: { path: string }[] };
  return packed.files.map((file) => file.path);
}
