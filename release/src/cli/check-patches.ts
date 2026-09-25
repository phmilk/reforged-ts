/**
 * `release:check-patches`: fails when the `reforged.patch` fields of the
 * publishable packages disagree: a package names a Patch the Typings ship no
 * entry for, the library's is not the Typings' newest, or a package has
 * none. On failure it prints one line per problem. Exit codes: 0 pass, 1 a
 * problem or inputs that cannot be read, 2 usage.
 */
import { checkPatches, readPatchInputs } from "../check-patches.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: release:check-patches\n";

/** Where the command looks: the workspace root. */
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

  let input: Awaited<ReturnType<typeof readPatchInputs>>;
  try {
    input = await readPatchInputs(context.root);
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }

  const result = checkPatches(input);
  if (!result.ok) {
    output.stderr(
      result.problems.map((problem) => `${problem.message}\n`).join("") +
        "The bump rules and the reforged.patch field: docs/release.md#the-reforgedpatch-field.\n",
    );
    return 1;
  }
  output.stdout(
    `Every publishable package names a Patch the Typings ship an entry for, the library the newest (${String(result.newest)}): ` +
      `${result.patches.map(({ name, patch }) => `${name} ${String(patch)}`).join(", ")}.\n`,
  );
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
