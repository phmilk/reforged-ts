// The rename map of `no-legacy-w3ts-names`: migration/renames.json, published
// by reforged-ts and read from the linted project's installation. The
// library's migration/renames.schema.json is the contract; this parser
// checks the same shape at load (the plugin does not ship a JSON Schema
// validator). Fields it does not read are not checked.
import {
  DataFileError,
  elements,
  expectBoolean,
  expectObject,
  expectString,
  type FieldPath,
} from "./schema.js";
import type { OptionalDataFile } from "./optional.js";

export const renameKinds = [
  "constructor",
  "member",
  "accessor",
  "function",
  "class",
  "type",
  "entryPoint",
  "package",
] as const;

export type RenameKind = (typeof renameKinds)[number];

/** One entry of the rename map. */
export interface RenameEntry {
  /** The old symbol: `new Unit(...)`, `Group.getEnumUnit`, `hookedMain`, `main::before`, or a package name. */
  readonly old: string;
  /** The replacements, in the map's order; empty when the symbol was removed. */
  readonly replacements: readonly string[];
  readonly kind: RenameKind;
  /** The version pair, as the message names it: `w3ts@3` and `reforged-ts@1`. */
  readonly versions: { readonly from: string; readonly to: string };
  /** The replacement takes the same arguments: the rule autofixes. */
  readonly oneToOne: boolean;
  /** Why the symbol changed, one sentence. */
  readonly note: string;
}

const identifier = String.raw`[A-Za-z_$][\w$]*`;
const call = String.raw`(\(\.\.\.\))?`;
const symbolPattern = new RegExp(
  String.raw`^${identifier}(\.${identifier})?${call}$`,
);
const oldSymbolPattern = new RegExp(
  String.raw`^((new )?${identifier}(\.${identifier})?${call}|${identifier}::${identifier})$`,
);
const packagePattern = /^(@[a-z0-9~-][a-z0-9._~-]*\/)?[a-z0-9~-][a-z0-9._~-]*$/;
const versionPattern = /^[a-z][a-z0-9-]*@[0-9]+$/;

function expectMatch(
  object: Record<string, unknown>,
  key: string,
  path: FieldPath,
  pattern: RegExp,
  expected: string,
): string {
  const value = expectString(object, key, path);
  if (!pattern.test(value)) {
    throw new DataFileError(path.file, `${path.field}.${key}`, expected);
  }
  return value;
}

function parseKind(entry: Record<string, unknown>, path: FieldPath) {
  const kind = entry.kind;
  if (!renameKinds.includes(kind as RenameKind)) {
    throw new DataFileError(
      path.file,
      `${path.field}.kind`,
      `one of ${renameKinds.join(", ")}`,
    );
  }
  return kind as RenameKind;
}

function parseReplacements(
  entry: Record<string, unknown>,
  path: FieldPath,
  kind: RenameKind,
): string[] {
  const field = `${path.field}.new`;
  const value = entry.new;
  if (kind === "package") {
    return [expectMatch(entry, "new", path, packagePattern, "a package name")];
  }
  const symbol = "a symbol (`Unit.create(...)`)";
  if (value === null) {
    return [];
  }
  if (typeof value === "string") {
    return [expectMatch(entry, "new", path, symbolPattern, symbol)];
  }
  if (!Array.isArray(value) || value.length < 2) {
    throw new DataFileError(
      path.file,
      field,
      `${symbol}, a list of at least two symbols, or null`,
    );
  }
  const list = value.map((each: unknown, index) => {
    if (typeof each !== "string" || !symbolPattern.test(each)) {
      throw new DataFileError(path.file, `${field}[${String(index)}]`, symbol);
    }
    return each;
  });
  if (new Set(list).size !== list.length) {
    throw new DataFileError(path.file, field, "a list without duplicates");
  }
  return list;
}

export function parseRenames(json: unknown, file: string): RenameEntry[] {
  return elements(json, { file, field: "" }).map(({ value, path }) => {
    const entry = expectObject(value, path);
    const kind = parseKind(entry, path);
    const old =
      kind === "package"
        ? expectMatch(entry, "old", path, packagePattern, "a package name")
        : expectMatch(
            entry,
            "old",
            path,
            oldSymbolPattern,
            "a symbol (`new Unit(...)`, `Group.getEnumUnit`, `main::before`)",
          );
    const replacements = parseReplacements(entry, path, kind);
    const versionsPath = { file, field: `${path.field}.versions` };
    const versions = expectObject(entry.versions, versionsPath);
    const version = "a package and its major (`w3ts@3`)";
    const oneToOne = expectBoolean(entry, "oneToOne", path);
    if (oneToOne && replacements.length !== 1) {
      throw new DataFileError(
        file,
        `${path.field}.new`,
        "a single symbol when oneToOne is true",
      );
    }
    return {
      old,
      replacements,
      kind,
      versions: {
        from: expectMatch(
          versions,
          "from",
          versionsPath,
          versionPattern,
          version,
        ),
        to: expectMatch(versions, "to", versionsPath, versionPattern, version),
      },
      oneToOne,
      note: expectString(entry, "note", path),
    };
  });
}

/** reforged-ts's rename map, as `no-legacy-w3ts-names` reads it. */
export const renamesFile: OptionalDataFile<RenameEntry[]> = {
  package: "reforged-ts",
  path: "migration/renames.json",
  parse: parseRenames,
};
