/**
 * Reading values the report knows nothing about yet: parsed JSON files and
 * caught errors.
 */

/** Whether a parsed JSON value is an object (not an array, not `null`). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The message of a caught error, or the thrown value as text. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
