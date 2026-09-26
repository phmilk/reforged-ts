/**
 * `data:check`, programmatic entry point: what the migration data can get
 * wrong against the code that no other check catches, answered in seconds
 * without building the site.
 *
 * - An old symbol of the rename map that the library's built declarations
 *   still export: a rename that left the old name in place. An entry point
 *   (`main::before`) and a package name are not symbols; an entry that
 *   keeps its name (a note on changed arguments) and an old name marked
 *   `@deprecated` before the major of its pair are exported on purpose.
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
import { join, posix, relative, sep } from "node:path";
import { readPreMode, type PreMode } from "./changesets.js";
import {
  formatPair,
  MIGRATION_DIR,
  RENAMES_FILE,
} from "./major-changeset-gate.js";
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
import { readPublishablePackages } from "./workspace.js";

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
 * Old symbols the library exports on purpose although their entry says they
 * are gone, which the map cannot express, with the last major that may
 * still export each.
 */
const KEPT_OLD_SYMBOLS: ReadonlyMap<string, number> = new Map([
  // The entry documents the constructor overloads that took the data; the
  // constructor stays.
  ["new SyncRequest(...)", Infinity],
  // Deprecated with `addScriptHook`, still exported for 1.x and removed in
  // 2.0 (the entry's note), though its pair is w3ts@3 to reforged-ts@1.
  ["W3TS_HOOK", 1],
]);

/**
 * The major a version pair migrates to, `2` for `reforged-ts@2`: the pair's
 * target is always the library.
 */
function targetMajor(versions: VersionPair): number {
  return Number(versions.to.slice(versions.to.lastIndexOf("@") + 1));
}

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
      major <= (KEPT_OLD_SYMBOLS.get(old) ?? -1)
    ) {
      continue;
    }
    const exported = resolver.stillExported(old);
    // Deprecated in a minor, with its entry of the pair to the next major,
    // and removed by that major.
    const deprecating =
      exported?.deprecated === true && major < targetMajor(entry.versions);
    if (exported !== undefined && !deprecating) {
      violations.push({ kind: "old-name", old, versions: entry.versions });
    }
  }
  for (const versions of versionPairs(items)) {
    if (targetMajor(versions) > major) continue;
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
export function failingViolations(
  violations: readonly Violation[],
  preMode: PreMode,
): Violation[] {
  return violations.filter(
    (violation) => violation.kind !== "page" || preMode !== "pre",
  );
}

/**
 * Reads the inputs from the workspace at `root`, their paths absolute: the
 * rename map, the declaration entry (the `types` of its manifest) and the
 * version of `reforged-ts`, and the site's docs tree.
 */
export async function readDataCheckInput(
  root: string,
): Promise<DataCheckInput> {
  const packages = await readPublishablePackages(root);
  const library = packages.find((pkg) => pkg.name === LIBRARY_PACKAGE);
  const types = library?.manifest.types;
  if (library === undefined || typeof types !== "string") {
    throw new Error(
      `The workspace has no publishable package ${LIBRARY_PACKAGE} with a "types" entry.`,
    );
  }
  return {
    renames: join(library.absoluteDir, RENAMES_FILE),
    declarations: join(library.absoluteDir, types),
    docs: join(root, DOCS_DIR),
    version: library.version,
  };
}

export interface DataCheckResult {
  input: DataCheckInput;
  /** Every violation, in `dataCheck`'s order. */
  violations: Violation[];
  /** Those that fail the check (`failingViolations`). */
  failing: Violation[];
}

/** The check on the workspace at `root`, under its pre state. */
export async function dataCheckWorkspace(
  root: string,
): Promise<DataCheckResult> {
  const input = await readDataCheckInput(root);
  const violations = await dataCheck(input);
  return {
    input,
    violations,
    failing: failingViolations(violations, await readPreMode(root)),
  };
}

/**
 * The result as lines for the terminal, one per violation, paths relative
 * to `root`.
 */
export function formatDataCheck(result: DataCheckResult, root: string): string {
  const rootRelative = (path: string) =>
    relative(root, path).split(sep).join(posix.sep);
  const { input, violations } = result;
  if (violations.length === 0) {
    return `${rootRelative(input.renames)} agrees with ${rootRelative(input.declarations)} and ${rootRelative(input.docs)}.\n`;
  }
  const lines = [
    `${rootRelative(input.renames)} disagrees with the declarations or the docs tree:`,
    ...violations.map((violation) =>
      violation.kind === "old-name"
        ? `- \`${violation.old}\` (${formatPair(violation.versions)}) is still exported by ${rootRelative(input.declarations)}: remove it, or see \`data:check\` in docs/release.md for what may stay.`
        : `- No migration page for ${formatPair(violation.versions)}: ${rootRelative(violation.path)} (or .mdx).`,
    ),
  ];
  if (result.failing.length < violations.length) {
    lines.push(
      "Pre mode is active (`.changeset/pre.json`): a missing migration page is reported only, and fails once pre mode is exited.",
    );
  }
  return `${lines.join("\n")}\n`;
}
