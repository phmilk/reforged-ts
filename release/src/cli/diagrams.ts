/**
 * `diagrams:generate` and `diagrams:check`: the generated diagrams (ADR
 * 0019). `generate` writes each diagram into its marked region of its doc,
 * and writes nothing when a region is missing, unknown or its markers are
 * broken. `check`, a Drift check, fails when a committed region differs
 * from what `generate` writes, is missing or is unknown, each failure
 * naming `pnpm diagrams:generate`; it writes nothing. Exit codes: 0 written
 * or in sync, 1 a problem or sources that cannot be read, 2 usage.
 */
import { DIAGRAMS } from "../diagram-list.js";
import {
  compareDiagrams,
  GENERATE_COMMAND,
  type Comparison,
  type Diagram,
} from "../diagrams.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  plural,
  PROCESS_OUTPUT,
  update,
  type Output,
} from "./common.js";

const USAGE = "Usage: diagrams generate|check\n";

/** The repository the command reads, and the diagrams it knows. */
export interface Context {
  root: string;
  diagrams: readonly Diagram[];
}

export const DEFAULT_CONTEXT: Context = {
  root: repositoryRoot,
  diagrams: DIAGRAMS,
};

const checklist = (comparison: Comparison) =>
  comparison.problems.map(({ message }) => `- [ ] ${message}\n`).join("");

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = DEFAULT_CONTEXT,
): Promise<number> {
  const [mode, ...rest] = args;
  if ((mode !== "generate" && mode !== "check") || rest.length > 0) {
    output.stderr(USAGE);
    return 2;
  }

  let comparison: Comparison;
  try {
    comparison = await compareDiagrams(context.root, context.diagrams);
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
  const regions = plural(comparison.regions, "region", "regions");

  if (mode === "check") {
    if (comparison.problems.length > 0) {
      output.stderr(
        `Diagrams drift: ${plural(comparison.problems.length, "problem", "problems")}. ` +
          `Run \`${GENERATE_COMMAND}\` and commit the result.\n\n${checklist(comparison)}`,
      );
      return 1;
    }
    output.stdout(
      `Diagrams match: ${regions} ${comparison.regions === 1 ? "is" : "are"} exactly what \`${GENERATE_COMMAND}\` writes.\n`,
    );
    return 0;
  }

  const unfixable = comparison.problems.filter(
    ({ kind }) => kind !== "changed",
  );
  if (unfixable.length > 0) {
    output.stderr(
      `Diagrams: ${plural(unfixable.length, "problem", "problems")} the generator cannot fix, so it wrote nothing.\n\n` +
        checklist({ ...comparison, problems: unfixable }),
    );
    return 1;
  }
  const written: string[] = [];
  for (const [path, text] of comparison.files) {
    if (await update(context.root, path, text)) written.push(path);
  }
  output.stdout(
    written.length === 0
      ? `No file changed: ${regions} ${comparison.regions === 1 ? "is" : "are"} what the generator writes.\n`
      : `Wrote ${written.join(", ")}.\n`,
  );
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
