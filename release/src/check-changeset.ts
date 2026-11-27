/**
 * `release:check-changeset`, programmatic entry point: given the files a
 * pull request changed and the changesets it adds, which publishable
 * packages changed without a changeset naming them, and which major
 * changesets the channel of its base branch refuses.
 */
import type { Changeset } from "./changesets.js";
import { byCodePoint } from "./order.js";
import type { ReleaseChannel } from "./release-channel.js";
import { owningPackage, type PublishablePackage } from "./workspace.js";

export interface ChangesetCheckInput {
  /** The publishable packages of the workspace. */
  packages: readonly Pick<PublishablePackage, "name" | "dir">[];
  /** The files the pull request changed, `/`-separated, root-relative. */
  changedFiles: readonly string[];
  /** The changesets the pull request adds. */
  changesets: readonly Pick<Changeset, "file" | "releases">[];
  /**
   * The Release channel of the pull request's base branch, whose `majors`
   * say which packages may take a major changeset. Absent when the base is
   * no channel branch (neither `master` nor `next`): no major is refused.
   */
  channel?: Pick<ReleaseChannel, "majors">;
}

/** A major changeset the channel of the base branch refuses. */
export interface RefusedMajor {
  /** The package the changeset bumps by a major. */
  package: string;
  /** The changeset, as the input names it. */
  changeset: string;
}

export interface ChangesetCheckResult {
  /** Passes when no package is missing a changeset and no major is refused. */
  ok: boolean;
  /** The publishable packages holding a changed file, by name. */
  changed: string[];
  /** The changed packages no changeset covers, by name. */
  missing: string[];
  /** The major changesets the base's channel refuses, by package then file. */
  refused: RefusedMajor[];
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
 *
 * A major changeset of a package the base's channel refuses it for (on
 * `master`, a package at its first stable version or after) is refused:
 * that major goes to the branch `next` (docs/release.md, "Release
 * channels"). A package the channel does not know is left to Changesets.
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
  const majors = input.channel?.majors ?? {};
  const refused = input.changesets
    .flatMap((changeset) =>
      changeset.releases
        .filter(
          (release) =>
            release.type === "major" &&
            Object.hasOwn(majors, release.name) &&
            !majors[release.name],
        )
        .map((release) => ({
          package: release.name,
          changeset: changeset.file,
        })),
    )
    .sort(
      (a, b) =>
        byCodePoint(a.package, b.package) ||
        byCodePoint(a.changeset, b.changeset),
    );
  return {
    ok: missing.length === 0 && refused.length === 0,
    changed: [...changed].sort(byCodePoint),
    missing: missing.sort(byCodePoint),
    refused,
  };
}
