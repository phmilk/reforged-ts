/**
 * The issue model of the board and its rules: an issue as the board reads
 * it (`BoardIssue`, with the fragment of the queries and `readOpenIssues`),
 * the label pair of an open Spec (`specLabelsOf`, ADR 0025) and the Status
 * rules (`statusOf`, a pure function of an issue and its context). The
 * reconcile and `board:labels` read it; `spec-check` and `spec-verdict`
 * read it through `board.ts`.
 */
import { BOARD_APP_LOGIN, type Status } from "./board-definition.js";
import { BoardError, namesOf, nodesOf, ownerAndName } from "./board-request.js";
import { readNodes } from "./github-graphql.js";
import type { GitHubApi } from "./repo-settings.js";
import { isRecord } from "./unknown.js";

/** An issue named by its repository (`owner/name`) and number: its key across both repositories. */
export interface IssueRef {
  repository: string;
  number: number;
}

/** `owner/name#number`: how the board names an issue and keys it. */
export const issueKey = ({ repository, number }: IssueRef): string =>
  `${repository}#${String(number)}`;

/** A pull request that references an issue as closed by it, as the issue's fragment answers it. */
export interface BoardPullRequest {
  number: number;
  /** `OPEN`, `CLOSED` or `MERGED`: merged ones come back too, and only `OPEN` counts. */
  state: string;
  draft: boolean;
  /** The author's login; `null` for a deleted account. */
  author: string | null;
}

/** A sub-issue, as the parent's fragment answers it. */
export interface SubIssue extends IssueRef {
  /** `OPEN` or `CLOSED`. */
  state: string;
}

/** The parent of an issue, as the issue's fragment answers it. */
export interface ParentIssue extends IssueRef {
  labels: readonly string[];
}

/**
 * An issue as the Status rules and the archive rule read it: the
 * `BoardIssue` fragment of the queries, one record per issue.
 */
export interface BoardIssue extends IssueRef {
  /** The node id: the `contentId` of an add. */
  id: string;
  /** `OPEN` or `CLOSED`. */
  state: string;
  /**
   * When the issue itself last changed, the archive clock: a project write
   * (an add, a Status) does not move it, so the reconcile's own writes
   * never restart the fourteen days.
   */
  updatedAt: string;
  /**
   * Whether a Bot other than the App (`BOARD_APP_LOGIN`) authored it, such as
   * Renovate's Dependency Dashboard: never a member.
   */
  bot: boolean;
  labels: readonly string[];
  assignees: readonly string[];
  parent: ParentIssue | null;
  pullRequests: readonly BoardPullRequest[];
  /** The count of its open blockers. */
  blockedBy: number;
  subIssues: readonly SubIssue[];
}

/** The issue of a reference among those read, or `undefined`. */
export type IssueLookup = (ref: IssueRef) => BoardIssue | undefined;

/** A lookup over `issues`, by repository and number. */
export function issueLookup(issues: readonly BoardIssue[]): IssueLookup {
  const index = new Map(issues.map((issue) => [issueKey(issue), issue]));
  return (ref) => index.get(issueKey(ref));
}

/**
 * The label of an open Spec with no Ticket, an unsplit Spec (ADR 0025):
 * Backlog, whatever its other labels. `board:labels` derives it.
 */
export const NEEDS_SPLIT_LABEL = "needs-split";

/** The label of a Spec, as `to-spec` and `write-spec` set it. */
export const SPEC_LABEL = "spec";

/** The triage label of a split Spec, swapped with `NEEDS_SPLIT_LABEL`. */
export const READY_FOR_AGENT = "ready-for-agent";

/** The labels that make an open issue Ready on their own. */
const READY_LABELS: readonly string[] = [READY_FOR_AGENT, "ready-for-human"];

/** The label of a wayfinder map, whose open children are its frontier: Ready. */
const MAP_LABEL = "wayfinder:map";

/**
 * The triage labels a Spec keeps, split or not: one carrying any of them
 * gets or loses `needs-split` alone, never `ready-for-agent`.
 */
const KEPT_TRIAGE_LABELS: readonly string[] = [
  "ready-for-human",
  "needs-triage",
  "needs-info",
  "wontfix",
];

/** The labels to add to an issue and to remove from it. */
export interface LabelChange {
  add: string[];
  remove: string[];
}

/**
 * The labels an open Spec (labelled `spec`) lacks or carries wrongly by
 * ADR 0025, empty when it is right: with no sub-issue, open or closed, it
 * is unsplit, so `needs-split` in and `ready-for-agent` out; with one or
 * more, the reverse. A Spec carrying another triage label
 * (`KEPT_TRIAGE_LABELS`) keeps it and gets or loses `needs-split` alone.
 * `null` for a closed Spec and an issue that is no Spec.
 */
export function specLabelsOf(issue: BoardIssue): LabelChange | null {
  const has = (label: string) => issue.labels.includes(label);
  if (issue.state !== "OPEN" || !has(SPEC_LABEL)) return null;
  const change: LabelChange = { add: [], remove: [] };
  const triaged = issue.labels.some((label) =>
    KEPT_TRIAGE_LABELS.includes(label),
  );
  if (issue.subIssues.length === 0) {
    if (!has(NEEDS_SPLIT_LABEL)) change.add.push(NEEDS_SPLIT_LABEL);
    if (!triaged && has(READY_FOR_AGENT)) change.remove.push(READY_FOR_AGENT);
  } else {
    if (!triaged && !has(READY_FOR_AGENT)) change.add.push(READY_FOR_AGENT);
    if (has(NEEDS_SPLIT_LABEL)) change.remove.push(NEEDS_SPLIT_LABEL);
  }
  return change;
}

/**
 * The labels of `issue` once `specLabelsOf` is applied: what the Status
 * rules read, so that a Status never waits on a label write.
 */
function derivedLabels(issue: BoardIssue): readonly string[] {
  const change = specLabelsOf(issue);
  return change === null
    ? issue.labels
    : [
        ...issue.labels.filter((label) => !change.remove.includes(label)),
        ...change.add,
      ];
}

/**
 * The order the parent rule ranks the open sub-issues by, lowest first: a
 * parent takes the highest. No Done: an open sub-issue is never Done.
 */
export const PARENT_RULE_ORDER: readonly Status[] = [
  "Backlog",
  "Blocked",
  "Ready",
  "In progress",
  "In review",
];

/**
 * The Status of `issue` by the rules of ADR 0016, precedence top-down, the
 * first that matches: Done, the issue is closed; In review, an open pull
 * request that is not a draft closes it, read from the pull request's own
 * state (a merged one comes back too and does not count); In progress, it
 * has an assignee, the Claim (a draft keeps it here); the parent rule, it
 * has open sub-issues: the highest of their values by `PARENT_RULE_ORDER`,
 * each by these rules in turn, so a map takes its specs' highest and a spec
 * its tickets' (a sub-issue `lookup` does not know is left out); Blocked,
 * it has an open blocker, whatever its labels; Backlog, `needs-split`, an
 * unsplit Spec, whatever its other labels; Ready, `ready-for-agent`,
 * `ready-for-human`, or a child of a `wayfinder:map`; Backlog, everything
 * else. An open Spec's labels are read as `specLabelsOf` derives them
 * (ADR 0025), whether or not `board:labels` has written them yet.
 */
export function statusOf(issue: BoardIssue, lookup: IssueLookup): Status {
  return highestStatus(issue, lookup, new Set());
}

/** `statusOf`, with the parents already on the path, so a cyclic hierarchy ends. */
function highestStatus(
  issue: BoardIssue,
  lookup: IssueLookup,
  seen: Set<string>,
): Status {
  if (issue.state === "CLOSED") return "Done";
  if (
    issue.pullRequests.some(({ state, draft }) => state === "OPEN" && !draft)
  ) {
    return "In review";
  }
  if (issue.assignees.length > 0) return "In progress";
  seen.add(issueKey(issue));
  let highest = -1;
  for (const sub of issue.subIssues) {
    if (sub.state !== "OPEN" || seen.has(issueKey(sub))) continue;
    const child = lookup(sub);
    if (child === undefined) continue;
    highest = Math.max(
      highest,
      PARENT_RULE_ORDER.indexOf(highestStatus(child, lookup, seen)),
    );
  }
  if (highest >= 0) return PARENT_RULE_ORDER[highest];
  if (issue.blockedBy > 0) return "Blocked";
  const labels = derivedLabels(issue);
  if (labels.includes(NEEDS_SPLIT_LABEL)) return "Backlog";
  if (
    labels.some((label) => READY_LABELS.includes(label)) ||
    issue.parent?.labels.includes(MAP_LABEL) === true
  ) {
    return "Ready";
  }
  return "Backlog";
}

/**
 * An issue as the reconcile reads it, everything the Status rules and the
 * archive rule look at; the parent and the sub-issues carry their
 * repository, since a ticket of the Template may be the child of a library
 * spec. `closedByPullRequestsReferences(includeClosedPrs: false)` still
 * returns merged pull requests, so In review is read from each pull
 * request's own `state`, never from the presence of a reference. The
 * Issue status is not read here: it is a preview, and a field GitHub
 * changes must not fail this fragment, which the reconcile reads too
 * (`readIssueStatuses`).
 */
export const BOARD_ISSUE_FRAGMENT = `fragment BoardIssue on Issue {
  id number state updatedAt
  repository { nameWithOwner }
  author { __typename login }
  labels(first: 30) { nodes { name } }
  assignees(first: 10) { nodes { login } }
  parent { id number repository { nameWithOwner } labels(first: 30) { nodes { name } } }
  closedByPullRequestsReferences(first: 10, includeClosedPrs: false) { nodes { number isDraft state author { __typename login } } }
  issueDependenciesSummary { blockedBy }
  subIssues(first: 100) { nodes { id number state repository { nameWithOwner } } }
}`;

/** The open issues of one repository, oldest first, paged with `$first` and `$cursor`. */
const OPEN_ISSUES_QUERY = `query OpenIssues($owner: String!, $name: String!, $first: Int!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    issues(states: OPEN, first: $first, after: $cursor, orderBy: { field: CREATED_AT, direction: ASC }) {
      pageInfo { hasNextPage endCursor }
      nodes { ...BoardIssue }
    }
  }
}
${BOARD_ISSUE_FRAGMENT}`;

/** The repository and number of an issue or pull request node, or `undefined`. */
export function readRef(node: unknown): IssueRef | undefined {
  if (
    !isRecord(node) ||
    typeof node.number !== "number" ||
    !isRecord(node.repository) ||
    typeof node.repository.nameWithOwner !== "string"
  ) {
    return undefined;
  }
  return { repository: node.repository.nameWithOwner, number: node.number };
}

/** A node of the `BoardIssue` fragment, or `undefined` when it is not one. */
export function readIssue(node: unknown): BoardIssue | undefined {
  const ref = readRef(node);
  if (
    ref === undefined ||
    !isRecord(node) ||
    typeof node.id !== "string" ||
    typeof node.state !== "string" ||
    typeof node.updatedAt !== "string"
  ) {
    return undefined;
  }
  const parent = readRef(node.parent);
  return {
    ...ref,
    id: node.id,
    state: node.state,
    updatedAt: node.updatedAt,
    bot:
      isRecord(node.author) &&
      node.author.__typename === "Bot" &&
      node.author.login !== BOARD_APP_LOGIN,
    labels: namesOf(node.labels, "name"),
    assignees: namesOf(node.assignees, "login"),
    parent:
      parent === undefined
        ? null
        : {
            ...parent,
            labels: namesOf(
              isRecord(node.parent) ? node.parent.labels : undefined,
              "name",
            ),
          },
    pullRequests: nodesOf(node.closedByPullRequestsReferences).flatMap(
      (pullRequest) =>
        isRecord(pullRequest) &&
        typeof pullRequest.number === "number" &&
        typeof pullRequest.state === "string"
          ? [
              {
                number: pullRequest.number,
                state: pullRequest.state,
                draft: pullRequest.isDraft === true,
                author:
                  isRecord(pullRequest.author) &&
                  typeof pullRequest.author.login === "string"
                    ? pullRequest.author.login
                    : null,
              },
            ]
          : [],
    ),
    blockedBy:
      isRecord(node.issueDependenciesSummary) &&
      typeof node.issueDependenciesSummary.blockedBy === "number"
        ? node.issueDependenciesSummary.blockedBy
        : 0,
    subIssues: nodesOf(node.subIssues).flatMap((sub) => {
      const subRef = readRef(sub);
      return subRef === undefined ||
        !isRecord(sub) ||
        typeof sub.state !== "string"
        ? []
        : [{ ...subRef, state: sub.state }];
    }),
  };
}

/** The open issues of `repository` (`owner/name`), bots included, oldest first. */
export async function readOpenIssues(
  api: GitHubApi,
  repository: string,
): Promise<BoardIssue[]> {
  const nodes = await readNodes(
    api,
    OPEN_ISSUES_QUERY,
    ownerAndName(repository),
    ["repository", "issues"],
  );
  return nodes.map((node) => {
    const issue = readIssue(node);
    if (issue === undefined) {
      throw new BoardError(
        `OpenIssues answered an issue of ${repository} without its fields.`,
      );
    }
    return issue;
  });
}
