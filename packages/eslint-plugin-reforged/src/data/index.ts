// Everything the rules read from data files, loaded once when the plugin is
// created. Add a field here when a rule needs a new file.
//
// Two sources: the plugin's own files (data/*.json, always there), and the
// files an optional peer package publishes (optional.ts), read from the
// linted project's installation. An optional file that is unavailable reads
// as empty and is listed in `unavailable`; the plugin disables every rule
// whose entry `requires` that package.
import { readDataFile, ownDataFile } from "./load.js";
import {
  readOptionalDataFile,
  type OptionalDataFile,
  type OptionalPackage,
  type Unavailable,
} from "./optional.js";
import { renamesFile, type RenameEntry } from "./renames.js";
import { parseUnsafeNatives, type UnsafeNative } from "./unsafe-natives.js";

export interface PluginData {
  /** The ban list of `no-unsafe-natives` (the plugin's data/unsafe-natives.json). */
  readonly unsafeNatives: readonly UnsafeNative[];
  /** The rename map of `no-legacy-w3ts-names` (reforged-ts's migration/renames.json). */
  readonly renames: readonly RenameEntry[];
  /** The optional packages whose files could not be read, and why. */
  readonly unavailable: ReadonlyMap<OptionalPackage, Unavailable>;
}

/** Where each data file is read from; the tests point one at a fixture. */
export interface DataFiles {
  /** Defaults to the plugin's own data/unsafe-natives.json. */
  readonly unsafeNatives?: string;
  /** Defaults to reforged-ts's migration/renames.json, found from the project root. */
  readonly renames?: string;
}

export function loadPluginData(
  files: DataFiles = {},
  projectRoot: string = process.cwd(),
): PluginData {
  const unavailable = new Map<OptionalPackage, Unavailable>();
  function optional<T>(
    spec: OptionalDataFile<T>,
    override: string | undefined,
    empty: T,
  ): T {
    const result = readOptionalDataFile(spec, projectRoot, override);
    if (result.available) {
      return result.value;
    }
    unavailable.set(spec.package, result.unavailable);
    return empty;
  }
  return {
    unsafeNatives: readDataFile(
      files.unsafeNatives ?? ownDataFile("unsafe-natives.json"),
      parseUnsafeNatives,
    ),
    renames: optional(renamesFile, files.renames, []),
    unavailable,
  };
}

export type { OptionalPackage } from "./optional.js";
export type { RenameEntry, RenameKind } from "./renames.js";
export type { UnsafeNative } from "./unsafe-natives.js";
export { DataFileError } from "./schema.js";
