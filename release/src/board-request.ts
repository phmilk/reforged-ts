/**
 * The request plumbing of the board modules: what a request is
 * (`BoardRequest`), the mutations the three writers send
 * (`BOARD_MUTATIONS`), the error they stop with (`BoardError`), how a
 * request is printed and sent, and the readers of a GraphQL answer the
 * modules share. The lowest of the five board modules: it imports none of
 * the others, and importers outside them read it through `board.ts`.
 */
import { graphql } from "./github-graphql.js";
import type { GitHubApi } from "./repo-settings.js";
import { errorMessage, isRecord } from "./unknown.js";

/** One GraphQL mutation that changes the board. */
export interface BoardRequest {
  /** The mutation's document; every value travels as a variable. */
  query: string;
  variables: Readonly<Record<string, unknown>>;
  /** What it does, in one sentence. */
  summary: string;
}

/** A state the script cannot use, an answer it cannot read, or a request GitHub refused. */
export class BoardError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "BoardError";
  }
}

/** The mutations the plan sends, each named after what it does. */
export const BOARD_MUTATIONS = {
  createProject: `mutation CreateProject($ownerId: ID!, $title: String!) {
  createProjectV2(input: { ownerId: $ownerId, title: $title }) {
    projectV2 { id number url }
  }
}`,
  updateProject: `mutation UpdateProject($projectId: ID!, $readme: String!, $public: Boolean!) {
  updateProjectV2(input: { projectId: $projectId, readme: $readme, public: $public }) {
    projectV2 { id }
  }
}`,
  updateStatusOptions: `mutation UpdateStatusOptions($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
  updateProjectV2Field(input: { fieldId: $fieldId, singleSelectOptions: $options }) {
    projectV2Field { ... on ProjectV2SingleSelectField { id } }
  }
}`,
  createView: `mutation CreateView($projectId: ID!, $name: String!, $layout: ProjectV2ViewLayout!, $fields: [ID!]!) {
  createProjectV2View(input: { projectId: $projectId, name: $name, layout: $layout, configuration: { visibleFieldIds: $fields } }) {
    projectV2View { id }
  }
}`,
  updateView: `mutation UpdateView($viewId: ID!, $name: String!, $layout: ProjectV2ViewLayout!, $fields: [ID!]!) {
  updateProjectV2View(input: { viewId: $viewId, name: $name, layout: $layout, configuration: { visibleFieldIds: $fields } }) {
    projectV2View { id }
  }
}`,
  linkRepository: `mutation LinkRepository($projectId: ID!, $repositoryId: ID!) {
  linkProjectV2ToRepository(input: { projectId: $projectId, repositoryId: $repositoryId }) {
    repository { id }
  }
}`,
  addItem: `mutation AddItem($projectId: ID!, $contentId: ID!) {
  addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
    item { id }
  }
}`,
  updateItemStatus: `mutation UpdateItemStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
  updateProjectV2ItemFieldValue(input: { projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: { singleSelectOptionId: $optionId } }) {
    projectV2Item { id }
  }
}`,
  archiveItem: `mutation ArchiveItem($projectId: ID!, $itemId: ID!) {
  archiveProjectV2Item(input: { projectId: $projectId, itemId: $itemId }) {
    item { id }
  }
}`,
  unarchiveItem: `mutation UnarchiveItem($projectId: ID!, $itemId: ID!) {
  unarchiveProjectV2Item(input: { projectId: $projectId, itemId: $itemId }) {
    item { id }
  }
}`,
  deleteItem: `mutation DeleteItem($projectId: ID!, $itemId: ID!) {
  deleteProjectV2Item(input: { projectId: $projectId, itemId: $itemId }) {
    deletedItemId
  }
}`,
  addLabels: `mutation AddLabels($labelableId: ID!, $labelIds: [ID!]!) {
  addLabelsToLabelable(input: { labelableId: $labelableId, labelIds: $labelIds }) {
    clientMutationId
  }
}`,
  removeLabels: `mutation RemoveLabels($labelableId: ID!, $labelIds: [ID!]!) {
  removeLabelsFromLabelable(input: { labelableId: $labelableId, labelIds: $labelIds }) {
    clientMutationId
  }
}`,
  // The Issue status is a public preview, "subject to change": GitHub's
  // changelog of 2026-11-23, "Issue statuses and repository boards are in
  // public preview". The mutation closes or reopens the issue when the
  // value calls for it, so the plan sends an open value to an open issue
  // only (`ISSUE_STATUS_OF`). It needs `public_repo` of a classic token, so
  // the App's token sends it and the board's (`project` alone) cannot (#959).
  setIssueStatus: `mutation SetIssueStatus($issueId: ID!, $statusId: ID!) {
  setIssueStatus(input: { issueId: $issueId, statusId: $statusId }) {
    issue { id }
  }
}`,
} as const;

/** The `owner` and `name` of a repository named `owner/name`. */
export function ownerAndName(repository: string): {
  owner: string;
  name: string;
} {
  const slash = repository.indexOf("/");
  return {
    owner: repository.slice(0, slash),
    name: repository.slice(slash + 1),
  };
}

/** The operation and its variables, as the document declares them. */
function signature(query: string): string {
  const brace = query.indexOf("{");
  return (brace === -1 ? query : query.slice(0, brace))
    .trim()
    .replaceAll(/\s+/g, " ");
}

/** One request for a person to read: what it does, the operation, the variables. */
export function describeRequest({
  query,
  variables,
  summary,
}: BoardRequest): string {
  return `${summary}\n${signature(query)}\n${JSON.stringify(variables, null, 2)}\n`;
}

/** The `nodes` of a connection, or none. */
export function nodesOf(connection: unknown): unknown[] {
  return isRecord(connection) && Array.isArray(connection.nodes)
    ? (connection.nodes as unknown[])
    : [];
}

/** The string `key` of each node of a connection, in order. */
export function namesOf(connection: unknown, key: string): string[] {
  return nodesOf(connection).flatMap((node) => {
    const value = isRecord(node) ? node[key] : undefined;
    return typeof value === "string" ? [value] : [];
  });
}

/** Sends one request and resolves with its `data`; a refusal names what was not done. */
export async function sendOne(
  api: GitHubApi,
  request: BoardRequest,
): Promise<Record<string, unknown>> {
  try {
    return await graphql(api, request.query, request.variables);
  } catch (error) {
    throw new BoardError(`${errorMessage(error)} Not done: ${request.summary}`);
  }
}

/** Sends `requests` in order, calling `sent` after each one that succeeds. */
export async function send(
  api: GitHubApi,
  requests: readonly BoardRequest[],
  sent: (request: BoardRequest) => void,
): Promise<void> {
  for (const request of requests) {
    await sendOne(api, request);
    sent(request);
  }
}
