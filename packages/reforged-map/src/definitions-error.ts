// The one error of Object definitions (#700): loading, checking and
// merging them. The Object data editor's own refusals stay
// ObjectDataWriterError.

/**
 * Why Object definitions were refused: `"load-failed"`, a definition file
 * could not be loaded (it threw, or imported what definitions cannot);
 * `"invalid-definition"`, a definition's Rawcode, base or fields are not
 * ones the World Editor could make; `"defined-twice"`, two definitions name
 * one Rawcode of one Object kind; `"collision"`, a definition names a
 * Rawcode the map folder defines or changes; `"peer-missing"`, `typescript`
 * or `reforged-builtins` (its index, or its field table of format 2) could
 * not be read from the Map project.
 */
export type ObjectDefinitionsErrorReason =
  | "collision"
  | "defined-twice"
  | "invalid-definition"
  | "load-failed"
  | "peer-missing";

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
 * Object definitions the build refuses: a definition file that cannot be
 * loaded, an invalid definition, a Rawcode defined twice, a collision with
 * the map folder, or a missing peer. Its `reason` says which, for a caller
 * to switch on, and its message what the author does next. Nothing is
 * written when it is thrown.
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

  constructor(
    reason: ObjectDefinitionsErrorReason,
    problems: readonly ObjectDefinitionProblem[],
  ) {
    super(
      problems.length === 1
        ? (problems[0]?.message ?? "")
        : `${String(problems.length)} problems in the Object definitions:\n${problems.map((problem) => `- ${problem.message}`).join("\n")}`,
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
