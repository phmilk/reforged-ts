/**
 * Adopting a Build into the package root: the previous model the record of
 * the Patch compares against, the manifest's fields that move with it, and
 * the rename entries of a major merged into the package's rename map.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  compareVersions,
  expectedExports,
  gameVersionFolders,
} from "./check.js";
import { kindsOf } from "./emit.js";
import type { BuiltinsIndex, ObjectKind } from "./model.js";
import type { RenameEntry } from "./record.js";

/** The package's rename map, with the schema of the library's, relative to its root. */
export const RENAMES_FILE = "migration/renames.json";

/** The package's name, as its rename map's version pairs name it. */
const PACKAGE = "reforged-builtins";

async function readText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function readIndex(
  root: string,
  gameVersion: string,
): Promise<BuiltinsIndex | undefined> {
  const text = await readText(join(root, gameVersion, "index.json"));
  return text === undefined ? undefined : (JSON.parse(text) as BuiltinsIndex);
}

/**
 * The model a new one of `gameVersion` is compared with: the committed one
 * of the same Game version, else the newest of an earlier one; undefined
 * when the root holds neither.
 */
export async function previousIndex(
  root: string,
  gameVersion: string,
): Promise<BuiltinsIndex | undefined> {
  const earlier = (await gameVersionFolders(root)).filter(
    (folder) => compareVersions(folder, gameVersion) <= 0,
  );
  for (const folder of earlier.reverse()) {
    const index = await readIndex(root, folder);
    if (index !== undefined) return index;
  }
  return undefined;
}

/**
 * Moves the manifest of the root, when it has one, to the Game versions it
 * holds: `exports` points the kind entry points at the newest, and
 * `reforged.patch` names `build`. Returns whether it wrote it.
 */
export async function updateManifest(
  root: string,
  build: string,
): Promise<boolean> {
  const file = join(root, "package.json");
  const text = await readText(file);
  if (text === undefined) return false;
  const kindsByVersion = new Map<string, ObjectKind[]>();
  for (const gameVersion of await gameVersionFolders(root)) {
    const index = await readIndex(root, gameVersion);
    if (index !== undefined) kindsByVersion.set(gameVersion, kindsOf(index));
  }
  const manifest = JSON.parse(text) as Record<string, unknown>;
  manifest.reforged = {
    ...(manifest.reforged as Record<string, unknown> | undefined),
    patch: build,
  };
  manifest.exports = expectedExports(kindsByVersion);
  await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`);
  return true;
}

/**
 * The version pair of the package's next major, from the version of its
 * manifest: `reforged-builtins@1` to `reforged-builtins@2` from 1.x.
 */
export async function nextMajorPair(
  root: string,
): Promise<{ from: string; to: string }> {
  const text = await readText(join(root, "package.json"));
  const version =
    text === undefined
      ? "0.0.0"
      : ((JSON.parse(text) as { version?: string }).version ?? "0.0.0");
  const major = Number(version.split(".")[0]);
  return {
    from: `${PACKAGE}@${String(major)}`,
    to: `${PACKAGE}@${String(major + 1)}`,
  };
}

/**
 * Merges `entries` into the root's rename map, created when missing: an
 * entry of the same old symbol and version pair is replaced, every other
 * kept. Returns the number written.
 */
export async function mergeRenameEntries(
  root: string,
  entries: readonly RenameEntry[],
): Promise<number> {
  if (entries.length === 0) return 0;
  const file = join(root, RENAMES_FILE);
  const text = await readText(file);
  const map = text === undefined ? [] : (JSON.parse(text) as RenameEntry[]);
  const key = (entry: RenameEntry) =>
    `${entry.old} ${entry.versions.from} ${entry.versions.to}`;
  const replaced = new Set(entries.map(key));
  const merged = [
    ...map.filter((entry) => !replaced.has(key(entry))),
    ...entries,
  ];
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(merged, null, 2)}\n`);
  return entries.length;
}
