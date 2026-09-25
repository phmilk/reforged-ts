/**
 * `release:gate`: the major-changeset gate on the workspace. It takes no
 * arguments. The verdict goes to stdout, or to stderr when the gate fails;
 * when the environment variable `GITHUB_STEP_SUMMARY` names a file (a step
 * of GitHub Actions), a requirement and what is missing are appended to it
 * as the job summary. Exit codes: 0 pass, or missing artefacts reported in
 * pre mode; 1 missing artefacts for a stable version, or the inputs cannot
 * be read; 2 usage.
 */
import { appendFile } from "node:fs/promises";
import {
  formatGate,
  majorChangesetGate,
  type GateResult,
} from "../major-changeset-gate.js";
import { repositoryRoot } from "../workspace.js";
import { invokedDirectly, PROCESS_OUTPUT, type Output } from "./common.js";

const USAGE = "Usage: release:gate\n";

/** The environment variable GitHub Actions names the job summary in. */
export const SUMMARY_VARIABLE = "GITHUB_STEP_SUMMARY";

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

  let result: GateResult;
  try {
    result = await majorChangesetGate(context.root);
  } catch (error) {
    output.stderr(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }

  const text = formatGate(result);
  const summary = context.env[SUMMARY_VARIABLE];
  if (
    summary !== undefined &&
    summary !== "" &&
    result.requirement !== undefined
  ) {
    await appendFile(summary, `## Major-changeset gate\n\n${text}\n`);
  }
  if (result.verdict === "fail") {
    output.stderr(text);
    return 1;
  }
  output.stdout(text);
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
