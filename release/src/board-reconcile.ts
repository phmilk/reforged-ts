/**
 * `board:reconcile`, programmatic entry point: the board's single writer
 * of Status. `planBoardReconcile` turns the project's items and the open
 * issues of both repositories into the writes that make the board agree
 * with GitHub, membership and archiving included, each Status by the rules
 * of `statusOf`; `readReconcileState` reads them on the setup's state
 * reader, and `applyBoardReconcile` sends the plan. Importers outside the
 * board modules read it through `board.ts`.
 */
import {
  BOARD_OWNER,
  BOARD_REPOSITORIES,
  BOARD_TITLE,
  placeholder,
  readBoardState,
  sameName,
  STATUS_FIELD,
  statusFieldOf,
  type ProjectState,
  type Status,
} from "./board-definition.js";
import {
  BOARD_ISSUE_FRAGMENT,
  issueKey,
  issueLookup,
  readIssue,
  readOpenIssues,
  readRef,
  statusOf,
  type BoardIssue,
} from "./board-issues.js";
import {
  BOARD_MUTATIONS,
  BoardError,
  sendOne,
  type BoardRequest,
} from "./board-request.js";
import { readNodes } from "./github-graphql.js";
import type { GitHubApi } from "./repo-settings.js";
import { isRecord } from "./unknown.js";

/** What an item of the project holds, as the API answers it. */
export type ItemContent =
  | { type: "ISSUE"; issue: BoardIssue }
  | { type: "PULL_REQUEST"; repository: string; number: number }
  | { type: "DRAFT_ISSUE" }
  /** An item whose content the token cannot see. */
  | { type: "REDACTED" };

/** An item of the project, as the API answers it. */
export interface ProjectItem {
  id: string;
  archived: boolean;
  content: ItemContent;
  /** The name of its Status value; `null` when none is set. */
  status: string | null;
}

/** What the reconcile needs to know, as the API answers it. */
export interface ReconcileState {
  /** The login the token belongs to. */
  viewer: string;
  project: ProjectState;
  /** Every item of the project, archived ones included. */
  items: readonly ProjectItem[];
  /** The open issues of both repositories, bots included. */
  issues: readonly BoardIssue[];
}

/** A request of the reconcile: a mutation, and after an add the Status write of the item it makes. */
export interface ReconcileRequest extends BoardRequest {
  /**
   * On an add, the write that follows it on the item GitHub answers with
   * (`addProjectV2ItemById.item.id`); its `itemId` is a placeholder until
   * then.
   */
  followUp?: BoardRequest;
}

export interface BoardReconcilePlan {
  /** The requests to send, in order. */
  requests: ReconcileRequest[];
  /** How many items are left as they are. */
  kept: number;
}

/** The days a closed issue stays Done on the board before its item is archived. */
export const ARCHIVE_AFTER_DAYS = 14;

const DAY = 24 * 60 * 60 * 1000;

/**
 * The most items one run removes from the board unless told otherwise: a
 * token that sees no issue, or a bug, would otherwise empty it in one run,
 * and an item removed loses its place and its Status history.
 */
export const MAX_DELETES = 10;

/** What a run of the reconcile may do beyond the defaults. */
export interface ReconcileLimits {
  /** The most items the plan may remove; `MAX_DELETES` when not given. */
  maxDeletes?: number;
}

/** The issue an item holds and keeps a place for, or why the item goes. */
function membershipOf(
  content: ItemContent,
): { member: BoardIssue } | { remove: string } {
  switch (content.type) {
    case "ISSUE":
      return content.issue.bot
        ? { remove: "an issue of a bot" }
        : BOARD_REPOSITORIES.includes(content.issue.repository)
          ? { member: content.issue }
          : { remove: "an issue of another repository" };
    case "PULL_REQUEST":
      return { remove: "a pull request" };
    case "DRAFT_ISSUE":
      return { remove: "a draft item" };
    case "REDACTED":
      return { remove: "an item the token cannot see" };
  }
}

/** What an item holds, for a person. */
function itemName(content: ItemContent): string {
  switch (content.type) {
    case "ISSUE":
      return issueKey(content.issue);
    case "PULL_REQUEST":
      return `the pull request ${issueKey(content)}`;
    case "DRAFT_ISSUE":
      return "a draft item";
    case "REDACTED":
      return "a redacted item";
  }
}

/**
 * The requests that make the board agree with GitHub, given its `state` at
 * `now`, and nothing when it already does. Membership both ways: every open
 * issue of both repositories that no bot but the App authored is added when
 * it has no item (its Status written on the item the add makes), and an
 * item that holds anything else (a pull request, another bot's issue, an
 * issue of another repository, a draft, a redacted item) is removed. Each
 * item's Status is set to what `statusOf` gives its issue when it differs.
 * A closed issue stays Done until its own `updatedAt` is
 * `ARCHIVE_AFTER_DAYS` old, then its item is archived; an archived item
 * whose issue is open is unarchived, and its Status written. A closed issue
 * is never added. A plan that removes more items than `limits.maxDeletes`
 * (`MAX_DELETES`) is refused with a `BoardError` that lists the removals
 * and names the flag that allows them: the brake against a run that would
 * empty the board.
 */
export function planBoardReconcile(
  state: ReconcileState,
  now: Date,
  limits: ReconcileLimits = {},
): BoardReconcilePlan {
  const { project, items, issues } = state;
  const status = statusFieldOf(project, ": run board:setup first");
  const options = status.options;
  const optionId = (value: Status): string => {
    const option = options.find(({ name }) => sameName(name, value));
    if (option === undefined) {
      throw new BoardError(
        `The ${STATUS_FIELD} field has no option named ${value}: run board:setup first.`,
      );
    }
    return option.id;
  };
  const projectId = project.id;
  const statusWrite = (
    itemId: string,
    value: Status,
  ): Omit<BoardRequest, "summary"> => ({
    query: BOARD_MUTATIONS.updateItemStatus,
    variables: {
      projectId,
      itemId,
      fieldId: status.id,
      optionId: optionId(value),
    },
  });
  const itemRequest = (
    query: string,
    itemId: string,
    summary: string,
  ): ReconcileRequest => ({
    query,
    variables: { projectId, itemId },
    summary,
  });

  const lookup = issueLookup(issues);
  const requests: ReconcileRequest[] = [];
  let kept = 0;
  const members = new Set<string>();
  for (const item of items) {
    const before = requests.length;
    const membership = membershipOf(item.content);
    if ("remove" in membership) {
      requests.push(
        itemRequest(
          BOARD_MUTATIONS.deleteItem,
          item.id,
          `Remove ${itemName(item.content)} from the board: ${membership.remove}.`,
        ),
      );
      continue;
    }
    const issue = membership.member;
    const key = issueKey(issue);
    members.add(key);
    if (issue.state === "CLOSED") {
      if (item.archived) {
        kept++;
        continue;
      }
      const updated = Date.parse(issue.updatedAt);
      if (
        !Number.isNaN(updated) &&
        now.getTime() - updated >= ARCHIVE_AFTER_DAYS * DAY
      ) {
        requests.push(
          itemRequest(
            BOARD_MUTATIONS.archiveItem,
            item.id,
            `Archive ${key}: closed, and not updated since ${issue.updatedAt.slice(0, 10)}.`,
          ),
        );
        continue;
      }
    } else if (item.archived) {
      requests.push(
        itemRequest(
          BOARD_MUTATIONS.unarchiveItem,
          item.id,
          `Unarchive ${key}: its issue is open.`,
        ),
      );
    }
    const value = statusOf(issue, lookup);
    if (item.status === null || !sameName(item.status, value)) {
      requests.push({
        ...statusWrite(item.id, value),
        summary: `Set the Status of ${key} to ${value}${item.status === null ? "" : ` (was ${item.status})`}.`,
      });
    }
    if (requests.length === before) kept++;
  }

  for (const issue of issues) {
    const key = issueKey(issue);
    if (
      issue.bot ||
      issue.state !== "OPEN" ||
      !BOARD_REPOSITORIES.includes(issue.repository) ||
      members.has(key)
    ) {
      continue;
    }
    const value = statusOf(issue, lookup);
    requests.push({
      query: BOARD_MUTATIONS.addItem,
      variables: { projectId, contentId: issue.id },
      summary: `Add ${key} to the board, then set its Status to ${value}.`,
      followUp: {
        ...statusWrite(placeholder(`the id of the item of ${key}`), value),
        summary: `Set the Status of ${key}, once added, to ${value}.`,
      },
    });
  }

  const maxDeletes = limits.maxDeletes ?? MAX_DELETES;
  const deletes = requests.filter(
    ({ query }) => query === BOARD_MUTATIONS.deleteItem,
  );
  if (deletes.length > maxDeletes) {
    throw new BoardError(
      `Refused: the plan removes ${String(deletes.length)} items from the board, more than the ${String(maxDeletes)} one run may remove, and nothing was sent. The removals: ${deletes.map(({ summary }) => summary).join(" ")} When they are right, run board:reconcile --max-deletes ${String(deletes.length)}.`,
    );
  }

  return { requests, kept };
}

/**
 * Every item of the project, paged with `$first` and `$cursor`. Archived
 * items are left out unless asked for: both states, so that an archived
 * item of a reopened issue is found and unarchived, not added.
 */
const ITEMS_QUERY = `query ProjectItems($projectId: ID!, $status: String!, $first: Int!, $cursor: String) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: $first, after: $cursor, archivedStates: [ARCHIVED, NOT_ARCHIVED]) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id type isArchived
          content {
            __typename
            ... on Issue { ...BoardIssue }
            ... on PullRequest { number repository { nameWithOwner } }
          }
          status: fieldValueByName(name: $status) {
            ... on ProjectV2ItemFieldSingleSelectValue { name }
          }
        }
      }
    }
  }
}
${BOARD_ISSUE_FRAGMENT}`;

/** An item node of `ProjectItems`; stops on one the reconcile cannot read. */
function readItem(node: unknown): ProjectItem {
  if (
    !isRecord(node) ||
    typeof node.id !== "string" ||
    typeof node.type !== "string"
  ) {
    throw new BoardError(
      "ProjectItems answered an item without an id and a type.",
    );
  }
  let content: ItemContent;
  if (node.type === "ISSUE") {
    const issue = readIssue(node.content);
    if (issue === undefined) {
      throw new BoardError(
        `ProjectItems answered the item ${node.id} of an issue without the issue's fields.`,
      );
    }
    content = { type: "ISSUE", issue };
  } else if (node.type === "PULL_REQUEST") {
    const ref = readRef(node.content);
    if (ref === undefined) {
      throw new BoardError(
        `ProjectItems answered the item ${node.id} of a pull request without its number and repository.`,
      );
    }
    content = { type: "PULL_REQUEST", ...ref };
  } else {
    content = {
      type: node.type === "DRAFT_ISSUE" ? "DRAFT_ISSUE" : "REDACTED",
    };
  }
  return {
    id: node.id,
    archived: node.isArchived === true,
    content,
    status:
      isRecord(node.status) && typeof node.status.name === "string"
        ? node.status.name
        : null,
  };
}

/** Every item of the project `projectId`, archived ones included. */
export async function readProjectItems(
  api: GitHubApi,
  projectId: string,
): Promise<ProjectItem[]> {
  const nodes = await readNodes(
    api,
    ITEMS_QUERY,
    { projectId, status: STATUS_FIELD },
    ["node", "items"],
  );
  return nodes.map(readItem);
}

/**
 * The reconcile's state, read through `api`: the project of `BOARD_TITLE`
 * with its fields, every item of it and the open issues of both
 * repositories. Stops with a `BoardError` when no project has the title:
 * `board:setup` makes it.
 */
export async function readReconcileState(
  api: GitHubApi,
): Promise<ReconcileState> {
  const board = await readBoardState(api);
  if (board.project === null) {
    throw new BoardError(
      `No project "${BOARD_TITLE}" under ${BOARD_OWNER}: run board:setup first.`,
    );
  }
  const items = await readProjectItems(api, board.project.id);
  const issues: BoardIssue[] = [];
  for (const repository of BOARD_REPOSITORIES) {
    issues.push(...(await readOpenIssues(api, repository)));
  }
  return { viewer: board.viewer, project: board.project, items, issues };
}

/**
 * Sends the plan's requests in order through `api`, calling `sent` after
 * each one that succeeds; an add is followed by the Status write of the
 * item GitHub answered with. Stops with a `BoardError` at the first error
 * answer.
 */
export async function applyBoardReconcile(
  api: GitHubApi,
  plan: BoardReconcilePlan,
  sent: (request: BoardRequest) => void = () => undefined,
): Promise<void> {
  for (const request of plan.requests) {
    const data = await sendOne(api, request);
    sent(request);
    if (request.followUp === undefined) continue;
    const added = isRecord(data.addProjectV2ItemById)
      ? data.addProjectV2ItemById.item
      : undefined;
    if (!isRecord(added) || typeof added.id !== "string") {
      throw new BoardError(
        `AddItem answered no item id. Not done: ${request.followUp.summary}`,
      );
    }
    const write: BoardRequest = {
      ...request.followUp,
      variables: { ...request.followUp.variables, itemId: added.id },
    };
    await sendOne(api, write);
    sent(write);
  }
}
