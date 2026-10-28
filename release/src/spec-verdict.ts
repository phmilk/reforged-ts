/**
 * The Spec verdict, the second write of `pnpm board:labels` (#796): every
 * open Spec of both Board repositories with sub-issues and none open gets
 * the coverage check's verdict in one sticky comment, green with the
 * command that closes it, red with each gap in the words `pnpm spec:check`
 * prints. A last Ticket merged by auto-merge (ADR 0021) leaves nobody there
 * to run the check that ADR 0023 gives its merger; the comment is the
 * reminder, and the close stays a person's or an Agent's act: nothing here
 * closes an issue.
 *
 * `specsToCheck`, `verdictComment` and `planSpecVerdict` are pure; the
 * verdict is `spec-check.ts`'s, reused as is. `planSpecVerdicts` reads each
 * Spec, with its Tickets and the comment, through the GitHub GraphQL API,
 * and a Spec it cannot read is reported without stopping the others. The
 * comment is the App's, found by `VERDICT_MARKER`: a marked comment by any
 * other login is passed over, so that nobody can plant it.
 */
import {
  BOARD_APP_LOGIN,
  BOARD_REPOSITORIES,
  issueKey,
  SPEC_LABEL,
  type BoardIssue,
  type BoardRequest,
  type IssueRef,
} from "./board.js";
import { graphql, readNodes } from "./github-graphql.js";
import type { GitHubApi } from "./repo-settings.js";
import {
  coverageVerdict,
  describeGap,
  gapCount,
  readSpec,
  verdictCounts,
  type FetchedSpec,
  type Verdict,
} from "./spec-check.js";
import { errorMessage, isRecord } from "./unknown.js";

/** The hidden marker that opens the board's comment of a Spec's verdict. */
export const VERDICT_MARKER = "<!-- board: coverage check -->";

/** Where "Closing a Spec" lives, which every comment points to. */
const CLOSING = 'See `docs/agents/issue-tracker.md`, "Closing a Spec".';

/** Whether `spec` is of the library, whose repository both commands leave out. */
const ofLibrary = (spec: IssueRef): boolean =>
  spec.repository === BOARD_REPOSITORIES[0];

/** The command that runs the coverage check of `spec`. */
const checkCommand = (spec: IssueRef): string =>
  `pnpm spec:check ${String(spec.number)}${ofLibrary(spec) ? "" : ` ${spec.repository}`}`;

/** The command that closes `spec`, with `comment`. */
const closeCommand = (spec: IssueRef, comment: string): string =>
  `gh issue close ${String(spec.number)}${ofLibrary(spec) ? "" : ` -R ${spec.repository}`} --comment "${comment}"`;

/**
 * The comment of `spec`'s verdict `verdict`, under `VERDICT_MARKER`:
 * green, the counts and the command that closes it; red, each gap.
 */
export function verdictComment(
  spec: FetchedSpec,
  verdict: Verdict = coverageVerdict(spec),
): string {
  const check = `\`${checkCommand(spec)}\``;
  const counts = verdictCounts(verdict);
  const text =
    verdict.gaps.length === 0
      ? `**Coverage check: green.** Every Ticket of this Spec is closed, and ${check} finds no gap: ${counts}. ` +
        `Close the Spec: \`${closeCommand(spec, `Delivered: the coverage check is green (${counts}).`)}\`. ` +
        "The board never closes it: whoever merged its last Ticket, an assignee of the Spec or the maintainer does (ADR 0023). " +
        CLOSING
      : `**Coverage check: red.** Every Ticket of this Spec is closed, but ${check} finds ${gapCount(verdict)} (${counts}):\n\n` +
        verdict.gaps
          .map((gap) => `- ${describeGap(spec.repository, gap)}\n`)
          .join("") +
        "\nThe Spec stays open. Whoever fills a gap runs the check again; the board edits this comment on its next run. " +
        CLOSING;
  return `${VERDICT_MARKER}\n\n${text}`;
}

/**
 * The Specs whose verdict the board comments: the open issues of `issues`
 * in the Board repositories labelled `spec`, with one sub-issue or more
 * and none open. A Spec with an open Ticket, or with none yet, waits.
 */
export function specsToCheck(issues: readonly BoardIssue[]): BoardIssue[] {
  return issues.filter(
    (issue) =>
      issue.state === "OPEN" &&
      BOARD_REPOSITORIES.includes(issue.repository) &&
      issue.labels.includes(SPEC_LABEL) &&
      issue.subIssues.length > 0 &&
      issue.subIssues.every((subIssue) => subIssue.state !== "OPEN"),
  );
}

/** The board's comment of a Spec's verdict, as GitHub returns it. */
export interface VerdictComment {
  /** Its node id, which `updateIssueComment` takes. */
  id: string;
  body: string;
}

/** The mutations of the comment: the only writes of this module. */
const MUTATIONS = {
  add: `mutation AddComment($subjectId: ID!, $body: String!) {
  addComment(input: { subjectId: $subjectId, body: $body }) {
    clientMutationId
  }
}`,
  update: `mutation UpdateIssueComment($id: ID!, $body: String!) {
  updateIssueComment(input: { id: $id, body: $body }) {
    clientMutationId
  }
}`,
} as const;

/** Whether two comment bodies read the same (GitHub may store CRLF). */
const sameBody = (a: string, b: string): boolean =>
  a.replaceAll("\r\n", "\n").trim() === b.replaceAll("\r\n", "\n").trim();

/**
 * The write that makes the comment of `spec`, whose node id is `specId`,
 * say its verdict: added when `existing` is `null`, edited in place when
 * it says something else, and none when it already says it.
 */
export function planSpecVerdict(
  specId: string,
  spec: FetchedSpec,
  existing: VerdictComment | null,
): BoardRequest | null {
  const verdict = coverageVerdict(spec);
  const body = verdictComment(spec, verdict);
  if (existing !== null && sameBody(existing.body, body)) return null;
  const result =
    verdict.gaps.length === 0 ? "green" : `red, ${gapCount(verdict)}`;
  const key = issueKey(spec);
  return existing === null
    ? {
        query: MUTATIONS.add,
        variables: { subjectId: specId, body },
        summary: `Comment the coverage check on ${key}: ${result}.`,
      }
    : {
        query: MUTATIONS.update,
        variables: { id: existing.id, body },
        summary: `Edit the coverage check's comment on ${key}: ${result}.`,
      };
}

// Reading and writing through the GitHub GraphQL API.

const SPEC_COMMENTS = `query SpecComments($owner: String!, $name: String!, $number: Int!, $first: Int!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    issue(number: $number) {
      comments(first: $first, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes { id body author { __typename login } }
      }
    }
  }
}`;

/**
 * The board's comment on `spec`: the first one the App wrote whose body
 * opens with `VERDICT_MARKER`; `null` when there is none.
 */
async function readVerdictComment(
  api: GitHubApi,
  spec: IssueRef,
): Promise<VerdictComment | null> {
  const [owner, name] = spec.repository.split("/");
  const nodes = await readNodes(
    api,
    SPEC_COMMENTS,
    { owner, name, number: spec.number },
    ["repository", "issue", "comments"],
  );
  for (const node of nodes) {
    if (
      isRecord(node) &&
      typeof node.id === "string" &&
      typeof node.body === "string" &&
      node.body.startsWith(VERDICT_MARKER) &&
      isRecord(node.author) &&
      node.author.__typename === "Bot" &&
      node.author.login === BOARD_APP_LOGIN
    ) {
      return { id: node.id, body: node.body };
    }
  }
  return null;
}

/** What the board will comment on the Specs whose Tickets are all closed. */
export interface SpecVerdictPlan {
  /** The writes to send, one per Spec at most, in the order of `issues`. */
  requests: BoardRequest[];
  /** How many Specs it checked: open, with sub-issues, none open. */
  specs: number;
  /** How many of their comments already say the verdict. */
  kept: number;
  /** One sentence per Spec it could not read, the error included. */
  failures: string[];
}

/**
 * The comments of the Specs among `issues` that `specsToCheck` keeps, each
 * Spec read with its Tickets and its comment through `api`. A Spec that
 * cannot be read is a failure, and the others are still planned.
 */
export async function planSpecVerdicts(
  api: GitHubApi,
  issues: readonly BoardIssue[],
): Promise<SpecVerdictPlan> {
  const plan: SpecVerdictPlan = {
    requests: [],
    specs: 0,
    kept: 0,
    failures: [],
  };
  for (const issue of specsToCheck(issues)) {
    plan.specs++;
    try {
      const spec = await readSpec(api, issue.repository, issue.number);
      const request = planSpecVerdict(
        issue.id,
        spec,
        await readVerdictComment(api, issue),
      );
      if (request === null) plan.kept++;
      else plan.requests.push(request);
    } catch (error) {
      plan.failures.push(
        `The coverage check of ${issueKey(issue)} could not run: ${errorMessage(error)}`,
      );
    }
  }
  return plan;
}

/**
 * Sends the plan's comments in order through `api`, calling `sent` after
 * each one that succeeds; one that fails does not stop the others.
 * Resolves with one sentence per failure, the error included.
 */
export async function applySpecVerdicts(
  api: GitHubApi,
  plan: SpecVerdictPlan,
  sent: (request: BoardRequest) => void = () => undefined,
): Promise<string[]> {
  const failures: string[] = [];
  for (const request of plan.requests) {
    try {
      await graphql(api, request.query, request.variables);
      sent(request);
    } catch (error) {
      failures.push(`${errorMessage(error)} Not done: ${request.summary}`);
    }
  }
  return failures;
}
