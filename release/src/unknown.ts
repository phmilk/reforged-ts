/**
 * Reading values the scripts know nothing about yet: parsed JSON files and
 * caught errors.
 */

/** Whether a parsed JSON value is an object (not an array, not `null`). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Whether a parsed JSON value is an array of strings. */
export function isStringList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

/** The message of a caught error, or the thrown value as text. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
