/**
 * `release:version`: the version step of a release. It runs
 * `changeset version` in the repository root (versions, changelogs, the
 * consumed changesets moved or removed), then stamps the docs version of the
 * release into the packages (`docs-version.ts`: the lint plugin's
 * `reforged.docs` and the READMEs' `llms.txt` links), then runs the
 * compatibility matrix generator (`release:matrix`), so the Version
 * Packages pull request carries the stamp and the matrix row.
 * `changeset version` needs a GitHub token for the changelog generator
 * (`GITHUB_TOKEN`, or a `.env` file at the root). It does not run the
 * major-changeset gate, which reads the pending changesets and so runs
 * before this step. Exit codes: 0 versioned, stamped and generated, 1 a
 * step failed (the steps after it do not run), 2 usage.
 */
import { createRequire } from "node:module";
import { stampDocsVersion } from "../docs-version.js";
import { runInherited } from "../process.js";
import { repositoryRoot } from "../workspace.js";
import {
  invokedDirectly,
  PROCESS_OUTPUT,
  update,
  type Output,
} from "./common.js";
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
  const stamp = await stampDocsVersion(context.root);
  if (!stamp.ok) {
    output.stderr(
      stamp.problems.map((problem) => `${problem}\n`).join("") +
        "The docs version was not stamped and the compatibility matrix was not generated: docs/release.md#the-version-step-releaseversion.\n",
    );
    return 1;
  }
  const written: string[] = [];
  for (const [path, text] of stamp.files) {
    if (await update(context.root, path, text)) written.push(path);
  }
  output.stdout(
    `Docs version ${stamp.label}: ${written.length === 0 ? "no file changed" : `wrote ${written.join(", ")}`}.\n`,
  );
  return matrix([], output, { root: context.root, now: context.now });
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
