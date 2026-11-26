/**
 * What `board:labels` writes with the App's token, programmatic entry
 * point: the label pair of an open Spec (`planBoardLabels`) and the Issue
 * status of every open issue the board holds or will hold, the mirror of
 * its Status (`planIssueStatuses`), each with its reader and its sender.
 * Importers outside the board modules read it through `board.ts`.
 */
import {
  BOARD_REPOSITORIES,
  sameName,
  type Status,
} from "./board-definition.js";
import {
  issueKey,
  issueLookup,
  NEEDS_SPLIT_LABEL,
  READY_FOR_AGENT,
  readOpenIssues,
  specLabelsOf,
  statusOf,
  type BoardIssue,
} from "./board-issues.js";
import {
  BOARD_MUTATIONS,
  BoardError,
  nodesOf,
  ownerAndName,
  send,
  sendOne,
  type BoardRequest,
} from "./board-request.js";
import { graphql, readNodes } from "./github-graphql.js";
import type { GitHubApi } from "./repo-settings.js";
import { errorMessage, isRecord } from "./unknown.js";

// The labels: the pair an open Spec carries by ADR 0025.

/** Node ids by repository (`owner/name`), then by the name of what each one is the id of. */
export type IdsByRepository = Readonly<
  Partial<Record<string, Readonly<Partial<Record<string, string>>>>>
>;

/** What `board:labels` needs to know to write the labels, as the API answers it. */
export interface LabelState {
  /** The open issues of both repositories. */
  issues: readonly BoardIssue[];
  /**
   * The node id of each label the plan may write, by repository
   * (`owner/name`) then name; a label missing from a repository is absent.
   */
  labelIds: IdsByRepository;
}

/** What `board:labels` will write, and what it found. */
export interface BoardLabelPlan {
  /** The requests to send, in order. */
  requests: BoardRequest[];
  /** How many open Specs of both repositories it read. */
  specs: number;
  /** How many of them already carry the right pair. */
  kept: number;
}

/**
 * The requests that give every open Spec of both repositories the labels
 * `specLabelsOf` derives, in its own repository's labels: one add and one
 * removal at most per Spec, and nothing for a Spec already right. Stops
 * with a `BoardError` naming a label it must write that its repository
 * lacks.
 */
export function planBoardLabels(state: LabelState): BoardLabelPlan {
  const requests: BoardRequest[] = [];
  let specs = 0;
  let kept = 0;
  for (const issue of state.issues) {
    if (!BOARD_REPOSITORIES.includes(issue.repository)) continue;
    const change = specLabelsOf(issue);
    if (change === null) continue;
    specs++;
    const { add, remove } = change;
    if (add.length === 0 && remove.length === 0) {
      kept++;
      continue;
    }
    const ids = (names: readonly string[]): string[] =>
      names.map((name) => {
        const id = state.labelIds[issue.repository]?.[name];
        if (id === undefined) {
          throw new BoardError(
            `The label ${name} does not exist in ${issue.repository}: create it there (pnpm repo:settings creates the library's), then run board:labels again.`,
          );
        }
        return id;
      });
    const key = issueKey(issue);
    const reason =
      issue.subIssues.length === 0
        ? "a Spec with no sub-issue"
        : "a Spec with sub-issues";
    if (add.length > 0) {
      requests.push({
        query: BOARD_MUTATIONS.addLabels,
        variables: { labelableId: issue.id, labelIds: ids(add) },
        summary: `Add ${add.join(", ")} to ${key}: ${reason}.`,
      });
    }
    if (remove.length > 0) {
      requests.push({
        query: BOARD_MUTATIONS.removeLabels,
        variables: { labelableId: issue.id, labelIds: ids(remove) },
        summary: `Remove ${remove.join(", ")} from ${key}: ${reason}.`,
      });
    }
  }
  return { requests, specs, kept };
}

/** The aliases of the `Labels` query, by the label each one reads. */
const LABEL_ALIASES: Readonly<Record<string, string>> = {
  [NEEDS_SPLIT_LABEL]: "needsSplit",
  [READY_FOR_AGENT]: "readyForAgent",
};

/** The two labels of an open Spec in one repository, one alias each. */
const LABELS_QUERY = `query Labels($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
${Object.entries(LABEL_ALIASES)
  .map(
    ([name, alias]) =>
      `    ${alias}: label(name: ${JSON.stringify(name)}) { id }`,
  )
  .join("\n")}
  }
}`;

/**
 * What `board:labels` reads through `api` for the labels: the open issues
 * of both repositories and, in each, the ids of the two labels of an open
 * Spec.
 */
export async function readLabelState(api: GitHubApi): Promise<LabelState> {
  const issues: BoardIssue[] = [];
  const labelIds: Record<string, Record<string, string>> = {};
  for (const repository of BOARD_REPOSITORIES) {
    issues.push(...(await readOpenIssues(api, repository)));
    const data = await graphql(api, LABELS_QUERY, ownerAndName(repository));
    const found = isRecord(data.repository) ? data.repository : {};
    labelIds[repository] = Object.fromEntries(
      Object.entries(LABEL_ALIASES).flatMap(([name, alias]) => {
        const label = found[alias];
        return isRecord(label) && typeof label.id === "string"
          ? [[name, label.id]]
          : [];
      }),
    );
  }
  return { issues, labelIds };
}

/**
 * Sends the label plan's requests in order through `api`, calling `sent`
 * after each one that succeeds; stops with a `BoardError` at the first
 * error answer.
 */
export async function applyBoardLabels(
  api: GitHubApi,
  plan: BoardLabelPlan,
  sent: (request: BoardRequest) => void = () => undefined,
): Promise<void> {
  await send(api, plan.requests, sent);
}

// The Issue status: the mirror of the Status on the issue itself (#958).

/** The values of the Issue status an open issue takes; GitHub's closed ones (Done, Not planned, Duplicate) are never written. */
export type OpenIssueStatus = "Backlog" | "Todo" | "In progress" | "In review";

/**
 * The Issue status of each Status an open issue takes. GitHub moves a card
 * when its issue's Issue status takes a value the board's Status has too
 * (measured in #959: Backlog moved a Blocked card to Backlog at once, Todo
 * left it), so Blocked reads Todo, which the board lacks, and every other
 * value is one that moves the card where the reconcile puts it anyway. No
 * Done: a closed issue keeps the Issue status GitHub gave it.
 */
export const ISSUE_STATUS_OF: Readonly<
  Record<Exclude<Status, "Done">, OpenIssueStatus>
> = {
  Backlog: "Backlog",
  Blocked: "Todo",
  Ready: "Todo",
  "In progress": "In progress",
  "In review": "In review",
};

/**
 * The Issue statuses of both Board repositories, as the API answers them:
 * read apart from the issues (`readIssueStatuses`), since the feature is a
 * preview and its fields may change.
 */
export interface IssueStatusState {
  /**
   * The node id of each Issue status a repository has, by repository then
   * name; a repository without Issue statuses has none.
   */
  ids: IdsByRepository;
  /**
   * The Issue status of each issue this read saw open, by its key
   * (`issueKey`): its name, or `null` when it has none. An issue absent was
   * not open at this read, and is never written.
   */
  current: Readonly<Partial<Record<string, string | null>>>;
}

/** What `board:labels` will write of the Issue statuses, and what it found. */
export interface IssueStatusPlan {
  /** The requests to send, in order. */
  requests: BoardRequest[];
  /** How many open issues it looked at: the ones the board holds or will hold. */
  issues: number;
  /** How many of them already read as their Status maps. */
  kept: number;
  /** What it cannot write, one sentence each: a repository or a value without Issue statuses. */
  warnings: string[];
}

/**
 * The requests that give every open issue the board holds or will hold (an
 * open issue of a Board repository that no bot but the App authored,
 * whether or not it has an item yet) the Issue status `ISSUE_STATUS_OF`
 * maps its Status to, the Status `statusOf` derives among `read`, the open
 * issues of both repositories as the labels read them, as the reconcile
 * does; nothing for one that already reads so, and never anything for a
 * closed issue. `statuses` is a later read: an issue it did not see open
 * (closed in between) gets nothing, since an open value would reopen it. A
 * repository without Issue statuses plans none and is named once in
 * `warnings`, as is each value a repository lacks.
 */
export function planIssueStatuses(
  read: readonly BoardIssue[],
  statuses: IssueStatusState,
): IssueStatusPlan {
  const lookup = issueLookup(read);
  const requests: BoardRequest[] = [];
  const warnings = new Set<string>();
  let issues = 0;
  let kept = 0;
  for (const issue of read) {
    if (
      issue.bot ||
      issue.state !== "OPEN" ||
      !BOARD_REPOSITORIES.includes(issue.repository)
    ) {
      continue;
    }
    const key = issueKey(issue);
    const current = statuses.current[key];
    // Not open any more when the Issue statuses were read: the next run's.
    if (current === undefined) continue;
    const status = statusOf(issue, lookup);
    // An open issue is never Done.
    if (status === "Done") continue;
    issues++;
    const value = ISSUE_STATUS_OF[status];
    if (current !== null && sameName(current, value)) {
      kept++;
      continue;
    }
    const ids = Object.entries(statuses.ids[issue.repository] ?? {});
    if (ids.length === 0) {
      warnings.add(
        `${issue.repository} has no Issue statuses: none is written there.`,
      );
      continue;
    }
    const statusId = ids.find(([name]) => sameName(name, value))?.[1];
    if (statusId === undefined) {
      warnings.add(
        `${issue.repository} has no Issue status named ${value}: it is written on no issue there.`,
      );
      continue;
    }
    requests.push({
      query: BOARD_MUTATIONS.setIssueStatus,
      variables: { issueId: issue.id, statusId },
      summary: `Set the Issue status of ${key} to ${value}${current === null ? "" : ` (was ${current})`}.`,
    });
  }
  return { requests, issues, kept, warnings: [...warnings] };
}

/**
 * The queries of the Issue status, a public preview: kept out of every
 * other document, so that a field GitHub renames or removes fails these
 * two and nothing else.
 */
const ISSUE_STATUS_QUERIES = {
  // In display order; `null` where the repository has none. They are few
  // (seven on 2026-11-26) and the API has no mutation that adds one.
  statuses: `query IssueStatuses($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    planningStatuses(first: 50) { nodes { id name } }
  }
}`,
  // `status` is `null` on an issue that has none.
  open: `query OpenIssueStatuses($owner: String!, $name: String!, $first: Int!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    issues(states: OPEN, first: $first, after: $cursor, orderBy: { field: CREATED_AT, direction: ASC }) {
      pageInfo { hasNextPage endCursor }
      nodes { number status { name } }
    }
  }
}`,
} as const;

/**
 * The Issue statuses, read through `api`: in each Board repository, the
 * ids of its Issue statuses by name and the Issue status of each open
 * issue, `null` for one that has none. Rejects when GitHub refuses a
 * query, as it would once the preview's fields change: the caller warns
 * and writes none.
 */
export async function readIssueStatuses(
  api: GitHubApi,
): Promise<IssueStatusState> {
  const ids: Record<string, Record<string, string>> = {};
  const current: Record<string, string | null> = {};
  for (const repository of BOARD_REPOSITORIES) {
    const variables = ownerAndName(repository);
    const data = await graphql(api, ISSUE_STATUS_QUERIES.statuses, variables);
    ids[repository] = Object.fromEntries(
      nodesOf(
        isRecord(data.repository)
          ? data.repository.planningStatuses
          : undefined,
      ).flatMap((status) =>
        isRecord(status) &&
        typeof status.id === "string" &&
        typeof status.name === "string"
          ? [[status.name, status.id]]
          : [],
      ),
    );
    const nodes = await readNodes(api, ISSUE_STATUS_QUERIES.open, variables, [
      "repository",
      "issues",
    ]);
    for (const node of nodes) {
      if (!isRecord(node) || typeof node.number !== "number") continue;
      current[issueKey({ repository, number: node.number })] =
        isRecord(node.status) && typeof node.status.name === "string"
          ? node.status.name
          : null;
    }
  }
  return { ids, current };
}

/**
 * Sends the Issue status plan's requests in order through `api`, calling
 * `sent` after each one that succeeds. The Issue status is a mirror on a
 * preview API: a refused request stops nothing, the ones after it are still
 * sent, and it resolves with one warning per refusal, naming the issue and
 * the value not written.
 */
export async function applyIssueStatuses(
  api: GitHubApi,
  plan: IssueStatusPlan,
  sent: (request: BoardRequest) => void = () => undefined,
): Promise<string[]> {
  const refused: string[] = [];
  for (const request of plan.requests) {
    try {
      await sendOne(api, request);
    } catch (error) {
      refused.push(errorMessage(error));
      continue;
    }
    sent(request);
  }
  return refused;
}
