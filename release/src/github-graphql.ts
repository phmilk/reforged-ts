/**
 * GitHub's GraphQL API over the REST transport the release scripts share
 * (`GitHubApi`, a `POST` to `/graphql`): one operation's `data`, and a
 * connection read page after page. The board (`board.ts`) reads and writes
 * the Claim board through it; nothing here knows the board.
 */
import { apiMessage, type GitHubApi } from "./repo-settings.js";
import { isRecord } from "./unknown.js";

/** An answer the scripts cannot read, or an operation GitHub refused. */
export class GraphQlError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "GraphQlError";
  }
}

/** The GraphQL endpoint, under the API root the REST calls use. */
const GRAPHQL_ENDPOINT = "/graphql";

/** The name of a document's operation (`query Projects(...)` gives `Projects`). */
export function operationName(query: string): string {
  return /^\s*(?:query|mutation)\s+(\w+)/.exec(query)?.[1] ?? "The request";
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
 * `variables`. Stops with a `GraphQlError` naming the operation on an error
 * answer: GitHub answers 200 with `errors` to most of them, and a missing
 * `project` scope (the one scope the scripts' reads need beyond `repo`) is
 * named with the `gh auth refresh` that adds it.
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
    throw new GraphQlError(`${operation} answered ${apiMessage(response)}.`);
  }
  const { body } = response;
  if (!isRecord(body)) {
    throw new GraphQlError(`${operation} answered no JSON object.`);
  }
  const errors = Array.isArray(body.errors) ? (body.errors as unknown[]) : [];
  if (errors.length > 0) {
    const scope = errors.some(
      (error) => isRecord(error) && error.type === "INSUFFICIENT_SCOPES",
    )
      ? " The gh login needs the project scope: gh auth refresh -s project."
      : "";
    const detail = errors.map(graphQlError).join("; ");
    throw new GraphQlError(
      `${operation} answered: ${detail}${detail.endsWith(".") ? "" : "."}${scope}`,
    );
  }
  if (!isRecord(body.data)) {
    throw new GraphQlError(`${operation} answered no data.`);
  }
  return body.data;
}

const PAGE_SIZE = 100;

/** More pages than any connection the scripts read fills. */
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
      throw new GraphQlError(`${what} is not a connection in the answer.`);
    }
    nodes.push(...(connection.nodes as unknown[]));
    const { hasNextPage, endCursor } = connection.pageInfo;
    if (hasNextPage !== true) return nodes;
    if (typeof endCursor !== "string") {
      throw new GraphQlError(`${what} has a next page but no cursor.`);
    }
    cursor = endCursor;
  }
  throw new GraphQlError(`${what} has more than ${String(MAX_PAGES)} pages.`);
}
