/** @noSelfInFile */

// The Lua globals the runner shares with the glue, and the Lua standard
// library as the runner calls it. The stub helpers it calls are declared by
// the Shipped stubs' declarations, ../stubs/index.d.ts, which tsconfig.json
// includes.

/**
 * Set by the runner when a test module loads it; the glue calls it to run the
 * module's tests and read their results as JSON.
 */
declare let __reforged_test_run: ((position?: string) => string) | undefined;

/**
 * Set by reforged-test/map when a test module loads it: each test of the
 * file then runs in a Test game of its own, a fresh Lua state.
 */
declare let __reforged_test_isolated: boolean | undefined;

/**
 * Set by reforged-test/map: answers, at the end of a test, after its last
 * `afterEach` and the cleanups, the message listing the Caught errors the
 * test left unexpected, or undefined when there is none.
 */
declare let __reforged_test_caught: (() => string | undefined) | undefined;

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
