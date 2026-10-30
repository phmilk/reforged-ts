/**
 * The Studio's session over one map folder: `reforged-map`'s Object data
 * editor, opened once, and its Rawcode lookup; the saved state (what the map
 * folder held at the last read), the working state (saved plus unsaved
 * edits), the states before and after the Studio's last save, and the undo
 * and redo stacks, in the shape of the prototype of #476. Every edit is the
 * editor's, checked at once; the stacks span the whole session, saves
 * included, and are never persisted.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  loadFieldTable,
  ObjectDataWriterError,
  openObjectData,
  openRawcodeLookup,
  type FieldTable,
  type Locale,
  type ObjectDataEditor,
  type ObjectDataField,
  type ObjectDataModification,
  type ObjectDataObject,
  type ObjectDataSaveResult,
  type ObjectKind,
  type RawcodeLookup,
  type RawcodeObject,
  type WorldEditorCheckOptions,
} from "reforged-map";
import type { Edit, NotReplayed, SessionCounts } from "./api-types.js";

/** An object's key in a state: its Object kind and its Rawcode. */
export const objectKey = (kind: ObjectKind, rawcode: string): string =>
  `${kind}:${rawcode}`;

/** The map folder's objects as the editor lists them, by {@link objectKey}. */
export type ObjectState = ReadonlyMap<string, ObjectDataObject>;

/** The translations of a localizable value, by locale. */
type Translations = Readonly<Partial<Record<Locale, string>>>;

/**
 * An edit as the session applies it: one of the API's, a `setField` with
 * the translations it restores. An edit of the API keeps the translations
 * the field holds: the Studio edits a localizable field's default text only.
 */
type SessionEdit =
  | Edit
  | (Extract<Edit, { op: "setField" }> & {
      readonly translations: Translations;
    });

/** One edit of an undo step, with the edits that take it back. */
interface AppliedEdit {
  /** The edit, with its after value. */
  readonly edit: SessionEdit;
  /** The edits that restore the state before it, with the before values, applied in order. */
  readonly inverse: readonly SessionEdit[];
}

/** One undo step: edits applied together; a bulk edit is one step. */
export interface EditStep {
  /** Its edits, in the order applied. */
  readonly edits: readonly AppliedEdit[];
}

/** An edit the session refuses before the editor sees it. */
export class EditRefusedError extends Error {
  override name = "EditRefusedError";

  /**
   * @param reason - The refusal's reason, as the API names it.
   * @param message - The message an author reads.
   * @param file - The file the refusal names, relative to the Map project's root.
   */
  constructor(
    readonly reason: string,
    message: string,
    readonly file?: string,
  ) {
    super(message);
  }
}

/** What opens a session. */
export interface SessionOptions {
  readonly projectRoot: string;
  readonly mapFolder: string;
}

/** What replaying the unsaved edits on a map folder read again gave. */
export interface Replay {
  /** How many edits the editor took. */
  readonly replayed: number;
  /** The edits it refused, with its reasons. */
  readonly notReplayed: readonly NotReplayed[];
}

/**
 * The Object definition that defines an object of a listing: its file
 * relative to the Map project's root, with `/`; undefined when none does.
 */
function definitionFile(
  objects: readonly RawcodeObject[],
  projectRoot: string,
  { kind, rawcode }: { kind: ObjectKind; rawcode: string },
): string | undefined {
  const object = objects.find(
    (other) => other.kind === kind && other.rawcode === rawcode,
  );
  return object === undefined ||
    object.origin === "builtin" ||
    object.definitionFile === undefined
    ? undefined
    : path
        .relative(projectRoot, object.definitionFile)
        .split(path.sep)
        .join("/");
}

/** The objects of an editor, as a state. */
function snapshot(editor: ObjectDataEditor): ObjectState {
  return new Map(
    editor
      .objects()
      .map((object) => [objectKey(object.kind, object.rawcode), object]),
  );
}

/** A modification's place in an object, whichever file holds it: its field, level and data pointer. */
const placeKey = (modification: ObjectDataModification): string =>
  [
    modification.field,
    String(modification.level ?? 0),
    String(modification.dataPointer ?? 0),
  ].join(" ");

/** A modification's identity in an object: its place and its file. */
const modificationKey = (modification: ObjectDataModification): string =>
  `${placeKey(modification)} ${modification.file}`;

/**
 * What a modification holds, to compare two states: its value, a
 * `TRIGSTR_nnn` resolved, and its translations. The number of a
 * `TRIGSTR_nnn` is left out: an undo that gives a removed name back gives it
 * the text it had, under the number the writer picks.
 */
const contentOf = (modification: ObjectDataModification): string =>
  JSON.stringify([modification.value, modification.translations]);

/** How many fields and objects `working` changes from `saved`. */
function countChanges(saved: ObjectState, working: ObjectState): number {
  let changes = 0;
  for (const key of new Set([...saved.keys(), ...working.keys()])) {
    const before = saved.get(key);
    const after = working.get(key);
    if (before === undefined || after === undefined) {
      changes++;
      continue;
    }
    if (before.base !== after.base) changes++;
    const values = (object: ObjectDataObject) =>
      new Map(
        object.modifications.map((modification) => [
          modificationKey(modification),
          contentOf(modification),
        ]),
      );
    const from = values(before);
    const to = values(after);
    for (const field of new Set([...from.keys(), ...to.keys()])) {
      if (from.get(field) !== to.get(field)) changes++;
    }
  }
  return changes;
}

/** The `setField` that gives a modification's field its value and translations back. */
function restore(
  kind: ObjectKind,
  rawcode: string,
  modification: ObjectDataModification,
): SessionEdit {
  return {
    op: "setField",
    kind,
    rawcode,
    field: modification.field,
    ...(modification.level !== undefined && { level: modification.level }),
    ...(modification.dataPointer !== undefined && {
      dataPointer: modification.dataPointer,
    }),
    value: modification.value,
    translations: modification.translations ?? {},
  };
}

/** The `removeField` of a modification's field. */
function removal(
  kind: ObjectKind,
  rawcode: string,
  modification: ObjectDataModification,
): Edit {
  return {
    op: "removeField",
    kind,
    rawcode,
    field: modification.field,
    ...(modification.level !== undefined && { level: modification.level }),
    ...(modification.dataPointer !== undefined && {
      dataPointer: modification.dataPointer,
    }),
  };
}

/** Each modification of an object by its place, the last one of a place kept. */
const byPlace = (
  object: ObjectDataObject,
): Map<string, ObjectDataModification> =>
  new Map(
    object.modifications.map((modification) => [
      placeKey(modification),
      modification,
    ]),
  );

/**
 * The edits that take `saved` to `working`, field by field: each object
 * added with its fields, each object removed, and each field set, changed
 * or removed.
 */
function editsBetween(saved: ObjectState, working: ObjectState): SessionEdit[] {
  const edits: SessionEdit[] = [];
  for (const [key, before] of saved) {
    if (!working.has(key)) {
      edits.push({
        op: "removeObject",
        kind: before.kind,
        rawcode: before.rawcode,
      });
    }
  }
  for (const [key, after] of working) {
    const { kind, rawcode } = after;
    const before = saved.get(key);
    if (
      before === undefined &&
      after.origin === "custom" &&
      after.base !== undefined
    ) {
      edits.push({ op: "addObject", kind, rawcode, base: after.base });
    }
    const from =
      before === undefined
        ? new Map<string, ObjectDataModification>()
        : byPlace(before);
    const to = byPlace(after);
    for (const [place, modification] of from) {
      if (!to.has(place)) edits.push(removal(kind, rawcode, modification));
    }
    for (const [place, modification] of to) {
      const was = from.get(place);
      if (was === undefined || contentOf(was) !== contentOf(modification)) {
        edits.push(restore(kind, rawcode, modification));
      }
    }
  }
  return edits;
}

/** An edit as the API names it: a `setField` without the translations the session keeps. */
function publicEdit(edit: SessionEdit): Edit {
  if (edit.op !== "setField") return edit;
  return {
    op: "setField",
    kind: edit.kind,
    rawcode: edit.rawcode,
    field: edit.field,
    ...(edit.level !== undefined && { level: edit.level }),
    ...(edit.dataPointer !== undefined && { dataPointer: edit.dataPointer }),
    value: edit.value,
  };
}

/**
 * The bytes of every file an editor would write, encoded: the editor saved
 * to an empty temporary folder, with the World Editor check off, then read
 * back and the folder removed. By path in the folder, with `/`.
 */
function encodedFiles(editor: ObjectDataEditor): Map<string, Uint8Array> {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "reforged-studio-"));
  try {
    editor.save(folder, { worldEditorCheck: false });
    const files = new Map<string, Uint8Array>();
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else {
          files.set(
            path.relative(folder, file).split(path.sep).join("/"),
            fs.readFileSync(file),
          );
        }
      }
    };
    walk(folder);
    return files;
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
}

/** The session of one Studio. */
export class Session {
  /** The lookup of the map folder, the hover's and the lint rule's. */
  readonly lookup: RawcodeLookup;
  /** The field table of `reforged-builtins`, which gives each field its input; undefined when it cannot be read. */
  readonly fieldTable: FieldTable | undefined;
  /** The working state's editor: the saved state plus the unsaved edits. */
  #editor: ObjectDataEditor;
  /** What the map folder held at the last read. */
  #saved: ObjectState;
  /** The bytes of the saved state's files, encoded before the first edit after a read; undefined until then. */
  #savedFiles: Map<string, Uint8Array> | undefined;
  /** The states before and after the Studio's last save, to tell a World Editor revert. */
  lastStudioSave:
    { readonly before: ObjectState; readonly after: ObjectState } | undefined;
  /** The steps undo takes back, the last one last. */
  readonly undo: EditStep[] = [];
  /** The steps redo takes again, the next one last. */
  readonly redo: EditStep[] = [];
  readonly #options: SessionOptions;

  /**
   * Opens the map folder with the editor and the lookup.
   *
   * @param options - The Map project, its map folder and the owner of each object.
   */
  constructor(options: SessionOptions) {
    this.#options = options;
    this.#editor = openObjectData(options.mapFolder, {
      projectRoot: options.projectRoot,
    });
    this.#saved = snapshot(this.#editor);
    this.lookup = openRawcodeLookup({
      mapFolder: options.mapFolder,
      projectRoot: options.projectRoot,
      minInterval: 0,
    });
    const fields = loadFieldTable(options.projectRoot);
    this.fieldTable = "table" in fields ? fields.table : undefined;
  }

  /** The readers' warnings, the editor's then the lookup's. */
  get warnings(): readonly string[] {
    return [...new Set([...this.#editor.warnings, ...this.lookup.warnings()])];
  }

  /** What the map folder held at the last read. */
  get saved(): ObjectState {
    return this.#saved;
  }

  /** What the Studio shows: the saved state plus the unsaved edits. */
  working(): ObjectState {
    return snapshot(this.#editor);
  }

  /** The counts a host shows. */
  counts(): SessionCounts {
    return {
      unsavedEdits: countChanges(this.#saved, this.working()),
      undo: this.undo.length,
      redo: this.redo.length,
    };
  }

  /**
   * Reads the map folder again, after a change on disk with no unsaved
   * edit: the new saved state replaces the old, and the undo and redo
   * stacks, whose steps read the old one, are emptied.
   */
  reopen(): void {
    this.#read();
    this.undo.length = 0;
    this.redo.length = 0;
  }

  /** Opens the map folder again with a new editor, whose state is the saved state. */
  #read(): void {
    this.#editor = openObjectData(this.#options.mapFolder, {
      projectRoot: this.#options.projectRoot,
    });
    this.#saved = snapshot(this.#editor);
    this.#savedFiles = undefined;
  }

  /**
   * Applies edits together as one undo step, or none of them: an edit of an
   * Object definition is refused before any is applied, and an edit the
   * editor refuses takes back the ones applied before it.
   *
   * @param edits - The edits, in order.
   * @throws {@link EditRefusedError} With the reason `"object-definition"`,
   *   or `"unavailable"` when the lookup cannot say which objects the code owns.
   * @throws ObjectDataWriterError The editor's refusal.
   */
  edit(edits: readonly Edit[]): void {
    const listing = this.lookup.list();
    if (listing.status === "unavailable") {
      // Without the lookup, which objects the code owns is unknown: no edit.
      throw new EditRefusedError("unavailable", listing.reason);
    }
    for (const edit of edits) {
      const file = definitionFile(
        listing.objects,
        this.#options.projectRoot,
        edit,
      );
      if (file !== undefined) {
        throw new EditRefusedError(
          "object-definition",
          `${edit.rawcode} is an Object definition of ${file}: edit it there.`,
          file,
        );
      }
    }
    const applied = this.#applyAll(edits);
    if (applied.length > 0) {
      this.undo.push({ edits: applied });
      this.redo.length = 0;
    }
  }

  /**
   * The edits that put an object back: a Custom object's fields to its
   * base's values, a modified Built-in object to the Built-in object, a
   * field to its base's value; none for an object or a field the map does
   * not modify.
   *
   * @param target - The object, and the field to reset when only one is.
   * @returns The edits, to pass to {@link Session.edit} as one step.
   */
  resetEdits(target: {
    readonly kind: ObjectKind;
    readonly rawcode: string;
    readonly field?: string;
    readonly level?: number;
    readonly dataPointer?: number;
  }): Edit[] {
    const { kind, rawcode, field } = target;
    if (field !== undefined) {
      return [
        {
          op: "removeField",
          kind,
          rawcode,
          field,
          ...(target.level !== undefined && { level: target.level }),
          ...(target.dataPointer !== undefined && {
            dataPointer: target.dataPointer,
          }),
        },
      ];
    }
    const object = this.#object(kind, rawcode);
    if (object === undefined) return [];
    if (object.origin === "modified") {
      return [{ op: "removeObject", kind, rawcode }];
    }
    return [...byPlace(object).values()].map((modification) =>
      removal(kind, rawcode, modification),
    );
  }

  /**
   * Takes the last step back, applying its edits' inverses in reverse.
   *
   * @throws {@link EditRefusedError} With the reason `"nothing-to-undo"`.
   * @throws ObjectDataWriterError The editor's refusal; nothing is changed.
   */
  undoStep(): void {
    const step = this.undo.at(-1);
    if (step === undefined) {
      throw new EditRefusedError(
        "nothing-to-undo",
        "There is nothing to undo.",
      );
    }
    this.#applyAll(step.edits.toReversed().flatMap((edit) => edit.inverse));
    this.undo.pop();
    this.redo.push(step);
  }

  /**
   * Takes the last step undone again.
   *
   * @throws {@link EditRefusedError} With the reason `"nothing-to-redo"`.
   * @throws ObjectDataWriterError The editor's refusal; nothing is changed.
   */
  redoStep(): void {
    const step = this.redo.at(-1);
    if (step === undefined) {
      throw new EditRefusedError(
        "nothing-to-redo",
        "There is nothing to redo.",
      );
    }
    const applied = this.#applyAll(step.edits.map((edit) => edit.edit));
    this.redo.pop();
    this.undo.push({ edits: applied });
  }

  /**
   * Saves the working state to the map folder with the editor's `save()`,
   * then reads the map folder again so that the next save compares with
   * what this one wrote; the undo and redo stacks stay, so an undo after a
   * save makes the map dirty again.
   *
   * @param worldEditorCheck - The World Editor check's options, or true for the system's.
   * @returns The editor's answer: the files written and what the World Editor showed.
   * @throws ObjectDataWriterError The editor's refusal: `"changed-on-disk"`,
   *   `"modified-in-world-editor"`, `"world-editor-check-failed"`; nothing
   *   is written and every unsaved edit is kept.
   */
  save(worldEditorCheck: true | WorldEditorCheckOptions): ObjectDataSaveResult {
    const before = this.#saved;
    const after = this.working();
    const result = this.#editor.save(undefined, { worldEditorCheck });
    if (result.written.length > 0) {
      this.lastStudioSave = { before, after };
      this.#read();
    }
    return result;
  }

  /**
   * Reads the map folder again after a save refused with
   * `"changed-on-disk"`, and replays the unsaved edits on top, field by
   * field: each object added or removed and each field set or removed in
   * the working state since the saved state. The undo and redo stacks stay.
   *
   * @returns How many edits were replayed, and those the editor refused.
   */
  replayOnDisk(): Replay {
    const edits = editsBetween(this.#saved, this.working());
    this.#read();
    let replayed = 0;
    const notReplayed: NotReplayed[] = [];
    for (const edit of edits) {
      try {
        this.#apply(edit);
        replayed++;
      } catch (error) {
        if (!(error instanceof ObjectDataWriterError)) throw error;
        notReplayed.push({
          edit: publicEdit(edit),
          reason: error.reason,
          message: error.message,
        });
      }
    }
    return { replayed, notReplayed };
  }

  /**
   * The bytes of each file of the saved state and of the working state, as
   * a save would write them, by path in the map folder with `/`.
   *
   * @returns Both sets of files.
   */
  files(): {
    readonly saved: ReadonlyMap<string, Uint8Array>;
    readonly working: ReadonlyMap<string, Uint8Array>;
  } {
    const working = encodedFiles(this.#editor);
    return { saved: this.#savedFiles ?? working, working };
  }

  /** The working state's object of a kind and Rawcode. */
  #object(kind: ObjectKind, rawcode: string): ObjectDataObject | undefined {
    return this.#editor
      .objects(kind)
      .find((object) => object.rawcode === rawcode);
  }

  /** The working state's modification an edit of a field addresses. */
  #held(
    edit: Extract<Edit, { op: "setField" | "removeField" }>,
  ): ObjectDataModification | undefined {
    return this.#object(edit.kind, edit.rawcode)?.modifications.find(
      (modification) =>
        modification.field === edit.field &&
        (modification.level ?? 0) === (edit.level ?? modification.level ?? 0) &&
        (edit.dataPointer === undefined ||
          (modification.dataPointer ?? 0) === edit.dataPointer),
    );
  }

  /**
   * Applies edits in order, each with its inverse read before it, or none:
   * an edit the editor refuses takes back the ones applied before it.
   */
  #applyAll(edits: readonly SessionEdit[]): AppliedEdit[] {
    const applied: AppliedEdit[] = [];
    try {
      for (const edit of edits) {
        const inverse = this.#inverse(edit);
        this.#apply(edit);
        applied.push({ edit, inverse });
      }
    } catch (error) {
      for (const { inverse } of applied.toReversed()) {
        for (const edit of inverse) this.#apply(edit);
      }
      throw error;
    }
    return applied;
  }

  /** The edits that take an edit back, read from the working state before it. */
  #inverse(edit: SessionEdit): SessionEdit[] {
    const { kind, rawcode } = edit;
    switch (edit.op) {
      case "setField":
      case "removeField": {
        const before = this.#held(edit);
        if (before !== undefined) return [restore(kind, rawcode, before)];
        return edit.op === "setField" ? [removalOf(edit)] : [];
      }
      case "addObject":
        return [{ op: "removeObject", kind, rawcode }];
      case "removeObject": {
        const object = this.#object(kind, rawcode);
        if (object === undefined) return [];
        return [
          ...(object.origin === "custom" && object.base !== undefined
            ? [{ op: "addObject", kind, rawcode, base: object.base } as const]
            : []),
          ...object.modifications.map((modification) =>
            restore(kind, rawcode, modification),
          ),
        ];
      }
    }
  }

  /**
   * Applies one edit to the editor. A `setField` of the API keeps the
   * translations the field holds; the saved state's files are encoded
   * before the first edit after a read, for the diff of unsaved changes.
   */
  #apply(edit: SessionEdit): void {
    this.#savedFiles ??= encodedFiles(this.#editor);
    const field = (): ObjectDataField => {
      if (edit.op !== "setField" && edit.op !== "removeField") {
        throw new Error(edit.op);
      }
      return {
        kind: edit.kind,
        rawcode: edit.rawcode,
        field: edit.field,
        ...(edit.level !== undefined && { level: edit.level }),
        ...(edit.dataPointer !== undefined && {
          dataPointer: edit.dataPointer,
        }),
      };
    };
    switch (edit.op) {
      case "setField": {
        const translations =
          "translations" in edit
            ? edit.translations
            : (this.#held(edit)?.translations ?? {});
        this.#editor.setField(
          field(),
          edit.value,
          Object.keys(translations).length > 0 ? { translations } : {},
        );
        return;
      }
      case "removeField":
        this.#editor.removeField(field());
        return;
      case "addObject":
        this.#editor.addObject({
          kind: edit.kind,
          rawcode: edit.rawcode,
          base: edit.base,
        });
        return;
      case "removeObject":
        this.#editor.removeObject({ kind: edit.kind, rawcode: edit.rawcode });
        return;
    }
  }
}

/** The `removeField` that takes back a `setField` of a field the object did not hold. */
function removalOf(edit: Extract<SessionEdit, { op: "setField" }>): Edit {
  return {
    op: "removeField",
    kind: edit.kind,
    rawcode: edit.rawcode,
    field: edit.field,
    ...(edit.level !== undefined && { level: edit.level }),
    ...(edit.dataPointer !== undefined && { dataPointer: edit.dataPointer }),
  };
}
