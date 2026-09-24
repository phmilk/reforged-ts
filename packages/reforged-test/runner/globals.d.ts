/** @noSelfInFile */

// The Lua globals the runner shares with the glue and the stubs, and the
// Lua standard library as the runner calls it.

/**
 * Set by the runner when a test module loads it; the glue calls it to run the
 * module's tests and read their results as JSON.
 */
declare let __reforged_test_run: (() => string) | undefined;

/** The stub call log, defined by the baseline stub. */
declare const __stub_calls: string[] | undefined;

/**
 * Raises any value as the error, as Lua does; lua-types declares only a
 * string message. The runner raises a table to tell an unmet expectation
 * from any other error.
 */
declare function error(value: unknown, level?: number): never;

declare namespace string {
  /**
   * A plain find: the bounds of the first match, or nil when there is none.
   * lua-types types the miss as an empty tuple, which destructures to number.
   */
  function find(
    s: string,
    pattern: string,
    init: number,
    plain: true,
  ): LuaMultiReturn<[number, number] | [undefined]>;
}
