/**
 * `board:setup`, programmatic entry point: the Claim board as code. The
 * board is one Projects (v2) project on the owner's account, public, over
 * both repositories (ADR 0016): its title, its Status field, its views, its
 * README, its visibility and its repository links are the constants below.
 * `planBoardSetup` turns them and the project's current state into the
 * GraphQL mutations that make the project match, creating it when it is
 * missing; the CLI reads the state and sends them with the maintainer's `gh`
 * authentication, which holds the `project` scope. The Status rules and the
 * reconcile that writes each item's value (`board:reconcile`) build on the
 * same state reader and GraphQL layer.
 */
import type { ApiResponse, GitHubApi } from "./repo-settings.js";
import { errorMessage, isRecord } from "./unknown.js";

/** The owner of the project and of both repositories: the maintainer's account. */
export const BOARD_OWNER = "phmilk";

/** The project's title: how `board:setup` finds it among the owner's projects. */
export const BOARD_TITLE = "Claim board";

/** The repositories the board spans and is linked to, as `owner/name`. */
export const BOARD_REPOSITORIES: readonly string[] = [
  `${BOARD_OWNER}/reforged-ts`,
  `${BOARD_OWNER}/reforged-ts-template`,
];

/** The built-in single select whose options the board rewrites in place. */
export const STATUS_FIELD = "Status";

/** The colour of an option, as GitHub's `ProjectV2SingleSelectFieldOptionColor` names them. */
export type OptionColor =
  "GRAY" | "BLUE" | "GREEN" | "YELLOW" | "ORANGE" | "RED" | "PINK" | "PURPLE";

export interface StatusOption {
  name: string;
  color: OptionColor;
  /** One line, shown under the name wherever the field is edited. */
  description: string;
}

/**
 * The six values of Status, in the order the Board view's columns show
 * them. Every value is derived from GitHub state by the reconcile, whose
 * rules the descriptions summarise, and never set by hand.
 */
export const STATUS_OPTIONS = [
  {
    name: "Backlog",
    color: "GRAY",
    description:
      "Everything else: needs-triage, needs-info, no label, a parent with no open child.",
  },
  {
    name: "Ready",
    color: "BLUE",
    description:
      "Takeable now: ready-for-agent, ready-for-human, or a frontier ticket of a wayfinder map.",
  },
  {
    name: "Blocked",
    color: "RED",
    description: "An open blocker, whatever the labels.",
  },
  {
    name: "In progress",
    color: "YELLOW",
    description: "An assignee: the Claim.",
  },
  {
    name: "In review",
    color: "PURPLE",
    description: "An open pull request that is not a draft closes it.",
  },
  {
    name: "Done",
    color: "GREEN",
    description: "The issue is closed.",
  },
] as const satisfies readonly StatusOption[];

/** A value of Status. */
export type Status = (typeof STATUS_OPTIONS)[number]["name"];

/** The layout of a view, as GitHub's `ProjectV2ViewLayout` names them; no roadmap. */
export type ViewLayout = "BOARD_LAYOUT" | "TABLE_LAYOUT";

export interface BoardView {
  name: string;
  layout: ViewLayout;
  /**
   * The visible fields by name, in order, Title first: GitHub shows Title on
   * every view and reads it back on a board even when it was not sent, so
   * the definition names it to compare equal with what is read.
   */
  fields: readonly string[];
}

/** The columns of both tables. */
const TABLE_FIELDS: readonly string[] = [
  "Title",
  "Assignees",
  "Status",
  "Repository",
  "Labels",
  "Parent issue",
  "Sub-issues progress",
  "Linked pull requests",
];

/**
 * The three views. The API sets a view's name, layout and visible fields.
 * The Board view's column field (Status) and the tables' group-by (Assignees
 * for "By assignee", Parent issue for "By parent") are UI-only: the code
 * does not set them, and the board stage of the repository-setup wizard
 * lists them as hand steps. A board the API creates takes Status as its
 * column field by itself (measured on the prototype).
 */
export const BOARD_VIEWS: readonly BoardView[] = [
  // The repository shows in the card footer, so no Repository field here.
  {
    name: "Board",
    layout: "BOARD_LAYOUT",
    fields: ["Title", "Assignees", "Labels", "Parent issue"],
  },
  // Grouped by Assignees: who holds what.
  { name: "By assignee", layout: "TABLE_LAYOUT", fields: TABLE_FIELDS },
  // Grouped by Parent issue: each spec with its tickets.
  { name: "By parent", layout: "TABLE_LAYOUT", fields: TABLE_FIELDS },
];

/** The Claim section of the tracker doc, which holds the protocol in full. */
export const CLAIM_DOC_URL =
  "https://github.com/phmilk/reforged-ts/blob/master/docs/agents/issue-tracker.md#claim";

/** The project's README: the rules in prose, and that nothing here is moved by hand. */
export const BOARD_README = `# Claim board

Every open issue of [phmilk/reforged-ts](https://github.com/phmilk/reforged-ts) and [phmilk/reforged-ts-template](https://github.com/phmilk/reforged-ts-template), with a Status derived from GitHub state. One reconcile workflow in phmilk/reforged-ts is the board's single writer: it reads every open issue of both repositories, computes each Status by the rules below and writes only the differences, hourly and on every issue and pull-request event. Every value is derived, and nothing here is moved by hand: a card moved by hand is put back by the next run.

## Status

Precedence top-down; the first rule that matches wins.

- **Done**: the issue is closed.
- **In review**: an open pull request that is not a draft closes it.
- **In progress**: it has an assignee, the Claim. A draft pull request keeps it here.
- A parent (a spec, a map) with open sub-issues and none of the above takes the highest value among its open sub-issues, by the order Backlog < Blocked < Ready < In progress < In review.
- **Blocked**: it has an open blocker, whatever its labels.
- **Ready**: \`ready-for-agent\`, \`ready-for-human\`, or an open child of a \`wayfinder:map\` (a frontier ticket); takeable now.
- **Backlog**: everything else: \`needs-triage\`, \`needs-info\`, no label, a parent with no open child.

## Members

Every open issue of both repositories; no pull request, no bot item. Specs and maps as parents, whose sub-issues GitHub adds by itself. A closed issue stays Done for two weeks after its last update, then its item is archived; reopened, it is back.

## Views

**Board**, by Status. **By assignee**, a table grouped by Assignees: who holds what. **By parent**, a table grouped by Parent issue: each spec with its tickets. No "Mine" view: filter a table on \`assignee:@me\`.

## The Claim

The assignee is the Claim: before working on an issue, a Collaborator or an Agent assigns itself, as its first write, and an issue assigned to another login is theirs. The protocol in full, the stale rule and the takeover included, is the [Claim section of the tracker doc](${CLAIM_DOC_URL}). Nothing in it requires reading this board: the assignee on the issue is the source, the board a view of it. The board's definition is code, \`release/src/board.ts\` of phmilk/reforged-ts: \`pnpm board:setup\` rebuilds this project from it.
`;

/** An option of a single select, as the API answers it. */
export interface SelectOption {
  /**
   * A short string, not a node id. Sent back on a rewrite, it keeps the
   * option's identity and with it the items' values.
   */
  id: string;
  name: string;
  color: string;
  description: string;
}

/** A field of the project, as the API answers it. */
export interface ProjectField {
  id: string;
  name: string;
  /** GitHub's `ProjectV2FieldType`: `SINGLE_SELECT` for Status. */
  dataType: string;
  /** The options of a single select, in order; absent on the other kinds. */
  options?: readonly SelectOption[];
}

/** A view of the project, as the API answers it. */
export interface ProjectView {
  id: string;
  name: string;
  /** GitHub's `ProjectV2ViewLayout`. */
  layout: string;
  /** The visible fields by name, in the configured order. */
  fields: readonly string[];
}

/** The project, as the API answers it. */
export interface ProjectState {
  id: string;
  number: number;
  url: string;
  title: string;
  public: boolean;
  /** `null` when none was set. */
  readme: string | null;
  fields: readonly ProjectField[];
  views: readonly ProjectView[];
  /** The linked repositories, as `owner/name`. */
  repositories: readonly string[];
}

/** What the plan needs to know, as the API answers it. */
export interface BoardState {
  /** The login the authentication belongs to; only the owner's writes the board. */
  viewer: string;
  /** The owner's node id, for `createProjectV2`. */
  ownerId: string;
  /** The node id of each of `BOARD_REPOSITORIES`, by `owner/name`. */
  repositoryIds: Readonly<Partial<Record<string, string>>>;
  /** The project of the title under the owner; `null` when none exists. */
  project: ProjectState | null;
}

/** One GraphQL mutation that changes the board. */
export interface BoardRequest {
  /** The mutation's document; every value travels as a variable. */
  query: string;
  variables: Readonly<Record<string, unknown>>;
  /** What it does, in one sentence. */
  summary: string;
}

export interface BoardSetupPlan {
  /** The requests to send, in order. */
  requests: BoardRequest[];
  /** What already matches, one sentence each. */
  unchanged: string[];
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
} as const;

/** The queries that read the state; a connection is paged with `$first` and `$cursor`. */
const QUERIES = {
  owner: `query Owner($owner: String!) {
  viewer { login }
  user(login: $owner) { id }
}`,
  repository: `query Repository($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) { id }
}`,
  projects: `query Projects($owner: String!, $first: Int!, $cursor: String) {
  user(login: $owner) {
    projectsV2(first: $first, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes { id title }
    }
  }
}`,
  project: `query Project($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 { id number title url public readme }
  }
}`,
  fields: `query ProjectFields($projectId: ID!, $first: Int!, $cursor: String) {
  node(id: $projectId) {
    ... on ProjectV2 {
      fields(first: $first, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          ... on ProjectV2FieldCommon { id name dataType }
          ... on ProjectV2SingleSelectField { options { id name color description } }
        }
      }
    }
  }
}`,
  views: `query ProjectViews($projectId: ID!, $first: Int!, $cursor: String) {
  node(id: $projectId) {
    ... on ProjectV2 {
      views(first: $first, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id name layout
          configuration { visibleFields(first: $first) { nodes { ... on ProjectV2FieldCommon { name } } } }
        }
      }
    }
  }
}`,
  repositories: `query ProjectRepositories($projectId: ID!, $first: Int!, $cursor: String) {
  node(id: $projectId) {
    ... on ProjectV2 {
      repositories(first: $first, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes { nameWithOwner }
      }
    }
  }
}`,
} as const;

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Whether two texts match but for line endings and a final newline, which GitHub may store differently. */
const sameText = (a: string | null, b: string) =>
  (a ?? "").replaceAll("\r\n", "\n").trimEnd() ===
  b.replaceAll("\r\n", "\n").trimEnd();

const sameNames = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((name, i) => sameName(name, b[i]));

/** An id the dry run prints where only the created project will give one. */
const placeholder = (what: string) => `<${what}>`;

/**
 * The project as `createProjectV2` makes it, with placeholders for the ids
 * it will have: the plan on a missing project is made against it, so that
 * the dry run prints every request. Its Status comes without options: a
 * real run reads the created project, whose default options are matched by
 * name, and plans those requests again with its ids.
 */
export function freshProject(): ProjectState {
  const names = new Set<string>([
    STATUS_FIELD,
    ...BOARD_VIEWS.flatMap(({ fields }) => fields),
  ]);
  return {
    id: placeholder("the id of the created project"),
    number: 0,
    url: "",
    title: BOARD_TITLE,
    public: false,
    readme: null,
    fields: [...names].map((name) =>
      name === STATUS_FIELD
        ? {
            id: placeholder(`the id of its ${name} field`),
            name,
            dataType: "SINGLE_SELECT",
            options: [],
          }
        : {
            id: placeholder(`the id of its ${name} field`),
            name,
            dataType: "BUILT_IN",
          },
    ),
    views: [],
    repositories: [],
  };
}

/**
 * The state a dry run assumes when GitHub cannot be read (no `gh` login, no
 * `project` scope): no project exists, and the ids are placeholders.
 */
export function assumedState(): BoardState {
  return {
    viewer: "",
    ownerId: placeholder(`the id of ${BOARD_OWNER}`),
    repositoryIds: Object.fromEntries(
      BOARD_REPOSITORIES.map((repository) => [
        repository,
        placeholder(`the id of ${repository}`),
      ]),
    ),
    project: null,
  };
}

const layoutWord = (layout: ViewLayout) =>
  layout === "BOARD_LAYOUT" ? "a board" : "a table";

/**
 * The requests that make the board match this module's definition, given
 * its current `state`: the project created when none has the title, then
 * (on the project as it will be, with placeholder ids) everything; on one
 * that exists, only what differs: the visibility and the README restored,
 * the Status options rewritten when any name, colour or description differs
 * (every option is sent, since the list replaces the set; an option that
 * exists already, matched by name, carries its id, so the items holding it
 * keep their value; one new to GitHub gets no id, and the items that held
 * its old value get it back from the reconcile's next run), a missing view
 * created and a drifted view's name, layout or visible fields updated, a
 * missing repository link added. Options and views are matched by name.
 */
export function planBoardSetup(state: BoardState): BoardSetupPlan {
  const requests: BoardRequest[] = [];
  const unchanged: string[] = [];

  let project = state.project;
  if (project === null) {
    requests.push({
      query: BOARD_MUTATIONS.createProject,
      variables: { ownerId: state.ownerId, title: BOARD_TITLE },
      summary: `Create the project "${BOARD_TITLE}" under ${BOARD_OWNER}.`,
    });
    project = freshProject();
  }

  const makePublic = !project.public;
  const setReadme = !sameText(project.readme, BOARD_README);
  if (makePublic || setReadme) {
    // Both values travel: the one that matches is sent as it is.
    requests.push({
      query: BOARD_MUTATIONS.updateProject,
      variables: { projectId: project.id, readme: BOARD_README, public: true },
      summary:
        makePublic && setReadme
          ? "Make the project public and set its README."
          : makePublic
            ? "Make the project public."
            : "Set the project's README.",
    });
  }
  if (!makePublic) unchanged.push("Visibility: public.");
  if (!setReadme) unchanged.push("README: as committed.");

  const status = project.fields.find(({ name }) =>
    sameName(name, STATUS_FIELD),
  );
  if (status?.options === undefined) {
    throw new BoardError(
      `The project has no single select named ${STATUS_FIELD}.`,
    );
  }
  const names = STATUS_OPTIONS.map(({ name }) => name).join(", ");
  const current = status.options;
  if (
    current.length === STATUS_OPTIONS.length &&
    STATUS_OPTIONS.every(({ name, color, description }, i) => {
      const option = current[i];
      return (
        option.name === name &&
        option.color === color &&
        option.description === description
      );
    })
  ) {
    unchanged.push(`${STATUS_FIELD} options: ${names}.`);
  } else {
    const kept: string[] = [];
    const options = STATUS_OPTIONS.map(({ name, color, description }) => {
      const existing = current.find((option) => sameName(option.name, name));
      if (existing === undefined) return { name, color, description };
      kept.push(name);
      return { id: existing.id, name, color, description };
    });
    requests.push({
      query: BOARD_MUTATIONS.updateStatusOptions,
      variables: { fieldId: status.id, options },
      summary:
        kept.length === 0
          ? `Rewrite the ${STATUS_FIELD} options to ${names}.`
          : `Rewrite the ${STATUS_FIELD} options to ${names}, keeping the ids of ${kept.join(", ")}.`,
    });
  }

  const fields = project.fields;
  const fieldIds = (view: BoardView) =>
    view.fields.map((name) => {
      const field = fields.find((candidate) => sameName(candidate.name, name));
      if (field === undefined) {
        throw new BoardError(
          `The project has no field named ${name}, which the view "${view.name}" shows.`,
        );
      }
      return field.id;
    });
  const keptViews: string[] = [];
  for (const view of BOARD_VIEWS) {
    const ids = fieldIds(view);
    const existing = project.views.find(({ name }) =>
      sameName(name, view.name),
    );
    const shows = `${layoutWord(view.layout)}; ${view.fields.join(", ")}`;
    if (existing === undefined) {
      requests.push({
        query: BOARD_MUTATIONS.createView,
        variables: {
          projectId: project.id,
          name: view.name,
          layout: view.layout,
          fields: ids,
        },
        summary: `Create the view "${view.name}" (${shows}).`,
      });
      continue;
    }
    const drifted = [
      ...(existing.name === view.name
        ? []
        : [`renamed from "${existing.name}"`]),
      ...(existing.layout === view.layout ? [] : ["the layout"]),
      ...(sameNames(existing.fields, view.fields)
        ? []
        : ["the visible fields"]),
    ];
    if (drifted.length === 0) {
      keptViews.push(view.name);
      continue;
    }
    requests.push({
      query: BOARD_MUTATIONS.updateView,
      variables: {
        viewId: existing.id,
        name: view.name,
        layout: view.layout,
        fields: ids,
      },
      summary: `Update the view "${view.name}" (${drifted.join(", ")}) to ${shows}.`,
    });
  }
  if (keptViews.length > 0) unchanged.push(`Views: ${keptViews.join(", ")}.`);

  const linked: string[] = [];
  for (const repository of BOARD_REPOSITORIES) {
    if (project.repositories.some((name) => sameName(name, repository))) {
      linked.push(repository);
      continue;
    }
    const repositoryId = state.repositoryIds[repository];
    if (repositoryId === undefined) {
      throw new BoardError(`The state holds no id for ${repository}.`);
    }
    requests.push({
      query: BOARD_MUTATIONS.linkRepository,
      variables: { projectId: project.id, repositoryId },
      summary: `Link the project to ${repository}.`,
    });
  }
  if (linked.length > 0) unchanged.push(`Repositories: ${linked.join(", ")}.`);

  return { requests, unchanged };
}

/** The GraphQL endpoint, under the API root the REST calls use. */
const GRAPHQL_ENDPOINT = "/graphql";

/** The name of a document's operation (`query Projects(...)` gives `Projects`). */
export function operationName(query: string): string {
  return /^\s*(?:query|mutation)\s+(\w+)/.exec(query)?.[1] ?? "The request";
}

/** GitHub's own message of an error answer, else its status. */
function apiMessage({ status, body }: ApiResponse): string {
  return isRecord(body) && typeof body.message === "string"
    ? `${String(status)} ${body.message}`
    : String(status);
}

/** One error of a GraphQL answer, as `type: message`. */
function graphQlError(error: unknown): string {
  if (!isRecord(error)) return JSON.stringify(error);
  const type = typeof error.type === "string" ? error.type : "";
  const message =
    typeof error.message === "string" ? error.message : JSON.stringify(error);
  return type === "" ? message : `${type}: ${message}`;
}

/**
 * The `data` of the GraphQL document `query`, sent through `api` with
 * `variables`. Stops with a `BoardError` naming the operation on an error
 * answer: GitHub answers 200 with `errors` to most of them, and a missing
 * `project` scope is named with the `gh auth refresh` that adds it.
 */
export async function graphql(
  api: GitHubApi,
  query: string,
  variables: Readonly<Record<string, unknown>> = {},
): Promise<Record<string, unknown>> {
  const operation = operationName(query);
  const response = await api({
    method: "POST",
    endpoint: GRAPHQL_ENDPOINT,
    body: { query, variables },
  });
  if (response.status !== 200) {
    throw new BoardError(`${operation} answered ${apiMessage(response)}.`);
  }
  const { body } = response;
  if (!isRecord(body)) {
    throw new BoardError(`${operation} answered no JSON object.`);
  }
  const errors = Array.isArray(body.errors) ? (body.errors as unknown[]) : [];
  if (errors.length > 0) {
    const scope = errors.some(
      (error) => isRecord(error) && error.type === "INSUFFICIENT_SCOPES",
    )
      ? " The gh login needs the project scope: gh auth refresh -s project."
      : "";
    const detail = errors.map(graphQlError).join("; ");
    throw new BoardError(
      `${operation} answered: ${detail}${detail.endsWith(".") ? "" : "."}${scope}`,
    );
  }
  if (!isRecord(body.data)) {
    throw new BoardError(`${operation} answered no data.`);
  }
  return body.data;
}

const PAGE_SIZE = 100;

/** More pages than any connection the board reads fills. */
const MAX_PAGES = 50;

/**
 * Every node of the connection at `path` in the answers of `query`, page
 * after page: the document takes `$first` (the page size) and `$cursor`
 * (`after`) and selects `pageInfo { hasNextPage endCursor }` and `nodes`.
 */
export async function readNodes(
  api: GitHubApi,
  query: string,
  variables: Readonly<Record<string, unknown>>,
  path: readonly string[],
): Promise<unknown[]> {
  const what = `${operationName(query)}: ${path.join(".")}`;
  const nodes: unknown[] = [];
  let cursor: string | null = null;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await graphql(api, query, {
      ...variables,
      first: PAGE_SIZE,
      cursor,
    });
    let connection: unknown = data;
    for (const key of path) {
      connection = isRecord(connection) ? connection[key] : undefined;
    }
    if (
      !isRecord(connection) ||
      !Array.isArray(connection.nodes) ||
      !isRecord(connection.pageInfo)
    ) {
      throw new BoardError(`${what} is not a connection in the answer.`);
    }
    nodes.push(...(connection.nodes as unknown[]));
    const { hasNextPage, endCursor } = connection.pageInfo;
    if (hasNextPage !== true) return nodes;
    if (typeof endCursor !== "string") {
      throw new BoardError(`${what} has a next page but no cursor.`);
    }
    cursor = endCursor;
  }
  throw new BoardError(`${what} has more than ${String(MAX_PAGES)} pages.`);
}

/** A field node of `ProjectFields`, or nothing when it is not one. */
function readField(node: unknown): ProjectField[] {
  if (
    !isRecord(node) ||
    typeof node.id !== "string" ||
    typeof node.name !== "string" ||
    typeof node.dataType !== "string"
  ) {
    return [];
  }
  const field: ProjectField = {
    id: node.id,
    name: node.name,
    dataType: node.dataType,
  };
  if (!Array.isArray(node.options)) return [field];
  const options = (node.options as unknown[]).flatMap((option) =>
    isRecord(option) &&
    typeof option.id === "string" &&
    typeof option.name === "string" &&
    typeof option.color === "string" &&
    typeof option.description === "string"
      ? [
          {
            id: option.id,
            name: option.name,
            color: option.color,
            description: option.description,
          },
        ]
      : [],
  );
  return [{ ...field, options }];
}

/** A view node of `ProjectViews`, or nothing when it is not one. */
function readView(node: unknown): ProjectView[] {
  if (
    !isRecord(node) ||
    typeof node.id !== "string" ||
    typeof node.name !== "string" ||
    typeof node.layout !== "string"
  ) {
    return [];
  }
  const visible = isRecord(node.configuration)
    ? node.configuration.visibleFields
    : undefined;
  const fields =
    isRecord(visible) && Array.isArray(visible.nodes)
      ? (visible.nodes as unknown[]).flatMap((field) =>
          isRecord(field) && typeof field.name === "string" ? [field.name] : [],
        )
      : [];
  return [{ id: node.id, name: node.name, layout: node.layout, fields }];
}

/** The project `projectId`, with its fields, views and linked repositories. */
export async function readProjectState(
  api: GitHubApi,
  projectId: string,
): Promise<ProjectState> {
  const { node } = await graphql(api, QUERIES.project, { projectId });
  if (
    !isRecord(node) ||
    typeof node.id !== "string" ||
    typeof node.number !== "number" ||
    typeof node.title !== "string" ||
    typeof node.url !== "string" ||
    typeof node.public !== "boolean"
  ) {
    throw new BoardError(`Project answered no project for ${projectId}.`);
  }
  const variables = { projectId };
  const fields = await readNodes(api, QUERIES.fields, variables, [
    "node",
    "fields",
  ]);
  const views = await readNodes(api, QUERIES.views, variables, [
    "node",
    "views",
  ]);
  const repositories = await readNodes(api, QUERIES.repositories, variables, [
    "node",
    "repositories",
  ]);
  return {
    id: node.id,
    number: node.number,
    title: node.title,
    url: node.url,
    public: node.public,
    readme: typeof node.readme === "string" ? node.readme : null,
    fields: fields.flatMap(readField),
    views: views.flatMap(readView),
    repositories: repositories.flatMap((repository) =>
      isRecord(repository) && typeof repository.nameWithOwner === "string"
        ? [repository.nameWithOwner]
        : [],
    ),
  };
}

/**
 * The current state, read through `api`: the login, the owner's id, both
 * repositories' ids, and the project of `BOARD_TITLE` among the owner's
 * projects, the first of that exact title, or `null`.
 */
export async function readBoardState(api: GitHubApi): Promise<BoardState> {
  const owner = await graphql(api, QUERIES.owner, { owner: BOARD_OWNER });
  if (
    !isRecord(owner.viewer) ||
    typeof owner.viewer.login !== "string" ||
    !isRecord(owner.user) ||
    typeof owner.user.id !== "string"
  ) {
    throw new BoardError(`Owner answered no login or no user ${BOARD_OWNER}.`);
  }

  const repositoryIds: Record<string, string> = {};
  for (const repository of BOARD_REPOSITORIES) {
    const slash = repository.indexOf("/");
    const data = await graphql(api, QUERIES.repository, {
      owner: repository.slice(0, slash),
      name: repository.slice(slash + 1),
    });
    if (!isRecord(data.repository) || typeof data.repository.id !== "string") {
      throw new BoardError(`Repository answered no repository ${repository}.`);
    }
    repositoryIds[repository] = data.repository.id;
  }

  const projects = await readNodes(
    api,
    QUERIES.projects,
    { owner: BOARD_OWNER },
    ["user", "projectsV2"],
  );
  const found = projects.find(
    (project) => isRecord(project) && project.title === BOARD_TITLE,
  );
  const project =
    isRecord(found) && typeof found.id === "string"
      ? await readProjectState(api, found.id)
      : null;

  return {
    viewer: owner.viewer.login,
    ownerId: owner.user.id,
    repositoryIds,
    project,
  };
}

/** Sends one request and resolves with its `data`; a refusal names what was not done. */
async function sendOne(
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
async function send(
  api: GitHubApi,
  requests: readonly BoardRequest[],
  sent: (request: BoardRequest) => void,
): Promise<void> {
  for (const request of requests) {
    await sendOne(api, request);
    sent(request);
  }
}

/**
 * Sends the plan's requests in order through `api`, calling `sent` after
 * each one that succeeds; stops with a `BoardError` at the first error
 * answer. When the plan creates the project, the requests after the
 * creation were planned on the project as it would be, with placeholder
 * ids: once GitHub has made it, the project is read and those requests are
 * planned again with its ids, and the new plan is sent. Resolves with the
 * project as it was read: the created one, else the one the plan was made
 * on.
 */
export async function applyBoardSetup(
  api: GitHubApi,
  state: BoardState,
  plan: BoardSetupPlan,
  sent: (request: BoardRequest) => void = () => undefined,
): Promise<ProjectState> {
  if (state.project !== null) {
    await send(api, plan.requests, sent);
    return state.project;
  }
  const create = plan.requests.find(
    ({ query }) => query === BOARD_MUTATIONS.createProject,
  );
  if (create === undefined) {
    throw new BoardError("The plan creates no project, and none exists.");
  }
  const data = await sendOne(api, create);
  sent(create);
  const created = isRecord(data.createProjectV2)
    ? data.createProjectV2.projectV2
    : undefined;
  if (!isRecord(created) || typeof created.id !== "string") {
    throw new BoardError("CreateProject answered no project id.");
  }
  const project = await readProjectState(api, created.id);
  const rest = planBoardSetup({ ...state, project });
  await send(api, rest.requests, sent);
  return project;
}
