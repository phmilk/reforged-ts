/**
 * The Studio's host-neutral API: the JSON bodies its server answers and
 * takes, and the events of its one event stream. The page talks to the
 * server through these alone, and so does any other host (the later VS Code
 * custom editor): nothing here assumes a browser tab.
 */
import type {
  GameDataSet,
  Locale,
  ObjectKind,
  RawcodeSuggestion,
  WorldEditorState,
} from "reforged-map";

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
  /**
   * Its group in the World Editor's tree, outermost first, each labelled as
   * the editor data labels it (`["Human", "Melee", "Heroes"]`): for a
   * Built-in object the install holds, modified or not; absent otherwise.
   */
  readonly group?: readonly string[];
  /**
   * The path of its icon (`ReplaceableTextures\CommandButtons\BTNFootman.blp`),
   * its own modification over its base's value, as the field holds it;
   * absent when it has none. `GET /api/files?path=` serves it.
   */
  readonly icon?: string;
  /** Whether the map's Game data set holds it: false for a Built-in object outside it. */
  readonly inGameDataSet: boolean;
  /** Whether an object of another Object kind has its Rawcode (`B000`). */
  readonly shared: boolean;
}

/** `GET /api/objects`: the objects, by Object kind, origin, then Rawcode. */
export interface ObjectsAnswer {
  /** The map's Game data set; undefined when `war3map.w3i` does not say it. */
  readonly gameDataSet: GameDataSet | undefined;
  /** The objects the filter keeps. */
  readonly objects: readonly ListedObject[];
}

/** `GET /api/search?q=`: the objects whose Rawcode or name matches, a Rawcode's first. */
export interface SearchAnswer {
  /** The text searched, trimmed. */
  readonly query: string;
  /** The objects found, at most 50: those of the Rawcode, then those whose name holds the text. */
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
  /** Its base's value as the editor shows it: an enumeration's label, a `WESTRING_` key resolved; absent with `base`. */
  readonly baseDisplay?: string;
  /** Its value in the session's working state, a `TRIGSTR_nnn` resolved; absent when the object does not modify it. */
  readonly value?: number | string;
  /** Its value as the file stores it (`TRIGSTR_004`); absent when the object does not modify it. */
  readonly stored?: number | string;
  /**
   * The value shown, as the editor shows it: the working state's value when
   * the object modifies it, else its base's, an enumeration's label
   * (`Normal` for `normal`) and a `WESTRING_` key resolved; absent when
   * there is neither.
   */
  readonly display?: string;
  /** Whether the object modifies it. */
  readonly modified: boolean;
  /**
   * Whether the working state's value differs from the saved state's: an
   * unsaved edit set, changed or removed it.
   */
  readonly unsaved: boolean;
  /**
   * The input it edits with, by its type in `reforged-builtins`' field
   * table; absent when the field table does not know it and the object does
   * not modify it, or when there is no field table: then it is read-only.
   */
  readonly input?: FieldInput;
  /** The type a modification of it stores, which an edit's value takes: an integer, a real or a string. */
  readonly valueType?: "int" | "real" | "unreal" | "string";
  /** The raw values of an enumeration and their labels, for the input `"select"`, in the editor data's order. */
  readonly options?: readonly FieldOption[];
  /** The Object kind of the Rawcodes a Rawcode list names, as the field table gives it. */
  readonly of?: ObjectKind;
  /** The objects of a Rawcode list's value, in its order, each with its kind and name when an object of the list's kind has it. */
  readonly references?: readonly FieldReference[];
  /**
   * Whether the World Editor writes its value as a `TRIGSTR_nnn` of
   * `war3map.wts`: the Studio edits its default text only.
   */
  readonly localizable?: boolean;
  /** The translations of a localizable value, by locale, read-only: the writer keeps them through an edit of the default text. */
  readonly translations?: Readonly<Partial<Record<Locale, string>>>;
}

/**
 * The input a field edits with: a whole number, a real, a text, an
 * enumeration as a select, a toggle (0 or 1), a Rawcode list as chips, or
 * an icon's path with its picker.
 */
export type FieldInput =
  "integer" | "real" | "text" | "select" | "toggle" | "rawcodes" | "icon";

/** One raw value of an enumeration, as a select offers it: `Heavy (large)`. */
export interface FieldOption {
  /** The raw value the field holds: `large`. */
  readonly value: string;
  /** Its enUS label: `Heavy`; absent when the editor strings give none. */
  readonly label?: string;
}

/** One Rawcode of a Rawcode list, as a chip links it. */
export interface FieldReference {
  /** The Rawcode. */
  readonly rawcode: string;
  /** The Object kind of the object that has it; absent when none has it. */
  readonly kind?: ObjectKind;
  /** The object's name; absent when none is known. */
  readonly name?: string;
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

/** The body of `POST /api/reset`: a field to put back to its base, or, without `field`, a whole object. */
export interface ResetRequest {
  /** The object's Object kind. */
  readonly kind: ObjectKind;
  /** The object's Rawcode. */
  readonly rawcode: string;
  /** The field to reset; the whole object when left out. */
  readonly field?: string;
  /** The field's level, for a field of levels. */
  readonly level?: number;
  /** The field's data pointer, in the kinds that store one. */
  readonly dataPointer?: number;
}

/** The body of `POST /api/edits`: edits applied together, as one undo step, or none of them. */
export interface EditsRequest {
  /** The edits, applied in order. */
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

/** The body of `POST /api/save`. */
export interface SaveRequest {
  /**
   * Whether to reload the World Editor at once when it holds the map folder
   * without unsaved edits and the save wrote files, instead of offering it:
   * the page's setting. False when left out.
   */
  readonly reloadWorldEditor?: boolean;
}

/**
 * What a save does about the World Editor: `"offered"` when it holds the
 * map folder without unsaved edits (`"open"`) and the save wrote files, so
 * the page offers "Reload in the World Editor"; `"sent"` when the save
 * reloaded it at once, as the request asked; `"no-executable"` when it
 * would be offered but the Studio was given no World Editor executable;
 * `"none"` otherwise.
 */
export type ReloadOffer = "offered" | "sent" | "no-executable" | "none";

/** `POST /api/save`'s answer, once the map folder is written. */
export interface SaveAnswer extends SessionCounts {
  /** The files written or deleted, by path in the map folder with `/`; empty when no byte changed. */
  readonly written: readonly string[];
  /** What the World Editor showed of the map folder before the first write. */
  readonly worldEditor: WorldEditorState | undefined;
  /** What the save does about the World Editor. */
  readonly reload: ReloadOffer;
  /** Why the reload the request asked for failed, when it did: it is then offered. */
  readonly reloadError?: string;
}

/** An unsaved edit the editor refused to replay on a map folder read again, with its reason. */
export interface NotReplayed {
  /** The edit. */
  readonly edit: Edit;
  /** The editor's reason. */
  readonly reason: string;
  /** Its message. */
  readonly message: string;
}

/**
 * `POST /api/save`'s refusal, answered with 409: `"modified-in-world-editor"`,
 * `"changed-on-disk"` or `"world-editor-check-failed"`, every unsaved edit
 * kept. After `"changed-on-disk"` the Studio has read the map folder again
 * and replayed its unsaved edits on top, field by field.
 */
export interface SaveRefusedAnswer extends ErrorAnswer, SessionCounts {
  /** After `"changed-on-disk"`: how many edits were replayed on the map folder read again. */
  readonly replayed?: number;
  /** After `"changed-on-disk"`: the edits the editor refused on it. */
  readonly notReplayed?: readonly NotReplayed[];
}

/** `POST /api/reload-world-editor`'s answer: the World Editor was started with `-launch -loadfile <map folder>`. */
export interface ReloadAnswer {
  /** Always true. */
  readonly reloaded: true;
}

/** One file of a diff: its path in the map folder and its text's unified diff. */
export interface FileDiff {
  /** The file, by path in the map folder with `/` (`war3map.w3u`). */
  readonly file: string;
  /** Its unified diff, in `git diff`'s hunks. */
  readonly diff: string;
}

/**
 * `GET /api/diff?against=saved|head`: the working state against the saved
 * state (`saved`, the unsaved changes), or against the files at `HEAD`
 * (`head`, the changes since the last commit), each Object data file in the
 * text of `reforged-map`'s `textconv` function, `war3map.wts` and the
 * locales' tables in their own text.
 */
export type DiffAnswer =
  | {
      /** What the working state is compared with. */
      readonly against: "saved" | "head";
      /** The diff could be made. */
      readonly available: true;
      /** Each file that differs, in the order a save writes them. */
      readonly files: readonly FileDiff[];
    }
  | {
      /** `head` only. */
      readonly against: "head";
      /** The map folder is not in a git repository. */
      readonly available: false;
      /** Why, a message an author reads. */
      readonly reason: string;
    };

/** `GET /api/icons`: the icons' paths the objects of every kind use, each once and sorted, for the icon picker. */
export interface IconsAnswer {
  /** The paths. */
  readonly icons: readonly string[];
}

/**
 * A refusal: its reason and a message an author reads. The reasons are
 * `reforged-map`'s `ObjectDataWriterError` reasons, and the Studio's own:
 * `"object-definition"`, `"no-editor"`, `"bad-request"`, `"not-found"`,
 * `"forbidden-host"`, `"forbidden-origin"`, `"unavailable"`,
 * `"nothing-to-undo"`, `"nothing-to-redo"`, `"no-world-editor"`,
 * `"reload-failed"`.
 */
export interface ErrorAnswer {
  /** The refusal. */
  readonly error: {
    readonly reason: string;
    readonly message: string;
    /** The Object definition's file, for `"object-definition"`. */
    readonly file?: string;
  };
}

/** `GET /api/session`: the session's map folder, game and counts. */
export interface SessionAnswer extends SessionCounts {
  /** The map folder, an absolute path. */
  readonly mapFolder: string;
  /** The Map project's root, an absolute path. */
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
  /** The Object definition's file, an absolute path. */
  readonly file: string;
  /** The line of its Rawcode, from 1. */
  readonly line: number;
}

/**
 * The events of `GET /api/events`, a `text/event-stream`: `session` once on
 * connecting; `reloaded` when the map folder changed on disk with no
 * unsaved edit and the Studio read it again; `changed-on-disk` when it
 * changed with unsaved edits, which it keeps and does not read over;
 * `saved` when the Studio saved the map folder.
 */
export interface StudioEvents {
  readonly session: SessionCounts;
  readonly reloaded: SessionCounts & { readonly files: readonly string[] };
  readonly "changed-on-disk": SessionCounts & {
    readonly files: readonly string[];
  };
  readonly saved: SessionCounts & { readonly written: readonly string[] };
}
