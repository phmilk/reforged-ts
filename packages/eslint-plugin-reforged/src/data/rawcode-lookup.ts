// The Rawcode lookup of reforged-map (#579), an optional module beside the
// optional data files: its main entry is loaded with a `require` created at
// the project root, from the linted project's installation, never from the
// plugin's own dependencies, so the lists are those of the versions the map
// builds against. The lookup is synchronous and the package has no
// top-level await, which `require` of an ES module needs. A package that is
// not installed, or that does not export the lookup, is unavailable, and
// the rules that run reduced without it say so (plugin.ts).
//
// The types below are the part of reforged-map's lookup the rules read,
// declared here so that the plugin's own declarations need no reforged-map.
import { createRequire } from "node:module";
import path from "node:path";

import {
  findPackageDirectory,
  type Unavailable,
  versionOf,
} from "./optional.js";

/** An object a Rawcode names, as far as the rules read it. */
export interface RawcodeObject {
  readonly rawcode: string;
  /** Its Object kind (`unit`). */
  readonly kind: string;
  /** Its name, undefined when none is known. */
  readonly name: string | undefined;
}

/** A Game data set: its id and the name the World Editor gives it. */
export interface GameDataSet {
  readonly id: string;
  readonly label: string;
}

/** What the lookup says of a literal. */
export type RawcodeLookupResult =
  | {
      readonly status: "known";
      readonly rawcode: string;
      readonly objects: readonly RawcodeObject[];
    }
  | {
      readonly status: "not-in-game-data-set";
      readonly rawcode: string;
      readonly objects: readonly RawcodeObject[];
      readonly gameDataSet: GameDataSet;
    }
  | {
      readonly status: "unknown";
      readonly rawcode: string;
      readonly suggestions: readonly RawcodeObject[];
    }
  | { readonly status: "malformed"; readonly rawcode: string }
  | { readonly status: "unavailable"; readonly reason: string };

/** A lookup over one map folder. */
export interface RawcodeLookup {
  lookup(rawcode: string): RawcodeLookupResult;
  /** The Game version of the reforged-builtins index it read; undefined when unavailable. */
  gameVersion(): string | undefined;
  /** The warnings of reading the map folder, each one line. */
  warnings(): readonly string[];
}

/** reforged-map's `openRawcodeLookup`. */
export type OpenRawcodeLookup = (options: {
  mapFolder: string;
  projectRoot: string;
}) => RawcodeLookup;

/** The package the lookup comes from. */
const PACKAGE = "reforged-map";

export type OptionalModuleResult<T> =
  | { readonly available: true; readonly value: T }
  | { readonly available: false; readonly unavailable: Unavailable };

function unavailable(reason: string): OptionalModuleResult<never> {
  return { available: false, unavailable: { package: PACKAGE, reason } };
}

/**
 * Loads `openRawcodeLookup` from reforged-map as the project installs it.
 * `override` is a module path loaded instead (the tests); it must load.
 */
export function loadRawcodeLookup(
  projectRoot: string,
  override?: string,
): OptionalModuleResult<OpenRawcodeLookup> {
  // A require of the project, as Node resolves a package from it.
  const require = createRequire(
    path.join(path.resolve(projectRoot), "package.json"),
  );
  let file: string;
  let where: string;
  if (override === undefined) {
    const directory = findPackageDirectory(projectRoot, PACKAGE);
    if (directory === undefined) {
      return unavailable(
        `${PACKAGE} is not installed in ${path.resolve(projectRoot)} (resolved from the project root)`,
      );
    }
    where = `${PACKAGE}${versionOf(directory)} in ${directory}`;
    try {
      file = require.resolve(directory);
    } catch (error) {
      return unavailable(
        `${where} has no main entry to load (${message(error)})`,
      );
    }
  } else {
    file = path.resolve(override);
    where = file;
  }
  let loaded: unknown;
  try {
    loaded = require(file);
  } catch (error) {
    if (override !== undefined) throw error;
    return unavailable(`${where} could not be loaded (${message(error)})`);
  }
  const open = (loaded as { openRawcodeLookup?: unknown } | null)
    ?.openRawcodeLookup;
  if (typeof open !== "function") {
    return unavailable(
      `${where} does not export openRawcodeLookup, the Rawcode lookup: update it`,
    );
  }
  return { available: true, value: open as OpenRawcodeLookup };
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
