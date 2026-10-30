/**
 * The Studio's session over one map folder: `reforged-map`'s Object data
 * editor, opened once, and its Rawcode lookup; the saved state (what the map
 * folder held at the last read), the working state (saved plus unsaved
 * edits), the states before and after the Studio's last save, and the undo
 * and redo stacks, in the shape of the prototype of #476. Every edit is the
 * editor's, checked at once.
 */
import path from "node:path";
import {
  openObjectData,
  openRawcodeLookup,
  type ObjectDataEditor,
  type ObjectDataField,
  type ObjectDataModification,
  type ObjectDataObject,
  type ObjectKind,
  type RawcodeLookup,
} from "reforged-map";
import type { Edit, SessionCounts } from "./api-types.js";

/** An object's key in a state: its Object kind and its Rawcode. */
export const objectKey = (kind: ObjectKind, rawcode: string): string =>
  `${kind}:${rawcode}`;

/** The map folder's objects as the editor lists them, by {@link objectKey}. */
export type ObjectState = ReadonlyMap<string, ObjectDataObject>;

/** One edit of an undo step, with the edits that take it back. */
interface AppliedEdit {
  readonly edit: Edit;
  /** The edits that restore the state before it, applied in order. */
  readonly inverse: readonly Edit[];
}

/** One undo step: edits applied together; a bulk edit is one step. */
export interface EditStep {
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

/** The objects of an editor, as a state. */
function snapshot(editor: ObjectDataEditor): ObjectState {
  return new Map(
    editor
      .objects()
      .map((object) => [objectKey(object.kind, object.rawcode), object]),
  );
}

/** A modification's identity in an object: its field, level, data pointer and file. */
const modificationKey = (modification: ObjectDataModification): string =>
  [
    modification.field,
    String(modification.level ?? 0),
    String(modification.dataPointer ?? 0),
    modification.file,
  ].join(" ");

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
          JSON.stringify([
            modification.value,
            modification.stored,
            modification.translations,
          ]),
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

/** The session of one Studio. */
export class Session {
  /** The lookup of the map folder, the hover's and the lint rule's. */
  readonly lookup: RawcodeLookup;
  /** The working state's editor: the saved state plus the unsaved edits. */
  #editor: ObjectDataEditor;
  /** What the map folder held at the last read. */
  #saved: ObjectState;
  /** The states before and after the Studio's last save, to tell a World Editor revert. */
  lastStudioSave:
    { readonly before: ObjectState; readonly after: ObjectState } | undefined;
  readonly undo: EditStep[] = [];
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
    const editor = openObjectData(this.#options.mapFolder, {
      projectRoot: this.#options.projectRoot,
    });
    this.#editor = editor;
    this.#saved = snapshot(editor);
    this.undo.length = 0;
    this.redo.length = 0;
  }

  /**
   * Applies edits together as one undo step, or none of them: an edit of an
   * Object definition is refused before any is applied, and an edit the
   * editor refuses takes back the ones applied before it.
   *
   * @param edits - The edits, in order.
   * @throws {@link EditRefusedError} With the reason `"object-definition"`.
   * @throws ObjectDataWriterError The editor's refusal.
   */
  edit(edits: readonly Edit[]): void {
    for (const edit of edits) {
      const file = this.definitionOf(edit.kind, edit.rawcode);
      if (file !== undefined) {
        throw new EditRefusedError(
          "object-definition",
          `${edit.rawcode} is an Object definition of ${file}: edit it there.`,
          file,
        );
      }
    }
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
    if (applied.length > 0) {
      this.undo.push({ edits: applied });
      this.redo.length = 0;
    }
  }

  /**
   * The Object definition that defines an object, by the lookup: its file
   * relative to the Map project's root, with `/`.
   *
   * @param kind - The object's Object kind.
   * @param rawcode - Its Rawcode.
   * @returns The file, or undefined when no definition defines it.
   */
  definitionOf(kind: ObjectKind, rawcode: string): string | undefined {
    const listing = this.lookup.list();
    if (listing.status !== "listed") return undefined;
    const object = listing.objects.find(
      (other) => other.kind === kind && other.rawcode === rawcode,
    );
    return object === undefined ||
      object.origin === "builtin" ||
      object.definitionFile === undefined
      ? undefined
      : path
          .relative(this.#options.projectRoot, object.definitionFile)
          .split(path.sep)
          .join("/");
  }

  /** The working state's object of a kind and Rawcode. */
  #object(kind: ObjectKind, rawcode: string): ObjectDataObject | undefined {
    return this.#editor
      .objects(kind)
      .find((object) => object.rawcode === rawcode);
  }

  /** The edits that take an edit back, read from the working state before it. */
  #inverse(edit: Edit): Edit[] {
    const { kind, rawcode } = edit;
    const object = this.#object(kind, rawcode);
    const restore = (modification: ObjectDataModification): Edit => ({
      op: "setField",
      kind,
      rawcode,
      field: modification.field,
      ...(modification.level !== undefined && { level: modification.level }),
      ...(modification.dataPointer !== undefined && {
        dataPointer: modification.dataPointer,
      }),
      value: modification.value,
    });
    switch (edit.op) {
      case "setField":
      case "removeField": {
        const before = object?.modifications.find(
          (modification) =>
            modification.field === edit.field &&
            (modification.level ?? 0) ===
              (edit.level ?? modification.level ?? 0) &&
            (edit.dataPointer === undefined ||
              (modification.dataPointer ?? 0) === edit.dataPointer),
        );
        if (before !== undefined) return [restore(before)];
        return edit.op === "setField" ? [{ ...edit, op: "removeField" }] : [];
      }
      case "addObject":
        return [{ op: "removeObject", kind, rawcode }];
      case "removeObject":
        if (object === undefined) return [];
        return [
          ...(object.origin === "custom" && object.base !== undefined
            ? [{ op: "addObject", kind, rawcode, base: object.base } as const]
            : []),
          ...object.modifications.map(restore),
        ];
    }
  }

  /** Applies one edit to the editor. */
  #apply(edit: Edit): void {
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
      case "setField":
        this.#editor.setField(field(), edit.value);
        return;
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
