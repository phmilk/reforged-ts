/**
 * The claim check (`claim / check`), the logic behind
 * `.github/workflows/claim-check.yml`: on a pull request, the issues of its
 * repository that it closes are claimed for its author, or fail the check
 * when another login holds them; on an assignment, a conflict draws a
 * comment on the issue. The protocol is `docs/agents/issue-tracker.md`,
 * "Claim"; the texts are the spec's (#529), the logins filled at run time.
 * `planPullRequest` and `planIssue` are pure: the event and the fetched
 * state in; the verdict, the assignments, the comment upserts, the summary
 * lines and the exit code out. `main` reads the state through the GitHub
 * API with the token of the environment and applies the plan.
 *
 * Self-contained on purpose: Node built-ins only and erasable syntax only
 * (no enum, no namespace, no parameter property), so that Node 24 runs it
 * from a checkout with no install and no build, as the workflow does:
 * `node release/src/claim-check.ts <pull-request|issue>`. Nothing is
 * imported from the other release scripts, since Node maps no `.js`
 * specifier to a `.ts` file: `isRecord`, `errorMessage`, the job summary
 * and the "started directly" test are copied from them.
 */
import { appendFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const USAGE = "Usage: node release/src/claim-check.ts <pull-request|issue>\n";

/** The hidden marker that opens the check's sticky comment. */
export const MARKER = "<!-- claim-check -->";

/**
 * The login the check writes as: `GITHUB_TOKEN` comments as GitHub Actions.
 * REST spells it with the `[bot]` suffix; the suffix-less spelling counts
 * only on a user of the `Bot` type.
 */
export const CHECK_LOGIN = "github-actions";

/** The head of text 2: a sticky comment holding it holds a failure. */
const FAILED_HEAD = "**Claim check failed.**";

/**
 * The most issues one run assigns the author to: a pull request that closes
 * more unclaimed issues than this claims none past it, so that one
 * description cannot claim a repository's backlog in one push.
 */
export const MAX_ASSIGNMENTS = 20;

/**
 * The check's comment texts (#529, "The check's comment texts"), numbered as
 * there; the tests pin them word for word. `tooMany` is not the spec's: it
 * is the line of the assignment cap (`MAX_ASSIGNMENTS`).
 */
export const TEXTS = {
  /** 1. Assigned: an unclaimed issue, now the author's. */
  assigned: (issue: number, author: string): string =>
    `**Claim check.** Assigned #${String(issue)} to @${author}. Under the Claim protocol the Claim comes before the work: \`gh issue edit ${String(issue)} --add-assignee @me\`, as the first write. See \`docs/agents/issue-tracker.md\`, "Claim".`,
  /** 2. Failed: an issue claimed by another login. */
  failed: (issue: number, assignee: string): string =>
    `${FAILED_HEAD} #${String(issue)} is claimed by @${assignee} (the assignee is the Claim: one login per issue), and this pull request would close it. Coordinate with them or, if the Claim is stale (3 days without a commit on their pull request and without a comment), take it over: comment on #${String(issue)} first, then \`gh issue edit ${String(issue)} --remove-assignee ${assignee} --add-assignee @me\`. Then re-run this check (Actions, "Re-run jobs") or push a commit. See \`docs/agents/issue-tracker.md\`, "Claim".`,
  /** 3. Not assignable: GitHub will not assign the author. */
  notAssignable: (issue: number, author: string): string =>
    `**Claim check.** #${String(issue)} could not be assigned to @${author}: GitHub assigns only a login with push access or a comment on the issue. Comment on #${String(issue)} and re-run this check, or a maintainer assigns it.`,
  /** 4. Conflict: a second assignee not added by the first or by the owner. */
  secondAssignee: (issue: number, newcomer: string, first: string): string =>
    `**Claim conflict.** @${newcomer} was added to #${String(issue)}, which is claimed by @${first}: one login per issue, and a second assignee is added only by the first, for pairing. If the Claim is stale (3 days without a commit on its pull request and without a comment), take it over: comment, then \`gh issue edit ${String(issue)} --remove-assignee ${first}\`. Otherwise withdraw: \`gh issue edit ${String(issue)} --remove-assignee @me\`.`,
  /** 5. Conflict: an open pull request by a login outside the assignees. */
  openPullRequest: (
    issue: number,
    assignee: string,
    pullRequest: number,
    author: string,
  ): string =>
    `**Claim conflict.** @${assignee} claimed #${String(issue)}, but the open pull request #${String(pullRequest)} by @${author} closes it. One login per issue: coordinate, and leave one Claim and one pull request. A stale pull request (3 days without a commit and without a comment) may be taken over: comment on #${String(issue)} first.`,
  /** 6. The issue's conflict is gone. */
  resolved: "**Claim conflict** resolved.",
  /** 7. The pull request passes after a failure. */
  passed: "**Claim check** passed.",
  /** The cap: the issues past `MAX_ASSIGNMENTS` were not assigned. */
  tooMany: (issues: readonly number[]): string =>
    `**Claim check.** This pull request closes too many issues to claim them here: at most ${String(MAX_ASSIGNMENTS)} are assigned per run, and ${issues.map((issue) => `#${String(issue)}`).join(", ")} ${issues.length === 1 ? "was" : "were"} not. Claim each one yourself, as the first write: \`gh issue edit <n> --add-assignee @me\`.`,
} as const;

/** An issue a pull request closes, as the check read it. */
export interface ClosingIssue {
  /** `owner/name`; an issue of another repository is ignored. */
  repository: string;
  number: number;
  /** The logins assigned to it, in GitHub's order. */
  assignees: readonly string[];
  /**
   * Whether GitHub lets the pull request's author be assigned to it (push
   * access, or a comment on the issue), asked before any assignment.
   */
  authorAssignable: boolean;
}

/** A pull request that references an issue as closed by it, with its own state. */
export interface ClosingPullRequest {
  /** `owner/name`; a pull request of another repository is ignored. */
  repository: string;
  number: number;
  author: string;
  /** Whether the author is a bot: outside the protocol. */
  bot: boolean;
  /** `closedByPullRequestsReferences` returns merged ones too: only `OPEN` counts. */
  state: "OPEN" | "CLOSED" | "MERGED";
}

/** The sticky comment the check already left on an issue or a pull request. */
export interface StickyComment {
  id: number;
  body: string;
}

/** The pull-request branch's input: the event and what was fetched. */
export interface PullRequestInput {
  /** The repository the event is of, `owner/name`. */
  repository: string;
  pullRequest: { number: number; author: string };
  /** The issues the pull request closes, of any repository. */
  closing: readonly ClosingIssue[];
  comment: StickyComment | null;
}

/** The issue branch's input: the event and what was fetched. */
export interface IssueInput {
  repository: string;
  action: "assigned" | "unassigned";
  issue: number;
  /** The login the event added or removed; `null` when the payload names none. */
  assignee: string | null;
  /** The login that made the change. */
  sender: string;
  /** The repository's owner, who may reassign at any time. */
  owner: string;
  /** The issue's assignees, re-read after the event. */
  assignees: readonly string[];
  pullRequests: readonly ClosingPullRequest[];
  comment: StickyComment | null;
}

export interface Assignment {
  issue: number;
  login: string;
}

/** The sticky comment to create or edit in place. */
export interface CommentUpsert {
  /** The issue or pull request it is on. */
  number: number;
  /** The comment to edit; `null` creates one. */
  id: number | null;
  body: string;
}

export type Verdict = "passed" | "failed" | "conflict" | "clear";

/** What one run of the check decided. */
export interface Plan {
  /** The run's verdict: for a pull request, the worst of its issues'. */
  verdict: Verdict;
  assignments: Assignment[];
  /** At most one: the sticky comment of the pull request or the issue. */
  comments: CommentUpsert[];
  /** One Markdown line per issue the run looked at, for the job summary. */
  summary: string[];
  exitCode: 0 | 1;
}

const names = (logins: readonly string[]): string =>
  logins.map((login) => `@${login}`).join(", ");

/** A login as GraphQL spells it: REST and the webhooks add `[bot]` to a bot's. */
const plain = (login: string): string =>
  login.endsWith("[bot]") ? login.slice(0, -"[bot]".length) : login;

/** Whether two comment bodies read the same (GitHub may store CRLF). */
const sameBody = (a: string, b: string): boolean =>
  a.replaceAll("\r\n", "\n").trim() === b.replaceAll("\r\n", "\n").trim();

/**
 * The sticky comment to write on `number`: `lines` under the marker, one
 * per issue. With nothing to say, none is created, and an earlier comment
 * is rewritten to `settled` (a conflict gone, a pass after a failure) when
 * that is a text, else left as it is. Nothing when the comment already
 * reads so.
 */
function upsert(
  number: number,
  lines: readonly string[],
  existing: StickyComment | null,
  settled: string | null,
): CommentUpsert[] {
  const body =
    lines.length > 0
      ? [MARKER, ...lines].join("\n\n")
      : existing === null || settled === null
        ? null
        : `${MARKER}\n\n${settled}`;
  if (body === null || (existing !== null && sameBody(existing.body, body))) {
    return [];
  }
  return [{ number, id: existing?.id ?? null, body }];
}

/**
 * The pull-request branch, per issue of the same repository the pull
 * request closes: no assignee, assign the author and say so (text 1), or
 * text 3 when GitHub will not assign them; the author among the assignees,
 * pass (pairing included); assignees that exclude the author, fail with
 * text 2. At most `MAX_ASSIGNMENTS` issues are assigned in one run: the
 * unclaimed ones past the cap stay so, with a summary line each and one
 * line in the comment. An issue of another repository is ignored with a
 * summary line; a pull request that closes no issue passes with one. The
 * worst verdict wins: exit 1 when any issue fails. With nothing to say, an
 * earlier comment is left alone unless it holds a failure, which a pass
 * replaces with text 7.
 */
export function planPullRequest(input: PullRequestInput): Plan {
  const { repository, pullRequest, closing, comment } = input;
  const { author } = pullRequest;
  const assignments: Assignment[] = [];
  const lines: string[] = [];
  const summary: string[] = [];
  const capped: number[] = [];
  let failed = false;
  let seen = 0;
  for (const issue of closing) {
    const n = String(issue.number);
    if (issue.repository !== repository) {
      summary.push(
        `- ${issue.repository}#${n}: an issue of another repository; ignored.`,
      );
      continue;
    }
    seen++;
    if (issue.assignees.includes(author)) {
      summary.push(
        issue.assignees.length === 1
          ? `- #${n}: claimed by @${author}, the author; passed.`
          : `- #${n}: claimed by ${names(issue.assignees)}, the author among them; passed.`,
      );
    } else if (issue.assignees.length > 0) {
      failed = true;
      lines.push(TEXTS.failed(issue.number, issue.assignees[0]));
      summary.push(
        `- #${n}: claimed by ${names(issue.assignees)}, not by the author @${author}; failed.`,
      );
    } else if (!issue.authorAssignable) {
      lines.push(TEXTS.notAssignable(issue.number, author));
      summary.push(
        `- #${n}: no assignee, and the author @${author} cannot be assigned; passed, with a comment.`,
      );
    } else if (assignments.length < MAX_ASSIGNMENTS) {
      assignments.push({ issue: issue.number, login: author });
      lines.push(TEXTS.assigned(issue.number, author));
      summary.push(`- #${n}: no assignee; assigned to the author @${author}.`);
    } else {
      capped.push(issue.number);
      summary.push(
        `- #${n}: no assignee; not assigned: the pull request closes too many issues to claim them here (at most ${String(MAX_ASSIGNMENTS)} per run).`,
      );
    }
  }
  if (capped.length > 0) lines.push(TEXTS.tooMany(capped));
  if (seen === 0) {
    summary.push(
      `- #${String(pullRequest.number)} closes no issue of this repository; passed.`,
    );
  }
  // Only a failure is replaced on a pass; a reminder (text 1, text 3) stays.
  const settled =
    comment?.body.includes(FAILED_HEAD) === true ? TEXTS.passed : null;
  return {
    verdict: failed ? "failed" : "passed",
    assignments,
    comments: upsert(pullRequest.number, lines, comment, settled),
    summary,
    exitCode: failed ? 1 : 0,
  };
}

/**
 * The issue branch, on `assigned` and `unassigned`, recomputed on every
 * event. On `assigned` with two or more assignees (re-read, so that the
 * interface's add-then-remove draws nothing): the sender already an
 * assignee, pairing, nothing; the sender the repository owner, nothing;
 * otherwise text 4. An open pull request of the same repository by a login
 * outside the assignees draws text 5, read from its own state. With no
 * conflict left (at most one assignee, and no such pull request), an
 * earlier comment becomes text 6; a second assignee the event did not add
 * keeps it, since their conflict stands. Comments only, never a reversal:
 * always exit 0.
 */
export function planIssue(input: IssueInput): Plan {
  const { repository, action, issue, assignee, sender, owner } = input;
  const { assignees, pullRequests, comment } = input;
  const n = String(issue);
  const lines: string[] = [];
  const summary: string[] = [];

  if (
    action === "assigned" &&
    assignee !== null &&
    assignees.length >= 2 &&
    assignees.includes(assignee)
  ) {
    const others = assignees.filter((login) => login !== assignee);
    if (sender === owner) {
      summary.push(
        `- #${n}: @${assignee} added by @${sender}, the repository owner; no conflict.`,
      );
    } else if (others.includes(sender)) {
      summary.push(
        `- #${n}: @${assignee} added by @${sender}, an assignee (pairing); no conflict.`,
      );
    } else {
      lines.push(TEXTS.secondAssignee(issue, assignee, others[0]));
      summary.push(
        `- #${n}: @${assignee} added by @${sender} to an issue claimed by @${others[0]}; conflict.`,
      );
    }
  }

  if (assignees.length > 0) {
    const held = assignees.map(plain);
    for (const pullRequest of pullRequests) {
      if (
        pullRequest.repository !== repository ||
        pullRequest.state !== "OPEN" ||
        pullRequest.bot ||
        held.includes(plain(pullRequest.author))
      ) {
        continue;
      }
      lines.push(
        TEXTS.openPullRequest(
          issue,
          assignees[0],
          pullRequest.number,
          pullRequest.author,
        ),
      );
      summary.push(
        `- #${n}: the open pull request #${String(pullRequest.number)} by @${pullRequest.author} closes it, claimed by @${assignees[0]}; conflict.`,
      );
    }
  }

  if (summary.length === 0) {
    summary.push(
      assignees.length === 0
        ? `- #${n}: no assignee; no conflict.`
        : `- #${n}: claimed by ${names(assignees)}; no conflict.`,
    );
  }
  return {
    verdict: lines.length > 0 ? "conflict" : "clear",
    assignments: [],
    comments: upsert(
      issue,
      lines,
      comment,
      assignees.length <= 1 ? TEXTS.resolved : null,
    ),
    summary,
    exitCode: 0,
  };
}

// The GitHub API: reading the state and applying the plan.

/** Configuration the script cannot use, or an answer it cannot read. */
export class ClaimCheckError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ClaimCheckError";
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

/** The `login` of each user object of `users`, in order. */
function loginsOf(users: unknown): string[] {
  return isList(users)
    ? users.flatMap((user) =>
        isRecord(user) && typeof user.login === "string" ? [user.login] : [],
      )
    : [];
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

/** A GitHub API answer: its status and its parsed JSON body (`null` when empty). */
interface ApiResponse {
  status: number;
  body: unknown;
}

/** One call to the GitHub API as the token's holder: a REST path, or `/graphql`. */
type Api = (request: {
  method: "GET" | "POST" | "PATCH";
  path: string;
  body?: unknown;
}) => Promise<ApiResponse>;

/** The GitHub API at `base` as the holder of `token`, over `fetcher`. */
function gitHubApi(base: string, token: string, fetcher: typeof fetch): Api {
  return async ({ method, path, body }) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
        "user-agent": "reforged-ts-claim-check",
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

/** GitHub's own message of an error answer, else its status. */
function apiMessage({ status, body }: ApiResponse): string {
  return isRecord(body) && typeof body.message === "string"
    ? `${String(status)} ${body.message}`
    : String(status);
}

/** The body of a REST call that must answer one of `accepted`. */
async function rest(
  api: Api,
  method: "GET" | "POST" | "PATCH",
  path: string,
  body: unknown,
  accepted: readonly number[],
): Promise<ApiResponse> {
  const response = await api({ method, path, body });
  if (!accepted.includes(response.status)) {
    throw new ClaimCheckError(
      `${method} ${path} answered ${apiMessage(response)}.`,
    );
  }
  return response;
}

/** The `data` of a GraphQL query; GitHub answers errors with a 200 too. */
async function graphql(
  api: Api,
  query: string,
  variables: Readonly<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  const response = await api({
    method: "POST",
    path: "/graphql",
    body: { query, variables },
  });
  const { body } = response;
  if (response.status !== 200 || !isRecord(body)) {
    throw new ClaimCheckError(
      `POST /graphql answered ${apiMessage(response)}.`,
    );
  }
  if (isList(body.errors) && body.errors.length > 0) {
    const messages = body.errors.map((error) =>
      isRecord(error) && typeof error.message === "string"
        ? error.message
        : JSON.stringify(error),
    );
    throw new ClaimCheckError(`POST /graphql answered: ${messages.join("; ")}`);
  }
  if (!isRecord(body.data)) {
    throw new ClaimCheckError("POST /graphql answered no data.");
  }
  return body.data;
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

const PAGE_SIZE = 100;

/** More pages than any issue's comments fill. */
const MAX_PAGES = 10;

/**
 * Whether a comment's `user` is the check itself, `CHECK_LOGIN`: a marked
 * comment by anyone else is not the check's, whatever it says.
 */
function byCheck(user: unknown): boolean {
  if (!isRecord(user) || typeof user.login !== "string") return false;
  return (
    user.login === `${CHECK_LOGIN}[bot]` ||
    (user.login === CHECK_LOGIN && user.type === "Bot")
  );
}

/**
 * The check's sticky comment on issue or pull request `number`: the first
 * comment by the check whose body opens with the marker. A marked comment
 * by another login is passed over, so that nobody can plant the check's
 * comment.
 */
async function findComment(
  api: Api,
  repository: string,
  number: number,
): Promise<StickyComment | null> {
  const path = `/repos/${repository}/issues/${String(number)}/comments`;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { body } = await rest(
      api,
      "GET",
      `${path}?per_page=${String(PAGE_SIZE)}&page=${String(page)}`,
      undefined,
      [200],
    );
    if (!isList(body)) {
      throw new ClaimCheckError(`GET ${path} answered no list.`);
    }
    for (const item of body) {
      if (
        isRecord(item) &&
        typeof item.id === "number" &&
        typeof item.body === "string" &&
        item.body.startsWith(MARKER) &&
        byCheck(item.user)
      ) {
        return { id: item.id, body: item.body };
      }
    }
    if (body.length < PAGE_SIZE) return null;
  }
  throw new ClaimCheckError(
    `GET ${path} answered more than ${String(MAX_PAGES)} pages.`,
  );
}

/**
 * Whether GitHub lets `login` be assigned to issue `number`: push access,
 * or a comment on that issue (204), else not (404). The add-assignees
 * endpoint would silently drop the login instead of saying so.
 */
async function assignable(
  api: Api,
  repository: string,
  number: number,
  login: string,
): Promise<boolean> {
  const { status } = await rest(
    api,
    "GET",
    `/repos/${repository}/issues/${String(number)}/assignees/${encodeURIComponent(login)}`,
    undefined,
    [204, 404],
  );
  return status === 204;
}

/**
 * The closing references read in one page. GitHub links at most ten issues
 * to a pull request by hand; keywords in the description are unbounded, so
 * the count is read too, and a pull request past the page stops the check.
 */
const CLOSING_PAGE = 50;

// An issue holds at most ten assignees: that connection is read whole.
const CLOSING_ISSUES = `query($owner: String!, $name: String!, $number: Int!, $first: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      closingIssuesReferences(first: $first) {
        totalCount
        nodes {
          number
          repository { nameWithOwner }
          assignees(first: 20) { nodes { login } }
        }
      }
    }
  }
}`;

const CLOSED_BY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    issue(number: $number) {
      closedByPullRequestsReferences(first: 50, includeClosedPrs: false) {
        nodes {
          number
          state
          repository { nameWithOwner }
          author { __typename login }
        }
      }
    }
  }
}`;

/** The `owner` and `name` of a repository named `owner/name`. */
function ownerAndName(repository: string): { owner: string; name: string } {
  const slash = repository.indexOf("/");
  return {
    owner: repository.slice(0, slash),
    name: repository.slice(slash + 1),
  };
}

/**
 * The issues the pull request closes, with whether `author` may be assigned
 * to each one of this repository. Stops when the pull request closes more
 * issues than one page holds: an issue the check did not read could be
 * claimed by another login, and the check never passes on one unread.
 */
async function readClosingIssues(
  api: Api,
  repository: string,
  pullRequest: { number: number; author: string },
): Promise<ClosingIssue[]> {
  const data = await graphql(api, CLOSING_ISSUES, {
    ...ownerAndName(repository),
    number: pullRequest.number,
    first: CLOSING_PAGE,
  });
  const connection = at(
    data,
    "repository",
    "pullRequest",
    "closingIssuesReferences",
  );
  const totalCount = at(connection, "totalCount");
  const nodes = nodesOf(connection);
  if (typeof totalCount !== "number") {
    throw new ClaimCheckError(
      "closingIssuesReferences answered no totalCount.",
    );
  }
  if (totalCount > nodes.length) {
    throw new ClaimCheckError(
      `#${String(pullRequest.number)} closes ${String(totalCount)} issues, more than the ${String(nodes.length)} the check read: it cannot pass on an issue it has not read. Name at most ${String(CLOSING_PAGE)} issues in the description, or split the pull request, then re-run the check.`,
    );
  }
  const issues: ClosingIssue[] = [];
  for (const node of nodes) {
    const nameWithOwner = at(node, "repository", "nameWithOwner");
    const number = at(node, "number");
    if (typeof nameWithOwner !== "string" || typeof number !== "number") {
      throw new ClaimCheckError(
        "closingIssuesReferences answered an issue without a number and a repository.",
      );
    }
    issues.push({
      repository: nameWithOwner,
      number,
      assignees: loginsOf(nodesOf(at(node, "assignees"))),
      authorAssignable:
        nameWithOwner === repository &&
        (await assignable(api, repository, number, pullRequest.author)),
    });
  }
  return issues;
}

/** The pull requests that reference issue `number` as closed by them. */
async function readClosingPullRequests(
  api: Api,
  repository: string,
  number: number,
): Promise<ClosingPullRequest[]> {
  const data = await graphql(api, CLOSED_BY, {
    ...ownerAndName(repository),
    number,
  });
  const pullRequests: ClosingPullRequest[] = [];
  for (const node of nodesOf(
    at(data, "repository", "issue", "closedByPullRequestsReferences"),
  )) {
    const nameWithOwner = at(node, "repository", "nameWithOwner");
    const pullRequest = at(node, "number");
    const state = at(node, "state");
    if (
      typeof nameWithOwner !== "string" ||
      typeof pullRequest !== "number" ||
      (state !== "OPEN" && state !== "CLOSED" && state !== "MERGED")
    ) {
      throw new ClaimCheckError(
        "closedByPullRequestsReferences answered a pull request without a number, a state and a repository.",
      );
    }
    const login = at(node, "author", "login");
    pullRequests.push({
      repository: nameWithOwner,
      number: pullRequest,
      // A deleted account has no author.
      author: typeof login === "string" ? login : "ghost",
      bot: at(node, "author", "__typename") === "Bot",
      state,
    });
  }
  return pullRequests;
}

/** The assignees of issue `number`, read now rather than from the event. */
async function readAssignees(
  api: Api,
  repository: string,
  number: number,
): Promise<string[]> {
  const path = `/repos/${repository}/issues/${String(number)}`;
  const { body } = await rest(api, "GET", path, undefined, [200]);
  if (!isRecord(body) || !isList(body.assignees)) {
    throw new ClaimCheckError(`GET ${path} answered no assignees.`);
  }
  return loginsOf(body.assignees);
}

/** Sends the plan's assignments, then its comment, saying what it did. */
async function apply(
  api: Api,
  repository: string,
  plan: Plan,
  output: Output,
): Promise<void> {
  for (const { issue, login } of plan.assignments) {
    await rest(
      api,
      "POST",
      `/repos/${repository}/issues/${String(issue)}/assignees`,
      { assignees: [login] },
      [201],
    );
    output.stdout(`Assigned #${String(issue)} to @${login}.\n`);
  }
  for (const { number, id, body } of plan.comments) {
    if (id === null) {
      await rest(
        api,
        "POST",
        `/repos/${repository}/issues/${String(number)}/comments`,
        { body },
        [201],
      );
      output.stdout(`Commented on #${String(number)}.\n`);
    } else {
      await rest(
        api,
        "PATCH",
        `/repos/${repository}/issues/comments/${String(id)}`,
        { body },
        [200],
      );
      output.stdout(`Edited the comment on #${String(number)}.\n`);
    }
  }
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

export interface Context {
  env: Readonly<Record<string, string | undefined>>;
  fetcher: typeof fetch;
}

/** The environment variable GitHub Actions names the job summary file in. */
const SUMMARY_VARIABLE = "GITHUB_STEP_SUMMARY";

/**
 * Appends `markdown` to the job summary when the environment `env` names
 * one (a step of GitHub Actions); does nothing elsewhere.
 */
async function appendSummary(
  env: Readonly<Record<string, string | undefined>>,
  markdown: string,
): Promise<void> {
  const file = env[SUMMARY_VARIABLE];
  if (file !== undefined && file !== "") await appendFile(file, markdown);
}

/** The environment variable GitHub Actions names the step's outputs file in. */
const OUTPUT_VARIABLE = "GITHUB_OUTPUT";

/** The step output that lists the issues the run assigned, comma-separated. */
export const ASSIGNED_OUTPUT = "assigned";

/**
 * Sets the step output `name` to `value` when the environment `env` names
 * the outputs file (a step of GitHub Actions); does nothing elsewhere.
 */
async function setOutput(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
  value: string,
): Promise<void> {
  const file = env[OUTPUT_VARIABLE];
  if (file !== undefined && file !== "") {
    await appendFile(file, `${name}=${value}\n`);
  }
}

/** What the environment of the job gives the script. */
interface Settings {
  token: string;
  /** `owner/name`, the caller's repository. */
  repository: string;
  owner: string;
  /** The API root, `GITHUB_API_URL`; GraphQL is `/graphql` under it. */
  base: string;
  eventPath: string;
}

/** The variable's value when set and not empty. */
function variable(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string | undefined {
  const value = env[name];
  return value === undefined || value === "" ? undefined : value;
}

function settingsOf(
  env: Readonly<Record<string, string | undefined>>,
): Settings {
  const token = variable(env, "GITHUB_TOKEN");
  if (token === undefined) {
    throw new ClaimCheckError("GITHUB_TOKEN is not set.");
  }
  const repository = variable(env, "GITHUB_REPOSITORY");
  if (repository === undefined || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    throw new ClaimCheckError(
      "GITHUB_REPOSITORY does not name a repository as owner/name.",
    );
  }
  const eventPath = variable(env, "GITHUB_EVENT_PATH");
  if (eventPath === undefined) {
    throw new ClaimCheckError("GITHUB_EVENT_PATH is not set.");
  }
  return {
    token,
    repository,
    owner: variable(env, "GITHUB_REPOSITORY_OWNER") ?? repository.split("/")[0],
    base: (variable(env, "GITHUB_API_URL") ?? "https://api.github.com").replace(
      /\/+$/,
      "",
    ),
    eventPath,
  };
}

/** The pull request of a `pull_request_target` event: its number and its author. */
function pullRequestOf(event: unknown): { number: number; author: string } {
  const number = at(event, "pull_request", "number");
  const author = at(event, "pull_request", "user", "login");
  if (typeof number !== "number" || typeof author !== "string") {
    throw new ClaimCheckError(
      "The event holds no pull request with a number and an author: the pull-request mode runs on pull_request_target.",
    );
  }
  return { number, author };
}

/** The issue, the login added or removed and the sender of an `issues` event. */
function issueEventOf(event: unknown): {
  action: "assigned" | "unassigned";
  issue: number;
  assignee: string | null;
  sender: string;
} {
  const action = at(event, "action");
  const issue = at(event, "issue", "number");
  const sender = at(event, "sender", "login");
  const assignee = at(event, "assignee", "login");
  if (
    (action !== "assigned" && action !== "unassigned") ||
    typeof issue !== "number" ||
    typeof sender !== "string"
  ) {
    throw new ClaimCheckError(
      "The event is not an assignment with an issue and a sender: the issue mode runs on issues (assigned, unassigned).",
    );
  }
  return {
    action,
    issue,
    assignee: typeof assignee === "string" ? assignee : null,
    sender,
  };
}

/** The pull-request branch's plan, the state read through `api`. */
async function checkPullRequest(
  api: Api,
  settings: Settings,
  event: unknown,
): Promise<Plan> {
  const pullRequest = pullRequestOf(event);
  const { repository } = settings;
  return planPullRequest({
    repository,
    pullRequest,
    closing: await readClosingIssues(api, repository, pullRequest),
    comment: await findComment(api, repository, pullRequest.number),
  });
}

/** The issue branch's plan, the state read through `api`. */
async function checkIssue(
  api: Api,
  settings: Settings,
  event: unknown,
): Promise<Plan> {
  const { action, issue, assignee, sender } = issueEventOf(event);
  const { repository, owner } = settings;
  return planIssue({
    repository,
    action,
    issue,
    assignee,
    sender,
    owner,
    assignees: await readAssignees(api, repository, issue),
    pullRequests: await readClosingPullRequests(api, repository, issue),
    comment: await findComment(api, repository, issue),
  });
}

/**
 * Runs the mode `args[0]` names (`pull-request` or `issue`) on the event
 * of `GITHUB_EVENT_PATH`, in `GITHUB_REPOSITORY`, with `GITHUB_TOKEN`,
 * through the API at `GITHUB_API_URL`; writes a line per issue, or the
 * error that stopped it, to the job summary when `GITHUB_STEP_SUMMARY`
 * names one, and the issues it assigned to the step output `assigned` when
 * `GITHUB_OUTPUT` names the file. Exit codes: 0 passed, 1 an issue claimed
 * by another login (pull-request mode) or an error, 2 usage.
 */
export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { env: process.env, fetcher: fetch },
): Promise<number> {
  const mode = args.at(0);
  if (args.length !== 1 || (mode !== "pull-request" && mode !== "issue")) {
    output.stderr(USAGE);
    return 2;
  }
  try {
    const settings = settingsOf(context.env);
    const event: unknown = JSON.parse(
      await readFile(settings.eventPath, "utf8"),
    );
    const api = gitHubApi(settings.base, settings.token, context.fetcher);
    const plan =
      mode === "pull-request"
        ? await checkPullRequest(api, settings, event)
        : await checkIssue(api, settings, event);
    for (const line of plan.summary) output.stdout(`${line}\n`);
    await apply(api, settings.repository, plan, output);
    // An assignment made with GITHUB_TOKEN raises no issues event: the
    // workflow reads this output to tell the board.
    if (plan.assignments.length > 0) {
      await setOutput(
        context.env,
        ASSIGNED_OUTPUT,
        plan.assignments.map(({ issue }) => String(issue)).join(","),
      );
    }
    await appendSummary(
      context.env,
      `## Claim check\n\n${plan.summary.join("\n")}\n`,
    );
    if (plan.verdict === "failed") {
      output.stdout(
        "::error title=Claim check failed::An issue this pull request closes is claimed by another login; the comment on the pull request names the way out.\n",
      );
    }
    return plan.exitCode;
  } catch (error) {
    const message = errorMessage(error);
    output.stderr(`${message}\n`);
    // The summary is what a person reads first: the error goes there too.
    await appendSummary(context.env, `## Claim check\n\n- ${message}\n`);
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
