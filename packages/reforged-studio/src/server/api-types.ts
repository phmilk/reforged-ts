/**
 * The Studio's host-neutral API: the JSON bodies its server answers and
 * takes, and the events of its one event stream. The page talks to the
 * server through these alone, and so does any other host (the later VS Code
 * custom editor): nothing here assumes a browser tab.
 */
import type { GameDataSet, ObjectKind, RawcodeSuggestion } from "reforged-map";

/**
 * Who owns an object, as the tree groups them: `"custom"`, a Custom object
 * of the map folder; `"definition"`, an object an Object definition of the
 * code defines, read-only; `"modified"`, a Built-in object the map folder
 * modifies; `"builtin"`, a Built-in object the map does not modify.
 */
export type ObjectOrigin = "custom" | "definition" | "modified" | "builtin";

/** The origins in the order the tree groups them. */
export const OBJECT_ORIGINS: readonly ObjectOrigin[] = [
  "custom",
  "definition",
  "modified",
  "builtin",
];

/** The Object definition that defines an object. */
export interface DefinitionSource {
  /** Its file, an absolute path. */
  readonly file: string;
  /** Its file relative to the Map project's root, with `/`. */
  readonly path: string;
}

/** One object, as the list and the search give it. */
export interface ListedObject {
  /** Its Rawcode. */
  readonly rawcode: string;
  /** Its Object kind. */
  readonly kind: ObjectKind;
  /** Who owns it. */
  readonly origin: ObjectOrigin;
  /** Its name in the session's working state; undefined when none is known. */
  readonly name: string | undefined;
  /** A Custom object's base, or an Object definition's when it has one: its Rawcode and its enUS name. */
  readonly base?: {
    readonly rawcode: string;
    readonly name: string | undefined;
  };
  /** A Built-in object's enUS name, modified or not. */
  readonly builtinName?: string;
  /** The Object definition that defines it, for the origin `"definition"`. */
  readonly definition?: DefinitionSource;
  /** Whether the map's Game data set holds it: false for a Built-in object outside it. */
  readonly inGameDataSet: boolean;
  /** Whether an object of another Object kind has its Rawcode (`B000`). */
  readonly shared: boolean;
}

/** `GET /api/objects`: the objects, by Object kind, origin, then Rawcode. */
export interface ObjectsAnswer {
  /** The map's Game data set; undefined when `war3map.w3i` does not say it. */
  readonly gameDataSet: GameDataSet | undefined;
  readonly objects: readonly ListedObject[];
}

/** `GET /api/search?q=`: the objects whose Rawcode or name matches, a Rawcode's first. */
export interface SearchAnswer {
  readonly query: string;
  readonly objects: readonly ListedObject[];
  /** For a query of four characters, no object of that Rawcode found: the lookup's suggestions. */
  readonly suggestions?: readonly RawcodeSuggestion[];
}

/** One row of an object's field table: a field, at one level for a field of levels. */
export interface FieldRow {
  /** The field's id (`uhpm`). */
  readonly id: string;
  /** Its enUS label, from the install; absent when the install gives none. */
  readonly label?: string;
  /** Its metadata type (`int`, `attackType`); absent for a field the install does not know. */
  readonly type?: string;
  /** Its metadata category (`stats`); absent for a field the install does not know. */
  readonly category?: string;
  /** Its level, from 1, for a field of levels. */
  readonly level?: number;
  /** Its base's value at that level, as the game's files hold it; absent when they hold none. */
  readonly base?: string;
  /** Its value in the session's working state, a `TRIGSTR_nnn` resolved; absent when the object does not modify it. */
  readonly value?: number | string;
  /** Its value as the file stores it (`TRIGSTR_004`); absent when the object does not modify it. */
  readonly stored?: number | string;
  /** Whether the object modifies it. */
  readonly modified: boolean;
}

/** One object with its field table, as `GET /api/objects/<rawcode>` selects it. */
export interface ObjectDetail extends ListedObject {
  /** Its fields: each field of its kind the install knows, then each modification it does not. */
  readonly fields: readonly FieldRow[];
  /** For an Object definition: its file and the line of its Rawcode, where "Open in editor" opens it. */
  readonly readOnly?: DefinitionSource & { readonly line: number };
}

/**
 * `GET /api/objects/<rawcode>[?kind=]`: what the Rawcode lookup of
 * `reforged-map` gives, the hover's and the lint rule's.
 */
export type RawcodeAnswer =
  | {
      /** `"known"`: one object, or one per Object kind sharing it. */
      readonly status: "known";
      readonly rawcode: string;
      readonly objects: readonly ListedObject[];
      /** The object selected: the only one, or the one of `?kind=`; absent when the page must ask which. */
      readonly selected?: ObjectDetail;
    }
  | {
      /** `"not-in-game-data-set"`: only Built-in objects the map's Game data set does not hold. */
      readonly status: "not-in-game-data-set";
      readonly rawcode: string;
      readonly objects: readonly ListedObject[];
      readonly selected?: ObjectDetail;
      readonly gameDataSet: GameDataSet;
    }
  | {
      /** `"unknown"`, answered with 404: neither in this map nor Built-in. */
      readonly status: "unknown";
      readonly rawcode: string;
      /** The lookup's suggestions, one edit away. */
      readonly suggestions: readonly RawcodeSuggestion[];
    }
  | {
      /** `"malformed"`, answered with 400: not four printable ASCII characters. */
      readonly status: "malformed";
      readonly rawcode: string;
    };

/** One edit of `POST /api/edits`, an edit of `reforged-map`'s Object data editor. */
export type Edit =
  | {
      readonly op: "setField";
      readonly kind: ObjectKind;
      readonly rawcode: string;
      readonly field: string;
      readonly level?: number;
      readonly dataPointer?: number;
      readonly value: number | string;
    }
  | {
      readonly op: "removeField";
      readonly kind: ObjectKind;
      readonly rawcode: string;
      readonly field: string;
      readonly level?: number;
      readonly dataPointer?: number;
    }
  | {
      readonly op: "addObject";
      readonly kind: ObjectKind;
      readonly rawcode: string;
      readonly base: string;
    }
  | {
      readonly op: "removeObject";
      readonly kind: ObjectKind;
      readonly rawcode: string;
    };

/** The body of `POST /api/edits`: edits applied together, as one undo step, or none of them. */
export interface EditsRequest {
  readonly edits: readonly Edit[];
}

/** What the session holds of unsaved work, in each answer that changes it. */
export interface SessionCounts {
  /** The fields and objects the working state changes from the saved state. */
  readonly unsavedEdits: number;
  /** The steps undo can take back. */
  readonly undo: number;
  /** The steps redo can take again. */
  readonly redo: number;
}

/**
 * A refusal: its reason and a message an author reads. The reasons are
 * `reforged-map`'s `ObjectDataWriterError` reasons, and the Studio's own:
 * `"object-definition"`, `"no-editor"`, `"bad-request"`, `"not-found"`,
 * `"forbidden-host"`, `"forbidden-origin"`, `"unavailable"`.
 */
export interface ErrorAnswer {
  readonly error: {
    readonly reason: string;
    readonly message: string;
    /** The Object definition's file, for `"object-definition"`. */
    readonly file?: string;
  };
}

/** `GET /api/session`: the session's map folder, game and counts. */
export interface SessionAnswer extends SessionCounts {
  readonly mapFolder: string;
  readonly projectRoot: string;
  /** The Build of the install read. */
  readonly build: string;
  /** The map's Game data set; undefined when `war3map.w3i` does not say it. */
  readonly gameDataSet: GameDataSet | undefined;
  /** The Game data set the field table's base values are read from: the map's, else the latest Custom one. */
  readonly baseValues: string;
  /** What the World Editor shows of the map folder, or `"check-failed"`. */
  readonly worldEditor: "no-window" | "open" | "modified" | "check-failed";
  /** The readers' warnings, each one line. */
  readonly warnings: readonly string[];
}

/** `POST /api/open-in-editor`'s answer: the command run and what it opened. */
export interface OpenInEditorAnswer {
  /** `"code"`, `"VISUAL"` or `"EDITOR"`. */
  readonly editor: "code" | "VISUAL" | "EDITOR";
  readonly file: string;
  readonly line: number;
}

/**
 * The events of `GET /api/events`, a `text/event-stream`: `session` once on
 * connecting; `reloaded` when the map folder changed on disk with no
 * unsaved edit and the Studio read it again; `changed-on-disk` when it
 * changed with unsaved edits, which it keeps and does not read over.
 */
export interface StudioEvents {
  readonly session: SessionCounts;
  readonly reloaded: SessionCounts & { readonly files: readonly string[] };
  readonly "changed-on-disk": SessionCounts & {
    readonly files: readonly string[];
  };
}
