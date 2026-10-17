// Everything the rules read from data files, loaded once when the plugin is
// created. Add a field here when a rule needs a new file.
//
// Two sources: the plugin's own files (data/*.json, always there), and the
// files an optional peer package publishes (optional.ts), read from the
// linted project's installation. An optional file that is unavailable reads
// as empty and is listed in `unavailable`; the plugin disables every rule
// whose entry `requires` that package. The Rawcode lookup of reforged-map is
// an optional module, loaded the same way (rawcode-lookup.ts); without it,
// the rules whose entry runs `reduced` without it lose one check.
import { asyncNativesFile } from "./async-natives.js";
import {
  type CrashingArguments,
  parseCrashingArguments,
} from "./crashing-arguments.js";
import {
  type CreationNative,
  parseCreationNatives,
} from "./creation-natives.js";
import { type EventResponse, parseEventResponses } from "./event-responses.js";
import { readDataFile, ownDataFile } from "./load.js";
import { parseLocalSafe, type LocalSafeEntry } from "./local-safe.js";
import {
  readOptionalDataFile,
  type OptionalDataFile,
  type OptionalPackage,
  type Unavailable,
} from "./optional.js";
import { loadRawcodeLookup, type OpenRawcodeLookup } from "./rawcode-lookup.js";
import { renamesFile, type RenameEntry } from "./renames.js";
import { parseUnsafeNatives, type UnsafeNative } from "./unsafe-natives.js";

export interface PluginData {
  /** The ban list of `no-unsafe-natives` (the plugin's data/unsafe-natives.json). */
  readonly unsafeNatives: readonly UnsafeNative[];
  /** The allowlist of visual and text calls (the plugin's data/local-safe.json). */
  readonly localSafe: readonly LocalSafeEntry[];
  /** The creation Natives (the plugin's data/creation-natives.json). */
  readonly creationNatives: readonly CreationNative[];
  /** The event responses (the plugin's data/event-responses.json). */
  readonly eventResponses: readonly EventResponse[];
  /** The Crashing cases of `no-crashing-arguments` (the plugin's data/crashing-arguments.json). */
  readonly crashingArguments: readonly CrashingArguments[];
  /** The rename map of `no-legacy-w3ts-names` (reforged-ts's migration/renames.json). */
  readonly renames: readonly RenameEntry[];
  /** The async Natives of `no-async-value-as-state` (reforged-types's async-natives.json). */
  readonly asyncNatives: readonly string[];
  /** The Rawcode lookup of `no-unknown-rawcodes` (reforged-map's `openRawcodeLookup`); undefined when unavailable. */
  readonly openRawcodeLookup: OpenRawcodeLookup | undefined;
  /** The Map project's root, where the optional packages and the map folder are looked for. */
  readonly projectRoot: string;
  /** The optional packages whose files could not be read, and why. */
  readonly unavailable: ReadonlyMap<OptionalPackage, Unavailable>;
}

/** Where each data file is read from; the tests point one at a fixture. */
export interface DataFiles {
  /** Defaults to the plugin's own data/unsafe-natives.json. */
  readonly unsafeNatives?: string;
  /** Defaults to the plugin's own data/local-safe.json. */
  readonly localSafe?: string;
  /** Defaults to the plugin's own data/creation-natives.json. */
  readonly creationNatives?: string;
  /** Defaults to the plugin's own data/event-responses.json. */
  readonly eventResponses?: string;
  /** Defaults to the plugin's own data/crashing-arguments.json. */
  readonly crashingArguments?: string;
  /** Defaults to reforged-ts's migration/renames.json, found from the project root. */
  readonly renames?: string;
  /** Defaults to reforged-types's async-natives.json, found from the project root. */
  readonly asyncNatives?: string;
  /** A module loaded instead of reforged-map, found from the project root; it exports `openRawcodeLookup`. */
  readonly rawcodeLookup?: string;
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
  function rawcodeLookup(): OpenRawcodeLookup | undefined {
    const result = loadRawcodeLookup(projectRoot, files.rawcodeLookup);
    if (result.available) {
      return result.value;
    }
    unavailable.set(result.unavailable.package, result.unavailable);
    return undefined;
  }
  return {
    unsafeNatives: readDataFile(
      files.unsafeNatives ?? ownDataFile("unsafe-natives.json"),
      parseUnsafeNatives,
    ),
    localSafe: readDataFile(
      files.localSafe ?? ownDataFile("local-safe.json"),
      parseLocalSafe,
    ),
    creationNatives: readDataFile(
      files.creationNatives ?? ownDataFile("creation-natives.json"),
      parseCreationNatives,
    ),
    eventResponses: readDataFile(
      files.eventResponses ?? ownDataFile("event-responses.json"),
      parseEventResponses,
    ),
    crashingArguments: readDataFile(
      files.crashingArguments ?? ownDataFile("crashing-arguments.json"),
      parseCrashingArguments,
    ),
    renames: optional(renamesFile, files.renames, []),
    asyncNatives: optional(asyncNativesFile, files.asyncNatives, []),
    openRawcodeLookup: rawcodeLookup(),
    projectRoot,
    unavailable,
  };
}

export type { OptionalPackage } from "./optional.js";
export type {
  OpenRawcodeLookup,
  RawcodeLookup,
  RawcodeLookupResult,
  RawcodeObject,
} from "./rawcode-lookup.js";
export type {
  RenameEntry,
  RenameKind,
  RenameName,
  RenameSymbol,
} from "./renames.js";
export type { UnsafeNative } from "./unsafe-natives.js";
export type { LocalSafeEntry, LocalSafeKind } from "./local-safe.js";
export type { CreationNative } from "./creation-natives.js";
export type { ArgumentValue, CrashingArguments } from "./crashing-arguments.js";
export type { EventContextKind, EventResponse } from "./event-responses.js";
export { DataFileError } from "./schema.js";
