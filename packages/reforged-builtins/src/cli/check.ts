/**
 * `builtins:check [--write] [--root <folder>]`: the drift gate, without the
 * game. Emits every artefact from each committed index again and compares
 * it byte for byte with the committed file, validates each index's shape and
 * checks that each Game version has its provenance (`../check.ts`).
 * `--write` first writes the artefacts each valid index emits, for a change
 * of the emitter on a machine without the game, then checks. `--root` is the
 * package root by default. Exit codes: 0 in sync, 1 on any problem, 2 on a
 * bad argument. A leading `--` is skipped, as by `builtins:generate`.
 */
import { resolve } from "node:path";
import { checkArtefacts, writeArtefacts } from "../check.js";
import { REGENERATE_COMMAND } from "../emit.js";
import {
  invokedDirectly,
  packageRoot,
  PROCESS_OUTPUT,
  type Output,
} from "./generate.js";

const USAGE = "Usage: builtins:check [--write] [--root <folder>]\n";

export async function main(
  args: readonly string[],
  output: Output,
  cwd: string = process.env.INIT_CWD ?? process.cwd(),
): Promise<number> {
  let root = packageRoot;
  let write = false;
  for (let i = args[0] === "--" ? 1 : 0; i < args.length; i++) {
    const value = args.at(i + 1);
    if (args[i] === "--write") write = true;
    else if (args[i] === "--root" && value !== undefined) {
      root = resolve(cwd, value);
      i++;
    } else {
      output.stderr(USAGE);
      return 2;
    }
  }

  if (write) {
    for (const path of await writeArtefacts(root)) {
      output.stdout(`Wrote ${path}.\n`);
    }
  }
  const result = await checkArtefacts(root);
  if (result.problems.length > 0) {
    output.stderr(
      `Built-in objects drift: ${String(result.problems.length)} ${
        result.problems.length === 1 ? "problem" : "problems"
      }. Every artefact is emitted from its Game version's index, which ${REGENERATE_COMMAND} extracts from the game's install; never edit one by hand.\n\n` +
        result.problems.map((line) => `- [ ] ${line}\n`).join(""),
    );
    return 1;
  }
  output.stdout(
    `Built-in objects match: ${String(result.files)} files of Game version${
      result.gameVersions.length === 1 ? "" : "s"
    } ${result.gameVersions.join(", ")} are exactly what their index emits.\n`,
  );
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
