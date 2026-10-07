/**
 * `board:setup`: makes the Claim board, a Projects (v2) project on the
 * owner's account, match its committed definition (`release/src/board.ts`:
 * the Status options, the three views, the README, the public visibility,
 * the links to both repositories) through the GitHub GraphQL API, as the
 * maintainer's `gh` authentication, which must be the owner's login and
 * hold the `project` scope. Reads the current state, prints each request,
 * then sends them, creating the project when none has the title.
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
  type BoardSetupPlan,
  type BoardState,
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

/** What was found, then the plan: what already matches and each request. */
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
