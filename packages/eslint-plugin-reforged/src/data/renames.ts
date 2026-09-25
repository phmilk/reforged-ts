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

/** A code symbol of the map, parsed: `Unit`, `Unit.create(...)`, `new Unit(...)`. */
export interface RenameSymbol {
  /** The class, function or type name: `Unit` in all three. */
  readonly className: string;
  /** The member after the dot (`create`), undefined for a bare name. */
  readonly member: string | undefined;
  /** Written `new X(...)`: a constructor call (an `old` symbol only). */
  readonly isNew: boolean;
  /** Written with `(...)`: a call. */
  readonly isCall: boolean;
}

/** A name of the map: the text as written, and its symbol when it is code. */
export interface RenameName {
  /** As the map writes it; the messages quote it. */
  readonly text: string;
  /**
   * The parsed symbol; undefined for a package name and for an entry-point
   * hook (`main::before`).
   */
  readonly symbol: RenameSymbol | undefined;
}

/** One entry of the rename map. */
export interface RenameEntry {
  /** The old name: `new Unit(...)`, `Group.getEnumUnit`, `hookedMain`, `main::before`, or a package name. */
  readonly old: RenameName;
  /** The replacements, in the map's order; empty when the symbol was removed. */
  readonly replacements: readonly RenameName[];
  readonly kind: RenameKind;
  /** The version pair, as the message names it: `w3ts@3` and `reforged-ts@1`. */
  readonly versions: { readonly from: string; readonly to: string };
  /** The replacement takes the same arguments: the rule autofixes. */
  readonly oneToOne: boolean;
  /** Why the symbol changed, one sentence. */
  readonly note: string;
}

const identifier = String.raw`[A-Za-z_$][\w$]*`;
const symbolPattern = new RegExp(
  String.raw`^(?<isNew>new )?(?<className>${identifier})(?:\.(?<member>${identifier}))?(?<call>\(\.\.\.\))?$`,
);
const hookPattern = new RegExp(String.raw`^${identifier}::${identifier}$`);
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

/** A code symbol; `new X(...)` only in an old name. */
function parseSymbol(text: string, isOld: boolean): RenameSymbol | undefined {
  // A group that did not take part in the match is undefined.
  const groups = symbolPattern.exec(text)?.groups as
    | Partial<Record<"isNew" | "className" | "member" | "call", string>>
    | undefined;
  if (
    groups?.className === undefined ||
    (!isOld && groups.isNew !== undefined)
  ) {
    return undefined;
  }
  return {
    className: groups.className,
    member: groups.member,
    isNew: groups.isNew !== undefined,
    isCall: groups.call !== undefined,
  };
}

/**
 * A code name of the map, parsed. An old name may also be a constructor
 * (`new Unit(...)`) or an entry-point hook (`main::before`, no symbol).
 */
function expectSymbol(
  text: unknown,
  field: string,
  path: FieldPath,
  isOld: boolean,
  expected: string,
): RenameName {
  if (typeof text === "string") {
    const symbol = parseSymbol(text, isOld);
    if (symbol !== undefined) {
      return { text, symbol };
    }
    if (isOld && hookPattern.test(text)) {
      return { text, symbol: undefined };
    }
  }
  throw new DataFileError(path.file, field, expected);
}

function packageName(
  entry: Record<string, unknown>,
  key: string,
  path: FieldPath,
): RenameName {
  return {
    text: expectMatch(entry, key, path, packagePattern, "a package name"),
    symbol: undefined,
  };
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
): RenameName[] {
  const field = `${path.field}.new`;
  const value = entry.new;
  if (kind === "package") {
    return [packageName(entry, "new", path)];
  }
  const symbol = "a symbol (`Unit.create(...)`)";
  if (value === null) {
    return [];
  }
  if (typeof value === "string") {
    expectString(entry, "new", path);
    return [expectSymbol(value, field, path, false, symbol)];
  }
  if (!Array.isArray(value) || value.length < 2) {
    throw new DataFileError(
      path.file,
      field,
      `${symbol}, a list of at least two symbols, or null`,
    );
  }
  const list = value.map((each: unknown, index) =>
    expectSymbol(each, `${field}[${String(index)}]`, path, false, symbol),
  );
  if (new Set(list.map((each) => each.text)).size !== list.length) {
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
        ? packageName(entry, "old", path)
        : expectSymbol(
            expectString(entry, "old", path),
            `${path.field}.old`,
            path,
            true,
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
