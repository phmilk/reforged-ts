// Everything the rules read from data files, loaded once when the plugin is
// created. Add a field here when a rule needs a new file.
import { readDataFile, ownDataFile } from "./load.js";
import { parseUnsafeNatives, type UnsafeNative } from "./unsafe-natives.js";

export interface PluginData {
  /** The ban list of `no-unsafe-natives` (the plugin's data/unsafe-natives.json). */
  readonly unsafeNatives: readonly UnsafeNative[];
}

/** Where each data file is read from; the tests point one at a fixture. */
export interface DataFiles {
  /** Defaults to the plugin's own data/unsafe-natives.json. */
  readonly unsafeNatives?: string;
}

export function loadPluginData(files: DataFiles = {}): PluginData {
  return {
    unsafeNatives: readDataFile(
      files.unsafeNatives ?? ownDataFile("unsafe-natives.json"),
      parseUnsafeNatives,
    ),
  };
}

export type { UnsafeNative } from "./unsafe-natives.js";
export { DataFileError } from "./schema.js";
