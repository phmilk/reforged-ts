/**
 * The issues a push to the Next branch closes, the logic of the `find` job
 * of `.github/workflows/next-close.yml`. GitHub closes an issue from a pull
 * request's closing keywords only when it merges into the default branch;
 * on a push to `next`, this script finds the pull request the push merged
 * (the one into `next` whose merge commit is the pushed commit), reads the
 * closing keywords of its body as `closing-keywords.ts` does, and writes
 * to the step outputs `pull-request`, its number, and `issues`, the open
 * issues of this repository it names, space-separated, both empty when
 * there is none. The `close` job closes them with the App. An issue of
 * another repository, which the App's token here cannot write, is named in
 * the job summary only. docs/release.md, "Closing a Ticket delivered on
 * `next`", describes it.
 *
 * Self-contained on purpose, as the claim check is: Node built-ins, the
 * self-contained `closing-keywords.ts`, and erasable syntax only, so that
 * Node runs it from a checkout with no install and no build, as the
 * workflow does: `node release/src/next-close.ts`. `isRecord`,
 * `errorMessage`, the API call, the job summary, the step outputs and the
 * "started directly" test are copied from the claim check.
 */
import { appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { closingReferences } from "./closing-keywords.ts";

/** The Next branch, whose merged pull requests this script reads. */
export const NEXT_BRANCH = "next";

/**
 * The pull requests into `next` read, the most recently updated first: the
 * one a push merged was updated by that merge, moments before the run.
 */
const PULLS_PAGE = 100;

/** An error that stops the script with a message and exit code 1. */
export class NextCloseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "NextCloseError";
  }
}

/** Whether a parsed JSON value is an object (not an array, not `null`). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The message of a caught error, or the thrown value as text, followed by
 * the chain of its causes: Node's `fetch` throws a bare "fetch failed" and
 * keeps the reason in `cause`.
 */
function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const causes: string[] = [];
  let cause: unknown = error.cause;
  while (cause !== undefined && causes.length < 5) {
    if (cause instanceof Error) {
      causes.push(cause.message);
      cause = cause.cause;
    } else {
      causes.push(typeof cause === "string" ? cause : JSON.stringify(cause));
      break;
    }
  }
  return causes.length === 0
    ? error.message
    : `${error.message} (${causes.join("; ")})`;
}

/** A GitHub API answer: its status and its parsed JSON body (`null` when empty). */
interface ApiResponse {
  status: number;
  body: unknown;
}

/** A `GET` of a REST path of the GitHub API, as the token's holder. */
type Api = (path: string) => Promise<ApiResponse>;

/** The GitHub API at `base` as the holder of `token`, over `fetcher`. */
function gitHubApi(base: string, token: string, fetcher: typeof fetch): Api {
  return async (path) => {
    const response = await fetcher(`${base}${path}`, {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
        "user-agent": "reforged-ts-next-close",
      },
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

/** The body of a `GET` of `path` that must answer one of `accepted`. */
async function get(
  api: Api,
  path: string,
  accepted: readonly number[] = [200],
): Promise<ApiResponse> {
  const response = await api(path);
  if (!accepted.includes(response.status)) {
    const { status, body } = response;
    const message =
      isRecord(body) && typeof body.message === "string"
        ? `${String(status)} ${body.message}`
        : String(status);
    throw new NextCloseError(`GET ${path} answered ${message}.`);
  }
  return response;
}

/** The pull request a push merged into `next`, as the script reads it. */
export interface MergedPullRequest {
  number: number;
  /** Its description, Markdown; empty when it has none. */
  body: string;
}

/**
 * The pull request of `pulls`, a listing of the closed pull requests into
 * `next`, that merged as commit `sha`; `null` when none did (a push made
 * without a pull request).
 */
export function mergedPullRequest(
  pulls: unknown,
  sha: string,
): MergedPullRequest | null {
  if (!Array.isArray(pulls)) {
    throw new NextCloseError("The pull requests into next are no list.");
  }
  for (const pull of pulls) {
    if (
      !isRecord(pull) ||
      pull.merged_at === null ||
      pull.merge_commit_sha !== sha
    ) {
      continue;
    }
    if (typeof pull.number !== "number") {
      throw new NextCloseError(
        `The pull request merged as ${sha} has no number.`,
      );
    }
    return {
      number: pull.number,
      body: typeof pull.body === "string" ? pull.body : "",
    };
  }
  return null;
}

/** What one run found: the pull request, the issues to close and the summary lines. */
export interface Found {
  pullRequest: number | null;
  issues: number[];
  summary: string[];
}

/**
 * The issues of `repository` that the pull request the push of `sha` into
 * `next` merged names in its closing keywords and that are open, read
 * through `api`.
 */
async function find(api: Api, repository: string, sha: string): Promise<Found> {
  const pulls = await get(
    api,
    `/repos/${repository}/pulls?state=closed&base=${NEXT_BRANCH}&sort=updated&direction=desc&per_page=${String(PULLS_PAGE)}`,
  );
  const pullRequest = mergedPullRequest(pulls.body, sha);
  if (pullRequest === null) {
    return {
      pullRequest: null,
      issues: [],
      summary: [
        `- ${sha} merged no pull request into ${NEXT_BRANCH}: nothing to close.`,
      ],
    };
  }
  const summary = [
    `- #${String(pullRequest.number)} merged into ${NEXT_BRANCH} as ${sha}.`,
  ];
  const issues: number[] = [];
  for (const ref of closingReferences(pullRequest.body, repository)) {
    if (ref.repository !== repository) {
      summary.push(
        `- ${ref.repository}#${String(ref.number)}: an issue of another repository; close it by hand.`,
      );
      continue;
    }
    const name = `#${String(ref.number)}`;
    const { status, body } = await get(
      api,
      `/repos/${repository}/issues/${String(ref.number)}`,
      [200, 404, 410],
    );
    if (status !== 200 || !isRecord(body)) {
      summary.push(`- ${name}: no such issue; skipped.`);
    } else if (body.pull_request !== undefined) {
      summary.push(`- ${name}: a pull request; it closes nothing.`);
    } else if (body.state !== "open") {
      summary.push(`- ${name}: already closed.`);
    } else {
      summary.push(`- ${name}: open; to close.`);
      issues.push(ref.number);
    }
  }
  return { pullRequest: pullRequest.number, issues, summary };
}

/** Where the script writes. */
export interface Output {
  stdout(text: string): void;
  stderr(text: string): void;
}

export const PROCESS_OUTPUT: Output = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

/** What the script reads: the environment and the network. */
export interface Context {
  env: Readonly<Record<string, string | undefined>>;
  fetcher: typeof fetch;
}

/** The variable's value when set and not empty. */
function variable(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string {
  const value = env[name];
  if (value === undefined || value === "") {
    throw new NextCloseError(`${name} is not set.`);
  }
  return value;
}

/** Appends `text` to the job summary, when the runner names one. */
async function appendSummary(
  env: Readonly<Record<string, string | undefined>>,
  text: string,
): Promise<void> {
  const path = env.GITHUB_STEP_SUMMARY;
  if (path !== undefined && path !== "") await appendFile(path, text);
}

/**
 * Finds the issues the push of `GITHUB_SHA` to `next` closes in
 * `GITHUB_REPOSITORY`, with `GITHUB_TOKEN`, through the API at
 * `GITHUB_API_URL`; writes a line per issue, or the error that stopped it,
 * to the job summary, and the outputs `pull-request` and `issues` to
 * `GITHUB_OUTPUT`. Exit codes: 0 found (none, maybe), 1 an error.
 */
export async function main(
  output: Output,
  context: Context = { env: process.env, fetcher: fetch },
): Promise<number> {
  const { env } = context;
  try {
    const token = variable(env, "GITHUB_TOKEN");
    const repository = variable(env, "GITHUB_REPOSITORY");
    if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) {
      throw new NextCloseError(
        "GITHUB_REPOSITORY does not name a repository as owner/name.",
      );
    }
    const sha = variable(env, "GITHUB_SHA");
    const outputs = variable(env, "GITHUB_OUTPUT");
    const base = (env.GITHUB_API_URL ?? "https://api.github.com").replace(
      /\/+$/,
      "",
    );
    const found = await find(
      gitHubApi(base, token, context.fetcher),
      repository,
      sha,
    );
    for (const line of found.summary) output.stdout(`${line}\n`);
    await appendFile(
      outputs,
      `pull-request=${found.pullRequest === null ? "" : String(found.pullRequest)}\nissues=${found.issues.join(" ")}\n`,
    );
    await appendSummary(
      env,
      `## Issues to close\n\n${found.summary.join("\n")}\n`,
    );
    return 0;
  } catch (error) {
    const message = errorMessage(error);
    output.stderr(`${message}\n`);
    await appendSummary(env, `## Issues to close\n\n- ${message}\n`);
    return 1;
  }
}

/** Whether the module at `moduleUrl` is the script Node was started with. */
function invokedDirectly(moduleUrl: string): boolean {
  const script = process.argv.at(1);
  return (
    script !== undefined && pathToFileURL(resolve(script)).href === moduleUrl
  );
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(PROCESS_OUTPUT);
}
