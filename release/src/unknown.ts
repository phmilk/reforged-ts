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

/**
 * The message of a caught error, or the thrown value as text, followed by the
 * chain of its causes: Node's `fetch` throws a bare "fetch failed" and keeps
 * the reason (`ECONNRESET`, a certificate error, ...) in `cause`.
 */
export function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const causes: string[] = [];
  let cause: unknown = error.cause;
  while (cause !== undefined && causes.length < 5) {
    if (cause instanceof Error) {
      const code =
        "code" in cause && typeof cause.code === "string" ? cause.code : "";
      causes.push(
        code !== "" && !cause.message.includes(code)
          ? `${code}: ${cause.message}`
          : cause.message,
      );
      cause = cause.cause;
    } else {
      causes.push(typeof cause === "string" ? cause : JSON.stringify(cause));
      break;
    }
  }
  return causes.length === 0
    ? error.message
    : `${error.message} (${causes.join("; ")})`;
}
