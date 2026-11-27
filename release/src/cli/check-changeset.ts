/**
 * `release:check-changeset [--base <ref>]`: fails when a publishable package
 * changed without a changeset naming it, or when a changeset it adds bumps a
 * package by a major the Release channel of the base branch refuses (on
 * `master`, a package at its first stable version or after). The pull
 * request is `HEAD` against its merge base with the base ref: `--base`, else
 * the environment variable `RELEASE_BASE_REF` (CI names the pull request's
 * base there, as `origin/<branch>`), else `master`. The base branch is the
 * ref's last name after `refs/heads/`, `refs/remotes/origin/` or `origin/`;
 * a base that is neither `master` nor `next` refuses no major. The
 * changesets it adds are read from the working tree. On failure it prints
 * one line per package missing a changeset and one per refused major. Exit
 * codes: 0 pass, 1 a package lacks a changeset, a major is refused or the
 * inputs cannot be read, 2 usage.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isChangesetPath, parseChangeset } from "../changesets.js";
import { baseBranch, checkChangeset } from "../check-changeset.js";
import { changesSince, defaultBase, gitIn, type Git } from "../git.js";
import { CHANNEL_BRANCHES, releaseChannel } from "../release-channel.js";
import { readPublishablePackages, repositoryRoot } from "../workspace.js";
import {
  BASE_OPTION,
  errorMessage,
  invokedDirectly,
  parseBaseArgs,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = `Usage: release:check-changeset ${BASE_OPTION}\n`;

/** Where the command looks: the repository, and how it asks git. */
export interface Context {
  root: string;
  git: Git;
  env: Readonly<Record<string, string | undefined>>;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    root: repositoryRoot,
    git: gitIn(repositoryRoot),
    env: process.env,
  },
): Promise<number> {
  const parsed = parseBaseArgs(args, context.env);
  if (!parsed) {
    output.stderr(USAGE);
    return 2;
  }

  let base: string;
  let input: Parameters<typeof checkChangeset>[0];
  try {
    base = parsed.base ?? (await defaultBase(context.git));
    const changes = await changesSince(context.git, base);
    const changesets = [];
    for (const { status, path } of changes) {
      if (status === "A" && isChangesetPath(path)) {
        const text = await readFile(join(context.root, path), "utf8");
        changesets.push(parseChangeset(path, text));
      }
    }
    const packages = await readPublishablePackages(context.root);
    const branch = baseBranch(base);
    input = {
      packages,
      changedFiles: changes.map((change) => change.path),
      changesets,
      ...((CHANNEL_BRANCHES as readonly string[]).includes(branch)
        ? { channel: releaseChannel(branch, packages) }
        : {}),
    };
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }

  const result = checkChangeset(input);
  if (!result.ok) {
    const dirs = new Map(input.packages.map((pkg) => [pkg.name, pkg.dir]));
    const lines = result.missing.map(
      (name) =>
        `Missing changeset: ${name} (${String(dirs.get(name))}) changed since ${base} and no changeset added names it.\n`,
    );
    if (result.missing.length > 0) {
      lines.push(
        "Add a changeset under .changeset/ naming each package with its bump, " +
          "or an empty changeset when the change publishes nothing.\n",
      );
    }
    for (const refused of result.refused) {
      lines.push(
        `Major refused on ${String(input.channel?.branch)}: ${refused.changeset} bumps ${refused.package} by a major, and ${refused.package} is at its first stable version or after.\n`,
      );
    }
    if (result.refused.length > 0) {
      lines.push(
        "A major goes to the branch next, the Next branch, once a package is stable: " +
          'base the pull request on next (docs/release.md, "Release channels").\n',
      );
    }
    output.stderr(lines.join(""));
    return 1;
  }
  output.stdout(
    result.changed.length === 0
      ? `No publishable package changed since ${base}.\n`
      : `Every changed publishable package has a changeset: ${result.changed.join(", ")}.\n`,
  );
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
