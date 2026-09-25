// The allowlist of local-safe calls (data/local-safe.json), owned by the
// plugin: one entry per Native or library member that only changes what the
// local player sees or hears (`visual`), that displays a string (`text`,
// the text sinks), or a Native that computes its result from its arguments
// alone and changes no game state (`pure`: the converters, the math and
// string Natives; not the frame lookups, whose first call may allocate a
// frame handle). It grows by pull request, and every
// entry carries its reason.
import {
  DataFileError,
  elements,
  expectObject,
  expectString,
  expectUnique,
} from "./schema.js";

/**
 * `visual`: only changes the local presentation. `text`: displays a string
 * (a text sink). `pure`: a Native whose result depends on its arguments
 * only (`I2S`, `SquareRoot`, `SubString`); it changes
 * no game state, and a value passed to it flows on into its result.
 */
export type LocalSafeKind = "visual" | "text" | "pure";

const kinds: readonly LocalSafeKind[] = ["visual", "text", "pure"];

export interface LocalSafeEntry {
  /**
   * A Native's name (or `print`), `Class#member` for an instance member or
   * accessor of the library, `Class.member` for a static member.
   */
  readonly name: string;
  readonly kind: LocalSafeKind;
  /** Why the call is local-safe, one sentence. */
  readonly reason: string;
}

const nativeNamePattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
const namePattern =
  /^(?:[A-Za-z_][A-Za-z0-9_]*|[A-Z][A-Za-z0-9_]*[#.][A-Za-z_][A-Za-z0-9_]*)$/;

export function parseLocalSafe(json: unknown, file: string): LocalSafeEntry[] {
  const entries = elements(json, { file, field: "" }).map(({ value, path }) => {
    const entry = expectObject(value, path);
    const name = expectString(entry, "name", path);
    if (!namePattern.test(name)) {
      throw new DataFileError(
        file,
        `${path.field}.name`,
        "a Native name, Class#member or Class.member",
      );
    }
    const kind = entry.kind;
    if (!kinds.includes(kind as LocalSafeKind)) {
      throw new DataFileError(
        file,
        `${path.field}.kind`,
        `one of ${kinds.map((each) => JSON.stringify(each)).join(", ")}`,
      );
    }
    if (kind === "pure" && !nativeNamePattern.test(name)) {
      throw new DataFileError(
        file,
        `${path.field}.name`,
        "a Native name (a pure entry)",
      );
    }
    return {
      name,
      kind: kind as LocalSafeKind,
      reason: expectString(entry, "reason", path),
    };
  });
  expectUnique(
    entries.map((entry) => entry.name),
    { file, field: "" },
    "name",
  );
  return entries;
}
