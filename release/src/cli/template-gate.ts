/**
 * `release:template-gate --template <path> --pack-dir <dir>`: installs the
 * tarballs of the publish plan in the pack output of `changeset pack` into
 * the Template checkout as overrides in its pnpm-workspace.yaml, then runs
 * the Template's build in release mode, its lint and its tests, then has the
 * packed create-reforged-map make a Map project from an archive of the
 * checkout in a temporary folder, and checks it; it stops at the first
 * failure, naming the command.
 *
 * `release:template-gate --print-ref --pack-dir <dir>` prints the Template
 * ref to check out for that release: `v<major>` of the library version the
 * plan publishes, else of the workspace's library.
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
import { releaseTemplateRef, runTemplateGate } from "../template-gate.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE =
  "Usage: release:template-gate --template <path> --pack-dir <dir>\n" +
  "       release:template-gate --print-ref --pack-dir <dir>\n";

/** Where the command runs, and how it runs the Template's commands. */
export interface Context {
  /** The folder relative paths resolve against. */
  cwd: string;
  /**
   * The workspace, for the library version and the creation CLI when the
   * plan lacks them.
   */
  root: string;
  run: Runner;
}

interface Options {
  template?: string;
  packDir?: string;
  printRef: boolean;
}

function parseArgs(args: readonly string[]): Options | undefined {
  const options: Options = { printRef: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--print-ref") {
      options.printRef = true;
      continue;
    }
    const value = args.at(i + 1);
    if (value === undefined || value === "" || value.startsWith("--")) {
      return undefined;
    }
    if (arg === "--template") options.template = value;
    else if (arg === "--pack-dir") options.packDir = value;
    else return undefined;
    i++;
  }
  const valid =
    options.packDir !== undefined &&
    (options.printRef
      ? options.template === undefined
      : options.template !== undefined);
  return valid ? options : undefined;
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
  const options = parseArgs(args);
  if (options?.packDir === undefined) {
    output.stderr(USAGE);
    return 2;
  }
  const packDir = resolve(context.cwd, options.packDir);

  try {
    if (options.printRef) {
      output.stdout(`${await releaseTemplateRef(packDir, context.root)}\n`);
      return 0;
    }

    const scratch = await mkdtemp(join(tmpdir(), "reforged-template-gate-"));
    const result = await runTemplateGate({
      template: resolve(context.cwd, String(options.template)),
      packDir,
      root: context.root,
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
 * git and node start without one, so the creation CLI gets its description
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
