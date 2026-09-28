// The Typings' reference (#40): where each entry of a Patch's manifest, and
// each Handle type its Jass files declare, has its page. The site's TypeDoc
// plugin checks every Typings reference against it, and the `@native` links
// of the library's reference (#183) are built from it. TypeDoc imports it
// from source with the plugin: erasable syntax only.
import { readFileSync } from "node:fs";

/** The kinds of entry a manifest holds (reforged-types' `src/artefacts.ts`). */
export const ENTRY_KINDS = ["native", "function", "global"] as const;

/**
 * The manifest's kinds of Native: a function of `common.j` or `common.ai`, a
 * Blizzard.j function, or a global.
 */
export type EntryKind = (typeof ENTRY_KINDS)[number];

/** What an entry's page needs: its name and its kind, nothing else. */
export interface TypingsEntry {
  readonly name: string;
  readonly kind: EntryKind;
}

/**
 * The route base path of the Typings' docs instance, which is not versioned
 * (#185): the reference of a Game version is at `/typings/<Game version>`,
 * each entry's page under it where `entryPage` says, for every docs version.
 */
export const TYPINGS_ROUTE_BASE = "typings";

/** The route of the Typings reference of a Game version, from the site's root. */
export function gameVersionRoute(gameVersion: string): string {
  return `/${TYPINGS_ROUTE_BASE}/${gameVersion}`;
}

/**
 * The slug of a Game version's index page, relative to its folder: a route
 * ending in the Game version (`/typings/3.0.0`) is taken for a file with an
 * extension by a static server, which answers 404 (`docusaurus serve`, #188).
 */
export const GAME_VERSION_INDEX_SLUG = "overview";

/** The part of a Patch's `manifest.json` the site reads. */
export interface TypingsManifest {
  /** The Build the Typings of the Game version were generated from. */
  readonly patch: string;
  readonly entries: readonly TypingsEntry[];
}

/**
 * An entry's page in the Typings reference of its Game version, relative to
 * the reference's folder, without `.md`: `functions/<name>` for a `native` or
 * a `function`, `variables/<name>` for a `global`. The reference puts
 * the declarations of `common.j`, `blizzard.j` and `common.ai` side by side,
 * so the Jass file an entry comes from is not part of it. The page's route is
 * the same path under the reference's route, `gameVersionRoute`.
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

/**
 * The Jass file of a Game version that declares its Handle types, next to
 * its `manifest.json`: the manifest lists no type.
 */
export const HANDLE_TYPES_FILE = "common.j.d.ts";

/**
 * A Handle type's page in the Typings reference of its Game version,
 * relative to the reference's folder, without `.md`: `interfaces/<name>`,
 * where TypeDoc puts the interface the Typings declare it as.
 */
export function handleTypePage(name: string): string {
  return `interfaces/${name}`;
}

/**
 * Reads the Handle types a Game version's `common.j.d.ts` declares: `handle`
 * and each interface that extends it, directly or through another one, in
 * the file's order.
 */
export function readHandleTypes(file: string): string[] {
  const declared = new Map<string, string | undefined>();
  for (const [, name, base] of readFileSync(file, "utf8").matchAll(
    /^declare interface (\w+)(?:\s+extends\s+(\w+))?/gm,
  )) {
    if (name !== undefined) declared.set(name, base);
  }
  const isHandle = (name: string, seen = new Set<string>()): boolean => {
    if (name === "handle") return true;
    const base = declared.get(name);
    if (base === undefined || seen.has(name)) return false;
    seen.add(name);
    return isHandle(base, seen);
  };
  return [...declared.keys()].filter((name) => isHandle(name));
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
