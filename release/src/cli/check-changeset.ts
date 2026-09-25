/**
 * `release:check-changeset [--base <ref>]`: fails when a publishable package
 * changed without a changeset naming it. The pull request is `HEAD` against
 * its merge base with the base ref: `--base`, else the environment variable
 * `RELEASE_BASE_REF` (CI names the pull request's base there), else
 * `master`. The changesets it adds are read from the working tree. On
 * failure it prints one line per package missing a changeset. Exit codes: 0
 * pass, 1 a package lacks a changeset or the inputs cannot be read, 2 usage.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isChangesetPath, parseChangeset } from "../changesets.js";
import { checkChangeset } from "../check-changeset.js";
import { changesSince, defaultBase, gitIn, type Git } from "../git.js";
import { readPublishablePackages, repositoryRoot } from "../workspace.js";
import {
  BASE_OPTION,
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
    input = {
      packages: await readPublishablePackages(context.root),
      changedFiles: changes.map((change) => change.path),
      changesets,
    };
  } catch (error) {
    output.stderr(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }

  const result = checkChangeset(input);
  if (!result.ok) {
    const dirs = new Map(input.packages.map((pkg) => [pkg.name, pkg.dir]));
    output.stderr(
      result.missing
        .map(
          (name) =>
            `Missing changeset: ${name} (${String(dirs.get(name))}) changed since ${base} and no changeset added names it.\n`,
        )
        .join("") +
        "Add a changeset under .changeset/ naming each package with its bump, " +
        "or an empty changeset when the change publishes nothing.\n",
    );
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
