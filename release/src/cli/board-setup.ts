/**
 * `board:setup`: makes the Claim board, a Projects (v2) project on the
 * owner's account, match its committed definition (`release/src/board.ts`:
 * the Status options, the three views, the README, the public visibility,
 * the links to both repositories) through the GitHub GraphQL API, as the
 * maintainer's `gh` authentication, which must be the owner's login and
 * hold the `project` scope. Reads the current state, prints each request,
 * then sends them, creating the project when none has the title. A
 * built-in workflow whose state differs from the definition is no request,
 * since the API cannot set it: each is named on a `By hand: ` line, under
 * the page to set it on.
 * `--dry-run` sends none and, when GitHub cannot be read (no gh, no login,
 * no scope), prints the plan that creates everything, with a note, so that
 * it never needs the token. Exit codes: 0 applied (or planned), 1 the state
 * cannot be read, the login is not the owner's or a request failed, 2
 * usage.
 */
import {
  applyBoardSetup,
  assumedState,
  BOARD_OWNER,
  BOARD_TITLE,
  describeRequest,
  planBoardSetup,
  readBoardState,
  workflowSteps,
  type BoardSetupPlan,
  type BoardState,
  type ProjectState,
} from "../board.js";
import {
  errorMessage,
  ghOutput,
  gitHubApi,
  invokedDirectly,
  parseRunArgs,
  printPlan,
  PROCESS_OUTPUT,
  runGh,
  type Gh,
  type Output,
} from "./common.js";

const USAGE =
  "Usage: board:setup [--dry-run]\n" +
  `  As the gh login of ${BOARD_OWNER}, holding the project scope (gh auth refresh -s project).\n`;

export interface Context {
  gh: Gh;
  fetcher: typeof fetch;
}

/**
 * The steps only a hand can take on `project`, each on a line the
 * repository-setup wizard reads by its `By hand: ` prefix, under the page
 * to take them on; nothing when there is none.
 */
function printByHand(
  output: Output,
  project: ProjectState,
  steps: readonly string[],
): void {
  if (steps.length === 0) return;
  output.stdout(
    `Built-in workflows, which the API cannot turn on or off: set by hand on ${project.url}/workflows\n`,
  );
  for (const step of steps) output.stdout(`By hand: ${step}\n`);
}

/**
 * What was found, then the plan: what already matches and each request. A
 * dry run names the hand steps before them; a real run names them last,
 * once the project it may have created is read.
 */
function printSetupPlan(
  output: Output,
  state: BoardState,
  plan: BoardSetupPlan,
  dryRun: boolean,
): void {
  output.stdout(
    state.project === null
      ? `No project "${BOARD_TITLE}" under ${BOARD_OWNER}: the plan creates it.\n`
      : `Project "${BOARD_TITLE}" under ${BOARD_OWNER}: ${state.project.url} (number ${String(state.project.number)}).\n`,
  );
  if (dryRun && state.project !== null) {
    printByHand(output, state.project, plan.byHand);
  }
  printPlan(output, plan, describeRequest, dryRun);
}

/** The dry run's answer when GitHub cannot be read: the plan that creates everything. */
function printAssumedPlan(output: Output, reason: unknown): number {
  output.stderr(
    "Note: GitHub could not be read, so the plan below assumes that no " +
      `project exists. ${errorMessage(reason)}\n`,
  );
  const state = assumedState();
  printSetupPlan(output, state, planBoardSetup(state), true);
  return 0;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { gh: runGh, fetcher: fetch },
): Promise<number> {
  const options = parseRunArgs(args);
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }

  try {
    let token: string;
    try {
      token = await ghOutput(
        context.gh,
        ["auth", "token"],
        "the token of the gh authentication; run gh auth login",
      );
    } catch (error) {
      if (!options.dryRun) throw error;
      return printAssumedPlan(output, error);
    }
    const api = gitHubApi(context.fetcher, token, "reforged-ts-board-setup");

    let state: BoardState;
    try {
      state = await readBoardState(api);
    } catch (error) {
      if (!options.dryRun) throw error;
      return printAssumedPlan(output, error);
    }
    if (state.viewer !== BOARD_OWNER) {
      const who = `The gh authentication is ${state.viewer}, not the owner ${BOARD_OWNER}, and only the owner writes the board.`;
      if (!options.dryRun) {
        throw new Error(
          `${who} Run it as ${BOARD_OWNER} (gh auth login, or gh auth switch to that account).`,
        );
      }
      output.stderr(`Note: ${who} A real run stops here.\n`);
    }

    const plan = planBoardSetup(state);
    printSetupPlan(output, state, plan, options.dryRun);
    if (options.dryRun) return 0;

    output.stdout("\n");
    const project = await applyBoardSetup(api, state, plan, ({ summary }) => {
      output.stdout(`Done: ${summary}\n`);
    });
    printByHand(output, project, workflowSteps(project.workflows));
    output.stdout(`The board: ${project.url}\n`);
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
