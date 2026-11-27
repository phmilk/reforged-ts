/**
 * `release:template-gate --template <path> --pack-dir <dir> --branch <name>`:
 * installs the tarballs of the publish plan in the pack output of
 * `changeset pack` into the Template checkout as overrides in its
 * pnpm-workspace.yaml, then runs the Template's build in release mode, its
 * lint and its tests, then has the packed create-reforged-map make a Map
 * project from an archive of the checkout in a temporary folder, and checks
 * it; it stops at the first failure, naming the command. The plan's
 * create-reforged-map must download the Template ref of the Release channel
 * of the branch `<name>` the release runs from (`main` from `master`, `next`
 * from `next`, ADR 0031), the ref `release:template-clone` checks out.
 *
 * Relative paths resolve against the folder the command was started from.
 * Exit codes: 0 pass, 1 a command failed or the inputs cannot be read, 2
 * usage.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { CREATION_PACKAGE } from "../packages.js";
import { commandLine, runInherited, type Runner } from "../process.js";
import { readReleaseChannel } from "../release-channel.js";
import { runTemplateGate } from "../template-gate.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  parseOptions,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE =
  "Usage: release:template-gate --template <path> --pack-dir <dir> --branch <name>\n";

/** Where the command runs, and how it runs the Template's commands. */
export interface Context {
  /** The folder relative paths resolve against. */
  cwd: string;
  /**
   * The workspace, whose packages the Release channel reads, and whose
   * Creation CLI is packed when the plan lacks it.
   */
  root: string;
  run: Runner;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    // pnpm starts the script in release/; INIT_CWD is where it was typed.
    cwd: process.env.INIT_CWD ?? process.cwd(),
    root: repositoryRoot,
    run: spawnRunner(output),
  },
): Promise<number> {
  const options = parseOptions(
    args,
    ["--template", "--pack-dir", "--branch"],
    ["--template", "--pack-dir", "--branch"],
  );
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }

  try {
    const { templateRef } = await readReleaseChannel(
      options["--branch"],
      context.root,
    );
    const scratch = await mkdtemp(join(tmpdir(), "reforged-template-gate-"));
    const result = await runTemplateGate({
      template: resolve(context.cwd, options["--template"]),
      packDir: resolve(context.cwd, options["--pack-dir"]),
      root: context.root,
      templateRef,
      scratch,
      run: context.run,
    }).finally(() => rm(scratch, { recursive: true, force: true }));
    const packages = result.installed
      .map(({ name, version }) => `${name}@${version}`)
      .join(", ");
    if (!result.ok) {
      output.stderr(`${result.message}\nPacked packages: ${packages}.\n`);
      return 1;
    }
    output.stdout(
      `The Template builds, lints and passes its tests with ${packages}, and ${CREATION_PACKAGE} creates a Map project from it.\n`,
    );
    return 0;
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
}

/**
 * A `Runner` that spawns the command with the process's own output, after
 * printing it. On Windows `pnpm` is a `.cmd` shim, which only a shell
 * starts; the gate's pnpm arguments hold no spaces or shell characters.
 * git and node start without one, so the Creation CLI gets its description
 * as one argument.
 */
export function spawnRunner(output: Output): Runner {
  return (command) => {
    output.stdout(`> ${commandLine(command)}\n`);
    return runInherited(command, {
      shell: process.platform === "win32" && command.command === "pnpm",
    });
  };
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
