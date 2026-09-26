/**
 * `data:check`, programmatic entry point: what the migration data can get
 * wrong against the code that no other check catches, answered in seconds
 * without building the site.
 *
 * - An old symbol of the rename map that the library's built declarations
 *   still export: a rename that left the old name in place. An entry point
 *   (`main::before`) and a package name are not symbols; an entry that
 *   keeps its name (a note on changed arguments) and an old name kept
 *   deprecated for a release are exported on purpose.
 * - A version pair of the map, markers included, without its migration page
 *   (`.md` or `.mdx`) in the site's docs tree, at the major-changeset gate's
 *   page path, once the library has reached the pair's target major. Before
 *   that, the pair holds the deprecations of the current major ("Deprecating
 *   and removing a symbol" in docs/release.md), and its page is due with the
 *   major, which the gate requires.
 *
 * The rest of the migration data is checked once, elsewhere: the schema,
 * the replacements and the entries or marker of each pair by the library's
 * `renames.test.ts`, `async-natives.json` by `typings:check`, the page of
 * the major being released by `release:gate`.
 */
import { access } from "node:fs/promises";
import { join, posix } from "node:path";
import { MIGRATION_DIR, type PreMode } from "./major-changeset-gate.js";
import { LIBRARY_PACKAGE } from "./packages.js";
import {
  declarationResolver,
  loadRenameMap,
  migrationPagePath,
  oldSymbol,
  renameEntries,
  replacements,
  versionPairs,
  type VersionPair,
} from "./rename-map.js";
import { parseSemver } from "./semver.js";

export interface DataCheckInput {
  /** The rename map, `renames.json`, with its schema next to it. */
  renames: string;
  /** The library's built declaration entry, `dist/index.d.ts`. */
  declarations: string;
  /** The site's docs tree, `website/docs`. */
  docs: string;
  /** The library's version, from its manifest. */
  version: string;
}

export type Violation =
  | { kind: "old-name"; old: string; versions: VersionPair }
  | { kind: "page"; versions: VersionPair; path: string };

/** The docs tree the gate's page path starts with, `website/docs`. */
export const DOCS_DIR = posix.dirname(MIGRATION_DIR);

/**
 * Old symbols of the map exported on purpose under the same name, though
 * the entry names another replacement, so the map cannot say so itself:
 * `new SyncRequest(...)` documents the constructor overloads that took the
 * data, and the constructor stays.
 */
const KEPT_OLD_SYMBOLS: ReadonlySet<string> = new Set(["new SyncRequest(...)"]);

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * The violations of the rename map at `input.renames` against the built
 * declarations and the docs tree: the old names first, in the map's order,
 * then the pages, in the order the map first references their pair. Throws
 * when the version is not semver, the map does not match its schema or the
 * declaration entry is not a module.
 */
export async function dataCheck(input: DataCheckInput): Promise<Violation[]> {
  const major = parseSemver(input.version)?.major;
  if (major === undefined) {
    throw new Error(
      `${LIBRARY_PACKAGE} has version "${input.version}", which is not semver.`,
    );
  }
  const items = await loadRenameMap(input.renames);
  const resolver = declarationResolver(input.declarations);

  const violations: Violation[] = [];
  for (const entry of renameEntries(items)) {
    const old = oldSymbol(entry);
    if (
      old === undefined ||
      replacements(entry).includes(old) ||
      KEPT_OLD_SYMBOLS.has(old)
    ) {
      continue;
    }
    const exported = resolver.stillExported(old);
    if (exported !== undefined && !exported.deprecated) {
      violations.push({ kind: "old-name", old, versions: entry.versions });
    }
  }
  for (const versions of versionPairs(items)) {
    if (Number(versions.to.slice(versions.to.lastIndexOf("@") + 1)) > major) {
      continue;
    }
    const path = join(
      input.docs,
      posix.relative(DOCS_DIR, migrationPagePath(versions)),
    );
    if (!(await exists(path)) && !(await exists(`${path}x`))) {
      violations.push({ kind: "page", versions, path });
    }
  }
  return violations;
}

/**
 * The violations that fail the check. A missing page is only reported
 * while pre mode is active, as the major-changeset gate does: the version
 * produced is a prerelease, and the page is due by the stable release.
 */
export function failing(
  violations: readonly Violation[],
  preMode: PreMode,
): Violation[] {
  return violations.filter(
    (violation) => violation.kind !== "page" || preMode !== "pre",
  );
}
