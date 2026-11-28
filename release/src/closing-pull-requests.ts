/**
 * An issue's Closing pull requests (GLOSSARY.md), the pull requests of its
 * own repository that close it when they merge: into the default branch
 * (`master`, the Template's `main`), those GitHub links to it by their
 * closing keywords (`closedByPullRequestsReferences`); into the Next branch,
 * where GitHub links none, those whose body's closing keywords name it, read
 * by `closing-keywords.ts` as the claim check and `next-close` read them.
 * The open ones into `next` come from the paginated list of the
 * repository's open pull requests based on it, the merged ones from
 * GitHub's issue search; a repository with no branch `next` has none.
 *
 * Its command, `pnpm closing-pull-requests <owner/name>#<n> [--json]`,
 * prints an issue's open and merged ones; with `--json` as one JSON object,
 * `answerJson`, the shape `ship-spec`'s `template-tickets.md` reads, so a
 * change to it changes that file in the same pull request.
 *
 * Self-contained on purpose, as `spec-frontier.ts` and the claim check
 * are, so that a script Node runs from source can import it: Node
 * built-ins, the self-contained `closing-keywords.ts`, and erasable syntax
 * only, so that Node runs it from a checkout with no install and no build:
 * `node release/src/closing-pull-requests.ts`. Its readers of a GraphQL
 * answer (`isRecord`, `at`, `nodesOf`), `errorMessage`, the GraphQL call,
 * the token and the "started directly" test are copied from
 * `spec-frontier.ts`. It only reads.
 */
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import {
  closingReferences,
  type IssueRef,
  NEXT_BRANCH,
} from "./closing-keywords.ts";

export type { IssueRef } from "./closing-keywords.ts";

/** A Closing pull request of an issue, as the module answers it. */
export interface ClosingPullRequest {
  /** `owner/name`: the issue's own repository. */
  repository: string;
  number: number;
  /** The branch it merges into: the default branch or `next`. */
  base: string;
  state: "open" | "merged";
  /** Whether it is a draft. */
  draft: boolean;
  /** Its merge commit when merged, else `null`. */
  mergeCommit: string | null;
}

/** Which Closing pull requests to read: the open ones, and the merged ones when `merged`. */
export interface ReadOptions {
  merged?: boolean;
}

/** A GitHub API answer: its status and its parsed JSON body. */
export interface ApiResponse {
  status: number;
  body: unknown;
}

/**
 * One request to the GitHub API, a `POST` of a GraphQL document to
 * `/graphql` under the API root; the release scripts' `GitHubApi` is one.
 */
export type Api = (request: {
  method: "POST";
  endpoint: string;
  body: unknown;
}) => Promise<ApiResponse>;

/** An answer the module cannot read, or an error GitHub answered. */
export class ClosingPullRequestsError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ClosingPullRequestsError";
  }
}

/** Whether a parsed JSON value is an object (not an array, not `null`). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The value at `keys` under `value`, descending through objects; `undefined` off the path. */
function at(value: unknown, ...keys: string[]): unknown {
  let current = value;
  for (const key of keys) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

/** The `nodes` of a GraphQL connection, or none. */
function nodesOf(connection: unknown): unknown[] {
  const nodes = at(connection, "nodes");
  return Array.isArray(nodes) ? (nodes as unknown[]) : [];
}

/** `ref` in full, `owner/name#n`. */
function fullRef(ref: IssueRef): string {
  return `${ref.repository}#${String(ref.number)}`;
}

/** The name of a document's operation (`query Linked(...)` gives `Linked`). */
function operationName(query: string): string {
  return /^\s*query\s+(\w+)/.exec(query)?.[1] ?? "The query";
}

/** The `data` of the GraphQL document `query`; GitHub answers errors with a 200 too. */
async function graphql(
  api: Api,
  query: string,
  variables: Readonly<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  const operation = operationName(query);
  const { status, body } = await api({
    method: "POST",
    endpoint: "/graphql",
    body: { query, variables },
  });
  if (status !== 200 || !isRecord(body)) {
    throw new ClosingPullRequestsError(
      `${operation} answered ${
        isRecord(body) && typeof body.message === "string"
          ? `${String(status)} ${body.message}`
          : String(status)
      }.`,
    );
  }
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const messages = (body.errors as unknown[]).map((error) =>
      isRecord(error) && typeof error.message === "string"
        ? error.message
        : JSON.stringify(error),
    );
    throw new ClosingPullRequestsError(
      `${operation} answered: ${messages.join("; ")}`,
    );
  }
  if (!isRecord(body.data)) {
    throw new ClosingPullRequestsError(`${operation} answered no data.`);
  }
  return body.data;
}

/** The fields of a pull request node every query reads. */
const PULL_REQUEST_FIELDS =
  "number state isDraft baseRefName mergeCommit { oid } repository { nameWithOwner }";

/** More pull requests than GitHub links to one issue: the query reads them in one page. */
const LINKED_PAGE = 50;

/**
 * The pull requests GitHub links to issue `$number` of `$owner/$name`, and
 * its branch `next`, `null` when it has none.
 * `includeClosedPrs: false` still answers merged ones.
 */
const LINKED_QUERY = `query ClosingPullRequests($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    ref(qualifiedName: "refs/heads/${NEXT_BRANCH}") { name }
    issue(number: $number) {
      closedByPullRequestsReferences(first: ${String(LINKED_PAGE)}, includeClosedPrs: false) {
        totalCount
        nodes { ${PULL_REQUEST_FIELDS} }
      }
    }
  }
}`;

/** A pull request node, or `undefined` when it is closed unmerged; an error when it cannot be read. */
function pullRequestOf(
  node: unknown,
  issue: IssueRef,
): ClosingPullRequest | undefined {
  const repository = at(node, "repository", "nameWithOwner");
  const number = at(node, "number");
  const state = at(node, "state");
  const base = at(node, "baseRefName");
  if (
    typeof repository !== "string" ||
    typeof number !== "number" ||
    typeof base !== "string" ||
    (state !== "OPEN" && state !== "MERGED" && state !== "CLOSED")
  ) {
    throw new ClosingPullRequestsError(
      `GitHub answered a pull request of ${fullRef(issue)} without a number, a state, a base and a repository.`,
    );
  }
  if (state === "CLOSED") return undefined;
  const oid = at(node, "mergeCommit", "oid");
  return {
    repository,
    number,
    base,
    state: state === "OPEN" ? "open" : "merged",
    draft: at(node, "isDraft") === true,
    mergeCommit: state === "MERGED" && typeof oid === "string" ? oid : null,
  };
}

/** `owner` and `name` of `repository`, `owner/name`. */
function ownerAndName(repository: string): { owner: string; name: string } {
  const slash = repository.indexOf("/");
  return {
    owner: repository.slice(0, slash),
    name: repository.slice(slash + 1),
  };
}

/** The pull requests one page of a list reads, GitHub's largest. */
const PULLS_PAGE = 100;

/** More pages than a list of pull requests fills: a guard against a cursor that never ends. */
const MAX_PAGES = 50;

/** The open pull requests of `$owner/$name` into `next`, a page at a time. */
const OPEN_INTO_NEXT_QUERY = `query OpenPullRequestsIntoNext($owner: String!, $name: String!, $first: Int!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    pullRequests(baseRefName: "${NEXT_BRANCH}", states: OPEN, first: $first, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes { ${PULL_REQUEST_FIELDS} body }
    }
  }
}`;

/** The pull requests GitHub's issue search answers to `$query`, a page at a time. */
const MERGED_INTO_NEXT_QUERY = `query MergedPullRequestsIntoNext($query: String!, $first: Int!, $cursor: String) {
  search(query: $query, type: ISSUE, first: $first, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes { ... on PullRequest { ${PULL_REQUEST_FIELDS} body } }
  }
}`;

/**
 * Every node of the connection at `path` of the answers to `query`, read
 * page after page with `$first` and `$cursor`.
 */
async function readPages(
  api: Api,
  query: string,
  variables: Readonly<Record<string, unknown>>,
  path: readonly string[],
): Promise<unknown[]> {
  const nodes: unknown[] = [];
  let cursor: string | null = null;
  for (let pages = 0; pages < MAX_PAGES; pages += 1) {
    const data = await graphql(api, query, {
      ...variables,
      first: PULLS_PAGE,
      cursor,
    });
    const connection = at(data, ...path);
    nodes.push(...nodesOf(connection));
    const next = at(connection, "pageInfo", "endCursor");
    if (
      at(connection, "pageInfo", "hasNextPage") !== true ||
      typeof next !== "string"
    ) {
      return nodes;
    }
    cursor = next;
  }
  throw new ClosingPullRequestsError(
    `${operationName(query)} answered more than ${String(MAX_PAGES)} pages.`,
  );
}

/** Whether two repositories, `owner/name`, are one: GitHub reads them in any case. */
function sameRepository(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * The Closing pull requests of `issue` through `api`: the open ones, and
 * the merged ones too with `merged`; those of its own repository only,
 * once each, ordered by number. Into the default branch, those GitHub
 * links to it; into `next`, when the repository has that branch, those
 * whose body's closing keywords name it: the open ones from the list of
 * the repository's open pull requests into `next`, the merged ones from
 * GitHub's issue search.
 */
export async function readClosingPullRequests(
  api: Api,
  issue: IssueRef,
  { merged = false }: ReadOptions = {},
): Promise<ClosingPullRequest[]> {
  const data = await graphql(api, LINKED_QUERY, {
    ...ownerAndName(issue.repository),
    number: issue.number,
  });
  const linked = at(
    data,
    "repository",
    "issue",
    "closedByPullRequestsReferences",
  );
  const linkedNodes = nodesOf(linked);
  const total = at(linked, "totalCount");
  if (typeof total !== "number" || total > linkedNodes.length) {
    throw new ClosingPullRequestsError(
      `${fullRef(issue)} has ${String(total)} linked pull requests, more than the ${String(linkedNodes.length)} read.`,
    );
  }
  const intoNextNodes: unknown[] = [];
  if (isRecord(at(data, "repository", "ref"))) {
    intoNextNodes.push(
      ...(await readPages(
        api,
        OPEN_INTO_NEXT_QUERY,
        ownerAndName(issue.repository),
        ["repository", "pullRequests"],
      )),
    );
    if (merged) {
      intoNextNodes.push(
        ...(await readPages(
          api,
          MERGED_INTO_NEXT_QUERY,
          {
            query: `repo:${issue.repository} is:pr is:merged base:${NEXT_BRANCH} ${String(issue.number)} in:body`,
          },
          ["search"],
        )),
      );
    }
  }
  /** The pull request of `node` when it is of the issue's repository and in a state asked. */
  const asked = (node: unknown): ClosingPullRequest | undefined => {
    const pullRequest = pullRequestOf(node, issue);
    return pullRequest !== undefined &&
      sameRepository(pullRequest.repository, issue.repository) &&
      (pullRequest.state === "open" || merged)
      ? pullRequest
      : undefined;
  };
  /** Whether the closing keywords of the body of `node`, into `next`, name the issue. */
  const bodyNamesIssue = (node: unknown, pullRequest: ClosingPullRequest) => {
    const body = at(node, "body");
    return (
      pullRequest.base === NEXT_BRANCH &&
      closingReferences(
        typeof body === "string" ? body : "",
        pullRequest.repository,
      ).some(
        (ref) =>
          sameRepository(ref.repository, issue.repository) &&
          ref.number === issue.number,
      )
    );
  };
  const found = new Map<number, ClosingPullRequest>();
  for (const node of linkedNodes) {
    const pullRequest = asked(node);
    if (pullRequest !== undefined) found.set(pullRequest.number, pullRequest);
  }
  for (const node of intoNextNodes) {
    const pullRequest = asked(node);
    if (pullRequest !== undefined && bodyNamesIssue(node, pullRequest)) {
      found.set(pullRequest.number, pullRequest);
    }
  }
  return [...found.values()].sort((a, b) => a.number - b.number);
}

// The command.

const USAGE =
  "Usage: node release/src/closing-pull-requests.ts <owner/name>#<n> [--json]\n";

/**
 * The answer of the command, as it prints it with `--json`: the issue and
 * its open and merged Closing pull requests. A contract with `ship-spec`'s
 * `template-tickets.md`: a change to its shape changes that file in the
 * same pull request.
 */
export interface AnswerJson {
  issue: IssueRef;
  pullRequests: ClosingPullRequest[];
}

/** The answer on `issue` as its JSON form, `AnswerJson`. */
export function answerJson(
  issue: IssueRef,
  pullRequests: readonly ClosingPullRequest[],
): AnswerJson {
  return {
    issue: { repository: issue.repository, number: issue.number },
    pullRequests: pullRequests.map((pullRequest) => ({ ...pullRequest })),
  };
}

/** The answer on `issue`, as the command prints it without `--json`. */
export function renderAnswer(
  issue: IssueRef,
  pullRequests: readonly ClosingPullRequest[],
): string {
  const lines = pullRequests.map((pullRequest) => {
    const state =
      pullRequest.state === "merged"
        ? `merged as ${pullRequest.mergeCommit ?? "an unknown commit"}`
        : pullRequest.draft
          ? "open, a draft"
          : "open";
    return `- #${String(pullRequest.number)} into ${pullRequest.base}, ${state}\n`;
  });
  return (
    `Closing pull requests of ${fullRef(issue)}, open and merged:\n` +
    (lines.length === 0 ? "- none\n" : lines.join(""))
  );
}

/**
 * The message of a caught error, or the thrown value as text, followed by
 * the chain of its causes: Node's `fetch` throws a bare "fetch failed" and
 * keeps the reason (`ECONNREFUSED`, a certificate error, ...) in `cause`.
 */
function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const causes: string[] = [];
  let cause: unknown = error.cause;
  while (cause !== undefined && causes.length < 5) {
    if (cause instanceof Error) {
      const code =
        "code" in cause && typeof cause.code === "string" ? cause.code : "";
      causes.push(
        code !== "" && !cause.message.includes(code)
          ? `${code}: ${cause.message}`
          : cause.message,
      );
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

/** How long one call to GitHub or to `gh` may take. */
const TIMEOUT_MS = 30_000;

/** The GitHub API at `base` as the holder of `token`, over `fetcher`. */
function gitHubApi(base: string, token: string, fetcher: typeof fetch): Api {
  return async ({ method, endpoint, body }) => {
    const response = await fetcher(`${base}${endpoint}`, {
      method,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "user-agent": "reforged-ts-closing-pull-requests",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    return { status: response.status, body: parsed };
  };
}

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export const PROCESS_OUTPUT: Output = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

export interface Context {
  env: Readonly<Record<string, string | undefined>>;
  fetcher: typeof fetch;
}

/** The variable's value when set and not empty. */
function variable(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string | undefined {
  const value = env[name];
  return value === undefined || value === "" ? undefined : value;
}

/**
 * The token, as `gh` picks it: `GH_TOKEN`, else `GITHUB_TOKEN`, else the
 * one of the `gh` login.
 */
async function tokenOf(context: Context): Promise<string> {
  const fromEnv =
    variable(context.env, "GH_TOKEN") ?? variable(context.env, "GITHUB_TOKEN");
  if (fromEnv !== undefined) return fromEnv;
  const what =
    "gh auth token (the token of the gh login, since GH_TOKEN and GITHUB_TOKEN are not set)";
  try {
    const token = (
      await promisify(execFile)("gh", ["auth", "token"], {
        encoding: "utf8",
        timeout: TIMEOUT_MS,
      })
    ).stdout.trim();
    if (token === "") throw new Error("it printed no token; run gh auth login");
    return token;
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
    throw new ClosingPullRequestsError(`${what} failed: ${reason}`);
  }
}

/** The flag that prints the answer as JSON, anywhere among the arguments. */
const JSON_FLAG = "--json";

/**
 * The issue and whether `--json` is among `args`, or `null` when they are
 * no usage: any other flag is none.
 */
function argumentsOf(
  args: readonly string[],
): { issue: IssueRef; json: boolean } | null {
  const positional = args.filter((arg) => arg !== JSON_FLAG);
  const match =
    positional.length === 1
      ? /^([\w.-]+\/[\w.-]+)#([1-9]\d*)$/.exec(positional[0] ?? "")
      : null;
  if (match === null) return null;
  return {
    issue: { repository: match[1], number: Number(match[2]) },
    json: positional.length < args.length,
  };
}

/**
 * Prints the open and merged Closing pull requests of issue `args[0]`
 * (`owner/name#n`), read with the token `GH_TOKEN`, else `GITHUB_TOKEN`,
 * else `gh auth token`, through the API at `GITHUB_API_URL`. With
 * `--json` among `args`, it prints `answerJson`'s object and a final
 * newline in place of the text; errors stay text on stderr, and stdout
 * holds nothing then. Exit codes: 0 an answer, 1 a state it cannot read,
 * 2 usage.
 */
export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { env: process.env, fetcher: fetch },
): Promise<number> {
  const target = argumentsOf(args);
  if (target === null) {
    output.stderr(USAGE);
    return 2;
  }
  try {
    const api = gitHubApi(
      (
        variable(context.env, "GITHUB_API_URL") ?? "https://api.github.com"
      ).replace(/\/+$/, ""),
      await tokenOf(context),
      context.fetcher,
    );
    const pullRequests = await readClosingPullRequests(api, target.issue, {
      merged: true,
    });
    output.stdout(
      target.json
        ? `${JSON.stringify(answerJson(target.issue, pullRequests), null, 2)}\n`
        : renderAnswer(target.issue, pullRequests),
    );
    return 0;
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
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
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
