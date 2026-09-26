/**
 * `release:version`: the version step of a release. It runs
 * `changeset version` in the repository root (versions, changelogs, the
 * consumed changesets moved or removed), then the compatibility matrix
 * generator (`release:matrix`), so the Version Packages pull request carries
 * the matrix row. `changeset version` needs a GitHub token for the changelog
 * generator (`GITHUB_TOKEN`, or a `.env` file at the root). It does not run
 * the major-changeset gate, which reads the pending changesets and so runs
 * before this step. Exit codes: 0 versioned and generated, 1 either step
 * failed (the matrix is not generated when `changeset version` fails), 2
 * usage.
 */
import { createRequire } from "node:module";
import { runInherited } from "../process.js";
import { repositoryRoot } from "../workspace.js";
import { invokedDirectly, PROCESS_OUTPUT, type Output } from "./common.js";
import { DEFAULT_CONTEXT, main as matrix } from "./matrix.js";

const USAGE = "Usage: release:version\n";

/** Runs `changeset version` in `root`; resolves with its exit code. */
export type ChangesetVersion = (root: string) => Promise<number>;

/** The Changesets CLI of the workspace, run with this Node. */
export const runChangesetVersion: ChangesetVersion = (root) => {
  const bin = createRequire(import.meta.url).resolve("@changesets/cli/bin.js");
  return runInherited({
    command: process.execPath,
    args: [bin, "version"],
    cwd: root,
  });
};

/** Where the command runs, its clock, and how it runs Changesets. */
export interface Context {
  root: string;
  now: () => Date;
  changesetVersion: ChangesetVersion;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    root: repositoryRoot,
    now: DEFAULT_CONTEXT.now,
    changesetVersion: runChangesetVersion,
  },
): Promise<number> {
  if (args.length > 0) {
    output.stderr(USAGE);
    return 2;
  }
  const code = await context.changesetVersion(context.root);
  if (code !== 0) {
    output.stderr(
      `changeset version failed (exit code ${String(code)}); the compatibility matrix was not generated.\n`,
    );
    return 1;
  }
  return matrix([], output, { root: context.root, now: context.now });
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
