/**
 * `builtins:check [--root <folder>]`: the drift gate, run by `pnpm check`
 * without the game. Emits every artefact from each committed index again
 * and fails on any difference, on an index of the wrong shape, on a Game
 * version without its provenance file and on `exports` that do not match
 * the Game versions (`../check.ts`). Exit codes: 0 in sync, 1 on a problem,
 * 2 on usage. A leading `--` is skipped, as `builtins:generate` does.
 */
import { resolve } from "node:path";
import { checkPackage } from "../check.js";
import { REGENERATE_COMMAND } from "../emit.js";
import {
  invokedDirectly,
  packageRoot,
  PROCESS_OUTPUT,
  type Output,
} from "./generate.js";

const USAGE = "Usage: builtins:check [--root <folder>]\n";

export async function main(
  args: readonly string[],
  output: Output,
  cwd: string = process.env.INIT_CWD ?? process.cwd(),
): Promise<number> {
  const rest = args[0] === "--" ? args.slice(1) : args;
  let root = packageRoot;
  if (rest.length === 2 && rest[0] === "--root") root = resolve(cwd, rest[1]);
  else if (rest.length > 0) {
    output.stderr(USAGE);
    return 2;
  }

  const result = await checkPackage(root);
  if (result.problems.length > 0) {
    output.stderr(
      `Built-in objects drift: ${String(result.problems.length)} ${
        result.problems.length === 1 ? "problem" : "problems"
      }. Run \`${REGENERATE_COMMAND}\` on the adopted Build, or fix the index, and commit the result.\n\n` +
        result.problems.map((problem) => `- [ ] ${problem}\n`).join(""),
    );
    return 1;
  }
  output.stdout(
    `Built-in objects match: ${String(result.compared)} artefacts of Game version ${result.gameVersions.join(", ")} are exactly what the committed index emits.\n`,
  );
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
