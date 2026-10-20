// The one error of the Object data editor and the World Editor check: a
// module of its own, so that both import it without a cycle.

/**
 * Why the Object data editor refused. Of a save: `"changed-on-disk"`, a file it would rewrite changed on disk
 * since it was read; `"modified-in-world-editor"`, the World Editor shows
 * unsaved edits for the folder it would write;
 * `"world-editor-check-failed"`, the World Editor check could not read the
 * windows' titles. Of an edit: `"builtins-missing"`, `reforged-builtins`
 * or its field table could not be read; `"file-not-read"`, the readers left
 * out a file of the kind; `"unknown-object"`, the kind holds no object of
 * the Rawcode, and no Built-in object has it; `"unknown-field"`, the field
 * table does not know the field and no value type was given;
 * `"field-held-twice"`, a file holds the field twice for the object;
 * `"invalid-value"`, the value, its type, the level or the data pointer is
 * not one the file can hold.
 */
export type ObjectDataWriterErrorReason =
  | "builtins-missing"
  | "changed-on-disk"
  | "field-held-twice"
  | "file-not-read"
  | "invalid-value"
  | "modified-in-world-editor"
  | "unknown-field"
  | "unknown-object"
  | "world-editor-check-failed";

/**
 * An edit or a save the Object data editor refuses, or a World Editor check
 * that failed. Its `reason` says which, for a caller to switch on, and its
 * message what the author does next. Nothing is written when it is thrown,
 * and a refused edit changes nothing.
 */
export class ObjectDataWriterError extends Error {
  /** `"ObjectDataWriterError"`, the error's name in a stack trace and in `String(error)`. */
  override name = "ObjectDataWriterError";
  /** Why the editor refused. */
  readonly reason: ObjectDataWriterErrorReason;
  /** The file of the map folder it is about (`war3map.w3u`), when it is about one. */
  readonly file: string | undefined;

  constructor(
    reason: ObjectDataWriterErrorReason,
    message: string,
    file?: string,
  ) {
    super(message);
    this.reason = reason;
    this.file = file;
  }
}
