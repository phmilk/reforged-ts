/**
 * `board:labels`: the board's writer of the label pair of an open Spec
 * (ADR 0025). Reads every open issue of both repositories and gives each
 * open Spec the labels `specLabelsOf` derives, `needs-split` with no
 * sub-issue and `ready-for-agent` with one or more, writing only the
 * differences; Specs already right draw no request. The token is
 * `LABELS_TOKEN`, the App's installation token over both repositories that
 * `board.yml` mints, since `PROJECT_TOKEN` writes no label, else, locally,
 * the `gh` login's; it says which. `--dry-run` prints the plan and sends
 * none. Exit codes: 0 applied (or planned), 1 the state cannot be read, a
 * label missing from a repository, no token or a request failed, 2 usage.
 */
import {
  applyBoardLabels,
  BOARD_REPOSITORIES,
  describeRequest,
  planBoardLabels,
  readLabelState,
  SPEC_LABEL,
  type BoardLabelPlan,
} from "../board.js";
import {
  appendSummary,
  errorMessage,
  ghOutput,
  gitHubApi,
  invokedDirectly,
  parseRunArgs,
  plural,
  printPlan,
  PROCESS_OUTPUT,
  runGh,
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

/** The token and where it came from. */
async function tokenOf(
  context: Context,
): Promise<{ token: string; source: string }> {
  const fromEnv = context.env[TOKEN_VARIABLE];
  if (fromEnv !== undefined && fromEnv !== "") {
    return { token: fromEnv, source: TOKEN_VARIABLE };
  }
  return {
    token: await ghOutput(
      context.gh,
      ["auth", "token"],
      `the token of the gh authentication, since ${TOKEN_VARIABLE} is not set; run gh auth login`,
    ),
    source: `the gh login (${TOKEN_VARIABLE} is not set)`,
  };
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
    const { token, source } = await tokenOf(context);
    const api = gitHubApi(context.fetcher, token, "reforged-ts-board-labels");
    output.stdout(`Token: ${source}.\n`);
    const state = await readLabelState(api);
    let plan: BoardLabelPlan;
    try {
      plan = planBoardLabels(state);
    } catch (error) {
      // A label missing from a repository: the summary says which.
      await appendSummary(
        context.env,
        `## Board labels\n\n${errorMessage(error)}\n`,
      );
      throw error;
    }
    const specs = state.issues.filter(
      ({ repository, labels }) =>
        BOARD_REPOSITORIES.includes(repository) && labels.includes(SPEC_LABEL),
    ).length;
    output.stdout(
      `${plural(specs, "open Spec", "open Specs")} of ${BOARD_REPOSITORIES.join(" and ")}.\n` +
        `As they should be: ${plural(plan.kept, "Spec", "Specs")}.\n`,
    );
    printPlan(output, plan, describeRequest, parsed.dryRun);
    if (parsed.dryRun) return 0;

    const done: string[] = [];
    try {
      await applyBoardLabels(api, plan, ({ summary }) => {
        done.push(summary);
        output.stdout(`Done: ${summary}\n`);
      });
    } finally {
      await appendSummary(
        context.env,
        "## Board labels\n\n" +
          `${plural(plan.kept, "Spec as it should be", "Specs as they should be")}; ` +
          `${plural(plan.requests.length, "request", "requests")}, ${String(done.length)} done.\n` +
          `${done.map((summary) => `\n- ${summary}`).join("")}${done.length === 0 ? "" : "\n"}`,
      );
    }
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
