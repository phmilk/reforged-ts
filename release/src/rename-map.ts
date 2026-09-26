/**
 * The rename map, programmatic entry point: `migration/renames.json` of the
 * library, read by the workspace's scripts and tests. Every reader asks the
 * same questions of it, answered here once:
 *
 * - load a map file and check it against the schema kept next to it
 *   (`renames.schema.json`), which throws naming the offending items;
 * - parse its symbols: `new Unit(...)` (a constructor), `Unit.create(...)`
 *   or `Frame.parent` (a static or an instance member: the declarations
 *   tell which), `hookedMain` (a function, a class or a type); a package
 *   name, an entry point (`main::before`) and the no-renames marker name no
 *   symbol;
 * - resolve a symbol against a built declaration entry (`dist/index.d.ts`)
 *   through the TypeScript compiler API, and list the replacements that do
 *   not resolve.
 *
 * The migration page of a version pair is the major-changeset gate's
 * `migrationPagePath`, re-exported here: the gate owns that rule.
 *
 * Other workspace packages import it as `reforged-ts-release/rename-map`
 * (the build output: run the release package's `build` first). The library
 * is published and cannot depend on this private package, so its tests
 * import the source by path.
 */
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  Ajv2020,
  type SchemaObject,
  type ValidateFunction,
} from "ajv/dist/2020.js";
import * as ts from "typescript";
import { NO_RENAMES_KIND, type VersionPair } from "./major-changeset-gate.js";

export { migrationPagePath, type VersionPair } from "./major-changeset-gate.js";

/** The schema's file name; `loadRenameMap` looks for it next to the map. */
const SCHEMA_FILE = "renames.schema.json";

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
  versions: VersionPair;
  oneToOne: boolean;
  note: string;
}

/**
 * The no-renames marker: the major of the version pair removes and renames
 * nothing. It stands in for the pair's entries.
 */
export interface NoRenamesMarker {
  kind: typeof NO_RENAMES_KIND;
  versions: VersionPair;
  note: string;
}

/** One item of the rename map: an entry, or the marker of a pair. */
export type RenameMapItem = RenameEntry | NoRenamesMarker;

export function isNoRenamesMarker(
  item: RenameMapItem,
): item is NoRenamesMarker {
  return item.kind === NO_RENAMES_KIND;
}

/** The compiled schemas, by file. */
const validators = new Map<string, ValidateFunction<RenameMapItem[]>>();

function validator(schemaFile: string): ValidateFunction<RenameMapItem[]> {
  let validate = validators.get(schemaFile);
  if (validate === undefined) {
    validate = new Ajv2020({ allErrors: true }).compile<RenameMapItem[]>(
      JSON.parse(readFileSync(schemaFile, "utf8")) as SchemaObject,
    );
    validators.set(schemaFile, validate);
  }
  return validate;
}

/**
 * Parses the text of a rename map; throws when it is not JSON or does not
 * match the schema in `schemaFile`.
 */
export function parseRenameMap(
  text: string,
  schemaFile: string,
): RenameMapItem[] {
  const validate = validator(schemaFile);
  const map: unknown = JSON.parse(text);
  if (!validate(map)) {
    const errors = (validate.errors ?? [])
      .map((error) => `${error.instancePath || "/"} ${error.message ?? ""}`)
      .join("\n");
    throw new Error(`The rename map does not match its schema:\n${errors}`);
  }
  return map;
}

/**
 * Reads and checks the rename map `file`, markers included, against the
 * schema next to it (or `schemaFile`).
 */
export async function loadRenameMap(
  file: string,
  schemaFile: string = join(dirname(file), SCHEMA_FILE),
): Promise<RenameMapItem[]> {
  return parseRenameMap(await readFile(file, "utf8"), schemaFile);
}

/** The entries of a map, without the markers. */
export function renameEntries(items: readonly RenameMapItem[]): RenameEntry[] {
  return items.filter((item): item is RenameEntry => !isNoRenamesMarker(item));
}

/** Each version pair of a map once, in the map's order, markers included. */
export function versionPairs(items: readonly RenameMapItem[]): VersionPair[] {
  const pairs = new Map<string, VersionPair>();
  for (const { versions } of items) {
    const key = `${versions.from} ${versions.to}`;
    if (!pairs.has(key))
      pairs.set(key, { from: versions.from, to: versions.to });
  }
  return [...pairs.values()];
}

/**
 * The replacement symbols of an item: none, one, or several. A `package`
 * entry names a package, not a symbol, and a marker names nothing: neither
 * has any.
 */
export function replacements(item: RenameMapItem): string[] {
  if (isNoRenamesMarker(item) || item.new === null || item.kind === "package")
    return [];
  return typeof item.new === "string" ? [item.new] : item.new;
}

/**
 * The old symbol of an item; undefined for a package, an entry point of
 * `addScriptHook` (`main::before`, not a symbol) and a marker.
 */
export function oldSymbol(item: RenameMapItem): string | undefined {
  return isNoRenamesMarker(item) ||
    item.kind === "package" ||
    item.kind === "entryPoint"
    ? undefined
    : item.old;
}

/**
 * A symbol of the map: an exported name (a class, a function, a type or a
 * value), or a static or instance member of one.
 */
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

export interface DeclarationResolver {
  /**
   * Whether the entry exports a symbol of that name and, when a member is
   * named, whether the export is a class with a public static or instance
   * member of that name (its own or inherited) or a value (`Init`,
   * `Reforged`) whose type has a public property of that name.
   */
  has(symbol: SymbolName): boolean;
  /**
   * Whether an author can still write `old`, an old symbol of the map,
   * against the entry: `new X(...)` when the exported class `X` has a
   * public constructor (its own or inherited), any other symbol when `has`
   * finds it. Undefined when they cannot; `deprecated` when every
   * declaration found carries `@deprecated`.
   */
  stillExported(old: string): { deprecated: boolean } | undefined;
}

/**
 * The compiler options of a declaration entry read on its own: the global
 * types a Map project lists (the Typings) are not needed to find a name.
 */
const ENTRY_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  noEmit: true,
  types: [],
};

/**
 * The public API a built declaration entry (the library's `dist/index.d.ts`)
 * exports, read with `options` (by default a Map project's, without its
 * global types). Throws when the entry is not a module.
 */
export function declarationResolver(
  entry: string,
  options: ts.CompilerOptions = ENTRY_OPTIONS,
): DeclarationResolver {
  const program = ts.createProgram({ rootNames: [entry], options });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  const entryModule =
    source === undefined ? undefined : checker.getSymbolAtLocation(source);
  if (entryModule === undefined) {
    throw new Error(`${entry} is not a module`);
  }
  const exported = new Map(
    checker
      .getExportsOfModule(entryModule)
      .map((symbol) => [
        symbol.name,
        symbol.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(symbol)
          : symbol,
      ]),
  );
  const isPublicDeclaration = (declaration: ts.Declaration) =>
    (ts.getCombinedModifierFlags(declaration) &
      (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) ===
    0;
  const isPublic = (member: ts.Symbol) =>
    (member.declarations ?? []).every(isPublicDeclaration);
  /** The export `className`, or its public member `member`. */
  const find = ({ className, member }: SymbolName) => {
    const symbol = exported.get(className);
    if (symbol === undefined || member === undefined) return symbol;
    const types: ts.Type[] = [];
    if (symbol.flags & ts.SymbolFlags.Class) {
      types.push(
        checker.getTypeOfSymbol(symbol),
        checker.getDeclaredTypeOfSymbol(symbol),
      );
    } else if (symbol.flags & ts.SymbolFlags.Variable) {
      types.push(checker.getTypeOfSymbol(symbol));
    }
    return types
      .map((type) => type.getProperty(member))
      .find((found) => found !== undefined && isPublic(found));
  };
  /** The declarations of the public constructors of the exported class. */
  const publicConstructors = (className: string) => {
    const symbol = exported.get(className);
    if (symbol === undefined || !(symbol.flags & ts.SymbolFlags.Class)) {
      return [];
    }
    return checker
      .getSignaturesOfType(
        checker.getTypeOfSymbol(symbol),
        ts.SignatureKind.Construct,
      )
      .map((signature) => signature.declaration)
      .filter(
        (declaration) =>
          declaration === undefined || isPublicDeclaration(declaration),
      );
  };
  return {
    has: (symbol) => find(symbol) !== undefined,
    stillExported(old) {
      const declarations = old.startsWith("new ")
        ? publicConstructors(parseSymbol(old).className)
        : find(parseSymbol(old))?.declarations;
      if (declarations === undefined || declarations.length === 0) {
        return undefined;
      }
      return {
        deprecated: declarations.every(
          (declaration) =>
            declaration !== undefined &&
            ts.getJSDocDeprecatedTag(declaration) !== undefined,
        ),
      };
    },
  };
}

/** A replacement the declarations do not export, and the entry naming it. */
export interface MissingSymbol {
  /** The entry's old name. */
  old: string;
  versions: VersionPair;
  /** The replacement, as the map writes it. */
  symbol: string;
}

/** The replacements of `items` that `resolver` does not find, in map order. */
export function missingSymbols(
  items: readonly RenameMapItem[],
  resolver: DeclarationResolver,
): MissingSymbol[] {
  return renameEntries(items).flatMap((entry) =>
    replacements(entry)
      .filter((symbol) => !resolver.has(parseSymbol(symbol)))
      .map((symbol) => ({ old: entry.old, versions: entry.versions, symbol })),
  );
}

export interface RenameMapCheck {
  /** The map's items, markers included. */
  items: RenameMapItem[];
  /** Its replacements the declaration entry does not export. */
  missing: MissingSymbol[];
}

/**
 * Loads and checks the rename map `file` against the schema next to it, and
 * resolves its replacements against the built declaration `entry`: what a
 * reader of the map checks before trusting it. Throws when the map is
 * malformed or the entry is not a module.
 */
export async function checkRenameMap(
  file: string,
  entry: string,
  options?: ts.CompilerOptions,
): Promise<RenameMapCheck> {
  const items = await loadRenameMap(file);
  return {
    items,
    missing: missingSymbols(items, declarationResolver(entry, options)),
  };
}
