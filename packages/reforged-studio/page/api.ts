/**
 * The page's one way to the Studio: its JSON API over HTTP and its event
 * stream, at the base the page's `reforged-studio-api` meta names, so that
 * a host such as a VS Code webview points it at the server.
 */
import type {
  ErrorAnswer,
  ObjectsAnswer,
  RawcodeAnswer,
  SearchAnswer,
  SessionAnswer,
  StudioEvents,
} from "../src/server/api-types.js";

const base =
  document
    .querySelector<HTMLMetaElement>('meta[name="reforged-studio-api"]')
    ?.content.replace(/\/$/, "") ?? "/api";

/** A refusal of the API, with its reason. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly reason: string,
    message: string,
  ) {
    super(message);
  }
}

async function get<T>(path: string, ok: readonly number[] = [200]): Promise<T> {
  const response = await fetch(base + path);
  const body = (await response.json()) as unknown;
  if (!ok.includes(response.status)) {
    const error = (body as Partial<ErrorAnswer>).error;
    throw new ApiError(
      response.status,
      error?.reason ?? "unknown",
      error?.message ?? response.statusText,
    );
  }
  return body as T;
}

async function post<T>(path: string, json: unknown): Promise<T> {
  const response = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(json),
  });
  const body = (await response.json()) as unknown;
  if (!response.ok) {
    const error = (body as Partial<ErrorAnswer>).error;
    throw new ApiError(
      response.status,
      error?.reason ?? "unknown",
      error?.message ?? response.statusText,
    );
  }
  return body as T;
}

/** `&all=1` when the objects outside the map's Game data set are shown. */
const allOf = (all: boolean): string => (all ? "&all=1" : "");

export const api = {
  session: () => get<SessionAnswer>("/session"),
  objects: (kind: string, all = false) =>
    get<ObjectsAnswer>(
      `/objects?kind=${encodeURIComponent(kind)}${allOf(all)}`,
    ),
  search: (query: string, all = false) =>
    get<SearchAnswer>(`/search?q=${encodeURIComponent(query)}${allOf(all)}`),
  /** The bytes of an icon's or a model's file; undefined when it is found nowhere. */
  file: async (path: string): Promise<ArrayBuffer | undefined> => {
    const response = await fetch(
      `${base}/files?path=${encodeURIComponent(path)}`,
    );
    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new ApiError(response.status, "unknown", response.statusText);
    }
    return response.arrayBuffer();
  },
  rawcode: (rawcode: string, kind?: string) =>
    get<RawcodeAnswer>(
      `/objects/${encodeURIComponent(rawcode)}${kind === undefined ? "" : `?kind=${encodeURIComponent(kind)}`}`,
      [200, 400, 404],
    ),
  openInEditor: (kind: string, rawcode: string) =>
    post<unknown>("/open-in-editor", { kind, rawcode }),
};

/** Listens to the event stream; returns how to stop. */
export function listen(handlers: {
  [Name in keyof StudioEvents]?: (data: StudioEvents[Name]) => void;
}): () => void {
  const source = new EventSource(`${base}/events`);
  for (const [name, handler] of Object.entries(handlers)) {
    source.addEventListener(name, (event) => {
      (handler as (data: unknown) => void)(
        JSON.parse((event as MessageEvent<string>).data) as unknown,
      );
    });
  }
  return () => {
    source.close();
  };
}
