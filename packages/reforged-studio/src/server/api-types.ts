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
import type { ArtLayer } from "../paths.js";

/**
 * A placement file's name: `war3mapUnits.doo` (units and items) or
 * `war3map.doo` (destructables and doodads). It is defined here, not in the
 * placement reader, so that the page's types need no Node module.
 */
export type PlacementFile = "war3mapUnits.doo" | "war3map.doo";

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
  /**
   * The path of its icon in each art layer, by layer, when its base's value
   * is another in one of them: the install gives the Priest's (`hmpr`)
   * under the layers' keys only (`Art:sd`, `Art:hd`), so it has no `icon`.
   * A layer with no path has no entry; absent when the path is `icon` in
   * every layer, and for its own modification, which every layer shows.
   */
  readonly layerIcons?: Readonly<Partial<Record<ArtLayerName, string>>>;
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
 * enumeration as a select, a toggle (0 or 1), a Rawcode list as chips, an
 * icon's path with its picker, or a model's path with its picker and
 * preview.
 */
export type FieldInput =
  | "integer"
  | "real"
  | "text"
  | "select"
  | "toggle"
  | "rawcodes"
  | "icon"
  | "model";

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

/**
 * One thing that holds a Rawcode, so that a new object cannot take it:
 * `"object"`, an object of any Object kind (the map folder's, saved or not,
 * an Object definition's, or a Built-in object); `"removed"`, the Object
 * manifest, which records an object of that Rawcode as removed by a sync;
 * `"placed"`, placements on the terrain that name it, in one placement file.
 */
export type RawcodeHolder =
  | {
      readonly by: "object";
      readonly kind: ObjectKind;
      readonly origin: ObjectOrigin;
      /** The object's name, when one is known. */
      readonly name?: string;
    }
  | { readonly by: "removed"; readonly kind: ObjectKind }
  | {
      readonly by: "placed";
      readonly file: PlacementFile;
      /** How many placements of the file name it. */
      readonly count: number;
    };

/**
 * `GET /api/free-rawcode?kind=&base=`: the Rawcode the Studio suggests for
 * a new object, the World Editor's prefix (a unit's base's first letter;
 * `I`, `A`, `B`, `B`, `D`, `R` for items, abilities, buffs, destructables,
 * doodads and upgrades) and the lowest free number in the editor's order.
 */
export interface FreeRawcodeAnswer {
  /** The new object's Object kind. */
  readonly kind: ObjectKind;
  /** The prefix taken. */
  readonly prefix: string;
  /** The free Rawcode; absent when every Rawcode of the prefix is taken. */
  readonly rawcode?: string;
}

/**
 * `GET /api/rawcode-check?rawcode=`: whether a new object can take a
 * Rawcode, and what holds it when it cannot, for the live validation of
 * the Rawcode field.
 */
export interface RawcodeCheckAnswer {
  /** The Rawcode checked. */
  readonly rawcode: string;
  /** Whether a new object can take it: a Rawcode nothing holds. */
  readonly free: boolean;
  /** What holds it; empty when it is free or malformed. */
  readonly holders: readonly RawcodeHolder[];
  /** Why it cannot be taken, a sentence an author reads; absent when it is free. */
  readonly message?: string;
}

/**
 * The body of `POST /api/create`: a new Custom object, based on a Built-in
 * object (`base`) or a copy of a Custom object of its kind (`copyOf`), with
 * its base and every modification. One of the two is given.
 */
export interface CreateRequest {
  /** The new object's Object kind. */
  readonly kind: ObjectKind;
  /** Its Rawcode, which nothing may hold. */
  readonly rawcode: string;
  /** The Built-in object it is based on. */
  readonly base?: string;
  /** The Custom object of its kind it copies. */
  readonly copyOf?: string;
}

/** `POST /api/create`'s answer: the object added, as one undo step, and the counts. */
export interface CreateAnswer extends SessionCounts {
  /** Its Object kind. */
  readonly kind: ObjectKind;
  /** Its Rawcode. */
  readonly rawcode: string;
}

/** An object whose fields name another, as a delete confirmation lists it. */
export interface Referrer {
  /** Its Object kind. */
  readonly kind: ObjectKind;
  /** Its Rawcode. */
  readonly rawcode: string;
  /** Its name, when one is known. */
  readonly name?: string;
  /** The ids of its fields that name the object, each once. */
  readonly fields: readonly string[];
}

/**
 * `GET /api/deletion?kind=&rawcode=`: what deleting an object does, for
 * its confirmation. Only a Custom object of the map folder can be deleted.
 */
export interface DeletionAnswer {
  /** The object's Object kind. */
  readonly kind: ObjectKind;
  /** Its Rawcode. */
  readonly rawcode: string;
  /** Whether it can be deleted: a Custom object of the map folder, which no Object definition defines. */
  readonly deletable: boolean;
  /** The objects of the working state whose fields name it. */
  readonly referrers: readonly Referrer[];
  /** How many times it is placed on the terrain. */
  readonly placements: number;
  /** The file that places it; absent for a kind nothing places. */
  readonly placementFile?: PlacementFile;
  /** What the delete does, or why it cannot be done, in sentences an author reads. */
  readonly message: string;
}

/** The body of `POST /api/delete`: the Custom object to delete. */
export interface DeleteRequest {
  /** Its Object kind. */
  readonly kind: ObjectKind;
  /** Its Rawcode. */
  readonly rawcode: string;
}

/** `POST /api/delete`'s answer: the object removed, as one undo step; its placements stay on disk. */
export interface DeleteAnswer extends SessionCounts {
  /** How many times it is placed on the terrain: the placements the game skips and the World Editor drops at its next save. */
  readonly placements: number;
}

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

/**
 * What a bulk edit does to one field of each object of a selection:
 * `"set"` gives it a value; `"add"` adds a number to its value and
 * `"multiply"` multiplies it, each object's own value (its modification,
 * else its base's), an integer field rounded to a whole number; `"reset"`
 * puts it back to its base.
 */
export type BulkOperation = "set" | "add" | "multiply" | "reset";

/**
 * Whether a bulk edit's operation takes a number: `"add"` and `"multiply"`.
 *
 * @param op - The operation, as a request names it.
 * @returns True for `"add"` and `"multiply"`.
 */
export const isNumericOperation = (op: string): boolean =>
  op === "add" || op === "multiply";

/** The body of `POST /api/bulk`: one field of a selection of objects of one kind, edited as one undo step. */
export interface BulkRequest {
  /** What the edit does. */
  readonly op: BulkOperation;
  /** The objects' Object kind. */
  readonly kind: ObjectKind;
  /** The objects' Rawcodes, at least one. */
  readonly rawcodes: readonly string[];
  /** The field. */
  readonly field: string;
  /** The field's level, for a field of levels. */
  readonly level?: number;
  /** The field's data pointer, in the kinds that store one. */
  readonly dataPointer?: number;
  /** The value `"set"` gives, or the number `"add"` adds and `"multiply"` multiplies by; absent for `"reset"`. */
  readonly value?: number | string;
}

/** `POST /api/bulk`'s answer: the counts, and how many objects the step edits. */
export interface BulkAnswer extends SessionCounts {
  /** The objects the step edits: each object of the selection, but those a reset leaves as they are. */
  readonly edited: number;
}

/** One column of the Table mode: a field, at one level for a field of levels. */
export interface TableColumn {
  /** The field's id (`uhpm`). */
  readonly id: string;
  /** Its enUS label, from the install; absent when the install gives none. */
  readonly label?: string;
  /** Its metadata category (`stats`); absent for a field the install does not know. */
  readonly category?: string;
  /** Its level, from 1, for a field of levels. */
  readonly level?: number;
  /** The input its cells edit with, as {@link FieldRow.input} says; absent when no row edits it. */
  readonly input?: FieldInput;
  /** The type its values store, as {@link FieldRow.valueType} says. */
  readonly valueType?: FieldRow["valueType"];
  /** An enumeration's raw values and labels, for the input `"select"`. */
  readonly options?: readonly FieldOption[];
}

/**
 * Gives a column its key, which tells it from the other columns of a table:
 * its field's id and its level (`acdn:2`, `uhpm:`).
 *
 * @param column - The column, or a field table's row of its field.
 * @returns The key.
 */
export const columnKey = (column: {
  readonly id: string;
  readonly level?: number;
}): string => `${column.id}:${String(column.level ?? "")}`;

/** One cell of the Table mode: an object's field. */
export interface TableCell {
  /** The value shown, as {@link FieldRow.display} says; absent when there is none. */
  readonly display?: string;
  /** The value an edit starts from: the working state's value when the object modifies it, else its base's; absent when there is neither. */
  readonly value?: number | string;
  /** Whether the object modifies it. */
  readonly modified: boolean;
  /** Whether an unsaved edit set, changed or removed it. */
  readonly unsaved: boolean;
  /** Whether it can be edited: false for an Object definition and a field with no input. */
  readonly editable: boolean;
}

/** One row of the Table mode: an object, with a cell per column, null where its kind's fields do not give it the column. */
export interface TableRow extends ListedObject {
  /** Its cells, in the columns' order. */
  readonly cells: readonly (TableCell | null)[];
}

/**
 * `GET /api/table?kind=[&objects=all][&fields=all][&all=1]`: one Object
 * kind as a spreadsheet, one row per object and one column per field. By
 * default the map's objects (Custom objects, Object definitions, modified
 * Built-in objects) and the columns one of them modifies; `objects=all`
 * adds the Built-in objects, `fields=all` every column, and `all=1` the
 * objects outside the map's Game data set.
 */
export interface TableAnswer {
  /** The Object kind. */
  readonly kind: ObjectKind;
  /** The columns, in the order of the kind's fields. */
  readonly columns: readonly TableColumn[];
  /** The rows, in the tree's order. */
  readonly rows: readonly TableRow[];
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
  /** The host that asks, which the `reloaded` event after a save refused with `"changed-on-disk"` names as {@link ReloadFromDiskRequest.host} does. */
  readonly host?: string;
}

/** The body of `POST /api/reload-from-disk`. */
export interface ReloadFromDiskRequest {
  /**
   * The host that asks, any text it chose: the `reloaded` event the read
   * sends names it, so that the host tells its own read, which its answer
   * reports, from a read another host asked for.
   */
  readonly host?: string;
}

/**
 * What a save does about the World Editor: `"offered"` when it holds the
 * map folder without unsaved edits (`"open"`) and the save wrote files, so
 * the page offers "Reload in the World Editor"; `"sent"` when the save
 * reloaded it at once, as the request asked; `"no-executable"` when it
 * would be offered but the Studio has no World Editor executable;
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
 * `"changed-on-disk"`, `"world-editor-check-failed"` or `"conflicts"` (a
 * conflict is left to choose), every unsaved edit kept. After
 * `"changed-on-disk"` the Studio has read the map folder again and
 * replayed its unsaved edits on top, field by field.
 */
export interface SaveRefusedAnswer extends ErrorAnswer, SessionCounts {
  /** After `"changed-on-disk"`: how many edits were replayed on the map folder read again. */
  readonly replayed?: number;
  /** After `"changed-on-disk"`: the edits the editor refused on it. */
  readonly notReplayed?: readonly NotReplayed[];
  /** After `"changed-on-disk"`, and with `"conflicts"`: the fields both sides changed, left to choose. */
  readonly conflicts?: readonly Conflict[];
  /** After `"changed-on-disk"`: the fields a World Editor save put back. */
  readonly putBack?: readonly PutBack[];
}

/**
 * A field's or an object's value in one state, as a turn with the World
 * Editor compares them: `"value"`, a field the map modifies, with its value
 * (a `TRIGSTR_nnn` resolved); `"unmodified"`, a field at its base's value;
 * `"present"` and `"absent"`, a whole object the state holds or not.
 */
export type TurnValue =
  | { readonly is: "value"; readonly value: number | string }
  | { readonly is: "unmodified" }
  | { readonly is: "present" }
  | { readonly is: "absent" };

/**
 * What a turn with the World Editor compares: one field of an object, at
 * its level and data pointer when it has them, or, without `field`, the
 * whole object, when one side adds or removes it.
 */
export interface TurnAddress {
  readonly kind: ObjectKind;
  readonly rawcode: string;
  /** The field's id; absent for the whole object. */
  readonly field?: string;
  readonly level?: number;
  readonly dataPointer?: number;
}

/**
 * A field both sides changed, after the map folder changed on disk under
 * unsaved edits: the Studio's unsaved edit (mine) and the map folder's new
 * value (theirs), both changed since the edit's base. The working state
 * holds mine until the author chooses; a save is refused with
 * `"conflicts"` while one is left.
 */
export interface Conflict extends TurnAddress {
  /** Its id, which `POST /api/conflicts` chooses by. */
  readonly id: string;
  /** The Studio's unsaved value. */
  readonly mine: TurnValue;
  /** The map folder's new value. */
  readonly theirs: TurnValue;
}

/**
 * A field the Studio's last save wrote that a save of the World Editor put
 * back: the map folder now holds the value it had before the Studio's save.
 */
export interface PutBack extends TurnAddress {
  /** What the Studio's save wrote. */
  readonly studio: TurnValue;
  /** What the map folder holds again, the value before the Studio's save. */
  readonly worldEditor: TurnValue;
}

/** `GET /api/turns`: the conflicts left to choose and the fields a World Editor save put back. */
export interface TurnsAnswer {
  readonly conflicts: readonly Conflict[];
  readonly putBack: readonly PutBack[];
}

/**
 * `POST /api/reload-from-disk`'s answer, "Reload and keep my edits on top":
 * the map folder read again and each unsaved edit replayed on it, field by
 * field, those the disk also changed listed as conflicts.
 */
export interface ReloadFromDiskAnswer extends SessionCounts, TurnsAnswer {
  /** How many edits were replayed on the map folder read again. */
  readonly replayed: number;
  /** The edits the editor refused on it. */
  readonly notReplayed: readonly NotReplayed[];
}

/** One choice of `POST /api/conflicts`: a conflict's id, and whether to keep mine or take theirs. */
export interface ConflictChoice {
  readonly id: string;
  readonly take: "mine" | "theirs";
}

/** The body of `POST /api/conflicts`: the choices, the values of theirs taken as one undo step. */
export interface ConflictsRequest {
  readonly choices: readonly ConflictChoice[];
}

/**
 * The body of `POST /api/put-back`: `"apply"`, "Apply them again", sets the
 * fields to what the Studio saved, as unsaved edits in one undo step;
 * `"keep"`, "Keep the World Editor's", leaves the map folder's values.
 */
export interface PutBackRequest {
  readonly action: "apply" | "keep";
}

/** `POST /api/conflicts`' and `POST /api/put-back`'s answer: the counts and what is left. */
export interface TurnsChangedAnswer extends SessionCounts, TurnsAnswer {}

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
 * `GET /api/diff?against=saved|head|reload`: the working state against the
 * saved state (`saved`, the unsaved changes), or against the files at
 * `HEAD` (`head`, the changes since the last commit), or the saved state
 * before the last change on disk the Studio read against the one it read
 * (`reload`, what the change brought), each Object data file in the text of
 * `reforged-map`'s `textconv` function, `war3map.wts` and the locales'
 * tables in their own text.
 */
export type DiffAnswer =
  | {
      /** What is compared. */
      readonly against: "saved" | "head" | "reload";
      /** The diff could be made. */
      readonly available: true;
      /** Each file that differs, in the order a save writes them. */
      readonly files: readonly FileDiff[];
    }
  | {
      /** `head` or `reload` only. */
      readonly against: "head" | "reload";
      /** The map folder is not in a git repository (`head`), or the Studio has not read it again since it started (`reload`). */
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
 * An art layer the previews and icons are read in: SD, the base layer
 * alone; HD (`_HD.w3mod:`) or DE (`_DE.w3mod:`) over it.
 */
export type ArtLayerName = ArtLayer;

/** The body of `POST /api/art-layer`: the art layer the session reads in from now on. */
export interface ArtLayerRequest {
  /** One of the map's Supported Modes' layers, {@link SessionAnswer.artLayers}. */
  readonly artLayer: ArtLayerName;
}

/** `POST /api/art-layer`'s answer: the art layer the session reads in now. */
export interface ArtLayerAnswer {
  /** The art layer. */
  readonly artLayer: ArtLayerName;
}

/** `PUT /api/thumbnails`' answer: the thumbnail the cache now holds. */
export interface ThumbnailAnswer {
  /** The model's path, as the resolver normalized it. */
  readonly path: string;
  /** The art layer it was drawn in. */
  readonly artLayer: ArtLayerName;
}

/** One model's path the picker offers. */
export interface ListedModel {
  /** The path, with backslashes as a field holds it (`Units\Human\Footman\Footman.mdx`). */
  readonly path: string;
  /** Where it is: the map folder's imports, or the install. */
  readonly from: "map" | "install";
}

/**
 * `GET /api/models?q=[&limit=&layer=]`: the models' paths of the install,
 * in the session's art layer (or the one `layer` names) and the base
 * layer, and of the map folder's imports, those whose path holds the text,
 * the imports first, then by path.
 */
export interface ModelsAnswer {
  /** The text searched, trimmed. */
  readonly query: string;
  /** The paths found, at most `limit` (200 by default). */
  readonly models: readonly ListedModel[];
  /** How many paths hold the text, beyond those answered. */
  readonly total: number;
}

/**
 * A refusal: its reason and a message an author reads. The reasons are
 * {@link reforged-map#ObjectDataWriterErrorReason}s, and the Studio's own:
 * `"object-definition"`, `"no-editor"`, `"bad-request"`, `"not-found"`,
 * `"forbidden-host"`, `"forbidden-origin"`, `"unavailable"`,
 * `"nothing-to-undo"`, `"nothing-to-redo"`, `"no-world-editor"`,
 * `"reload-failed"`, `"unsaved-edits"`, `"map-folder-unreadable"`,
 * `"not-supported"`, `"not-cached"`, `"rawcode-taken"`, `"not-custom"`;
 * and, for an adoption, every reason `reforged-map`'s `adoptObjects`
 * throws, each answered with a 409: its
 * {@link reforged-map#ObjectDefinitionsErrorReason}s and its
 * {@link reforged-map#ObjectDataWriterErrorReason}s.
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

/** The body of `POST /api/adopt`: the Custom object or modified Built-in object of the map folder to hand to the code. */
export interface AdoptRequest {
  /** The object's Object kind. */
  readonly kind: ObjectKind;
  /** The object's Rawcode. */
  readonly rawcode: string;
}

/** An object an adoption handed to the code, and its new definition file. */
export interface AdoptedObject {
  /** The object's Object kind. */
  readonly kind: ObjectKind;
  /** The object's Rawcode. */
  readonly rawcode: string;
  /** The definition file relative to the Map project's root, with `/`. */
  readonly path: string;
}

/**
 * `POST /api/adopt`'s answer: `reforged-map`'s Object adoption wrote the
 * object's definition file and its entry in the Object manifest, and the
 * Studio read the map folder again, so that the object shows as an Object
 * definition.
 */
export interface AdoptAnswer extends SessionCounts {
  /** The object adopted, with its new definition file. */
  readonly adopted: AdoptedObject & {
    /** The definition file, an absolute path. */
    readonly file: string;
  };
  /** Whether the Object manifest was written, which adoption does only when its bytes change. */
  readonly manifestWritten: boolean;
  /** Whether the definition file was formatted with the Map project's Prettier: false when the Map project has none. */
  readonly formatted: boolean;
  /** What the World Editor showed of the map folder before the first write. */
  readonly worldEditor: WorldEditorState | undefined;
  /** Adoption's warnings, each one line, such as a field adopted through the raw escape or a formatting that failed. */
  readonly warnings: readonly string[];
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
  /**
   * The World Editor's executable the reload starts, an absolute path: the
   * one the Studio was given, else `World Editor.exe` beside the game's;
   * undefined when there is neither, and the page then disables its
   * automatic reload.
   */
  readonly worldEditorExecutable: string | undefined;
  /** The readers' warnings, each one line. */
  readonly warnings: readonly string[];
  /**
   * The art layer icons and previews are read in: the World Editor's Asset
   * Mode preference, limited by the map's Supported Modes, HD when the
   * preference cannot be read, until the header's switch changes it.
   */
  readonly artLayer: ArtLayerName;
  /** The art layers the map's Supported Modes allow, which the switch offers. */
  readonly artLayers: readonly ArtLayerName[];
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
 * unsaved edit and the Studio read it again, or after "Reload and keep my
 * edits on top", with the conflicts and the fields put back it found;
 * `changed-on-disk` when it changed with unsaved edits, which it keeps and
 * does not read over until the author reloads;
 * `saved` when the Studio saved the map folder; `adopted` when it adopted
 * an object into the code and read the map folder again.
 */
export interface StudioEvents {
  readonly session: SessionCounts;
  readonly reloaded: SessionCounts & {
    /** The files that changed, as far as the read knows them: empty after "Reload and keep my edits on top". */
    readonly files: readonly string[];
    /** The host whose request read the map folder again, as its body named it; absent after a change the watch read. */
    readonly host?: string;
    /** The conflicts left to choose, which `GET /api/turns` lists. */
    readonly conflicts: number;
    /** The fields a World Editor save put back, which `GET /api/turns` lists. */
    readonly putBack: number;
  };
  readonly "changed-on-disk": SessionCounts & {
    readonly files: readonly string[];
  };
  readonly saved: SessionCounts & { readonly written: readonly string[] };
  readonly adopted: SessionCounts & AdoptedObject;
}
