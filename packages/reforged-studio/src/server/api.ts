/**
 * The routes of the Studio's JSON API, under `/api/`, and of its page. Every
 * answer is JSON but the page's files and the event stream; a refusal is an
 * {@link ErrorAnswer}.
 */
import type http from "node:http";
import {
  checkWorldEditor,
  ObjectDataWriterError,
  type GameDataSet,
  type ObjectKind,
  type WorldEditorCheckOptions,
} from "reforged-map";
import type { GameData } from "../game-data.js";
import { OBJECT_KINDS } from "../kinds.js";
import {
  OBJECT_ORIGINS,
  type Edit,
  type ErrorAnswer,
  type ListedObject,
  type ObjectOrigin,
  type ObjectsAnswer,
  type OpenInEditorAnswer,
  type RawcodeAnswer,
  type SearchAnswer,
  type SessionAnswer,
} from "./api-types.js";
import type { EventStreams } from "./events.js";
import { composeObjects, detailOf, definitionLine } from "./objects.js";
import { openInEditor, type EditorEnvironment } from "./open-in-editor.js";
import { servePage } from "./page.js";
import { refusal } from "./requests.js";
import { EditRefusedError, type Session } from "./session.js";

/** The most objects a search answers. */
const SEARCH_LIMIT = 50;

/** The largest request body read, in bytes. */
const BODY_LIMIT = 1024 * 1024;

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
  readonly env: EditorEnvironment;
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
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request as AsyncIterable<Buffer>) {
    size += chunk.byteLength;
    if (size > BODY_LIMIT) throw new SyntaxError("The body is too large.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

const isKind = (value: string): value is ObjectKind =>
  (OBJECT_KINDS as readonly string[]).includes(value);

const isOrigin = (value: string): value is ObjectOrigin =>
  (OBJECT_ORIGINS as readonly string[]).includes(value);

/** The objects and the map's Game data set, or the lookup's reason it cannot list them. */
function objectsOf(
  context: ApiContext,
): { objects: ListedObject[]; gameDataSet: GameDataSet | undefined } | Answer {
  const { session } = context;
  const listing = session.lookup.list();
  if (listing.status === "unavailable") {
    return refuse(503, "unavailable", listing.reason);
  }
  return {
    gameDataSet: listing.gameDataSet,
    objects: composeObjects({
      projectRoot: context.projectRoot,
      listed: listing.objects,
      gameDataSet: listing.gameDataSet,
      saved: session.saved,
      working: session.working(),
    }),
  };
}

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

function listObjects(context: ApiContext, query: URLSearchParams): Answer {
  const filter = filterOf(query);
  if (filter instanceof Answer) return filter;
  const listed = objectsOf(context);
  if (listed instanceof Answer) return listed;
  return new Answer(200, {
    gameDataSet: listed.gameDataSet,
    objects: listed.objects.filter(filter),
  } satisfies ObjectsAnswer);
}

function search(context: ApiContext, query: URLSearchParams): Answer {
  const filter = filterOf(query);
  if (filter instanceof Answer) return filter;
  const text = (query.get("q") ?? "").trim();
  const listed = objectsOf(context);
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
  switch (result.status) {
    case "malformed":
      return new Answer(400, {
        status: "malformed",
        rawcode,
      } satisfies RawcodeAnswer);
    case "unavailable":
      return refuse(503, "unavailable", result.reason);
    case "unknown":
      return new Answer(404, {
        status: "unknown",
        rawcode,
        suggestions: result.suggestions,
      } satisfies RawcodeAnswer);
    case "known":
    case "not-in-game-data-set": {
      const listed = objectsOf(context);
      if (listed instanceof Answer) return listed;
      const objects = listed.objects.filter(
        (object) =>
          object.rawcode === rawcode &&
          result.objects.some((other) => other.kind === object.kind),
      );
      const candidates =
        kind === null
          ? objects
          : objects.filter((object) => object.kind === kind);
      const selected =
        candidates.length === 1
          ? detailOf(
              candidates[0],
              context.session.working(),
              await context.gameData(
                baseValuesSet(context, listed.gameDataSet),
              ),
            )
          : undefined;
      const answer: RawcodeAnswer =
        result.status === "known"
          ? { status: "known", rawcode, objects, ...(selected && { selected }) }
          : {
              status: "not-in-game-data-set",
              rawcode,
              objects,
              ...(selected && { selected }),
              gameDataSet: result.gameDataSet,
            };
      return new Answer(200, answer);
    }
  }
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
  try {
    context.session.edit(edits as Edit[]);
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
  const listed = objectsOf(context);
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
    warnings: [
      ...session.warnings,
      ...(listing.status === "unavailable" ? [listing.reason] : []),
    ],
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
      send(response, listObjects(context, searchParams));
    } else if (method === "GET" && pathname.startsWith("/api/objects/")) {
      const rawcode = decodeURIComponent(
        pathname.slice("/api/objects/".length),
      );
      send(response, await rawcodeObjects(context, rawcode, searchParams));
    } else if (route === "GET /api/search") {
      send(response, search(context, searchParams));
    } else if (route === "POST /api/edits") {
      send(response, await edit(context, request));
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
