/**
 * `board:reconcile`: the Claim board's single writer. Reads every item of
 * the board and every open issue of both repositories, computes each
 * item's Status by the rules of `release/src/board.ts` and writes only the
 * differences, membership and archiving included; a board that already
 * agrees draws no request. The token is `PROJECT_TOKEN`, the maintainer's
 * classic token with the `project` scope (the secret `board.yml` holds),
 * else, locally, the `gh` login's; it says which. `--dry-run` prints the
 * plan and sends none. Exit codes: 0 applied (or planned), 1 the state
 * cannot be read (no project yet: `board:setup` first), no token, or a
 * request failed, 2 usage.
 */
import {
  applyBoardReconcile,
  BOARD_OWNER,
  BOARD_REPOSITORIES,
  BOARD_TITLE,
  describeRequest,
  planBoardReconcile,
  readReconcileState,
  type BoardReconcilePlan,
  type ReconcileState,
} from "../board.js";
import {
  appendSummary,
  errorMessage,
  ghOutput,
  gitHubApi,
  invokedDirectly,
  PROCESS_OUTPUT,
  runGh,
  type Gh,
  type Output,
} from "./common.js";

/** The environment variable that holds the token: the repository secret of the same name. */
export const TOKEN_VARIABLE = "PROJECT_TOKEN";

const USAGE =
  "Usage: board:reconcile [--dry-run]\n" +
  `  With the token in ${TOKEN_VARIABLE} (the maintainer's classic token, scope project), else the gh login's.\n`;

export interface Context {
  env: Readonly<Record<string, string | undefined>>;
  gh: Gh;
  fetcher: typeof fetch;
  /** The time the archive clock is read at. */
  now: () => Date;
}

/** The options of the arguments; `undefined` on a usage error. */
function parseArgs(args: readonly string[]): { dryRun: boolean } | undefined {
  if (args.length === 0) return { dryRun: false };
  if (args.length === 1 && args[0] === "--dry-run") return { dryRun: true };
  return undefined;
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

const plural = (count: number, one: string, many: string) =>
  `${String(count)} ${count === 1 ? one : many}`;

/** How many writes the plan holds: an add counts with the Status write that follows it. */
const writes = (plan: BoardReconcilePlan) =>
  plan.requests.reduce(
    (count, request) => count + (request.then === undefined ? 1 : 2),
    0,
  );

/** What was found and each request of the plan. */
function printPlan(
  output: Output,
  state: ReconcileState,
  plan: BoardReconcilePlan,
  dryRun: boolean,
): void {
  const { project, items, issues } = state;
  output.stdout(
    `Project "${BOARD_TITLE}" under ${BOARD_OWNER}: ${project.url} (number ${String(project.number)}).\n`,
  );
  const bots = issues.filter(({ bot }) => bot).length;
  output.stdout(
    `${plural(issues.length - bots, "open issue", "open issues")} of ${BOARD_REPOSITORIES.join(" and ")}` +
      `${bots === 0 ? "" : ` (and ${plural(bots, "bot's", "bots'")}, left out)`}; ` +
      `${plural(items.length, "item", "items")} on the board, ${String(items.filter(({ archived }) => archived).length)} archived.\n`,
  );
  output.stdout(`As they should be: ${plural(plan.kept, "item", "items")}.\n`);
  const count = plural(writes(plan), "request", "requests");
  output.stdout(dryRun ? `Dry run, ${count}, none sent:\n` : `${count}:\n`);
  for (const request of plan.requests) {
    output.stdout(`\n${describeRequest(request)}`);
    if (request.then !== undefined) {
      output.stdout(`\n${describeRequest(request.then)}`);
    }
  }
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    env: process.env,
    gh: runGh,
    fetcher: fetch,
    now: () => new Date(),
  },
): Promise<number> {
  const options = parseArgs(args);
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }

  try {
    const { token, source } = await tokenOf(context);
    const api = gitHubApi(
      context.fetcher,
      token,
      "reforged-ts-board-reconcile",
    );
    const state = await readReconcileState(api);
    output.stdout(`Token: ${source}, as ${state.viewer}.\n`);
    const plan = planBoardReconcile(state, context.now());
    printPlan(output, state, plan, options.dryRun);
    if (options.dryRun) return 0;

    const done: string[] = [];
    try {
      await applyBoardReconcile(api, plan, ({ summary }) => {
        done.push(summary);
        output.stdout(`Done: ${summary}\n`);
      });
    } finally {
      await appendSummary(
        context.env,
        "## Board reconcile\n\n" +
          `${plural(plan.kept, "item", "items")} as they should be; ` +
          `${plural(writes(plan), "request", "requests")}, ${String(done.length)} done.\n` +
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
