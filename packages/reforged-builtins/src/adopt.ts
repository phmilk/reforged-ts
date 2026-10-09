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
 * manifest, as the major-changeset gate computes it: `reforged-builtins@1`
 * to `reforged-builtins@2` from 1.x and from 2.0.0's prereleases (a major
 * bump releases 2.0.0 from those). Undefined below 1.0.0: no released major
 * to migrate from, so no rename entry.
 */
export async function nextMajorPair(
  root: string,
): Promise<{ from: string; to: string } | undefined> {
  const text = await readText(join(root, "package.json"));
  const version =
    text === undefined
      ? "0.0.0"
      : ((JSON.parse(text) as { version?: string }).version ?? "0.0.0");
  const match = /^(\d+)\.(\d+)\.(\d+)(-.+)?$/.exec(version);
  if (match === null)
    throw new Error(
      `${PACKAGE} has version "${version}", which is not semver.`,
    );
  const [major, minor, patch] = [match[1], match[2], match[3]].map(Number);
  const prerelease = version.includes("-");
  const next = prerelease && minor === 0 && patch === 0 ? major : major + 1;
  if (next <= 1) return undefined;
  return {
    from: `${PACKAGE}@${String(next - 1)}`,
    to: `${PACKAGE}@${String(next)}`,
  };
}

/** An item of the rename map: an entry, or a pair's no-renames marker. */
type RenameMapItem =
  | RenameEntry
  | { kind: "noRenames"; versions: RenameEntry["versions"]; note: string };

const samePair = (a: RenameEntry["versions"], b: RenameEntry["versions"]) =>
  a.from === b.from && a.to === b.to;

/**
 * Merges `entries` into the root's rename map, created when missing, and
 * returns the number of entries it holds for their pairs. Within one pair,
 * the major not yet released: an entry whose old name another entry
 * renamed to chains onto it (`Footman` to `Militia`, then `Militia` to
 * `Guard`, is `Footman` to `Guard`), an entry renamed back to its old name
 * is dropped, an entry of the same old name is replaced, and the pair's
 * no-renames marker gives way. Entries of other pairs are kept.
 */
export async function mergeRenameEntries(
  root: string,
  entries: readonly RenameEntry[],
): Promise<number> {
  if (entries.length === 0) return 0;
  const file = join(root, RENAMES_FILE);
  const text = await readText(file);
  let map = text === undefined ? [] : (JSON.parse(text) as RenameMapItem[]);
  for (const entry of entries) {
    map = map.filter(
      (item) =>
        !(item.kind === "noRenames" && samePair(item.versions, entry.versions)),
    );
    const chained = map.find(
      (item): item is RenameEntry =>
        item.kind !== "noRenames" &&
        samePair(item.versions, entry.versions) &&
        item.new === entry.old,
    );
    if (chained === undefined) {
      map = [
        ...map.filter(
          (item) =>
            item.kind === "noRenames" ||
            !(
              item.old === entry.old && samePair(item.versions, entry.versions)
            ),
        ),
        entry,
      ];
    } else if (chained.old === entry.new) {
      map = map.filter((item) => item !== chained);
    } else {
      chained.new = entry.new;
      chained.oneToOne = chained.oneToOne && entry.oneToOne;
      chained.note = entry.note;
    }
  }
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(map, null, 2)}\n`);
  const pairs = entries.map((entry) => entry.versions);
  return map.filter(
    (item) =>
      item.kind !== "noRenames" &&
      pairs.some((pair) => samePair(pair, item.versions)),
  ).length;
}
