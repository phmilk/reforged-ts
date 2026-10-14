// The index of reforged-builtins, an optional peer: resolved from the Map
// project's installation, never from this package's, and read for the
// newest Game version it holds, the one its kind entry points resolve to.

import fs from "node:fs";
import path from "node:path";

/** The index format this package reads. */
const INDEX_FORMAT = 1;

/** One Built-in object of the index, as far as this package reads it. */
export interface BuiltinObject {
  readonly kind: string;
  readonly name?: string;
  /** Its race (`human`), when it has one. */
  readonly race?: string;
  /** The ids of the Game data sets that hold it (`melee-tft`). */
  readonly sets?: readonly string[];
  /** Its constant's name in its kind's module (`Footman_hfoo`). */
  readonly constant?: string;
}

/** A Game data set of the index: its id (`melee-tft`) and its name (`Melee (The Frozen Throne)`). */
export interface GameDataSet {
  /** Its id in reforged-builtins' index (`melee-tft`). */
  readonly id: string;
  /** The name the World Editor gives it (`Melee (The Frozen Throne)`). */
  readonly label: string;
}

/** What this package reads of reforged-builtins' index. */
export interface BuiltinsIndex {
  readonly gameVersion: string;
  /** The Game data sets of the Game version, each with the name the World Editor gives it. */
  readonly gameDataSets?: readonly GameDataSet[];
  readonly objects: Readonly<Record<string, BuiltinObject>>;
}

/** The index, or why there is none, in words an author reads after "reforged-builtins ". */
export type BuiltinsResult =
  { readonly index: BuiltinsIndex } | { readonly missing: string };

/** The kind entry point whose target names the newest Game version. */
const KIND_ENTRY = "./units";

/** The files of reforged-builtins the index is read from: its package.json, and the index when it names one. */
export interface BuiltinsFiles {
  /** The path of its package.json. */
  readonly manifest: string;
  /** The path of the index of the Game version its kind entry points resolve to. */
  readonly index?: string;
  /** Why its package.json could not be read, when it could not. */
  readonly error?: string;
}

/**
 * Resolves reforged-builtins from `projectRoot` (a folder of the Map
 * project, whose `node_modules` or an ancestor's holds it): its package.json,
 * and the index of the Game version its kind entry points resolve to.
 * Undefined when it is not installed. Without `index` when its package.json
 * names no Game version, or cannot be read: `error` then says why.
 */
export function builtinsFiles(projectRoot: string): BuiltinsFiles | undefined {
  const manifestPath = findManifest(projectRoot);
  if (manifestPath === undefined) return undefined;
  let manifest: { exports?: Record<string, { types?: string } | string> };
  try {
    manifest = JSON.parse(
      fs.readFileSync(manifestPath, "utf8"),
    ) as typeof manifest;
  } catch (error) {
    return { manifest: manifestPath, error: (error as Error).message };
  }
  const entry = manifest.exports?.[KIND_ENTRY];
  const target = typeof entry === "string" ? entry : entry?.types;
  const version =
    target === undefined ? undefined : /^\.\/([^/]+)\//.exec(target)?.[1];
  return {
    manifest: manifestPath,
    ...(version !== undefined && {
      index: path.join(path.dirname(manifestPath), version, "index.json"),
    }),
  };
}

/**
 * Resolves reforged-builtins from `projectRoot`, as {@link builtinsFiles},
 * and reads the index of the Game version its kind entry points resolve to.
 */
export function loadBuiltins(projectRoot: string): BuiltinsResult {
  try {
    const files = builtinsFiles(projectRoot);
    if (files === undefined) return { missing: "is not installed" };
    if (files.error !== undefined) {
      return { missing: `could not be read (${files.error})` };
    }
    if (files.index === undefined) {
      return {
        missing: `names no Game version in its ${KIND_ENTRY} entry point`,
      };
    }
    const index = JSON.parse(
      fs.readFileSync(files.index, "utf8"),
    ) as BuiltinsIndex & {
      format?: number;
    };
    if (index.format !== INDEX_FORMAT) {
      return {
        missing: `has an index of format ${String(index.format)}, which reforged-map does not read (it reads format ${String(INDEX_FORMAT)})`,
      };
    }
    return { index };
  } catch (error) {
    return { missing: `could not be read (${(error as Error).message})` };
  }
}

/**
 * The package.json of `node_modules/reforged-builtins` in `from` or its
 * nearest ancestor that has one. Walked here, not with `require.resolve`,
 * which also searches `NODE_PATH`: pnpm sets it to its store when it runs
 * a script, where a package the Map project does not install can be found.
 */
function findManifest(from: string): string | undefined {
  let dir = path.resolve(from);
  for (;;) {
    const manifest = path.join(
      dir,
      "node_modules",
      "reforged-builtins",
      "package.json",
    );
    if (fs.statSync(manifest, { throwIfNoEntry: false })?.isFile()) {
      return manifest;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}
