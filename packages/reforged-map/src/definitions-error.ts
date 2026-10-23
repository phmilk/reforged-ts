// The one error of Object definitions (#700): loading, checking and
// merging them. The Object data editor's own refusals stay
// ObjectDataWriterError.

/**
 * Why Object definitions were refused: `"load-failed"`, a definition file
 * could not be loaded (it threw, or imported what definitions cannot);
 * `"invalid-definition"`, a definition's Rawcode, base or fields are not
 * ones the World Editor could make; `"defined-twice"`, two definitions name
 * one Rawcode of one Object kind; `"collision"`, a definition names a
 * Rawcode the map folder defines or changes and the code does not own;
 * `"changed-outside-code"`, an object the code owns was changed in the map
 * folder outside the code since the last Object sync;
 * `"manifest-unreadable"`, the Object manifest does not parse or is not one
 * Object sync writes; `"peer-missing"`, `typescript` or `reforged-builtins`
 * (its index, or its field table of format 2) could not be read from the
 * Map project; `"not-adoptable"`, Object adoption was given a Rawcode of
 * an object the code owns or defines, of a Built-in object the map folder
 * does not change, of no object of the map folder, of two kinds without
 * its kind, or of an object holding a value no definition can hold; `"target-exists"`, a definition file Object adoption would
 * write exists; `"not-releasable"`, Object release was given a Rawcode of
 * an object the code does not own, does not define, or defines in a file
 * holding other definitions, of no object of the code, or of two kinds
 * without its kind.
 */
export type ObjectDefinitionsErrorReason =
  | "changed-outside-code"
  | "collision"
  | "defined-twice"
  | "invalid-definition"
  | "load-failed"
  | "manifest-unreadable"
  | "not-adoptable"
  | "not-releasable"
  | "peer-missing"
  | "target-exists";

/** One problem of an {@link ObjectDefinitionsError}: where it is, and what it is. */
export interface ObjectDefinitionProblem {
  /** The definition file it is about, an absolute path, when it is about one. */
  readonly file: string | undefined;
  /** The Rawcode of the definition it is about, when it is about one. */
  readonly rawcode: string | undefined;
  /** The field id it is about, when it is about one. */
  readonly field: string | undefined;
  /** What is wrong and what the author does next, one sentence or two, naming the file, the Rawcode and the field. */
  readonly message: string;
}

/**
 * Object definitions the build, Object sync, Object adoption or Object
 * release refuses: a
 * definition file that cannot be loaded, an invalid definition, a Rawcode
 * defined twice, a collision with the map folder, an object the code owns
 * changed outside the code, an unreadable Object manifest, a missing peer,
 * an object that cannot be adopted, an adoption's file that exists, or an
 * object that cannot be released. Its `reason`
 * says which, for a caller to switch on, and its message what the author
 * does next. Nothing is written when it is thrown.
 */
export class ObjectDefinitionsError extends Error {
  /** `"ObjectDefinitionsError"`, the error's name in a stack trace and in `String(error)`. */
  override name = "ObjectDefinitionsError";
  /** Why the definitions were refused. */
  readonly reason: ObjectDefinitionsErrorReason;
  /** Every problem found, the first one's file, Rawcode and field being the error's. */
  readonly problems: readonly ObjectDefinitionProblem[];
  /** The definition file of the first problem, an absolute path, when it is about one. */
  readonly file: string | undefined;
  /** The Rawcode of the first problem, when it is about one. */
  readonly rawcode: string | undefined;
  /** The field id of the first problem, when it is about one. */
  readonly field: string | undefined;

  /**
   * Makes the error of a reason and its problems.
   *
   * @param reason - Why the definitions were refused.
   * @param problems - Every problem found, at least one.
   * @param header - The message's first line, what the problems share and
   *   what the author does next, each problem then listed on its own line;
   *   when left out, a single problem is the whole message and several are
   *   counted.
   */
  constructor(
    reason: ObjectDefinitionsErrorReason,
    problems: readonly ObjectDefinitionProblem[],
    header?: string,
  ) {
    const list = problems.map((problem) => `- ${problem.message}`).join("\n");
    super(
      header !== undefined
        ? `${header}\n${list}`
        : problems.length === 1
          ? (problems[0]?.message ?? "")
          : `${String(problems.length)} problems in the Object definitions:\n${list}`,
    );
    this.reason = reason;
    this.problems = problems;
    this.file = problems[0]?.file;
    this.rawcode = problems[0]?.rawcode;
    this.field = problems[0]?.field;
  }
}

/** An error of one problem. */
export function definitionsError(
  reason: ObjectDefinitionsErrorReason,
  message: string,
  where: { file?: string; rawcode?: string; field?: string } = {},
): ObjectDefinitionsError {
  return new ObjectDefinitionsError(reason, [
    {
      file: where.file,
      rawcode: where.rawcode,
      field: where.field,
      message,
    },
  ]);
}
