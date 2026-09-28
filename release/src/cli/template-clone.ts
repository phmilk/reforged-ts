/**
 * `release:template-clone --pack-dir <dir> --into <dir>`: clones the
 * Template at the ref the release in the `changeset pack` output `<dir>` is
 * gated against (`v<major>` of the library version, as
 * `release:template-gate --print-ref` prints it) into a new folder, shallow.
 * The Template is public: git reads it without a token. Fails naming the
 * ref when the Template has no such ref, and saying so when git cannot read it.
 *
 * Clone outside the repository: a Template without its own
 * `pnpm-workspace.yaml` would otherwise be installed as part of this
 * workspace. Relative paths resolve against the folder the command was
 * started from. Exit codes: 0 cloned, 1 failed, 2 usage.
 */
import { resolve } from "node:path";
import { runGit, type GitRunner } from "../git.js";
import { cloneTemplate, TEMPLATE_REPOSITORY } from "../template-clone.js";
import { releaseTemplateRef } from "../template-gate.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  parseOptions,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: release:template-clone --pack-dir <dir> --into <dir>\n";

export interface Context {
  /** The folder relative paths resolve against. */
  cwd: string;
  /** The workspace, for the library version when the plan lacks it. */
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
    ["--pack-dir", "--into"],
    ["--pack-dir", "--into"],
  );
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }
  const into = resolve(context.cwd, options["--into"]);

  try {
    const ref = await releaseTemplateRef(
      resolve(context.cwd, options["--pack-dir"]),
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
