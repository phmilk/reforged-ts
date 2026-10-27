/**
 * The Frontier query, `pnpm spec:frontier <spec> [owner/name]`: what the
 * `gh` login can do on a Spec now (#737, "The Frontier query"). It prints
 * three lists of the Spec's open Tickets, in either Board repository: those
 * the login may take (no open blocker, no assignee other than itself), those
 * it holds, with their open pull requests, and those other logins hold. The
 * skill hook, `next-step` and `ship-spec` ask it, so that they agree on the
 * Frontier. `frontierOf` is pure: the fetched Spec and the login in, the
 * three lists out. `main` reads the Spec through the GitHub GraphQL API, the
 * login being the token's, and prints them.
 *
 * Self-contained on purpose, as the claim check: Node built-ins only and
 * erasable syntax only (no enum, no namespace, no parameter property), so
 * that Node 24 runs it from a checkout with no install and no build, as the
 * hook does: `node release/src/spec-frontier.ts <spec> [owner/name]`.
 * Nothing is imported from the other release scripts, since Node maps no
 * `.js` specifier to a `.ts` file: `isRecord`, `errorMessage`, the GraphQL
 * call and the "started directly" test are copied from them.
 */
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const USAGE = "Usage: node release/src/spec-frontier.ts <spec> [owner/name]\n";

/** An issue a Ticket is blocked by, as the query read it. */
export interface Blocker {
  /** `owner/name`: a blocker may be of any repository. */
  repository: string;
  number: number;
  state: "OPEN" | "CLOSED";
}

/** A pull request that closes a Ticket. */
export interface PullRequestRef {
  /** `owner/name`. */
  repository: string;
  number: number;
}

/** A Ticket of the Spec, one of its sub-issues, as the query read it. */
export interface FetchedTicket {
  /** `owner/name`. */
  repository: string;
  number: number;
  title: string;
  state: "OPEN" | "CLOSED";
  /** The logins assigned to it, in GitHub's order. */
  assignees: readonly string[];
  /** The issues it is blocked by, open or closed. */
  blockers: readonly Blocker[];
  /** The open pull requests that close it. */
  pullRequests: readonly PullRequestRef[];
}

/** The Spec as the query read it, with its Tickets in GitHub's order. */
export interface FetchedSpec {
  /** `owner/name`. */
  repository: string;
  number: number;
  title: string;
  state: "OPEN" | "CLOSED";
  /** Whether it is labelled `spec`. */
  spec: boolean;
  tickets: readonly FetchedTicket[];
}

/** What a login can do on a Spec now: three lists of its open Tickets, in GitHub's order. */
export interface Frontier {
  login: string;
  /**
   * The Tickets the login may take: no open blocker and no assignee other
   * than the login, so one it holds alone is among them.
   */
  takeable: FetchedTicket[];
  /** The Tickets the login holds, alone or paired, blocked or not. */
  held: FetchedTicket[];
  /** The Tickets other logins hold, the login not among them. */
  heldByOthers: FetchedTicket[];
}

/**
 * The repositories the Claim board spans, as `owner/name`: a sub-issue of
 * another repository is no Ticket of the Frontier. A copy of
 * `BOARD_REPOSITORIES` of `board.ts`, since this script imports nothing; a
 * test holds them equal.
 */
export const BOARD_REPOSITORIES: readonly string[] = [
  "phmilk/reforged-ts",
  "phmilk/reforged-ts-template",
];

/** The label of a Spec, as `to-spec` and `write-spec` set it. */
export const SPEC_LABEL = "spec";

/**
 * The three lists of the Frontier query for `login` on `spec`, over its
 * open Tickets in the Board repositories; a closed Ticket is in none. A
 * Ticket blocked by an open issue, of any repository, is not takeable.
 */
export function frontierOf(spec: FetchedSpec, login: string): Frontier {
  const open = spec.tickets.filter(
    (ticket) =>
      ticket.state === "OPEN" && BOARD_REPOSITORIES.includes(ticket.repository),
  );
  return {
    login,
    takeable: open.filter(
      (ticket) =>
        ticket.blockers.every((blocker) => blocker.state !== "OPEN") &&
        ticket.assignees.every((assignee) => assignee === login),
    ),
    held: open.filter((ticket) => ticket.assignees.includes(login)),
    heldByOthers: open.filter(
      (ticket) =>
        ticket.assignees.length > 0 && !ticket.assignees.includes(login),
    ),
  };
}

/** `#n` in the Spec's repository `home`, else `owner/name#n`. */
function reference(home: string, repository: string, number: number): string {
  return repository === home
    ? `#${String(number)}`
    : `${repository}#${String(number)}`;
}

/** The lines of one list: one per Ticket, or `- none`. */
function list(
  tickets: readonly FetchedTicket[],
  line: (ticket: FetchedTicket) => string,
): string {
  return tickets.length === 0
    ? "- none\n"
    : tickets.map((ticket) => `- ${line(ticket)}\n`).join("");
}

/** The Frontier of `spec` for its login, as `main` prints it. */
export function renderFrontier(spec: FetchedSpec, frontier: Frontier): string {
  const { login } = frontier;
  const ref = (ticket: { repository: string; number: number }): string =>
    reference(spec.repository, ticket.repository, ticket.number);
  const head = (ticket: FetchedTicket): string =>
    `${ref(ticket)} ${ticket.title}`;
  const unsplit =
    spec.tickets.length === 0
      ? `#${String(spec.number)} has no Ticket: it is not split yet.\n`
      : "";
  return (
    `Spec #${String(spec.number)} of ${spec.repository}, "${spec.title}", for @${login}.\n` +
    unsplit +
    `\nTakeable now (open, no open blocker, no assignee but @${login}):\n` +
    list(frontier.takeable, (ticket) =>
      ticket.assignees.includes(login)
        ? `${head(ticket)} (held by @${login})`
        : head(ticket),
    ) +
    `\nHeld by @${login}:\n` +
    list(frontier.held, (ticket) =>
      ticket.pullRequests.length === 0
        ? `${head(ticket)}: no open pull request`
        : `${head(ticket)}: ${ticket.pullRequests.map((pullRequest) => `pull request ${ref(pullRequest)}`).join(", ")}`,
    ) +
    "\nHeld by other logins:\n" +
    list(
      frontier.heldByOthers,
      (ticket) =>
        `${head(ticket)}: ${ticket.assignees.map((assignee) => `@${assignee}`).join(", ")}`,
    )
  );
}

// The GitHub API: reading the Spec.

/** Configuration the script cannot use, or an answer it cannot read. */
export class SpecFrontierError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SpecFrontierError";
  }
}

/** Whether a parsed JSON value is an object (not an array, not `null`). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Whether a parsed JSON value is a list. */
function isList(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** The `nodes` of a GraphQL connection, or none. */
function nodesOf(connection: unknown): unknown[] {
  return isRecord(connection) && isList(connection.nodes)
    ? connection.nodes
    : [];
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

/** How long one call to GitHub or to `gh` may take: the hook waits on it. */
const TIMEOUT_MS = 30_000;

/** The `data` of a GraphQL query; GitHub answers errors with a 200 too. */
async function graphql(
  base: string,
  token: string,
  fetcher: typeof fetch,
  query: string,
  variables: Readonly<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  const response = await fetcher(`${base}/graphql`, {
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "reforged-ts-spec-frontier",
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (response.status !== 200 || !isRecord(body)) {
    throw new SpecFrontierError(
      `POST /graphql answered ${
        isRecord(body) && typeof body.message === "string"
          ? `${String(response.status)} ${body.message}`
          : String(response.status)
      }.`,
    );
  }
  if (isList(body.errors) && body.errors.length > 0) {
    const messages = body.errors.map((error) =>
      isRecord(error) && typeof error.message === "string"
        ? error.message
        : JSON.stringify(error),
    );
    throw new SpecFrontierError(
      `POST /graphql answered: ${messages.join("; ")}`,
    );
  }
  if (!isRecord(body.data)) {
    throw new SpecFrontierError("POST /graphql answered no data.");
  }
  return body.data;
}

/** More Tickets than a Spec splits into: the query reads them in one page. */
const TICKET_PAGE = 100;

/** More blockers than a Ticket has: the query reads them in one page. */
const BLOCKER_PAGE = 50;

// An issue holds at most ten assignees, and a Ticket a few pull requests.
const SPEC = `query($owner: String!, $name: String!, $number: Int!) {
  viewer { login }
  repository(owner: $owner, name: $name) {
    issue(number: $number) {
      number title state
      labels(first: 50) { nodes { name } }
      subIssues(first: ${String(TICKET_PAGE)}) {
        totalCount
        nodes {
          number title state
          repository { nameWithOwner }
          assignees(first: 20) { nodes { login } }
          blockedBy(first: ${String(BLOCKER_PAGE)}) {
            totalCount
            nodes { number state repository { nameWithOwner } }
          }
          closedByPullRequestsReferences(first: 20, includeClosedPrs: false) {
            nodes { number state repository { nameWithOwner } }
          }
        }
      }
    }
  }
}`;

/** An issue's `OPEN` or `CLOSED`, or an error naming `what` it belongs to. */
function issueState(value: unknown, what: string): "OPEN" | "CLOSED" {
  if (value !== "OPEN" && value !== "CLOSED") {
    throw new SpecFrontierError(`The query answered ${what} without a state.`);
  }
  return value;
}

/** The repository and number of an issue or pull request node, or an error naming `what`. */
function refOf(
  node: unknown,
  what: string,
): { repository: string; number: number } {
  const repository = at(node, "repository", "nameWithOwner");
  const number = at(node, "number");
  if (typeof repository !== "string" || typeof number !== "number") {
    throw new SpecFrontierError(
      `The query answered ${what} without a number and a repository.`,
    );
  }
  return { repository, number };
}

/** A Ticket from its sub-issue node; an error when it has more blockers than were read. */
function ticketOf(node: unknown, home: string): FetchedTicket {
  const { repository, number } = refOf(node, "a Ticket");
  const name = reference(home, repository, number);
  const title = at(node, "title");
  const blockedBy = at(node, "blockedBy");
  const blockers = nodesOf(blockedBy).map((blocker) => ({
    ...refOf(blocker, `a blocker of ${name}`),
    state: issueState(at(blocker, "state"), `a blocker of ${name}`),
  }));
  const total = at(blockedBy, "totalCount");
  if (typeof total !== "number" || total > blockers.length) {
    throw new SpecFrontierError(
      `${name} is blocked by ${String(total)} issues, more than the ${String(blockers.length)} read: the query cannot say whether one is open.`,
    );
  }
  return {
    repository,
    number,
    title: typeof title === "string" ? title : "",
    state: issueState(at(node, "state"), name),
    assignees: nodesOf(at(node, "assignees")).flatMap((user) =>
      isRecord(user) && typeof user.login === "string" ? [user.login] : [],
    ),
    blockers,
    // closedByPullRequestsReferences returns merged ones too: only OPEN counts.
    pullRequests: nodesOf(at(node, "closedByPullRequestsReferences")).flatMap(
      (pullRequest) =>
        at(pullRequest, "state") === "OPEN"
          ? [refOf(pullRequest, `a pull request of ${name}`)]
          : [],
    ),
  };
}

/** Spec `number` of `repository` and the login of the token, read in one query. */
async function readSpec(
  settings: Settings,
  repository: string,
  number: number,
): Promise<{ login: string; spec: FetchedSpec }> {
  const slash = repository.indexOf("/");
  const data = await graphql(
    settings.base,
    settings.token,
    settings.fetcher,
    SPEC,
    {
      owner: repository.slice(0, slash),
      name: repository.slice(slash + 1),
      number,
    },
  );
  const login = at(data, "viewer", "login");
  const issue = at(data, "repository", "issue");
  if (typeof login !== "string" || !isRecord(issue)) {
    throw new SpecFrontierError(
      `The query answered no login or no issue ${repository}#${String(number)}.`,
    );
  }
  const subIssues = at(issue, "subIssues");
  const nodes = nodesOf(subIssues);
  const total = at(subIssues, "totalCount");
  if (typeof total !== "number" || total > nodes.length) {
    throw new SpecFrontierError(
      `#${String(number)} has ${String(total)} sub-issues, more than the ${String(nodes.length)} read.`,
    );
  }
  return {
    login,
    spec: {
      repository,
      number,
      title: typeof issue.title === "string" ? issue.title : "",
      state: issueState(issue.state, `${repository}#${String(number)}`),
      spec: nodesOf(issue.labels).some(
        (label) => isRecord(label) && label.name === SPEC_LABEL,
      ),
      tickets: nodes.map((node) => ticketOf(node, repository)),
    },
  };
}

// The CLI.

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export const PROCESS_OUTPUT: Output = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

/** Runs `gh` with `args` and resolves with its standard output. */
export type Gh = (args: readonly string[]) => Promise<string>;

const runGh: Gh = async (args) =>
  (
    await promisify(execFile)("gh", args, {
      encoding: "utf8",
      timeout: TIMEOUT_MS,
    })
  ).stdout;

export interface Context {
  env: Readonly<Record<string, string | undefined>>;
  fetcher: typeof fetch;
  gh: Gh;
}

/** What the run needs to reach GitHub. */
interface Settings {
  token: string;
  /** The API root, `GITHUB_API_URL`; GraphQL is `/graphql` under it. */
  base: string;
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
    const token = (await context.gh(["auth", "token"])).trim();
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
    throw new SpecFrontierError(`${what} failed: ${reason}`);
  }
}

/** The library: the repository of a Spec when none is named. */
const DEFAULT_REPOSITORY = BOARD_REPOSITORIES[0];

/** The Spec and its repository named by `args`, or `null` when they are no usage. */
function argumentsOf(
  args: readonly string[],
): { number: number; repository: string } | null {
  const [spec, repository = DEFAULT_REPOSITORY] = args;
  if (
    args.length < 1 ||
    args.length > 2 ||
    !/^#?[1-9]\d*$/.test(spec) ||
    !/^[\w.-]+\/[\w.-]+$/.test(repository)
  ) {
    return null;
  }
  return { number: Number(spec.replace("#", "")), repository };
}

/**
 * Prints the Frontier of Spec `args[0]` (`737` or `#737`) of repository
 * `args[1]` (`owner/name`, the library when absent) for the login of the
 * token: `GH_TOKEN`, else `GITHUB_TOKEN`, else `gh auth token`, through the
 * API at `GITHUB_API_URL`. Exit codes: 0 an answer, 1 a state it cannot
 * read (no token, GitHub's error, an issue that is not a Spec), 2 usage.
 */
export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { env: process.env, fetcher: fetch, gh: runGh },
): Promise<number> {
  const target = argumentsOf(args);
  if (target === null) {
    output.stderr(USAGE);
    return 2;
  }
  try {
    const settings: Settings = {
      token: await tokenOf(context),
      base: (
        variable(context.env, "GITHUB_API_URL") ?? "https://api.github.com"
      ).replace(/\/+$/, ""),
      fetcher: context.fetcher,
    };
    const { login, spec } = await readSpec(
      settings,
      target.repository,
      target.number,
    );
    if (!spec.spec) {
      throw new SpecFrontierError(
        `${spec.repository}#${String(spec.number)} is not a Spec: it is not labelled ${SPEC_LABEL}.`,
      );
    }
    output.stdout(renderFrontier(spec, frontierOf(spec, login)));
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
