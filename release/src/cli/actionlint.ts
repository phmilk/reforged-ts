/**
 * `actionlint [<actionlint arguments>]`: runs actionlint, at the version CI
 * runs, on the workflow files (with no arguments, every file under
 * `.github/workflows`), so a workflow edit is checked before it runs.
 * actionlint is downloaded on first use and cached under
 * `node_modules/.cache/actionlint`; nothing is installed globally. It checks
 * the shell of `run:` steps only when shellcheck is on the PATH, as it is
 * in CI. Exit codes: actionlint's own (0 no problem, 1 problems found, 2 bad
 * arguments, 3 fatal), or 1 when actionlint cannot be installed.
 */
import { join } from "node:path";
import {
  actionlintAsset,
  ACTIONLINT_VERSION,
  installActionlint,
  onPath,
  tarCommand,
  type ActionlintAsset,
  type Fetcher,
} from "../actionlint.js";
import { runInherited, type Runner } from "../process.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

export interface Context {
  /** The workspace, whose `node_modules/.cache` keeps the download. */
  root: string;
  /** The folder actionlint runs in, which its path arguments are relative to. */
  cwd: string;
  env: Readonly<Record<string, string | undefined>>;
  /** The archive for this machine; `undefined` when none is pinned. */
  asset: ActionlintAsset | undefined;
  fetcher: Fetcher;
  run: Runner;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    root: repositoryRoot,
    // pnpm starts the script in release/; INIT_CWD is where it was typed.
    cwd: process.env.INIT_CWD ?? process.cwd(),
    env: process.env,
    asset: actionlintAsset(process.platform, process.arch),
    fetcher: (url) => fetch(url),
    run: (command) => runInherited(command),
  },
): Promise<number> {
  const { asset } = context;
  if (asset === undefined) {
    output.stderr(
      `No actionlint ${ACTIONLINT_VERSION} build is pinned for ${process.platform} ${process.arch}: ` +
        "add its checksum to release/src/actionlint.ts, or install actionlint and run it from the repository root.\n",
    );
    return 1;
  }

  let installed: Awaited<ReturnType<typeof installActionlint>>;
  try {
    installed = await installActionlint({
      asset,
      cacheDir: join(context.root, "node_modules", ".cache", "actionlint"),
      fetcher: context.fetcher,
      run: context.run,
      tar: tarCommand(process.platform, context.env),
    });
  } catch (error) {
    installed = { ok: false, message: errorMessage(error) };
  }
  if (!installed.ok) {
    output.stderr(`${installed.message} Nothing was run.\n`);
    return 1;
  }

  if (!(await onPath("shellcheck", context.env.PATH, process.platform))) {
    output.stderr(
      "shellcheck is not on the PATH: the run: scripts are not checked here, CI checks them.\n",
    );
  }
  const code = await context.run({
    command: installed.path,
    // `pnpm actionlint -- <args>` passes the `--` on.
    args: args[0] === "--" ? args.slice(1) : args,
    cwd: context.cwd,
  });
  if (code === 0) {
    output.stdout(`actionlint ${asset.version}: no problem found.\n`);
  }
  return code;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
