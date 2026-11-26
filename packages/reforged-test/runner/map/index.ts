/** @noSelfInFile */

// The entry point of a Map project's tests, reached as `reforged-test/map`.
// It is built over the runner of `reforged-test/lua` and shares its test
// registry, so a file may import from both. Loading it makes every test of
// the file run in a Test game of its own, a fresh Lua state (ADR 0029); it
// declares no `__stub_*` global for the test, which acts on the game
// through `startGame` and the `game` it returns.

import {
  afterEach as luaAfterEach,
  beforeEach as luaBeforeEach,
  describe as luaDescribe,
  expect as luaExpect,
  it as luaIt,
  type Matchers,
} from "../lua/index";

__reforged_test_isolated = true;

/**
 * Groups the tests registered by `body` under `name`. Nesting is allowed.
 * @param name - The name of the group, shown before each of its tests.
 * @param body - The function that registers the group's tests, called at
 * once.
 */
export const describe: (name: string, body: () => void) => void = luaDescribe;

/**
 * Registers one test. It runs in a Test game of its own: the file is loaded
 * again in a fresh Lua state for it, so its module-level code runs once per
 * test, and no test sees the units, the calls or the printed lines of
 * another.
 * @param name - The name of the test.
 * @param fn - The body of the test.
 */
export const it: (name: string, fn: () => void) => void = luaIt;

/**
 * Registers a function that runs before each test of the current
 * `describe`, its nested ones included, or of the whole file at the top, in
 * the test's own Test game: `startGame()` may be called there.
 * @remarks
 * - The hooks run from the outer `describe` inwards, in registration order
 *   within one.
 * - One that throws fails the test with its error, and the remaining
 *   `beforeEach` hooks and the test's body are skipped; the `afterEach`
 *   hooks still run.
 * - A function it returns is not run: clean up in an `afterEach`.
 * - There is no `beforeAll`: each test is a game of its own, so the file's
 *   top level runs once per test already.
 * @param fn - The function to run before each test.
 * @throws When called inside a test:
 * `beforeEach: called inside a test; register it in a describe or at the top of the file`.
 */
export const beforeEach: (fn: () => void) => void = luaBeforeEach;

/**
 * Registers a function that runs after each test of the current
 * `describe`, its nested ones included, or of the whole file at the top,
 * even when the test or a `beforeEach` failed.
 * @remarks
 * - The hooks run from the inner `describe` outwards, the last registered
 *   first within one.
 * - One that throws fails a test that had passed, and the remaining
 *   `afterEach` hooks are skipped, as Vitest's; a test that had failed
 *   keeps its first error.
 * - There is no `afterAll`: each test is a game of its own, and nothing of
 *   one reaches the next.
 * @param fn - The function to run after each test.
 * @throws When called inside a test:
 * `afterEach: called inside a test; register it in a describe or at the top of the file`.
 */
export const afterEach: (fn: () => void) => void = luaAfterEach;

/**
 * The matchers of `expect` on a Map project's test: Vitest's, with `.not`.
 * @noSelf
 */
export interface GameMatchers<T> extends Omit<
  Matchers<T>,
  "not" | "toContainCall"
> {
  /** The same matchers, each negated: `expect(n).not.toBe(0)`. */
  not: GameMatchers<T>;
}

/** The `expect` of a Map project's test, with its asymmetric matchers. */
export type GameExpect = (<T>(actual: T) => GameMatchers<T>) &
  Pick<
    typeof luaExpect,
    | "anything"
    | "any"
    | "objectContaining"
    | "arrayContaining"
    | "stringContaining"
  >;

/**
 * Starts an expectation on `actual`: each matcher of the result fails the
 * test, with a message naming the values, when it does not hold, and `.not`
 * negates every matcher. Its members are the asymmetric matchers. It is the
 * `expect` of `reforged-test/lua`.
 */
export const expect: GameExpect = luaExpect;

/** One message a display Native showed to a player. */
export interface DisplayedText {
  /** The text, as the Native was given it. */
  readonly text: string;
  /** The player it was shown to: the Handle the Native received. */
  readonly player: player;
  /** The seconds it stays on screen; undefined for `DisplayTextToPlayer`. */
  readonly duration?: number;
}

/** The Test game of one test, which `startGame` returns. */
export interface Game {
  /**
   * Every line printed since the Test game began, the library's included,
   * oldest first: one entry per `print` call, its arguments joined by a
   * tab. A copy at each read.
   */
  readonly printed: readonly string[];
  /**
   * Every message a display Native showed since the Test game began, oldest
   * first. A copy at each read.
   */
  readonly displayed: readonly DisplayedText[];
}

/** What the display Natives showed, as `game.displayed` lists it. */
function displayed(): DisplayedText[] {
  const records: DisplayedText[] = [];
  for (const shown of __stub_displayed()) {
    table.insert(records, {
      text: shown.text,
      player: shown.player,
      duration: shown.duration,
    });
  }
  return records;
}

// Read at each access, so each read is a copy and the map's later lines show.
const game = setmetatable({} as Game, {
  __index: (_: Game, key: unknown): unknown => {
    if (key === "printed") return __stub_printed();
    if (key === "displayed") return displayed();
    return undefined;
  },
});

const globals = _G as unknown as Record<string, (() => void) | undefined>;

/** Calls the global function `name`, defined first as one that does nothing. */
function callGlobal(name: string): void {
  // A plain assignment, so the library, which wraps an editor function on
  // its first assignment, wraps this one too.
  globals[name] ??= () => undefined;
  globals[name]();
}

let started = false;

/**
 * Starts the Test game: runs the map's initialization as the game does,
 * through the editor's script (`config`, then `main`, which runs
 * `InitGlobals`, `InitCustomTriggers` and `RunInitializationTriggers`, then
 * `MarkGameStarted`), and so through the library's Init stages. An editor
 * function nothing defined is defined as one that does nothing. Call it once
 * per test, in the test, in a `beforeEach` or at the top of the file.
 * @returns The test's game.
 * @throws When the game of this test already started:
 * `startGame: the game already started; a test is one game, so call startGame once per test`.
 */
export function startGame(): Game {
  if (started) {
    error(
      "startGame: the game already started; a test is one game, so call startGame once per test",
      2,
    );
  }
  started = true;
  callGlobal("config");
  globals.main ??= () => {
    callGlobal("InitGlobals");
    callGlobal("InitCustomTriggers");
    callGlobal("RunInitializationTriggers");
  };
  globals.main();
  callGlobal("MarkGameStarted");
  return game;
}
