/**
 * `board:labels`: the board's writer of the label pair of an open Spec
 * (ADR 0025). Reads every open issue of both repositories and gives each
 * open Spec the labels `specLabelsOf` derives, `needs-split` with no
 * sub-issue and `ready-for-agent` with one or more, writing only the
 * differences; Specs already right draw no request. Then it comments the
 * coverage check's verdict on every open Spec whose Tickets are all closed,
 * by `spec-verdict.ts`, and closes nothing (#796); a Spec that fails is
 * reported and the others are still commented. The token is
 * `LABELS_TOKEN`, the App's installation token over both repositories that
 * `board.yml` mints, since `PROJECT_TOKEN` writes no label, else, locally,
 * the `gh` login's; it says which. `--dry-run` prints the plan and sends
 * none. Exit codes: 0 applied (or planned), 1 the state cannot be read, a
 * label missing from a repository, no token, a request failed or a Spec's
 * check could not run, 2 usage.
 */
import {
  applyBoardLabels,
  BOARD_REPOSITORIES,
  describeRequest,
  planBoardLabels,
  readLabelState,
  type BoardIssue,
  type BoardLabelPlan,
  type LabelState,
} from "../board.js";
import type { GitHubApi } from "../repo-settings.js";
import { applySpecVerdicts, planSpecVerdicts } from "../spec-verdict.js";
import {
  appendSummary,
  errorMessage,
  gitHubApi,
  invokedDirectly,
  parseRunArgs,
  plural,
  printPlan,
  PROCESS_OUTPUT,
  runGh,
  tokenFrom,
  type Gh,
  type Output,
} from "./common.js";

/** The environment variable that holds the token: the App's, minted by the workflow. */
export const TOKEN_VARIABLE = "LABELS_TOKEN";

const USAGE =
  "Usage: board:labels [--dry-run]\n" +
  `  With the token in ${TOKEN_VARIABLE} (the App's, over both repositories), else the gh login's.\n`;

export interface Context {
  env: Readonly<Record<string, string | undefined>>;
  gh: Gh;
  fetcher: typeof fetch;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { env: process.env, gh: runGh, fetcher: fetch },
): Promise<number> {
  const parsed = parseRunArgs(args);
  if (parsed === undefined) {
    output.stderr(USAGE);
    return 2;
  }

  try {
    const { token, source } = await tokenFrom(
      context.env,
      context.gh,
      TOKEN_VARIABLE,
    );
    const api = gitHubApi(context.fetcher, token, "reforged-ts-board-labels");
    output.stdout(`Token: ${source}.\n`);
    const state = await readLabelState(api);
    // Neither pass stops the other: each says what failed, and either
    // failing exits 1.
    const labels = await writeLabels(
      api,
      state,
      parsed.dryRun,
      output,
      context.env,
    );
    const verdicts = await commentVerdicts(
      api,
      state.issues,
      parsed.dryRun,
      output,
      context.env,
    );
    return Math.max(labels, verdicts);
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
}

/**
 * The label pair of each open Spec of `state`, written, or printed only on
 * a dry run. A label missing from a repository, or a request that fails,
 * is reported; resolves with 1 then, else 0.
 */
async function writeLabels(
  api: GitHubApi,
  state: LabelState,
  dryRun: boolean,
  output: Output,
  env: Readonly<Record<string, string | undefined>>,
): Promise<number> {
  let plan: BoardLabelPlan;
  try {
    plan = planBoardLabels(state);
  } catch (error) {
    // A label missing from a repository: the summary says which.
    await appendSummary(env, `## Board labels\n\n${errorMessage(error)}\n`);
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
  output.stdout(
    `${plural(plan.specs, "open Spec", "open Specs")} of ${BOARD_REPOSITORIES.join(" and ")}.\n` +
      `As they should be: ${plural(plan.kept, "Spec", "Specs")}.\n`,
  );
  printPlan(output, plan, describeRequest, dryRun);
  if (dryRun) return 0;
  const done: string[] = [];
  try {
    await applyBoardLabels(api, plan, ({ summary }) => {
      done.push(summary);
      output.stdout(`Done: ${summary}\n`);
    });
    return 0;
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  } finally {
    await appendSummary(
      env,
      "## Board labels\n\n" +
        `${plural(plan.kept, "Spec as it should be", "Specs as they should be")}; ` +
        `${plural(plan.requests.length, "request", "requests")}, ${String(done.length)} done.\n` +
        `${done.map((summary) => `\n- ${summary}`).join("")}${done.length === 0 ? "" : "\n"}`,
    );
  }
}

/**
 * The Spec verdicts, after the labels (#796): the coverage check of each
 * open Spec of `issues` whose Tickets are all closed, commented on it, or
 * printed only on a dry run. Says nothing when no Spec is there to check.
 * A Spec that fails is reported, and the others are still commented;
 * resolves with 1 when one failed, else 0.
 */
async function commentVerdicts(
  api: GitHubApi,
  issues: readonly BoardIssue[],
  dryRun: boolean,
  output: Output,
  env: Readonly<Record<string, string | undefined>>,
): Promise<number> {
  const plan = await planSpecVerdicts(api, issues);
  if (plan.specs === 0) return 0;
  const found =
    `${plural(plan.specs, "open Spec", "open Specs")} with every Ticket closed, ` +
    `${plural(plan.kept, "comment", "comments")} already right`;
  output.stdout(`Coverage check: ${found}.\n`);
  printPlan(output, plan, describeRequest, dryRun);
  const done: string[] = [];
  const failures = [...plan.failures];
  if (!dryRun) {
    failures.push(
      ...(await applySpecVerdicts(api, plan, ({ summary }) => {
        done.push(summary);
        output.stdout(`Done: ${summary}\n`);
      })),
    );
  }
  for (const failure of failures) output.stderr(`${failure}\n`);
  if (!dryRun) {
    const lines = [...done, ...failures];
    await appendSummary(
      env,
      `## Coverage check\n\n${found}; ` +
        `${plural(plan.requests.length, "request", "requests")}, ${String(done.length)} done; ` +
        `${plural(failures.length, "failure", "failures")}.\n` +
        `${lines.map((line) => `\n- ${line}`).join("")}${lines.length === 0 ? "" : "\n"}`,
    );
  }
  return failures.length === 0 ? 0 : 1;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
