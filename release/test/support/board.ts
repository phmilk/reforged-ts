/**
 * What the board tests share: a project the script already set up and one
 * as GitHub creates it, both as the API answers them, and GitHub's GraphQL
 * endpoint as a fake that answers each operation from a state and records
 * what it receives.
 */
import {
  BOARD_OWNER,
  BOARD_README,
  BOARD_REPOSITORIES,
  BOARD_TITLE,
  BOARD_VIEWS,
  operationName,
  STATUS_OPTIONS,
  type BoardState,
  type ProjectState,
} from "../../src/board.js";
import { gitHubApi } from "../../src/cli/common.js";
import type { GitHubApi } from "../../src/repo-settings.js";
import { isRecord } from "../../src/unknown.js";

export const API = "https://api.github.com";

/** The built-in fields of a project, in GitHub's order. */
const FIELD_NAMES = [
  "Title",
  "Assignees",
  "Status",
  "Labels",
  "Linked pull requests",
  "Milestone",
  "Repository",
  "Reviewers",
  "Parent issue",
  "Sub-issues progress",
];

/** The id the fixtures give the field `name` of the project `prefix`. */
export const fieldId = (prefix: string, name: string) =>
  `${prefix}_${name.toLowerCase().replaceAll(/\W+/g, "_")}`;

/** A project the script already set up: everything as committed. */
export const CONFIGURED: ProjectState = {
  id: "PVT_board",
  number: 7,
  url: `https://github.com/users/${BOARD_OWNER}/projects/7`,
  title: BOARD_TITLE,
  public: true,
  readme: BOARD_README,
  fields: FIELD_NAMES.map((name) =>
    name === "Status"
      ? {
          id: "PVTSSF_status",
          name,
          dataType: "SINGLE_SELECT",
          options: STATUS_OPTIONS.map((option, i) => ({
            id: `opt${String(i)}`,
            ...option,
          })),
        }
      : { id: fieldId("PVTF", name), name, dataType: "BUILT_IN" },
  ),
  views: BOARD_VIEWS.map((view, i) => ({
    id: `PVTV_${String(i + 1)}`,
    name: view.name,
    layout: view.layout,
    fields: [...view.fields],
  })),
  repositories: [...BOARD_REPOSITORIES],
};

/**
 * A project as GitHub creates it: private, no README, a default table view
 * and the Status options a fresh project is believed to come with (they are
 * not documented).
 */
export const FRESH: ProjectState = {
  id: "PVT_new",
  number: 8,
  url: `https://github.com/users/${BOARD_OWNER}/projects/8`,
  title: BOARD_TITLE,
  public: false,
  readme: null,
  fields: FIELD_NAMES.map((name) =>
    name === "Status"
      ? {
          id: "PVTSSF_new",
          name,
          dataType: "SINGLE_SELECT",
          options: [
            { id: "new_todo", name: "Todo", color: "GRAY", description: "" },
            {
              id: "new_in_progress",
              name: "In Progress",
              color: "YELLOW",
              description: "",
            },
            { id: "new_done", name: "Done", color: "GREEN", description: "" },
          ],
        }
      : { id: fieldId("NEW", name), name, dataType: "BUILT_IN" },
  ),
  views: [
    {
      id: "PVTV_new_1",
      name: "View 1",
      layout: "TABLE_LAYOUT",
      fields: ["Title", "Assignees", "Status"],
    },
  ],
  repositories: [],
};

export const REPOSITORY_IDS: Readonly<Record<string, string>> =
  Object.fromEntries(
    BOARD_REPOSITORIES.map((repository, i) => [
      repository,
      `R_${String(i + 1)}`,
    ]),
  );

/** The state read as the owner, with the configured project. */
export const STATE: BoardState = {
  viewer: BOARD_OWNER,
  ownerId: "U_owner",
  repositoryIds: REPOSITORY_IDS,
  project: CONFIGURED,
};

export interface Sent {
  kind: "query" | "mutation";
  operation: string;
  variables: Record<string, unknown>;
  authorization: string | null;
}

/** The JSON body GitHub answers an operation with. */
export type Answers = (
  operation: string,
  variables: Record<string, unknown>,
) => unknown;

const text = (value: unknown) => (typeof value === "string" ? value : "");

/** One page holding every node, the last one. */
const page = (nodes: unknown[]) => ({
  pageInfo: { hasNextPage: false, endCursor: null },
  nodes,
});

/**
 * Answers that read `state` and, once `CreateProject` was answered with its
 * id, the project `created`; every mutation succeeds but `failing`, refused
 * with an error.
 */
export function reading(
  state: BoardState,
  options: { created?: ProjectState; failing?: string } = {},
): Answers {
  const projects = [state.project, options.created ?? null];
  const projectOf = (id: unknown) =>
    projects.find((project) => project !== null && project.id === id) ?? null;
  return (operation, variables) => {
    if (operation === options.failing) {
      return {
        errors: [
          {
            type: "FORBIDDEN",
            message: "Resource not accessible by personal access token",
          },
        ],
      };
    }
    const project = projectOf(variables.projectId);
    switch (operation) {
      case "Owner":
        return {
          data: {
            viewer: { login: state.viewer },
            user: { id: state.ownerId },
          },
        };
      case "Repository":
        return {
          data: {
            repository: {
              id:
                state.repositoryIds[
                  `${text(variables.owner)}/${text(variables.name)}`
                ] ?? null,
            },
          },
        };
      case "Projects":
        return {
          data: {
            user: {
              projectsV2: page(
                state.project === null
                  ? []
                  : [{ id: state.project.id, title: state.project.title }],
              ),
            },
          },
        };
      case "Project":
        return {
          data: {
            node:
              project === null
                ? null
                : {
                    id: project.id,
                    number: project.number,
                    title: project.title,
                    url: project.url,
                    public: project.public,
                    readme: project.readme,
                  },
          },
        };
      case "ProjectFields":
        return {
          data: {
            node: {
              fields: page(
                (project?.fields ?? []).map(
                  ({ id, name, dataType, options: fieldOptions }) => ({
                    id,
                    name,
                    dataType,
                    ...(fieldOptions === undefined
                      ? {}
                      : { options: fieldOptions }),
                  }),
                ),
              ),
            },
          },
        };
      case "ProjectViews":
        return {
          data: {
            node: {
              views: page(
                (project?.views ?? []).map(({ id, name, layout, fields }) => ({
                  id,
                  name,
                  layout,
                  configuration: {
                    visibleFields: {
                      nodes: fields.map((field) => ({ name: field })),
                    },
                  },
                })),
              ),
            },
          },
        };
      case "ProjectRepositories":
        return {
          data: {
            node: {
              repositories: page(
                (project?.repositories ?? []).map((nameWithOwner) => ({
                  nameWithOwner,
                })),
              ),
            },
          },
        };
      case "CreateProject": {
        const created = options.created ?? FRESH;
        return {
          data: {
            createProjectV2: {
              projectV2: {
                id: created.id,
                number: created.number,
                url: created.url,
              },
            },
          },
        };
      }
      default:
        return { data: { [operation]: { ok: true } } };
    }
  };
}

/**
 * GitHub's GraphQL endpoint as a `fetch`: answers `POST /graphql` from
 * `answers`, 404 to anything else, and records each request in `sent`.
 */
export function graphQlFetch(
  answers: Answers,
  sent: Sent[] = [],
): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    const body: unknown = JSON.parse(await request.text());
    if (
      request.url !== `${API}/graphql` ||
      request.method !== "POST" ||
      !isRecord(body) ||
      typeof body.query !== "string"
    ) {
      return Response.json({ message: "Not Found" }, { status: 404 });
    }
    const operation = operationName(body.query);
    const variables = isRecord(body.variables) ? body.variables : {};
    sent.push({
      kind: body.query.trimStart().startsWith("mutation")
        ? "mutation"
        : "query",
      operation,
      variables,
      authorization: request.headers.get("authorization"),
    });
    return Response.json(answers(operation, variables), { status: 200 });
  };
}

/** The same endpoint as a `GitHubApi`, through the CLIs' own transport. */
export function graphQlApi(answers: Answers, sent: Sent[] = []): GitHubApi {
  return gitHubApi(graphQlFetch(answers, sent), "t0k", "test");
}

/** The mutations of `sent`, as `[operation, variables]` pairs. */
export const mutations = (sent: readonly Sent[]) =>
  sent
    .filter(({ kind }) => kind === "mutation")
    .map(({ operation, variables }) => [operation, variables]);
