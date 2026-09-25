// Everything the rules read from data files, loaded once when the plugin is
// created. Add a field here when a rule needs a new file.
import {
  type CreationNative,
  parseCreationNatives,
} from "./creation-natives.js";
import { readDataFile, ownDataFile } from "./load.js";
import { parseUnsafeNatives, type UnsafeNative } from "./unsafe-natives.js";

export interface PluginData {
  /** The ban list of `no-unsafe-natives` (the plugin's data/unsafe-natives.json). */
  readonly unsafeNatives: readonly UnsafeNative[];
  /** The creation Natives (the plugin's data/creation-natives.json). */
  readonly creationNatives: readonly CreationNative[];
}

/** Where each data file is read from; the tests point one at a fixture. */
export interface DataFiles {
  /** Defaults to the plugin's own data/unsafe-natives.json. */
  readonly unsafeNatives?: string;
  /** Defaults to the plugin's own data/creation-natives.json. */
  readonly creationNatives?: string;
}

export function loadPluginData(files: DataFiles = {}): PluginData {
  return {
    unsafeNatives: readDataFile(
      files.unsafeNatives ?? ownDataFile("unsafe-natives.json"),
      parseUnsafeNatives,
    ),
    creationNatives: readDataFile(
      files.creationNatives ?? ownDataFile("creation-natives.json"),
      parseCreationNatives,
    ),
  };
}

export type { UnsafeNative } from "./unsafe-natives.js";
export type { CreationNative } from "./creation-natives.js";
export { DataFileError } from "./schema.js";
