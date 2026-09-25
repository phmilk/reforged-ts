/**
 * `release:check-changeset`, programmatic entry point: given the files a
 * pull request changed and the changesets it adds, which publishable
 * packages changed without a changeset naming them.
 */
import type { Changeset } from "./changesets.js";
import { byCodePoint } from "./order.js";
import { owningPackage, type PublishablePackage } from "./workspace.js";

export interface ChangesetCheckInput {
  /** The publishable packages of the workspace. */
  packages: readonly Pick<PublishablePackage, "name" | "dir">[];
  /** The files the pull request changed, `/`-separated, root-relative. */
  changedFiles: readonly string[];
  /** The changesets the pull request adds. */
  changesets: readonly Pick<Changeset, "releases">[];
}

export interface ChangesetCheckResult {
  /** Passes when no package is missing a changeset. */
  ok: boolean;
  /** The publishable packages holding a changed file, by name. */
  changed: string[];
  /** The changed packages no changeset covers, by name. */
  missing: string[];
}

/**
 * A changed package is covered by a changeset that names it, whatever its
 * bump, or by an empty changeset, which covers every changed package. Files
 * outside the publishable packages never need one.
 *
 * The empty changeset is the author's statement that nothing publishable
 * changed (a comment or a test inside a package folder): the script cannot
 * tell such a change from one that ships, so it takes the statement, and
 * review is the check (docs/release.md, "The empty changeset").
 */
export function checkChangeset(
  input: ChangesetCheckInput,
): ChangesetCheckResult {
  const changed = new Set<string>();
  for (const path of input.changedFiles) {
    const owner = owningPackage(input.packages, path);
    if (owner !== undefined) changed.add(owner.name);
  }
  const coversAll = input.changesets.some(
    (changeset) => changeset.releases.length === 0,
  );
  const named = new Set(
    input.changesets.flatMap((changeset) =>
      changeset.releases.map((release) => release.name),
    ),
  );
  const missing = coversAll
    ? []
    : [...changed].filter((name) => !named.has(name));
  return {
    ok: missing.length === 0,
    changed: [...changed].sort(byCodePoint),
    missing: missing.sort(byCodePoint),
  };
}
