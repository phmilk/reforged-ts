// The async Natives of `no-async-value-as-state`: async-natives.json,
// published by reforged-types (#39) and read from the linted project's
// installation. A sorted array of the Natives whose value differs between
// clients, the same set the Typings tag `@async` (the plugin's consistency
// oracle, test/data.test.ts). The rule pre-matches a plain call by this list,
// then asks the checker for the tag.
import type { OptionalDataFile } from "./optional.js";
import { DataFileError, elements, expectUnique } from "./schema.js";

export function parseAsyncNatives(json: unknown, file: string): string[] {
  const names = elements(json, { file, field: "" }).map(({ value, path }) => {
    if (typeof value !== "string" || value.trim() === "") {
      throw new DataFileError(path.file, path.field, "a non-empty string");
    }
    return value;
  });
  expectUnique(names, { file, field: "" }, "name");
  return names;
}

export const asyncNativesFile: OptionalDataFile<string[]> = {
  package: "reforged-types",
  path: "async-natives.json",
  parse: parseAsyncNatives,
};
