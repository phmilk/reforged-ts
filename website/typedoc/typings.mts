// The Typings' reference (#40): where each entry of a Patch's manifest has
// its page. The site's TypeDoc plugin checks every Typings reference against
// it, and the `@native` links of the library's reference (#183) are built
// from it. TypeDoc imports it from source with the plugin: erasable syntax
// only.
import { readFileSync } from "node:fs";

/** The kinds of entry a manifest holds (reforged-types' `src/artefacts.ts`). */
export const ENTRY_KINDS = ["native", "function", "global"] as const;

/** A Native, a Blizzard.j function, or a global. */
export type EntryKind = (typeof ENTRY_KINDS)[number];

/** What an entry's page needs: its name and its kind, nothing else. */
export interface TypingsEntry {
  readonly name: string;
  readonly kind: EntryKind;
}

/** The part of a Patch's `manifest.json` the site reads. */
export interface TypingsManifest {
  /** The Build the Typings of the Game version were generated from. */
  readonly patch: string;
  readonly entries: readonly TypingsEntry[];
}

/**
 * An entry's page in the Typings reference of its Game version, relative to
 * the reference's folder, without `.md`: `functions/<name>` for a Native or a
 * Blizzard.j function, `variables/<name>` for a global. The reference puts
 * the declarations of `common.j`, `blizzard.j` and `common.ai` side by side,
 * so the Jass file an entry comes from is not part of it. The page's route is
 * the same path under the reference's route.
 */
export function entryPage(entry: TypingsEntry): string {
  switch (entry.kind) {
    case "native":
    case "function":
      return `functions/${entry.name}`;
    case "global":
      return `variables/${entry.name}`;
  }
}

/** Reads a Patch's `manifest.json`, which the Typings generator writes. */
export function readTypingsManifest(file: string): TypingsManifest {
  const manifest = JSON.parse(readFileSync(file, "utf8")) as {
    patch?: unknown;
    entries?: unknown;
  };
  if (typeof manifest.patch !== "string" || !Array.isArray(manifest.entries)) {
    throw new Error(`${file}: not a Typings manifest (patch, entries).`);
  }
  const entries = (manifest.entries as unknown[]).map((entry, index) => {
    const { name, kind } = (entry ?? {}) as { name?: unknown; kind?: unknown };
    if (typeof name !== "string" || !ENTRY_KINDS.includes(kind as EntryKind)) {
      throw new Error(
        `${file}: entry ${String(index)} (${JSON.stringify(name)}) needs a name and a kind among ${ENTRY_KINDS.join(", ")}, got ${JSON.stringify(kind)}.`,
      );
    }
    return { name, kind: kind as EntryKind };
  });
  return { patch: manifest.patch, entries };
}
