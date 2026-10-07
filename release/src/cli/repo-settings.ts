/**
 * `repo:settings`: makes the repository match its committed settings (the
 * ruleset on master, the merge settings, the Pages source, the labels)
 * through the GitHub API, as the maintainer's `gh` authentication, which
 * must be an administrator of the repository. Reads the current state,
 * prints each request, then sends them; `--dry-run` sends none. The
 * repository is `--repo <owner/name>`, else the one `gh` resolves from the
 * working folder. Exit codes: 0 applied (or planned), 1 the state cannot be
 * read, the authentication is not an administrator or a request failed, 2
 * usage.
 */
import {
  applyRequests,
  isRepository,
  planRepositorySettings,
  readRepositoryState,
  readRuleset,
  RULESET_FILE,
  type ApiRequest,
} from "../repo-settings.js";
import { repositoryRoot } from "../workspace.js";
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

export type { Gh };

const USAGE = "Usage: repo:settings [--dry-run] [--repo <owner/name>]\n";

export interface Context {
  root: string;
  gh: Gh;
  fetcher: typeof fetch;
}

interface Options {
  dryRun: boolean;
  repository: string | null;
}

/** The options of the arguments; `undefined` on a usage error. */
function parseArgs(args: readonly string[]): Options | undefined {
  const parsed = parseRunArgs(args, ["--repo"]);
  if (parsed === undefined) return undefined;
  const repository = parsed.options["--repo"] ?? null;
  if (repository !== null && !isRepository(repository)) return undefined;
  return { dryRun: parsed.dryRun, repository };
}

/** One request for a person to read: what it does, the call, the body. */
function describeRequest({ method, endpoint, body, summary }: ApiRequest) {
  return `${summary}\n${method} ${endpoint}\n${JSON.stringify(body, null, 2)}\n`;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { root: repositoryRoot, gh: runGh, fetcher: fetch },
): Promise<number> {
  const options = parseArgs(args);
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }

  try {
    const ruleset = await readRuleset(context.root);
    const repository =
      options.repository ??
      (await ghOutput(
        context.gh,
        ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"],
        "the repository of the working folder; or pass --repo <owner/name>",
      ));
    if (!isRepository(repository)) {
      throw new Error(
        `gh named the repository "${repository}"; pass --repo <owner/name>.`,
      );
    }
    const token = await ghOutput(
      context.gh,
      ["auth", "token"],
      "the token of the gh authentication; run gh auth login",
    );
    const api = gitHubApi(context.fetcher, token, "reforged-ts-repo-settings");

    const state = await readRepositoryState(api, repository);
    const plan = planRepositorySettings(repository, ruleset, state);

    output.stdout(
      `${repository}: the gh authentication is an administrator. ` +
        `Ruleset from ${RULESET_FILE}.\n`,
    );
    printPlan(output, plan, describeRequest, options.dryRun);
    if (options.dryRun) return 0;

    output.stdout("\n");
    await applyRequests(api, plan.requests, ({ summary }) => {
      output.stdout(`Done: ${summary}\n`);
    });
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
