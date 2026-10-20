// The one error of the Object data editor and the World Editor check: a
// module of its own, so that both import it without a cycle.

/**
 * Why the Object data editor refused: `"changed-on-disk"`, a file it would
 * rewrite changed on disk since it was read; `"modified-in-world-editor"`,
 * the World Editor shows unsaved edits for the folder it would write;
 * `"world-editor-check-failed"`, the World Editor check could not read the
 * windows' titles.
 */
export type ObjectDataWriterErrorReason =
  "changed-on-disk" | "modified-in-world-editor" | "world-editor-check-failed";

/**
 * An edit or a save the Object data editor refuses, or a World Editor check
 * that failed. Its `reason` says which, for a caller to switch on, and its
 * message what the author does next. Nothing is written when it is thrown.
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
