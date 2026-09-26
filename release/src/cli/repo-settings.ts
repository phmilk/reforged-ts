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
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  applyRequests,
  isRepository,
  planRepositorySettings,
  readRepositoryState,
  readRuleset,
  RULESET_FILE,
  type ApiRequest,
  type GitHubApi,
} from "../repo-settings.js";
import { isRecord } from "../unknown.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: repo:settings [--dry-run] [--repo <owner/name>]\n";

/** Runs `gh` with `args` and resolves with its standard output. */
export type Gh = (args: readonly string[]) => Promise<string>;

export interface Context {
  root: string;
  gh: Gh;
  fetcher: typeof fetch;
}

const API_ROOT = "https://api.github.com";

const runGh: Gh = async (args) =>
  (await promisify(execFile)("gh", args, { encoding: "utf8" })).stdout;

interface Options {
  dryRun: boolean;
  repository: string | null;
}

/** The options of the arguments; `undefined` on a usage error. */
function parseArgs(args: readonly string[]): Options | undefined {
  const options: Options = { dryRun: false, repository: null };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    const value = args.at(i + 1);
    if (arg !== "--repo" || options.repository !== null) return undefined;
    if (value === undefined || !isRepository(value)) return undefined;
    options.repository = value;
    i++;
  }
  return options;
}

/** `gh`'s output for `args`, or an error naming what it was for. */
async function ghOutput(
  gh: Gh,
  args: readonly string[],
  what: string,
): Promise<string> {
  try {
    return (await gh(args)).trim();
  } catch (error) {
    // execFile's message repeats the command line; its stderr says why.
    const reason =
      isRecord(error) && error.code === "ENOENT"
        ? "gh is not installed (https://cli.github.com)"
        : isRecord(error) &&
            typeof error.stderr === "string" &&
            error.stderr.trim() !== ""
          ? error.stderr.trim()
          : errorMessage(error).trim();
    throw new Error(`gh ${args.join(" ")} (${what}) failed: ${reason}`, {
      cause: error,
    });
  }
}

/** The GitHub API as the holder of `token`, over `fetcher`. */
function gitHubApi(fetcher: typeof fetch, token: string): GitHubApi {
  return async ({ method, endpoint, body }) => {
    const response = await fetcher(`${API_ROOT}${endpoint}`, {
      method,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
        "user-agent": "reforged-ts-repo-settings",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    let parsed: unknown = null;
    if (text !== "") {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    return { status: response.status, body: parsed };
  };
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
    const api = gitHubApi(context.fetcher, token);

    const state = await readRepositoryState(api, repository);
    const plan = planRepositorySettings(repository, ruleset, state);

    output.stdout(
      `${repository}: the gh authentication is an administrator. ` +
        `Ruleset from ${RULESET_FILE}.\n`,
    );
    for (const line of plan.unchanged) output.stdout(`Already set: ${line}\n`);
    const count = `${String(plan.requests.length)} ${plan.requests.length === 1 ? "request" : "requests"}`;
    output.stdout(
      options.dryRun ? `Dry run, ${count}, none sent:\n` : `${count}:\n`,
    );
    for (const request of plan.requests) {
      output.stdout(`\n${describeRequest(request)}`);
    }
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
