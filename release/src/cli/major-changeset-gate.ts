/**
 * `release:gate`: the major-changeset gate on the workspace, for the
 * library and for `reforged-builtins`. It takes no arguments. The verdict
 * goes to stdout, or to stderr when the gate fails; when the environment
 * variable `GITHUB_STEP_SUMMARY` names a file (a step of GitHub Actions), a
 * requirement and what is missing are appended to it as the job summary.
 * Exit codes: 0 pass, or missing artefacts reported in pre mode; 1 missing
 * artefacts for a stable version, or the inputs cannot be read; 2 usage.
 */
import { builtinsGate } from "../builtins-gate.js";
import {
  formatGate,
  majorChangesetGate,
  type GateResult,
} from "../major-changeset-gate.js";
import { repositoryRoot } from "../workspace.js";
import {
  appendSummary,
  errorMessage,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: release:gate\n";

/** Where the command looks: the repository and the environment. */
export interface Context {
  root: string;
  env: Readonly<Record<string, string | undefined>>;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { root: repositoryRoot, env: process.env },
): Promise<number> {
  if (args.length > 0) {
    output.stderr(USAGE);
    return 2;
  }

  let results: GateResult[];
  try {
    const library = await majorChangesetGate(context.root);
    const builtins = await builtinsGate(context.root);
    // The package's gate is shown only when it requires something.
    results =
      builtins.requirement === undefined ? [library] : [library, builtins];
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }

  const text = results.map((result) => formatGate(result)).join("\n");
  if (results.some((result) => result.requirement !== undefined)) {
    await appendSummary(context.env, `## Major-changeset gate\n\n${text}\n`);
  }
  if (results.some((result) => result.verdict === "fail")) {
    output.stderr(text);
    return 1;
  }
  output.stdout(text);
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
