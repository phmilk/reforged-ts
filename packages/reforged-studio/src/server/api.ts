/**
 * The routes of the Studio's JSON API, under `/api/`, and of its page. Every
 * answer is JSON but the page's files and the event stream; a refusal is an
 * {@link ErrorAnswer}.
 */
import type http from "node:http";
import path from "node:path";
import {
  adoptObjects,
  checkWorldEditor,
  ObjectDataWriterError,
  ObjectDefinitionsError,
  MapFolderError,
  type ObjectDataObject,
  reloadWorldEditor,
  type DefinedObject,
  type GameDataSet,
  type ObjectKind,
  type WorldEditorCheckOptions,
  type WorldEditorReloadOptions,
} from "reforged-map";
import { ART_LAYERS } from "../art-layer.js";
import type { CascStorage } from "../casc/storage.js";
import type { GameData } from "../game-data.js";
import { isKind, OBJECT_KINDS } from "../kinds.js";
import type { ArtLayer, PathResolver, ResolvedPath } from "../paths.js";
import {
  THUMBNAIL_LIMIT,
  type ThumbnailCache,
  type ThumbnailKey,
} from "../thumbnails.js";
import {
  placementCount,
  placementFile,
  readPlacements,
} from "../placements.js";
import {
  isNumericOperation,
  OBJECT_ORIGINS,
  type AdoptAnswer,
  type AdoptedObject,
  type ArtLayerAnswer,
  type BulkAnswer,
  type BulkOperation,
  type ConflictChoice,
  type CreateAnswer,
  type DeleteAnswer,
  type DeletionAnswer,
  type DiffAnswer,
  type Edit,
  type ErrorAnswer,
  type IconsAnswer,
  type ListedObject,
  type ModelsAnswer,
  type ObjectOrigin,
  type ObjectsAnswer,
  type OpenInEditorAnswer,
  type FreeRawcodeAnswer,
  type RawcodeAnswer,
  type RawcodeCheckAnswer,
  type Referrer,
  type ReloadAnswer,
  type ReloadFromDiskAnswer,
  type ReloadOffer,
  type SaveAnswer,
  type SaveRefusedAnswer,
  type SearchAnswer,
  type SessionAnswer,
  type ThumbnailAnswer,
  type SessionCounts,
  type TurnsChangedAnswer,
} from "./api-types.js";
import { bulkEdits, BulkRefusedError, tableOf } from "./bulk.js";
import { diffFiles, headFiles } from "./diff.js";
import type { EventStreams } from "./events.js";
import { formatDefinitionFiles } from "./format.js";
import { installModels, mapModels, searchModels } from "./models.js";
import {
  composeObjects,
  detailOf,
  definitionLine,
  type DetailSources,
} from "./objects.js";
import { openInEditor, type EditorEnvironment } from "./open-in-editor.js";
import { servePage } from "./page.js";
import {
  freeRawcode,
  holdersText,
  isRawcode,
  notRawcodeText,
  objectText,
  rawcodeHolders,
  rawcodePrefix,
  removedRawcodes,
  type RawcodeSources,
} from "./rawcodes.js";
import { refusal } from "./requests.js";
import {
  EditRefusedError,
  reloadedEvent,
  type Replay,
  type Session,
} from "./session.js";
import { objectKey } from "./states.js";

/** The most objects a search answers. */
const SEARCH_LIMIT = 50;

/** The largest request body read, in bytes. */
const BODY_LIMIT = 1024 * 1024;

/** The most models' paths `GET /api/models` answers when the request sets no limit. */
const MODELS_LIMIT = 200;

/** The art layer of the session: the one icons and previews are read in, and those the map allows. */
export interface ArtLayerState {
  /** The art layer read in now. */
  current: ArtLayer;
  /** The art layers the map's Supported Modes allow. */
  readonly allowed: readonly ArtLayer[];
}

/** What the routes reach. */
export interface ApiContext {
  readonly session: Session;
  readonly events: EventStreams;
  readonly port: () => number;
  readonly projectRoot: string;
  readonly mapFolder: string;
  readonly build: string;
  /** The game data model of a Game data set, read once per set. */
  readonly gameData: (gameDataSet: string) => Promise<GameData>;
  /** The Game data set base values are read from when the map's is unknown. */
  readonly fallbackGameDataSet: string;
  readonly worldEditorCheck: WorldEditorCheckOptions | undefined;
  /** The World Editor's executable, which the reload after a save starts: the one given, else `World Editor.exe` beside the game's; undefined when there is neither. */
  readonly worldEditorExecutable: string | undefined;
  /** The reload's options, such as a stand-in launcher in tests. */
  readonly worldEditorReload: WorldEditorReloadOptions | undefined;
  /** Takes the watched files' stamps as they are, after the Studio wrote or read the map folder itself. */
  readonly resync: () => void;
  readonly env: EditorEnvironment;
  /** The resolver of icons' and models' paths in an art layer, the map folder's imports first. */
  readonly paths: (artLayer: ArtLayer) => PathResolver;
  /** The session's art layer, which the header's switch changes. */
  readonly artLayer: ArtLayerState;
  /** The install's storage, whose models the picker lists. */
  readonly storage: CascStorage;
  /** The thumbnails of the models, on disk under the user's cache folder. */
  readonly thumbnails: ThumbnailCache;
}

/** An answer the routes give: its status and its JSON body. */
class Answer {
  /**
   * @param status - The HTTP status.
   * @param body - The JSON body.
   */
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {}
}

const refuse = (
  status: number,
  reason: string,
  message: string,
  file?: string,
): Answer =>
  new Answer(status, {
    error: { reason, message, ...(file !== undefined && { file }) },
  } satisfies ErrorAnswer);

/** Writes a JSON answer. */
function send(response: http.ServerResponse, answer: Answer): void {
  response
    .writeHead(answer.status, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    })
    .end(JSON.stringify(answer.body));
}

/** Reads a request's JSON body. */
async function readJson(request: http.IncomingMessage): Promise<unknown> {
  return JSON.parse(await readText(request)) as unknown;
}

/** Reads a request's body as UTF-8 text, at most {@link BODY_LIMIT} bytes. */
async function readText(request: http.IncomingMessage): Promise<string> {
  return (await readBytes(request, BODY_LIMIT)).toString("utf8");
}

/** Reads a request's body, at most `limit` bytes. */
async function readBytes(
  request: http.IncomingMessage,
  limit: number,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request as AsyncIterable<Buffer>) {
    size += chunk.byteLength;
    if (size > limit) throw new SyntaxError("The body is too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const isArtLayer = (value: unknown): value is ArtLayer =>
  (ART_LAYERS as readonly unknown[]).includes(value);

/**
 * The art layer of a request's `?layer=`, the session's when it has none,
 * or the refusal of one the map does not allow.
 */
function layerOf(
  context: ApiContext,
  query: URLSearchParams,
): ArtLayer | Answer {
  const asked = query.get("layer");
  if (asked === null) return context.artLayer.current;
  if (!isArtLayer(asked) || !context.artLayer.allowed.includes(asked)) {
    return refuse(
      400,
      "bad-request",
      `${asked} is no art layer of this map; its Supported Modes allow ${context.artLayer.allowed.join(", ")}.`,
    );
  }
  return asked;
}

const isOrigin = (value: string): value is ObjectOrigin =>
  (OBJECT_ORIGINS as readonly string[]).includes(value);

/** The objects, the map's Game data set and its game data model, or the lookup's reason it cannot list them. */
async function objectsOf(context: ApiContext): Promise<
  | {
      objects: ListedObject[];
      gameDataSet: GameDataSet | undefined;
      gameData: GameData;
    }
  | Answer
> {
  const { session } = context;
  const listing = session.lookup.list();
  if (listing.status === "unavailable") {
    return refuse(503, "unavailable", listing.reason);
  }
  const gameData = await context.gameData(
    baseValuesSet(context, listing.gameDataSet),
  );
  return {
    gameDataSet: listing.gameDataSet,
    gameData,
    objects: composeObjects({
      projectRoot: context.projectRoot,
      listed: listing.objects,
      gameDataSet: listing.gameDataSet,
      saved: session.saved,
      working: session.working(),
      gameData,
    }),
  };
}

/** What an object's field table is read from: the session's states, the game data model and every object listed. */
const detailSourcesOf = (
  context: ApiContext,
  listed: { readonly gameData: GameData; readonly objects: ListedObject[] },
): DetailSources => ({
  working: context.session.working(),
  saved: context.session.saved,
  gameData: listed.gameData,
  fieldTable: context.session.fieldTable,
  objects: listed.objects,
});

/** The Game data set base values are read from: the map's, else the fallback. */
const baseValuesSet = (
  context: ApiContext,
  gameDataSet: GameDataSet | undefined,
): string => gameDataSet?.id ?? context.fallbackGameDataSet;

/** The object filter of `?kind=`, `?origin=` and `?all=`, or a refusal. */
function filterOf(
  query: URLSearchParams,
): ((object: ListedObject) => boolean) | Answer {
  const kind = query.get("kind");
  const origin = query.get("origin");
  if (kind !== null && !isKind(kind)) {
    return refuse(
      400,
      "bad-request",
      `${kind} is no Object kind; the kinds are ${OBJECT_KINDS.join(", ")}.`,
    );
  }
  if (origin !== null && !isOrigin(origin)) {
    return refuse(
      400,
      "bad-request",
      `${origin} is no origin; the origins are ${OBJECT_ORIGINS.join(", ")}.`,
    );
  }
  const all = query.get("all") === "1";
  return (object) =>
    (kind === null || object.kind === kind) &&
    (origin === null || object.origin === origin) &&
    (all || object.inGameDataSet);
}

async function listObjects(
  context: ApiContext,
  query: URLSearchParams,
): Promise<Answer> {
  const filter = filterOf(query);
  if (filter instanceof Answer) return filter;
  const listed = await objectsOf(context);
  if (listed instanceof Answer) return listed;
  return new Answer(200, {
    gameDataSet: listed.gameDataSet,
    objects: listed.objects.filter(filter),
  } satisfies ObjectsAnswer);
}

async function search(
  context: ApiContext,
  query: URLSearchParams,
): Promise<Answer> {
  const filter = filterOf(query);
  if (filter instanceof Answer) return filter;
  const text = (query.get("q") ?? "").trim();
  const listed = await objectsOf(context);
  if (listed instanceof Answer) return listed;
  const lower = text.toLowerCase();
  const candidates = listed.objects.filter(filter);
  const byRawcode = candidates.filter((object) => object.rawcode === text);
  const byName =
    lower === ""
      ? []
      : candidates.filter(
          (object) =>
            object.rawcode !== text &&
            (object.rawcode.toLowerCase() === lower ||
              (object.name ?? "").toLowerCase().includes(lower)),
        );
  const objects = [...byRawcode, ...byName].slice(0, SEARCH_LIMIT);
  let suggestions: SearchAnswer["suggestions"];
  if (byRawcode.length === 0 && text.length === 4) {
    const result = context.session.lookup.lookup(text);
    if (result.status === "unknown") suggestions = result.suggestions;
  }
  return new Answer(200, {
    query: text,
    objects,
    ...(suggestions !== undefined && { suggestions }),
  } satisfies SearchAnswer);
}

async function rawcodeObjects(
  context: ApiContext,
  rawcode: string,
  query: URLSearchParams,
): Promise<Answer> {
  const kind = query.get("kind");
  if (kind !== null && !isKind(kind)) {
    return refuse(
      400,
      "bad-request",
      `${kind} is no Object kind; the kinds are ${OBJECT_KINDS.join(", ")}.`,
    );
  }
  const result = context.session.lookup.lookup(rawcode);
  if (result.status === "malformed") {
    return new Answer(400, {
      status: "malformed",
      rawcode,
    } satisfies RawcodeAnswer);
  }
  if (result.status === "unavailable") {
    return refuse(503, "unavailable", result.reason);
  }
  // The working state's objects: one an unsaved edit added is known, one it
  // removed is not, whatever the map folder on disk holds.
  const listed = await objectsOf(context);
  if (listed instanceof Answer) return listed;
  const objects = listed.objects.filter((object) => object.rawcode === rawcode);
  if (objects.length === 0) {
    return new Answer(404, {
      status: "unknown",
      rawcode,
      suggestions: result.status === "unknown" ? result.suggestions : [],
    } satisfies RawcodeAnswer);
  }
  const candidates =
    kind === null ? objects : objects.filter((object) => object.kind === kind);
  const selected =
    candidates.length === 1
      ? detailOf(candidates[0], detailSourcesOf(context, listed))
      : undefined;
  const answer: RawcodeAnswer =
    result.status === "not-in-game-data-set"
      ? {
          status: "not-in-game-data-set",
          rawcode,
          objects,
          ...(selected && { selected }),
          gameDataSet: result.gameDataSet,
        }
      : { status: "known", rawcode, objects, ...(selected && { selected }) };
  return new Answer(200, answer);
}

/** Checks that a value is one edit of the API, or says why not. */
function editProblem(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null)
    return "an edit is an object";
  const edit = value as Record<string, unknown>;
  if (typeof edit.kind !== "string" || !isKind(edit.kind)) {
    return `an edit's kind is one of ${OBJECT_KINDS.join(", ")}`;
  }
  if (typeof edit.rawcode !== "string") return "an edit names its rawcode";
  switch (edit.op) {
    case "setField":
      if (typeof edit.value !== "string" && typeof edit.value !== "number") {
        return "setField's value is a number or a string";
      }
      if ("translations" in edit) {
        return "a field's translations are read-only: setField sets its default text, and its translations are kept";
      }
    // falls through
    case "removeField":
      if (typeof edit.field !== "string")
        return `${edit.op}'s field is a string`;
      for (const key of ["level", "dataPointer"]) {
        if (edit[key] !== undefined && typeof edit[key] !== "number") {
          return `${edit.op}'s ${key} is a number`;
        }
      }
      return undefined;
    case "addObject":
      return typeof edit.base === "string"
        ? undefined
        : "addObject's base is a string";
    case "removeObject":
      return undefined;
    default:
      return "an edit's op is setField, removeField, addObject or removeObject";
  }
}

async function edit(
  context: ApiContext,
  request: http.IncomingMessage,
): Promise<Answer> {
  const body = await readJson(request);
  const edits = (body as { edits?: unknown } | null)?.edits;
  if (!Array.isArray(edits)) {
    return refuse(400, "bad-request", "The body is { edits: [...] }.");
  }
  for (const value of edits as unknown[]) {
    const problem = editProblem(value);
    if (problem !== undefined)
      return refuse(400, "bad-request", `Not an edit: ${problem}.`);
  }
  return applied(context, () => {
    context.session.edit(edits as Edit[]);
  });
}

/**
 * Runs a change of the working state and answers the counts, or the
 * refusal: the session's (409, 503 while the lookup is unavailable) or the
 * editor's (422).
 */
function applied(context: ApiContext, change: () => void): Answer {
  try {
    change();
  } catch (error) {
    if (error instanceof EditRefusedError) {
      return refuse(
        error.reason === "unavailable" ? 503 : 409,
        error.reason,
        error.message,
        error.file,
      );
    }
    if (error instanceof ObjectDataWriterError) {
      return refuse(422, error.reason, error.message);
    }
    throw error;
  }
  return new Answer(200, context.session.counts());
}

/** Reads a request's JSON body, an empty body as an empty object. */
async function readOptionalJson(
  request: http.IncomingMessage,
): Promise<Record<string, unknown>> {
  const text = (await readText(request)).trim();
  if (text === "") return {};
  const body = JSON.parse(text) as unknown;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new SyntaxError("The body is a JSON object.");
  }
  return body as Record<string, unknown>;
}

/**
 * Answers `POST /api/reset`: the edits that put a field back to its base,
 * or a whole object back to its base (a Custom object) or to the Built-in
 * object (a modified Built-in object), as one undo step.
 */
async function reset(
  context: ApiContext,
  request: http.IncomingMessage,
): Promise<Answer> {
  const body = await readOptionalJson(request);
  const { kind, rawcode, field, level, dataPointer } = body;
  if (
    typeof kind !== "string" ||
    !isKind(kind) ||
    typeof rawcode !== "string" ||
    (field !== undefined && typeof field !== "string") ||
    (level !== undefined && typeof level !== "number") ||
    (dataPointer !== undefined && typeof dataPointer !== "number")
  ) {
    return refuse(
      400,
      "bad-request",
      "The body is { kind, rawcode, field?, level?, dataPointer? }.",
    );
  }
  return applied(context, () => {
    const edits = context.session.resetEdits({
      kind,
      rawcode,
      ...(field !== undefined && { field }),
      ...(level !== undefined && { level }),
      ...(dataPointer !== undefined && { dataPointer }),
    });
    if (edits.length > 0) context.session.edit(edits);
  });
}

/** The operations of a bulk edit. */
const BULK_OPERATIONS: readonly BulkOperation[] = [
  "set",
  "add",
  "multiply",
  "reset",
];

/** What `field`, `level` and `dataPointer` of a body address, or undefined when they are no field. */
function fieldAddress(
  body: Record<string, unknown>,
): { field: string; level?: number; dataPointer?: number } | undefined {
  const { field, level, dataPointer } = body;
  if (
    typeof field !== "string" ||
    (level !== undefined && typeof level !== "number") ||
    (dataPointer !== undefined && typeof dataPointer !== "number")
  ) {
    return undefined;
  }
  return {
    field,
    ...(level !== undefined && { level }),
    ...(dataPointer !== undefined && { dataPointer }),
  };
}

/**
 * Answers `POST /api/bulk`: one field of a selection of objects set, added
 * to, multiplied or reset, as one undo step, or none of it.
 */
async function bulk(
  context: ApiContext,
  request: http.IncomingMessage,
): Promise<Answer> {
  const body = await readOptionalJson(request);
  const { op, kind, rawcodes, value } = body;
  const address = fieldAddress(body);
  const numeric = typeof op === "string" && isNumericOperation(op);
  if (
    typeof op !== "string" ||
    !(BULK_OPERATIONS as readonly string[]).includes(op) ||
    typeof kind !== "string" ||
    !isKind(kind) ||
    !Array.isArray(rawcodes) ||
    rawcodes.length === 0 ||
    !rawcodes.every((rawcode) => typeof rawcode === "string") ||
    address === undefined ||
    (op === "set" && typeof value !== "string" && typeof value !== "number") ||
    (numeric && (typeof value !== "number" || !Number.isFinite(value)))
  ) {
    return refuse(
      400,
      "bad-request",
      "The body is { op: set | add | multiply | reset, kind, rawcodes: [...], field, level?, dataPointer?, value }, value a number for add and multiply, and none for reset.",
    );
  }
  const listed = await objectsOf(context);
  if (listed instanceof Answer) return listed;
  const objects: ListedObject[] = [];
  for (const rawcode of rawcodes) {
    const object = listed.objects.find(
      (candidate) => candidate.kind === kind && candidate.rawcode === rawcode,
    );
    if (object === undefined) {
      return refuse(
        404,
        "unknown-object",
        `${rawcode} is no ${kind} of this map nor a Built-in one.`,
      );
    }
    objects.push(object);
  }
  const { session } = context;
  let edited = 0;
  const change = () => {
    // Refused before any value is read, and even when a reset leaves the
    // object as it is: `session.edit` sees only the edits it is given.
    session.refuseDefinitions(objects, "edit");
    const edits = bulkEdits(
      {
        op: op as BulkOperation,
        kind,
        rawcodes,
        ...address,
        ...((typeof value === "string" || typeof value === "number") && {
          value,
        }),
      },
      {
        objects,
        details: detailSourcesOf(context, listed),
        resetEdits: (target) => session.resetEdits(target),
      },
    );
    if (edits.length > 0) session.edit(edits);
    edited = new Set(edits.map((edit) => edit.rawcode)).size;
  };
  let answer: Answer;
  try {
    answer = applied(context, change);
  } catch (error) {
    if (!(error instanceof BulkRefusedError)) throw error;
    return refuse(error.status, error.reason, error.message);
  }
  if (answer.status !== 200) return answer;
  return new Answer(200, {
    ...(answer.body as SessionCounts),
    edited,
  } satisfies BulkAnswer);
}

/**
 * Answers `GET /api/table`: one Object kind as a spreadsheet, the map's
 * objects and the changed columns unless `objects=all` and `fields=all`
 * ask for every one.
 */
async function table(
  context: ApiContext,
  query: URLSearchParams,
): Promise<Answer> {
  const kind = query.get("kind");
  if (kind === null || !isKind(kind)) {
    return refuse(
      400,
      "bad-request",
      `The table needs ?kind=, one of ${OBJECT_KINDS.join(", ")}.`,
    );
  }
  const filter = filterOf(query);
  if (filter instanceof Answer) return filter;
  const listed = await objectsOf(context);
  if (listed instanceof Answer) return listed;
  const allObjects = query.get("objects") === "all";
  const rows = listed.objects.filter(
    (object) => filter(object) && (allObjects || object.origin !== "builtin"),
  );
  return new Answer(
    200,
    tableOf(
      kind,
      rows,
      detailSourcesOf(context, listed),
      query.get("fields") === "all",
    ),
  );
}

/** What a new Rawcode is checked against, or the lookup's reason it cannot list the objects. */
function rawcodeSources(context: ApiContext): RawcodeSources | Answer {
  const { session } = context;
  const listing = session.lookup.list();
  if (listing.status === "unavailable") {
    return refuse(503, "unavailable", listing.reason);
  }
  // The lookup's files end with the Object manifest, as `files()` documents.
  const manifest = session.lookup.files().at(-1);
  return {
    listed: listing.objects,
    working: session.working(),
    removed: manifest === undefined ? [] : removedRawcodes(manifest),
    placements: readPlacements(context.mapFolder),
  };
}

/** The `?kind=` of a query, or a refusal. */
function kindOf(query: URLSearchParams): ObjectKind | Answer {
  const kind = query.get("kind") ?? "";
  return isKind(kind)
    ? kind
    : refuse(
        400,
        "bad-request",
        `The query names its kind, one of ${OBJECT_KINDS.join(", ")}.`,
      );
}

/**
 * Answers `GET /api/free-rawcode?kind=&base=`: the Rawcode suggested for a
 * new object of a kind, a unit's prefix taken from its base, or from the
 * base of the Custom object it copies (`?copyOf=`).
 */
function freeRawcodeRoute(context: ApiContext, query: URLSearchParams): Answer {
  const kind = kindOf(query);
  if (kind instanceof Answer) return kind;
  const sources = rawcodeSources(context);
  if (sources instanceof Answer) return sources;
  const copyOf = query.get("copyOf");
  let base = query.get("base") ?? undefined;
  if (copyOf !== null) {
    const source = sources.working.get(objectKey(kind, copyOf));
    if (source?.origin !== "custom" || source.base === undefined) {
      return refuse(
        409,
        "not-custom",
        `${copyOf} is no Custom ${kind} of the map folder: only a Custom object is copied.`,
      );
    }
    base = source.base;
  }
  const prefix = rawcodePrefix(kind, base);
  const rawcode = freeRawcode(prefix, sources);
  return new Answer(200, {
    kind,
    prefix,
    ...(rawcode !== undefined && { rawcode }),
  } satisfies FreeRawcodeAnswer);
}

/** Answers `GET /api/rawcode-check?rawcode=`: whether a new object can take a Rawcode, and what holds it. */
function rawcodeCheck(context: ApiContext, query: URLSearchParams): Answer {
  const rawcode = query.get("rawcode") ?? "";
  if (!isRawcode(rawcode)) {
    return new Answer(200, {
      rawcode,
      free: false,
      holders: [],
      message: notRawcodeText(rawcode),
    } satisfies RawcodeCheckAnswer);
  }
  const sources = rawcodeSources(context);
  if (sources instanceof Answer) return sources;
  const holders = rawcodeHolders(rawcode, sources);
  return new Answer(200, {
    rawcode,
    free: holders.length === 0,
    holders,
    ...(holders.length > 0 && { message: holdersText(rawcode, holders) }),
  } satisfies RawcodeCheckAnswer);
}

/**
 * Answers `POST /api/create`: a new Custom object based on a Built-in
 * object or copying a Custom object, as one undo step, refused with
 * `"rawcode-taken"` when anything holds its Rawcode.
 */
async function create(
  context: ApiContext,
  request: http.IncomingMessage,
): Promise<Answer> {
  const { kind, rawcode, base, copyOf } = await readOptionalJson(request);
  const from =
    typeof base === "string" && copyOf === undefined
      ? { base }
      : typeof copyOf === "string" && base === undefined
        ? { copyOf }
        : undefined;
  if (
    typeof kind !== "string" ||
    !isKind(kind) ||
    typeof rawcode !== "string" ||
    from === undefined
  ) {
    return refuse(
      400,
      "bad-request",
      "The body is { kind, rawcode, base } or { kind, rawcode, copyOf }.",
    );
  }
  if (!isRawcode(rawcode)) {
    return refuse(422, "invalid-value", notRawcodeText(rawcode));
  }
  const sources = rawcodeSources(context);
  if (sources instanceof Answer) return sources;
  const holders = rawcodeHolders(rawcode, sources);
  if (holders.length > 0) {
    return refuse(409, "rawcode-taken", holdersText(rawcode, holders));
  }
  const answer = applied(context, () => {
    context.session.create({ kind, rawcode, ...from });
  });
  if (answer.status !== 200) return answer;
  return new Answer(200, {
    kind,
    rawcode,
    ...context.session.counts(),
  } satisfies CreateAnswer);
}

/**
 * The ids of an object's fields whose value names an object: a Rawcode or
 * a Rawcode list field of the object's kind, by `reforged-builtins`' field
 * table; any text field naming its Rawcode when there is no field table.
 */
function referringFields(
  context: ApiContext,
  object: ObjectDataObject,
  target: { readonly kind: ObjectKind; readonly rawcode: string },
): string[] {
  const entries = context.session.fieldTable?.fields[object.kind];
  const fields = new Set<string>();
  for (const modification of object.modifications) {
    if (typeof modification.value !== "string") continue;
    if (entries !== undefined) {
      if (!Object.hasOwn(entries, modification.field)) continue;
      const entry = entries[modification.field];
      if (entry.category !== "rawcode" && entry.category !== "rawcodeList") {
        continue;
      }
      if (entry.of !== undefined && entry.of !== target.kind) continue;
    }
    const names = modification.value
      .split(",")
      .some((rawcode) => rawcode.trim() === target.rawcode);
    if (names) fields.add(modification.field);
  }
  return [...fields];
}

/** One referrer in a sentence: its name and Rawcode, then its fields. */
const referrerText = (referrer: Referrer): string =>
  `${objectText(referrer.rawcode, referrer.name)} in ${referrer.fields.join(", ")}`;

/**
 * The message of a delete confirmation, in #482's words: what the delete
 * does to the objects that name it and to its placements.
 */
function deletionMessage(
  deletion: Pick<
    DeletionAnswer,
    "rawcode" | "referrers" | "placements" | "placementFile"
  >,
): string {
  const { rawcode, referrers, placements, placementFile: file } = deletion;
  const parts = [
    `Deleting ${rawcode} removes it from the map folder's Object data at the next save.`,
  ];
  if (referrers.length > 0) {
    parts.push(
      `${String(referrers.length)} object${referrers.length === 1 ? " names" : "s name"} it, and will name a Rawcode no object has: ${referrers.map(referrerText).join("; ")}.`,
    );
  }
  if (placements > 0 && file !== undefined) {
    const one = placements === 1;
    parts.push(
      `It is placed ${String(placements)} time${one ? "" : "s"} on the terrain, in ${file}. The Studio leaves ${one ? "that placement" : "those placements"} there: the game already skips ${one ? "it" : "them"}, and the World Editor drops ${one ? "it" : "them"} without asking at its next save.`,
    );
  }
  return parts.join(" ");
}

/** What deleting an object does: the objects that name it, its placements, and whether it can be. */
function deletionOf(
  context: ApiContext,
  kind: ObjectKind,
  rawcode: string,
): DeletionAnswer | Answer {
  const { session } = context;
  const listing = session.lookup.list();
  if (listing.status === "unavailable") {
    return refuse(503, "unavailable", listing.reason);
  }
  const working = session.working();
  const listed = listing.objects.find(
    (other) => other.kind === kind && other.rawcode === rawcode,
  );
  const definition =
    listed !== undefined &&
    listed.origin !== "builtin" &&
    listed.definitionFile !== undefined;
  const deletable =
    working.get(objectKey(kind, rawcode))?.origin === "custom" && !definition;
  const names = new Map(
    listing.objects.map((other) => [
      objectKey(other.kind, other.rawcode),
      other.name,
    ]),
  );
  const referrers: Referrer[] = [];
  for (const other of working.values()) {
    if (other.kind === kind && other.rawcode === rawcode) continue;
    const fields = referringFields(context, other, { kind, rawcode });
    if (fields.length === 0) continue;
    const name = names.get(objectKey(other.kind, other.rawcode));
    referrers.push({
      kind: other.kind,
      rawcode: other.rawcode,
      ...(name !== undefined && { name }),
      fields,
    });
  }
  const file = placementFile(kind);
  const placements = placementCount(
    readPlacements(context.mapFolder),
    kind,
    rawcode,
  );
  const facts = {
    kind,
    rawcode,
    referrers,
    placements,
    ...(file !== undefined && { placementFile: file }),
  };
  let message: string;
  if (deletable) message = deletionMessage(facts);
  else if (definition) {
    message = `${rawcode} is an Object definition's: delete it in the code.`;
  } else {
    message = `${rawcode} is no Custom ${kind} of the map folder: only a Custom object is deleted.`;
  }
  return { ...facts, deletable, message };
}

/** Answers `GET /api/deletion?kind=&rawcode=`: what deleting an object does, for its confirmation. */
function deletionRoute(context: ApiContext, query: URLSearchParams): Answer {
  const kind = kindOf(query);
  if (kind instanceof Answer) return kind;
  const found = deletionOf(context, kind, query.get("rawcode") ?? "");
  return found instanceof Answer ? found : new Answer(200, found);
}

/**
 * Answers `POST /api/delete`: removes a Custom object as one undo step,
 * refused for any other object; its placements stay on disk, and the
 * answer counts them.
 */
async function deleteRoute(
  context: ApiContext,
  request: http.IncomingMessage,
): Promise<Answer> {
  const { kind, rawcode } = await readOptionalJson(request);
  if (
    typeof kind !== "string" ||
    !isKind(kind) ||
    typeof rawcode !== "string"
  ) {
    return refuse(400, "bad-request", "The body is { kind, rawcode }.");
  }
  const answer = applied(context, () => {
    context.session.deleteObject({ kind, rawcode });
  });
  if (answer.status !== 200) return answer;
  return new Answer(200, {
    placements: placementCount(
      readPlacements(context.mapFolder),
      kind,
      rawcode,
    ),
    ...context.session.counts(),
  } satisfies DeleteAnswer);
}

/** Starts the World Editor on the map folder with `-launch -loadfile`; the reason it could not, or undefined. */
function reloadNow(context: ApiContext): ErrorAnswer["error"] | undefined {
  const executable = context.worldEditorExecutable;
  if (executable === undefined) {
    return {
      reason: "no-world-editor",
      message:
        "The Studio has no World Editor executable: none was given and the game's install holds no _retail_/x86_64/World Editor.exe. Start it with worldEditorExecutable (--world-editor) to reload the map there.",
    };
  }
  try {
    reloadWorldEditor(context.mapFolder, executable, context.worldEditorReload);
  } catch (error) {
    return {
      reason: "reload-failed",
      message: error instanceof Error ? error.message : String(error),
    };
  }
  return undefined;
}

/**
 * Answers `POST /api/reload-from-disk`, "Reload and keep my edits on top":
 * reads the map folder again and replays the unsaved edits on it, field by
 * field, those the disk also changed listed as conflicts; with no unsaved
 * edit, the map folder read again replaces the saved state. It tells every
 * host with `reloaded`, which names the host that asked.
 */
async function reloadFromDisk(
  context: ApiContext,
  request: http.IncomingMessage,
): Promise<Answer> {
  const { host } = await readOptionalJson(request);
  const { session } = context;
  let replay: Replay = { replayed: 0, notReplayed: [] };
  try {
    if (session.counts().unsavedEdits > 0) replay = session.replayOnDisk();
    else session.readChangeOnDisk();
  } catch (error) {
    if (error instanceof MapFolderError) {
      return refuse(409, "map-folder-unreadable", error.message);
    }
    throw error;
  }
  context.resync();
  context.events.send(
    "reloaded",
    reloadedEvent(session, [], typeof host === "string" ? host : undefined),
  );
  return new Answer(200, {
    ...session.counts(),
    ...replay,
    ...session.turns(),
  } satisfies ReloadFromDiskAnswer);
}

/** The counts and the turns left, after a change of them. */
const turnsChanged = (context: ApiContext): Answer =>
  new Answer(200, {
    ...context.session.counts(),
    ...context.session.turns(),
  } satisfies TurnsChangedAnswer);

/**
 * Answers `POST /api/conflicts`: for each conflict chosen, keeps mine or
 * takes theirs, the values taken as one undo step.
 */
async function chooseConflicts(
  context: ApiContext,
  request: http.IncomingMessage,
): Promise<Answer> {
  const body = await readOptionalJson(request);
  const { choices } = body;
  if (
    !Array.isArray(choices) ||
    !(choices as unknown[]).every(
      (choice) =>
        typeof choice === "object" &&
        choice !== null &&
        typeof (choice as { id?: unknown }).id === "string" &&
        ["mine", "theirs"].includes(
          (choice as { take?: unknown }).take as string,
        ),
    )
  ) {
    return refuse(
      400,
      "bad-request",
      'The body is { choices: [{ id, take: "mine" | "theirs" }] }.',
    );
  }
  const refused = applied(context, () => {
    context.session.chooseConflicts(choices as ConflictChoice[]);
  });
  return refused.status === 200 ? turnsChanged(context) : refused;
}

/**
 * Answers `POST /api/put-back`: "Apply them again" (`"apply"`) sets the
 * fields a World Editor save put back to what the Studio saved, as unsaved
 * edits in one undo step; "Keep the World Editor's" (`"keep"`) leaves them.
 */
async function answerPutBack(
  context: ApiContext,
  request: http.IncomingMessage,
): Promise<Answer> {
  const { action } = await readOptionalJson(request);
  if (action !== "apply" && action !== "keep") {
    return refuse(
      400,
      "bad-request",
      'The body is { action: "apply" | "keep" }.',
    );
  }
  const refused = applied(context, () => {
    context.session.answerPutBack(action);
  });
  return refused.status === 200 ? turnsChanged(context) : refused;
}

/**
 * Answers `POST /api/save`: the editor's `save()` with the World Editor
 * check on. Saved, it offers the reload when the World Editor holds the map
 * folder without unsaved edits and files were written, or reloads at once
 * when the request asks. Refused, every unsaved edit is kept; after
 * `"changed-on-disk"` the map folder is read again and the unsaved edits
 * replayed on top.
 */
async function save(
  context: ApiContext,
  request: http.IncomingMessage,
): Promise<Answer> {
  const body = await readOptionalJson(request);
  const { session } = context;
  const { conflicts } = session.turns();
  if (conflicts.length > 0) {
    return new Answer(409, {
      error: {
        reason: "conflicts",
        message: `${String(conflicts.length)} field${conflicts.length === 1 ? "" : "s"} changed both in the Studio and on disk: choose yours or the map folder's for each, then save again.`,
      },
      ...session.counts(),
      conflicts,
    } satisfies SaveRefusedAnswer);
  }
  let result;
  try {
    result = session.save(context.worldEditorCheck ?? true);
  } catch (error) {
    if (!(error instanceof ObjectDataWriterError)) throw error;
    if (error.reason === "changed-on-disk") {
      const replay = session.replayOnDisk();
      context.resync();
      const turns = session.turns();
      context.events.send(
        "reloaded",
        reloadedEvent(
          session,
          error.file === undefined ? [] : [error.file],
          typeof body.host === "string" ? body.host : undefined,
        ),
      );
      return new Answer(409, {
        error: {
          reason: error.reason,
          message: `${error.file ?? "A file"} changed on disk since the Studio read the map folder (a World Editor save?): nothing was written. The Studio read the map folder again and put your unsaved edits on top: review them${turns.conflicts.length > 0 ? ", choose a side for each field both changed" : ""}, then save again.`,
          ...(error.file !== undefined && { file: error.file }),
        },
        ...session.counts(),
        replayed: replay.replayed,
        notReplayed: replay.notReplayed,
        ...turns,
      } satisfies SaveRefusedAnswer);
    }
    return new Answer(409, {
      error: { reason: error.reason, message: error.message },
      ...session.counts(),
    } satisfies SaveRefusedAnswer);
  }
  context.resync();
  let reload: ReloadOffer = "none";
  let reloadError: string | undefined;
  if (result.worldEditor === "open" && result.written.length > 0) {
    if (context.worldEditorExecutable === undefined) reload = "no-executable";
    else if (body.reloadWorldEditor === true) {
      const failed = reloadNow(context);
      reload = failed === undefined ? "sent" : "offered";
      reloadError = failed?.message;
    } else reload = "offered";
  }
  const counts = session.counts();
  context.events.send("saved", { ...counts, written: result.written });
  return new Answer(200, {
    written: result.written,
    worldEditor: result.worldEditor,
    reload,
    ...(reloadError !== undefined && { reloadError }),
    ...counts,
  } satisfies SaveAnswer);
}

/**
 * Answers `POST /api/reload-world-editor`: `reloadWorldEditor(mapFolder,
 * worldEditorExecutable)`, refused while the World Editor shows unsaved
 * edits for the map folder, which the reload would drop.
 */
function reloadRoute(context: ApiContext): Answer {
  let state;
  try {
    state = checkWorldEditor(context.mapFolder, context.worldEditorCheck);
  } catch (error) {
    return refuse(
      409,
      "world-editor-check-failed",
      error instanceof Error ? error.message : String(error),
    );
  }
  if (state === "modified") {
    return refuse(
      409,
      "modified-in-world-editor",
      `The World Editor shows unsaved edits for ${context.mapFolder}: reloading would drop them. Save or discard them there first.`,
    );
  }
  const failed = reloadNow(context);
  if (failed !== undefined) {
    return refuse(
      failed.reason === "no-world-editor" ? 409 : 500,
      failed.reason,
      failed.message,
    );
  }
  return new Answer(200, { reloaded: true } satisfies ReloadAnswer);
}

/**
 * Answers `POST /api/adopt`: `reforged-map`'s Object adoption of one
 * object, `adoptObjects`, the function `pnpm objects:adopt` runs, with the
 * same World Editor check, refused with a 409 for each reason it throws
 * and for a map folder it cannot read; its definition file formatted with the Map
 * project's Prettier, as `objects:adopt` formats it. It adopts the object
 * as the map folder holds it on disk, so it is refused while the Studio
 * holds unsaved edits. After it the Studio reads the map folder again, its
 * undo and redo stacks emptied as after any reload, and the object shows as
 * an Object definition.
 */
async function adopt(
  context: ApiContext,
  request: http.IncomingMessage,
): Promise<Answer> {
  const body = await readOptionalJson(request);
  const { kind, rawcode } = body;
  if (
    typeof kind !== "string" ||
    !isKind(kind) ||
    typeof rawcode !== "string" ||
    rawcode.length !== 4
  ) {
    return refuse(
      400,
      "bad-request",
      "The body is { kind, rawcode }, the Rawcode four characters.",
    );
  }
  const { session } = context;
  const { unsavedEdits } = session.counts();
  if (unsavedEdits > 0) {
    return refuse(
      409,
      "unsaved-edits",
      `The Studio holds ${String(unsavedEdits)} unsaved change${unsavedEdits === 1 ? "" : "s"}, and adoption adopts the object as the map folder holds it on disk: save or undo your edits first, then adopt again.`,
    );
  }
  let report;
  try {
    report = adoptObjects(
      context.mapFolder,
      context.projectRoot,
      [`${kind}:${rawcode}`],
      context.worldEditorCheck === undefined
        ? {}
        : { worldEditorCheck: context.worldEditorCheck },
    );
  } catch (error) {
    if (
      error instanceof ObjectDefinitionsError ||
      error instanceof ObjectDataWriterError
    ) {
      return refuse(409, error.reason, error.message);
    }
    if (error instanceof MapFolderError) {
      return refuse(409, "map-folder-unreadable", error.message);
    }
    throw error;
  }
  const object = report.adopted[0] as DefinedObject | undefined;
  if (object === undefined) {
    throw new Error(
      `Object adoption adopted nothing at the ${kind} ${rawcode}, without refusing it.`,
    );
  }
  const formatting = await formatDefinitionFiles(
    context.projectRoot,
    report.files,
  );
  session.reopen();
  context.resync();
  const adopted: AdoptedObject = {
    kind: object.kind,
    rawcode: object.rawcode,
    path: path
      .relative(context.projectRoot, object.file)
      .split(path.sep)
      .join("/"),
  };
  const counts = session.counts();
  context.events.send("adopted", { ...counts, ...adopted });
  return new Answer(200, {
    adopted: { ...adopted, file: object.file },
    manifestWritten: report.manifestWritten,
    formatted: formatting.formatted,
    worldEditor: report.worldEditor,
    warnings: [...report.warnings, ...formatting.warnings],
    ...counts,
  } satisfies AdoptAnswer);
}

/**
 * Answers `GET /api/diff?against=saved|head|reload`: the unsaved changes,
 * the changes since the last commit, or what the last change on disk the
 * Studio read brought, in the text of `reforged-map`'s `textconv` function.
 */
function diff(context: ApiContext, query: URLSearchParams): Answer {
  const against = query.get("against") ?? "saved";
  if (against !== "saved" && against !== "head" && against !== "reload") {
    return refuse(
      400,
      "bad-request",
      "The query is ?against=saved|head|reload.",
    );
  }
  if (against === "reload") {
    const reload = context.session.lastReload;
    if (reload === undefined) {
      return new Answer(200, {
        against,
        available: false,
        reason:
          "The Studio has not read the map folder again since it started: no change on disk to show.",
      } satisfies DiffAnswer);
    }
    return new Answer(200, {
      against,
      available: true,
      files: diffFiles((file) => reload.before.get(file), reload.after, [
        ...reload.before.keys(),
        ...reload.after.keys(),
      ]),
    } satisfies DiffAnswer);
  }
  const files = context.session.files();
  const names = [...files.saved.keys(), ...files.working.keys()];
  if (against === "saved") {
    return new Answer(200, {
      against,
      available: true,
      files: diffFiles((file) => files.saved.get(file), files.working, names),
    } satisfies DiffAnswer);
  }
  const head = headFiles(context.mapFolder, names);
  if (head === undefined) {
    return new Answer(200, {
      against,
      available: false,
      reason: `${context.mapFolder} is not in a git repository: there is no last commit to compare with.`,
    } satisfies DiffAnswer);
  }
  return new Answer(200, {
    against,
    available: true,
    files: diffFiles(head, files.working, names),
  } satisfies DiffAnswer);
}

/** Answers `GET /api/icons`: every icon's path the objects of every kind use, for the icon picker. */
async function icons(context: ApiContext): Promise<Answer> {
  const listed = await objectsOf(context);
  if (listed instanceof Answer) return listed;
  const paths = new Set<string>();
  for (const object of listed.objects) {
    if (object.icon !== undefined) paths.add(object.icon);
  }
  return new Answer(200, {
    icons: [...paths].sort(),
  } satisfies IconsAnswer);
}

async function openDefinition(
  context: ApiContext,
  request: http.IncomingMessage,
): Promise<Answer> {
  const body = (await readJson(request)) as {
    kind?: unknown;
    rawcode?: unknown;
  } | null;
  const kind = body?.kind;
  const rawcode = body?.rawcode;
  if (typeof kind !== "string" || typeof rawcode !== "string") {
    return refuse(400, "bad-request", "The body is { kind, rawcode }.");
  }
  const listed = await objectsOf(context);
  if (listed instanceof Answer) return listed;
  const definition = listed.objects.find(
    (object) => object.kind === kind && object.rawcode === rawcode,
  )?.definition;
  if (definition === undefined) {
    return refuse(
      404,
      "not-found",
      `No Object definition defines the ${kind} ${rawcode}.`,
    );
  }
  const line = definitionLine(definition.file, rawcode);
  const started = openInEditor(definition.file, line, context.env);
  if (started === undefined) {
    return refuse(
      404,
      "no-editor",
      `No editor found to open ${definition.path}: put VS Code's code command on the PATH, or set VISUAL or EDITOR.`,
    );
  }
  return new Answer(200, {
    editor: started.editor,
    file: definition.file,
    line,
  } satisfies OpenInEditorAnswer);
}

/**
 * The file a request's `?path=` and `?layer=` name, resolved in #481's
 * order in that art layer: the refusal of a request without a path or with
 * a layer the map does not allow, and the 404 of a path found nowhere.
 */
async function resolveQueriedFile(
  context: ApiContext,
  query: URLSearchParams,
): Promise<{ resolved: ResolvedPath; layer: ArtLayer } | Answer> {
  const asked = query.get("path");
  if (asked === null || asked.trim() === "") {
    return refuse(
      400,
      "bad-request",
      "The query is ?path=<path>[&layer=sd|hd|de].",
    );
  }
  const layer = layerOf(context, query);
  if (layer instanceof Answer) return layer;
  const resolved = await context.paths(layer).resolve(asked);
  if (!resolved.found) {
    return refuse(
      404,
      "not-found",
      `${resolved.path} is neither in the map folder nor in the install.`,
    );
  }
  return { resolved, layer };
}

/**
 * Answers `GET /api/files?path=`: the bytes of an icon's or a model's file,
 * resolved in #481's order, the map folder's imports first; a 404 for a
 * path found nowhere, which the page shows as a placeholder.
 */
async function serveFile(
  context: ApiContext,
  query: URLSearchParams,
  response: http.ServerResponse,
): Promise<void> {
  const found = await resolveQueriedFile(context, query);
  if (found instanceof Answer) {
    send(response, found);
    return;
  }
  const { resolved } = found;
  const bytes = await resolved.read();
  response
    .writeHead(200, {
      "content-type": "application/octet-stream",
      "content-length": String(bytes.byteLength),
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    })
    .end(bytes);
}

/** Answers `POST /api/art-layer`: the art layer the session reads icons and previews in from now on. */
async function setArtLayer(
  context: ApiContext,
  request: http.IncomingMessage,
): Promise<Answer> {
  const { artLayer } = await readOptionalJson(request);
  if (!isArtLayer(artLayer)) {
    return refuse(
      400,
      "bad-request",
      `The body is { artLayer }, one of ${ART_LAYERS.join(", ")}.`,
    );
  }
  if (!context.artLayer.allowed.includes(artLayer)) {
    return refuse(
      409,
      "not-supported",
      `The map's Supported Modes do not allow ${artLayer}: they allow ${context.artLayer.allowed.join(", ")}.`,
    );
  }
  context.artLayer.current = artLayer;
  return new Answer(200, { artLayer } satisfies ArtLayerAnswer);
}

/** The install's models of each art layer, listed once. */
const listedModels = new WeakMap<CascStorage, Map<ArtLayer, string[]>>();

/**
 * Answers `GET /api/models?q=[&limit=&layer=]`: the models' paths of the
 * map folder's imports and of the install in the art layer, those whose
 * path holds the text.
 */
async function models(
  context: ApiContext,
  query: URLSearchParams,
): Promise<Answer> {
  const layer = layerOf(context, query);
  if (layer instanceof Answer) return layer;
  const text = (query.get("q") ?? "").trim();
  const limitText = query.get("limit");
  const limit = limitText === null ? MODELS_LIMIT : Number(limitText);
  if (!Number.isInteger(limit) || limit < 1) {
    return refuse(400, "bad-request", "The limit is a whole number above 0.");
  }
  let byLayer = listedModels.get(context.storage);
  if (byLayer === undefined) {
    byLayer = new Map();
    listedModels.set(context.storage, byLayer);
  }
  let install = byLayer.get(layer);
  if (install === undefined) {
    install = installModels(context.storage, layer);
    byLayer.set(layer, install);
  }
  const found = searchModels(await mapModels(context.mapFolder), install, text);
  return new Answer(200, {
    query: text,
    models: found.slice(0, limit),
    total: found.length,
  } satisfies ModelsAnswer);
}

/**
 * The key of the thumbnail a request names, from its `?path=` and
 * `?layer=`: the path normalized as the resolver finds it, and a map
 * import's bytes; the refusal of a request without a path, and the 404 of
 * a model found nowhere.
 */
async function thumbnailKey(
  context: ApiContext,
  query: URLSearchParams,
): Promise<ThumbnailKey | Answer> {
  const found = await resolveQueriedFile(context, query);
  if (found instanceof Answer) return found;
  const { resolved, layer } = found;
  return {
    path: resolved.path,
    artLayer: layer,
    ...(resolved.from === "map" && { imported: await resolved.read() }),
  };
}

/**
 * Answers `GET /api/thumbnails?path=[&layer=]`: the PNG the cache holds for
 * a model, or a 404 the page answers by drawing it.
 */
async function readThumbnail(
  context: ApiContext,
  query: URLSearchParams,
  response: http.ServerResponse,
): Promise<void> {
  const key = await thumbnailKey(context, query);
  if (key instanceof Answer) {
    send(response, key);
    return;
  }
  const png = await context.thumbnails.read(key);
  if (png === undefined) {
    send(
      response,
      refuse(404, "not-cached", `No thumbnail of ${key.path} is cached yet.`),
    );
    return;
  }
  response
    .writeHead(200, {
      "content-type": "image/png",
      "content-length": String(png.byteLength),
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    })
    .end(png);
}

/** Answers `PUT /api/thumbnails?path=[&layer=]`: keeps the PNG the page drew for a model. */
async function writeThumbnail(
  context: ApiContext,
  query: URLSearchParams,
  request: http.IncomingMessage,
): Promise<Answer> {
  const key = await thumbnailKey(context, query);
  if (key instanceof Answer) return key;
  const png = await readBytes(request, THUMBNAIL_LIMIT);
  try {
    await context.thumbnails.write(key, png);
  } catch (error) {
    if (error instanceof TypeError) {
      return refuse(400, "bad-request", error.message);
    }
    throw error;
  }
  return new Answer(200, {
    path: key.path,
    artLayer: key.artLayer,
  } satisfies ThumbnailAnswer);
}

async function sessionAnswer(context: ApiContext): Promise<Answer> {
  const { session } = context;
  const listing = session.lookup.list();
  const gameDataSet =
    listing.status === "listed" ? listing.gameDataSet : undefined;
  let worldEditor: SessionAnswer["worldEditor"];
  try {
    worldEditor = checkWorldEditor(context.mapFolder, context.worldEditorCheck);
  } catch {
    worldEditor = "check-failed";
  }
  const baseValues = baseValuesSet(context, gameDataSet);
  await context.gameData(baseValues);
  return new Answer(200, {
    mapFolder: context.mapFolder,
    projectRoot: context.projectRoot,
    build: context.build,
    gameDataSet,
    baseValues,
    worldEditor,
    worldEditorExecutable: context.worldEditorExecutable,
    warnings: [
      ...session.warnings,
      ...(listing.status === "unavailable" ? [listing.reason] : []),
    ],
    artLayer: context.artLayer.current,
    artLayers: context.artLayer.allowed,
    ...session.counts(),
  } satisfies SessionAnswer);
}

/**
 * Answers one request: the request rules first, then the API's routes and
 * the page's.
 *
 * @param context - What the routes reach.
 * @param request - The request.
 * @param response - Its response.
 */
export async function handle(
  context: ApiContext,
  request: http.IncomingMessage,
  response: http.ServerResponse,
): Promise<void> {
  const refused = refusal(request, context.port());
  if (refused !== undefined) {
    send(response, refuse(403, refused.reason, refused.message));
    return;
  }
  const url = new URL(request.url ?? "/", "http://localhost");
  const { pathname, searchParams } = url;
  const method = request.method ?? "GET";
  const route = `${method} ${pathname}`;
  try {
    if (route === "GET /api/session") {
      send(response, await sessionAnswer(context));
    } else if (route === "GET /api/events") {
      context.events.open(response, context.session.counts());
    } else if (route === "GET /api/objects") {
      send(response, await listObjects(context, searchParams));
    } else if (method === "GET" && pathname.startsWith("/api/objects/")) {
      const rawcode = decodeURIComponent(
        pathname.slice("/api/objects/".length),
      );
      send(response, await rawcodeObjects(context, rawcode, searchParams));
    } else if (route === "GET /api/search") {
      send(response, await search(context, searchParams));
    } else if (route === "GET /api/files") {
      await serveFile(context, searchParams, response);
    } else if (route === "POST /api/art-layer") {
      send(response, await setArtLayer(context, request));
    } else if (route === "GET /api/models") {
      send(response, await models(context, searchParams));
    } else if (route === "GET /api/thumbnails") {
      await readThumbnail(context, searchParams, response);
    } else if (route === "PUT /api/thumbnails") {
      send(response, await writeThumbnail(context, searchParams, request));
    } else if (route === "POST /api/edits") {
      send(response, await edit(context, request));
    } else if (route === "GET /api/free-rawcode") {
      send(response, freeRawcodeRoute(context, searchParams));
    } else if (route === "GET /api/rawcode-check") {
      send(response, rawcodeCheck(context, searchParams));
    } else if (route === "POST /api/create") {
      send(response, await create(context, request));
    } else if (route === "GET /api/deletion") {
      send(response, deletionRoute(context, searchParams));
    } else if (route === "POST /api/delete") {
      send(response, await deleteRoute(context, request));
    } else if (route === "GET /api/table") {
      send(response, await table(context, searchParams));
    } else if (route === "POST /api/bulk") {
      send(response, await bulk(context, request));
    } else if (route === "POST /api/reset") {
      send(response, await reset(context, request));
    } else if (route === "POST /api/undo") {
      send(
        response,
        applied(context, () => {
          context.session.undoStep();
        }),
      );
    } else if (route === "POST /api/redo") {
      send(
        response,
        applied(context, () => {
          context.session.redoStep();
        }),
      );
    } else if (route === "POST /api/save") {
      send(response, await save(context, request));
    } else if (route === "GET /api/turns") {
      send(response, new Answer(200, context.session.turns()));
    } else if (route === "POST /api/reload-from-disk") {
      send(response, await reloadFromDisk(context, request));
    } else if (route === "POST /api/conflicts") {
      send(response, await chooseConflicts(context, request));
    } else if (route === "POST /api/put-back") {
      send(response, await answerPutBack(context, request));
    } else if (route === "POST /api/reload-world-editor") {
      send(response, reloadRoute(context));
    } else if (route === "POST /api/adopt") {
      send(response, await adopt(context, request));
    } else if (route === "GET /api/diff") {
      send(response, diff(context, searchParams));
    } else if (route === "GET /api/icons") {
      send(response, await icons(context));
    } else if (route === "POST /api/open-in-editor") {
      send(response, await openDefinition(context, request));
    } else if (pathname.startsWith("/api/")) {
      send(response, refuse(404, "not-found", `No route ${route}.`));
    } else if (method !== "GET") {
      send(response, refuse(405, "bad-request", `The page answers GET only.`));
    } else if (pathname === "/") {
      response.writeHead(302, { location: "/objects" }).end();
    } else {
      servePage(pathname, response);
    }
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof URIError) {
      send(response, refuse(400, "bad-request", error.message));
      return;
    }
    send(
      response,
      refuse(
        500,
        "internal",
        error instanceof Error ? error.message : String(error),
      ),
    );
  }
}
