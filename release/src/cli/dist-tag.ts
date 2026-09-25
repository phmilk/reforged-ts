/**
 * `release:dist-tag --pack-dir <dir>`: sets the npm dist-tag of every
 * package in the publish plan of the `changeset pack` output `<dir>`:
 * `next` while `.changeset/pre.json` is in pre mode, else what Changesets
 * wrote. Refuses a plan that publishes a package at `0.0.0`. Prints one
 * line per package; in GitHub Actions (`GITHUB_STEP_SUMMARY` set) the plan
 * also goes to the job summary as a table.
 *
 * Relative paths resolve against the folder the command was started from.
 * Exit codes: 0 done, 1 the plan cannot be read or is unversioned, 2 usage.
 */
import { appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { distTag, formatReleases } from "../dist-tag.js";
import { repositoryRoot } from "../workspace.js";
import { invokedDirectly, PROCESS_OUTPUT, type Output } from "./common.js";

const USAGE = "Usage: release:dist-tag --pack-dir <dir>\n";

export interface Context {
  /** The folder relative paths resolve against. */
  cwd: string;
  /** The workspace, for its pre state. */
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
  const [option, value] = args;
  if (args.length !== 2 || option !== "--pack-dir" || value === "") {
    output.stderr(USAGE);
    return 2;
  }

  try {
    const { releases } = await distTag(
      resolve(context.cwd, value),
      context.root,
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
    const summary = context.env.GITHUB_STEP_SUMMARY;
    if (summary !== undefined && summary !== "") {
      await appendFile(
        summary,
        `## Publish plan\n\n${formatReleases(releases)}\n`,
      );
    }
    return 0;
  } catch (error) {
    output.stderr(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
