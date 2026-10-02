// What a raised value says, in the game: the message the runner records for
// what a Probe threw, and the case runner for what a Native raised
// (../probes/nullability/case-runner.ts). Plain Lua only: no Native and no
// library code, and, like all of the runner's in-game source, no percent
// sign.

/** An Error thrown from TypeScript: a table with a name and a message. */
interface ThrownError {
  name?: unknown;
  message?: unknown;
}

/** A value as `tostring` gives it, or a description when `tostring` fails. */
export function describe(value: unknown): string {
  const [ok, text] = pcall(tostring, value);
  return ok ? text : `a ${type(value)} whose tostring failed`;
}

/**
 * The message of a raised value. An Error thrown from TypeScript is a table
 * whose `__tostring`, from typescript-to-lua's library, reads the `debug`
 * library, which the game does not have: it gives `<name>: <message>` as
 * that `__tostring` does, without calling it. Anything else gives what
 * `describe` gives.
 */
export function errorMessage(thrown: unknown): string {
  if (type(thrown) === "table") {
    const { name, message } = thrown as ThrownError;
    if (typeof name === "string" && typeof message === "string") {
      return message === "" ? name : `${name}: ${message}`;
    }
  }
  return describe(thrown);
}
