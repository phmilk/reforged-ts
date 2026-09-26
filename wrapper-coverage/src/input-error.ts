/**
 * Inputs the report cannot read: a file missing or malformed. The report is
 * not computed and nothing is written.
 */
export class InputError extends Error {
  override name = "InputError";
}
