// The creation Natives (data/creation-natives.json), owned by the plugin: the
// Handle-returning Natives that make a new engine object, one entry per
// Native with the name family it was listed under (`Create*`,
// `AddSpecialEffect*`, ...). Lookups and conversions (`Player`,
// `GetTriggerUnit`, `Convert*`) are never listed. It grows by pull request;
// a test asserts every entry is a Handle-returning Native of the Typings.
import {
  elements,
  expectObject,
  expectString,
  expectUnique,
} from "./schema.js";

export interface CreationNative {
  /** The Native's name as the Typings declare it. */
  readonly name: string;
  /** The name family it belongs to, as a pattern (`Create*`) or the name itself. */
  readonly family: string;
}

export function parseCreationNatives(
  json: unknown,
  file: string,
): CreationNative[] {
  const entries = elements(json, { file, field: "" }).map(({ value, path }) => {
    const entry = expectObject(value, path);
    return {
      name: expectString(entry, "name", path),
      family: expectString(entry, "family", path),
    };
  });
  expectUnique(
    entries.map((entry) => entry.name),
    { file, field: "" },
    "name",
  );
  return entries;
}
