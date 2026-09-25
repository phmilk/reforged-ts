// The ban list of `no-unsafe-natives` (data/unsafe-natives.json), owned by
// the plugin: one entry per Native, with the reason it is unsafe and what to
// use instead. It grows by pull request.
import {
  elements,
  expectObject,
  expectString,
  expectUnique,
} from "./schema.js";

export interface UnsafeNative {
  /** The Native's name as the Typings declare it. */
  readonly name: string;
  /** The pitfall and its consequence, one sentence, without the name. */
  readonly reason: string;
  /** What to write instead, one sentence. */
  readonly replacement: string;
}

export function parseUnsafeNatives(
  json: unknown,
  file: string,
): UnsafeNative[] {
  const entries = elements(json, { file, field: "" }).map(({ value, path }) => {
    const entry = expectObject(value, path);
    return {
      name: expectString(entry, "name", path),
      reason: expectString(entry, "reason", path),
      replacement: expectString(entry, "replacement", path),
    };
  });
  expectUnique(
    entries.map((entry) => entry.name),
    { file, field: "" },
    "name",
  );
  return entries;
}
