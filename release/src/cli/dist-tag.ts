/**
 * `release:dist-tag --pack-dir <dir> --branch <name>`: sets the npm
 * dist-tag of every package in the publish plan of the `changeset pack`
 * output `<dir>` to the dist-tag of the Release channel of the branch
 * `<name>` the release runs from: `latest` from `master`, `next` from
 * `next` (ADR 0031). Refuses any other branch, and a plan that publishes a
 * package at `0.0.0`. Prints one line per package; in GitHub Actions
 * (`GITHUB_STEP_SUMMARY` set) the plan also goes to the job summary as a
 * table.
 *
 * Relative paths resolve against the folder the command was started from.
 * Exit codes: 0 done, 1 a branch with no channel, or a plan that cannot be
 * read or is unversioned, 2 usage.
 */
import { resolve } from "node:path";
import { distTag, formatReleases } from "../dist-tag.js";
import { repositoryRoot } from "../workspace.js";
import {
  appendSummary,
  errorMessage,
  invokedDirectly,
  parseOptions,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: release:dist-tag --pack-dir <dir> --branch <name>\n";

export interface Context {
  /** The folder relative paths resolve against. */
  cwd: string;
  /** The workspace, for the versions of its packages. */
  root: string;
  env: Readonly<Record<string, string | undefined>>;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    // pnpm starts the script in release/; INIT_CWD is where it was typed.
    cwd: process.env.INIT_CWD ?? process.cwd(),
    root: repositoryRoot,
    env: process.env,
  },
): Promise<number> {
  const options = parseOptions(
    args,
    ["--pack-dir", "--branch"],
    ["--pack-dir", "--branch"],
  );
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }

  try {
    const { releases } = await distTag(
      resolve(context.cwd, options["--pack-dir"]),
      context.root,
      options["--branch"],
    );
    output.stdout(
      releases
        .map(({ name, version, from, tag }) =>
          from === tag
            ? `${name}@${version}: ${tag}\n`
            : `${name}@${version}: ${tag} (Changesets wrote ${from})\n`,
        )
        .join(""),
    );
    await appendSummary(
      context.env,
      `## Publish plan\n\n${formatReleases(releases)}\n`,
    );
    return 0;
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
