/**
 * `release:template-clone --branch <name> --into <dir>`: clones the
 * Template at the Template ref of the Release channel of the branch
 * `<name>` the release runs from (`main` from `master`, `next` from `next`,
 * ADR 0031) into a new folder, shallow. The Template is public: git reads
 * it without a token. Refuses a branch with no channel, fails naming the
 * ref when the Template has no such branch, and says so when git cannot
 * read it.
 *
 * Clone outside the repository: a Template without its own
 * `pnpm-workspace.yaml` would otherwise be installed as part of this
 * workspace. Relative paths resolve against the folder the command was
 * started from. Exit codes: 0 cloned, 1 failed, 2 usage.
 */
import { resolve } from "node:path";
import { runGit, type GitRunner } from "../git.js";
import { readReleaseChannel } from "../release-channel.js";
import { cloneTemplate, TEMPLATE_REPOSITORY } from "../template-clone.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  parseOptions,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: release:template-clone --branch <name> --into <dir>\n";

export interface Context {
  /** The folder relative paths resolve against. */
  cwd: string;
  /** The workspace, whose packages the Release channel reads. */
  root: string;
  git: GitRunner;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    // pnpm starts the script in release/; INIT_CWD is where it was typed.
    cwd: process.env.INIT_CWD ?? process.cwd(),
    root: repositoryRoot,
    git: runGit,
  },
): Promise<number> {
  const options = parseOptions(
    args,
    ["--branch", "--into"],
    ["--branch", "--into"],
  );
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }
  const into = resolve(context.cwd, options["--into"]);

  try {
    const { templateRef: ref } = await readReleaseChannel(
      options["--branch"],
      context.root,
    );
    const result = await cloneTemplate({
      ref,
      into,
      git: context.git,
    });
    if (!result.ok) {
      output.stderr(`${result.message}\n`);
      return 1;
    }
    output.stdout(`Cloned ${TEMPLATE_REPOSITORY} at ${ref} into ${into}.\n`);
    return 0;
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
