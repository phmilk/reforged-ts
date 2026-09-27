/**
 * `data:check`: the rename map of `reforged-ts` against its built
 * declarations and the site's docs tree. It takes no arguments and reads the
 * declarations as built (the root script builds the library first). Each
 * violation goes on its own line, to stderr when one fails the check, else
 * to stdout. A missing migration page is reported without failing while pre
 * mode is active, as `release:gate` does. Exit codes: 0 pass, or only
 * missing pages reported in pre mode; 1 a violation, or the inputs cannot
 * be read; 2 usage.
 */
import {
  dataCheckWorkspace,
  formatDataCheck,
  type DataCheckResult,
} from "../data-check.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: data:check\n";

/** Where the command looks: the repository. */
export interface Context {
  root: string;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { root: repositoryRoot },
): Promise<number> {
  if (args.length > 0) {
    output.stderr(USAGE);
    return 2;
  }

  let result: DataCheckResult;
  try {
    result = await dataCheckWorkspace(context.root);
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }

  const text = formatDataCheck(result, context.root);
  if (result.failing.length > 0) {
    output.stderr(text);
    return 1;
  }
  output.stdout(text);
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
