/**
 * The major-changeset gate on `reforged-builtins` (#514). When a pending
 * changeset or a changeset of the pre folder bumps the package by a major,
 * the gate requires, for the version pair of that major
 * (`reforged-builtins@1` to `reforged-builtins@2`):
 *
 * - the migration page, at `migrationPagePath(pair)`;
 * - the package's own rename entries for the pair, or its no-renames
 *   marker, in `migration/renames.json` with the schema of the library's;
 * - each replacement of those entries resolved against the constants the
 *   package emits for its newest Game version (`<version>/<kind>.d.ts`).
 *
 * Unlike the library's, it has no first stable rule: only a major counts,
 * and the major that releases the package first (to 1.0.0) needs nothing.
 * Pre mode reports and passes, as the library's gate does.
 */
import { getPackages } from "@manypkg/get-packages";
import { readdir } from "node:fs/promises";
import { join, posix, relative, sep } from "node:path";
import {
  CHANGESET_DIR,
  readChangesetFolder,
  readPreMode,
} from "./changesets.js";
import {
  hasRenames,
  majorAfterBump,
  migrationPagePath,
  parseVersion,
  readPages,
  RENAMES_FILE,
  verdictOf,
  type GateResult,
  type Missing,
  type Requirement,
  type VersionPair,
} from "./major-changeset-gate.js";
import { byCodePoint } from "./order.js";
import { BUILTINS_PACKAGE, LIBRARY_PACKAGE } from "./packages.js";
import {
  declarationResolver,
  loadRenameMap,
  parseSymbol,
  renameEntries,
  replacements,
  type RenameMapItem,
} from "./rename-map.js";

/** A Game version folder of the package: `3.0.0`. */
const GAME_VERSION = /^\d+\.\d+\.\d+$/;

/** Game versions in numeric order: `3.0.0` before `3.0.10`. */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** The constants' declarations of the package's newest Game version. */
async function newestDeclarations(dir: string): Promise<string[]> {
  const folders = (await readdir(dir, { withFileTypes: true }))
    .filter((item) => item.isDirectory() && GAME_VERSION.test(item.name))
    .map((item) => item.name)
    .sort(compareVersions);
  const newest = folders.at(-1);
  if (newest === undefined) return [];
  return (await readdir(join(dir, newest)))
    .filter((name) => name.endsWith(".d.ts"))
    .sort(byCodePoint)
    .map((name) => join(dir, newest, name));
}

/**
 * The replacements of the entries for `pair` among `items` that no
 * declaration of `declarations` exports, in map order.
 */
function unresolved(
  items: readonly RenameMapItem[],
  pair: VersionPair,
  declarations: readonly string[],
): string[] {
  const resolvers = declarations.map((entry) => declarationResolver(entry));
  return renameEntries(items)
    .filter(
      (entry) =>
        entry.versions.from === pair.from && entry.versions.to === pair.to,
    )
    .flatMap((entry) => replacements(entry))
    .filter(
      (symbol) =>
        !resolvers.some((resolver) => resolver.has(parseSymbol(symbol))),
    );
}

/** The gate on the `reforged-builtins` of the workspace at `root`. */
export async function builtinsGate(root: string): Promise<GateResult> {
  const preMode = await readPreMode(root);
  const { packages } = await getPackages(root);
  const builtins = packages.find(
    (pkg) => pkg.packageJson.name === BUILTINS_PACKAGE,
  );
  const library = packages.find(
    (pkg) => pkg.packageJson.name === LIBRARY_PACKAGE,
  );
  const pass: GateResult = {
    package: BUILTINS_PACKAGE,
    verdict: "pass",
    requirement: undefined,
    missing: [],
    preMode,
  };
  if (builtins === undefined) return pass;

  const majors = [
    ...(await readChangesetFolder(join(root, CHANGESET_DIR))),
    ...(await readChangesetFolder(join(root, CHANGESET_DIR, "pre"))),
  ]
    .filter((changeset) =>
      changeset.releases.some(
        (release) =>
          release.name === BUILTINS_PACKAGE && release.type === "major",
      ),
    )
    .map((changeset) =>
      relative(root, changeset.file).split(sep).join(posix.sep),
    )
    .sort(byCodePoint);
  if (majors.length === 0) return pass;

  const major = majorAfterBump(parseVersion(builtins.packageJson.version));
  // The major that releases the package first (0.x to 1.0.0) migrates from
  // no released major: it needs no page and no entries.
  if (major <= 1) return pass;
  const pair: VersionPair = {
    from: `${BUILTINS_PACKAGE}@${String(major - 1)}`,
    to: `${BUILTINS_PACKAGE}@${String(major)}`,
  };
  const requirement: Requirement = {
    pair,
    reason: { kind: "major", changesets: majors },
    page: migrationPagePath(pair),
  };
  const dir = relative(root, builtins.dir).split(sep).join(posix.sep);
  const renamesFile = `${dir}/${RENAMES_FILE}`;
  const missing: Missing[] = [];
  const pages = await readPages(root);
  if (!pages.has(requirement.page) && !pages.has(`${requirement.page}x`)) {
    missing.push({ kind: "page", path: requirement.page });
  }
  // The package's map has the schema of the library's, kept next to it.
  if (library === undefined) {
    throw new Error(
      `The workspace has no ${LIBRARY_PACKAGE}, whose renames.schema.json ${renamesFile} follows.`,
    );
  }
  const schemaFile = join(library.dir, "migration", "renames.schema.json");
  let items: RenameMapItem[] = [];
  try {
    items = await loadRenameMap(join(root, renamesFile), schemaFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (!hasRenames(items, pair)) {
    missing.push({ kind: "renames", file: renamesFile });
  } else {
    const symbols = unresolved(
      items,
      pair,
      await newestDeclarations(builtins.dir),
    );
    if (symbols.length > 0) {
      missing.push({ kind: "replacements", file: renamesFile, symbols });
    }
  }
  return {
    package: BUILTINS_PACKAGE,
    verdict: verdictOf(missing, preMode),
    requirement,
    missing,
    preMode,
  };
}
