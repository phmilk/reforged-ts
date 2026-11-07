/**
 * The page's one way to the Studio: its JSON API over HTTP and its event
 * stream, at the base the page's `reforged-studio-api` meta names, so that
 * a host such as a VS Code webview points it at the server.
 */
import type {
  AdoptAnswer,
  ArtLayerAnswer,
  ArtLayerName,
  BulkAnswer,
  BulkRequest,
  ConflictChoice,
  CreateAnswer,
  CreateRequest,
  DeleteAnswer,
  DeletionAnswer,
  DiffAnswer,
  FreeRawcodeAnswer,
  Edit,
  ErrorAnswer,
  IconsAnswer,
  ModelsAnswer,
  ObjectsAnswer,
  PutBackRequest,
  RawcodeAnswer,
  RawcodeCheckAnswer,
  ReloadFromDiskAnswer,
  ResetRequest,
  SaveAnswer,
  SaveRefusedAnswer,
  SearchAnswer,
  SessionAnswer,
  SessionCounts,
  StudioEvents,
  TableAnswer,
  TurnsAnswer,
  TurnsChangedAnswer,
} from "../src/server/api-types.js";

/**
 * This page's name as a host of the Studio, which its reads of the map
 * folder send, so that it tells the `reloaded` event of its own read from
 * one another host asked for.
 */
export const HOST = `page-${Math.random().toString(36).slice(2)}`;

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

/** A refusal's text as a field shows it: its message and its reason. */
export const refusalText = (reason: unknown): string =>
  reason instanceof ApiError
    ? `${reason.message} (${reason.reason})`
    : String(reason);

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
  /** The URL of an icon's or a model's file, in an art layer, the session's when left out. */
  fileUrl: (path: string, layer?: ArtLayerName): string =>
    `${base}/files?path=${encodeURIComponent(path)}${layer === undefined ? "" : `&layer=${layer}`}`,
  /** The bytes of an icon's or a model's file; undefined when it is found nowhere. */
  file: async (
    path: string,
    layer?: ArtLayerName,
  ): Promise<ArrayBuffer | undefined> => {
    const response = await fetch(api.fileUrl(path, layer));
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
  /** Applies edits as one undo step, or throws the editor's refusal. */
  edits: (edits: readonly Edit[]) => post<SessionCounts>("/edits", { edits }),
  /** One kind as a spreadsheet: every object with `objects`, every column with `fields`. */
  table: (
    kind: string,
    show: {
      readonly objects: boolean;
      readonly fields: boolean;
      readonly all: boolean;
    },
  ) =>
    get<TableAnswer>(
      `/table?kind=${encodeURIComponent(kind)}${show.objects ? "&objects=all" : ""}${show.fields ? "&fields=all" : ""}${allOf(show.all)}`,
    ),
  /** Sets, adds to, multiplies or resets one field on a selection, as one undo step, or throws the refusal. */
  bulk: (request: BulkRequest) => post<BulkAnswer>("/bulk", request),
  /** Puts a field, or a whole object, back to its base. */
  reset: (target: ResetRequest) => post<SessionCounts>("/reset", target),
  /** The Rawcode suggested for a new object of a kind, based on `base` or copying `copyOf`. */
  freeRawcode: (
    kind: string,
    from: { readonly base?: string; readonly copyOf?: string },
  ) =>
    get<FreeRawcodeAnswer>(
      `/free-rawcode?kind=${encodeURIComponent(kind)}${from.copyOf === undefined ? (from.base === undefined ? "" : `&base=${encodeURIComponent(from.base)}`) : `&copyOf=${encodeURIComponent(from.copyOf)}`}`,
    ),
  /** Whether a new object can take a Rawcode, and what holds it. */
  rawcodeCheck: (rawcode: string) =>
    get<RawcodeCheckAnswer>(
      `/rawcode-check?rawcode=${encodeURIComponent(rawcode)}`,
    ),
  /** Creates an object as one undo step, or throws the refusal. */
  create: (request: CreateRequest) => post<CreateAnswer>("/create", request),
  /** What deleting an object does, for its confirmation. */
  deletion: (kind: string, rawcode: string) =>
    get<DeletionAnswer>(
      `/deletion?kind=${encodeURIComponent(kind)}&rawcode=${encodeURIComponent(rawcode)}`,
    ),
  /** Deletes a Custom object as one undo step, or throws the refusal. */
  delete: (kind: string, rawcode: string) =>
    post<DeleteAnswer>("/delete", { kind, rawcode }),
  undo: () => post<SessionCounts>("/undo", {}),
  redo: () => post<SessionCounts>("/redo", {}),
  /** Saves: the answer, or the refusal with the counts, every unsaved edit kept. */
  save: async (
    reloadWorldEditor: boolean,
  ): Promise<
    | { readonly saved: true; readonly answer: SaveAnswer }
    | { readonly saved: false; readonly answer: SaveRefusedAnswer }
  > => {
    const response = await fetch(`${base}/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reloadWorldEditor, host: HOST }),
    });
    const body = (await response.json()) as unknown;
    if (response.ok) return { saved: true, answer: body as SaveAnswer };
    if (response.status === 409) {
      return { saved: false, answer: body as SaveRefusedAnswer };
    }
    const error = (body as Partial<ErrorAnswer>).error;
    throw new ApiError(
      response.status,
      error?.reason ?? "unknown",
      error?.message ?? response.statusText,
    );
  },
  reloadWorldEditor: () => post<unknown>("/reload-world-editor", {}),
  /** The conflicts left to choose and the fields a World Editor save put back. */
  turns: () => get<TurnsAnswer>("/turns"),
  /** "Reload and keep my edits on top": the map folder read again, the unsaved edits replayed on it. */
  reloadFromDisk: () =>
    post<ReloadFromDiskAnswer>("/reload-from-disk", { host: HOST }),
  /** Keeps mine or takes theirs for each conflict chosen. */
  chooseConflicts: (choices: readonly ConflictChoice[]) =>
    post<TurnsChangedAnswer>("/conflicts", { choices }),
  /** "Apply them again" or "Keep the World Editor's" for the fields put back. */
  answerPutBack: (action: PutBackRequest["action"]) =>
    post<TurnsChangedAnswer>("/put-back", { action }),
  /** Adopts a Custom object or a modified Built-in object into the code, or throws the refusal. */
  adopt: (kind: string, rawcode: string) =>
    post<AdoptAnswer>("/adopt", { kind, rawcode }),
  diff: (against: DiffAnswer["against"]) =>
    get<DiffAnswer>(`/diff?against=${against}`),
  icons: () => get<IconsAnswer>("/icons"),
  /** The models' paths of the map's imports and the install whose path holds the text. */
  models: (query: string, layer: ArtLayerName) =>
    get<ModelsAnswer>(`/models?q=${encodeURIComponent(query)}&layer=${layer}`),
  /** Sets the art layer icons and previews are read in, for the session. */
  artLayer: (artLayer: ArtLayerName) =>
    post<ArtLayerAnswer>("/art-layer", { artLayer }),
  /**
   * The thumbnail the server's cache holds for a model: its PNG, undefined
   * when none is cached yet, `"missing"` when the model is found nowhere.
   */
  thumbnail: async (
    path: string,
    layer: ArtLayerName,
  ): Promise<Blob | "missing" | undefined> => {
    const response = await fetch(thumbnailPath(path, layer));
    if (response.ok) return response.blob();
    if (response.status === 404) {
      const body = (await response.json()) as Partial<ErrorAnswer>;
      return body.error?.reason === "not-found" ? "missing" : undefined;
    }
    throw new ApiError(response.status, "unknown", response.statusText);
  },
  /** Gives the server's cache a model's thumbnail the page drew. */
  keepThumbnail: async (
    path: string,
    layer: ArtLayerName,
    png: Blob,
  ): Promise<void> => {
    const response = await fetch(thumbnailPath(path, layer), {
      method: "PUT",
      headers: { "content-type": "image/png" },
      body: png,
    });
    if (!response.ok) {
      throw new ApiError(response.status, "unknown", response.statusText);
    }
  },
};

/** The URL of a model's thumbnail in the server's cache. */
const thumbnailPath = (path: string, layer: ArtLayerName): string =>
  `${base}/thumbnails?path=${encodeURIComponent(path)}&layer=${layer}`;

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
