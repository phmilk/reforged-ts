/** @noSelfInFile */

// The entry point of a Map project's tests, reached as `reforged-test/map`.
// It is built over the runner of `reforged-test/lua` and shares its test
// registry, so a file may import from both. Loading it makes every test of
// the file run in a Test game of its own, a fresh Lua state (ADR 0029); it
// declares no `__stub_*` global for the test, which acts on the game
// through `startGame` and the `game` it returns.

import {
  afterEach as luaAfterEach,
  type BeforeEachCallback,
  beforeEach as luaBeforeEach,
  calls as luaCalls,
  describe as luaDescribe,
  expect as luaExpect,
  fn as luaFn,
  it as luaIt,
  type Matchers,
} from "../lua/index";
import type { HandleTypes, NativeName } from "./natives";

export type { HandleTypes, NativeName } from "./natives";

__reforged_test_isolated = true;

// A member of a type literal is a method to typescript-to-lua, called with a
// colon, in a Map project's compile too: `this: void` makes `it.skip(…)` a
// call with a dot, as the runner defines it.
/* eslint-disable @typescript-eslint/no-invalid-void-type -- the no-self marker of typescript-to-lua */

/**
 * Groups the tests registered by `body` under `name`. Nesting is allowed.
 * @remarks
 * `describe.skip` and `describe.only` are Vitest's: Vitest reports them in
 * its own forms, and a forgotten `only` fails the run under `CI`.
 * @example Two groups around one test
 * {@includeCode ../../examples/describe.test.ts}
 * @example A group skipped
 * {@includeCode ../../examples/describe-skip.test.ts}
 */
export const describe: {
  /**
   * Groups the tests registered by `body` under `name`.
   * @param name - The name of the group, shown before each of its tests.
   * @param body - The function that registers the group's tests, called at
   * once.
   */
  (name: string, body: () => void): void;
  /**
   * Groups tests and skips every one of them, as Vitest's `describe.skip`:
   * none of them opens a Test game or runs a `beforeEach` or `afterEach`.
   * @param name - The name of the group.
   * @param body - The function that registers the group's tests, called at
   * once.
   */
  skip: (this: void, name: string, body: () => void) => void;
  /**
   * Groups tests and focuses on them, as Vitest's `describe.only`: every
   * other Lua test of the Map project, in this file or another, is reported
   * as skipped and opens no Test game. A forgotten `only` fails the run
   * under `CI`.
   * @param name - The name of the group.
   * @param body - The function that registers the group's tests, called at
   * once.
   */
  only: (this: void, name: string, body: () => void) => void;
} = luaDescribe;

/**
 * Registers one test. It runs in a Test game of its own: the file is loaded
 * again in a fresh Lua state for it, so its module-level code runs once per
 * test, and no test sees the units, the calls or the printed lines of
 * another.
 * @remarks
 * `it.skip`, `it.only` and `it.todo` are Vitest's: Vitest reports them in
 * its own forms, and a forgotten `only` fails the run under `CI`. A test
 * skipped, todo or out of focus opens no Test game and runs no `beforeEach`
 * or `afterEach`.
 * @example Each test in a game of its own
 * {@includeCode ../../examples/it.test.ts}
 * @example A test skipped and a test still to write
 * {@includeCode ../../examples/it-skip.test.ts}
 */
export const it: {
  /**
   * Registers one test, run in a Test game of its own.
   * @param name - The name of the test.
   * @param fn - The body of the test.
   */
  (name: string, fn: () => void): void;
  /**
   * Registers a test that does not run, as Vitest's `it.skip`: Vitest
   * reports it as skipped.
   * @param name - The name of the test.
   * @param fn - The body of the test, which does not run.
   */
  skip: (this: void, name: string, fn: () => void) => void;
  /**
   * Registers a test and focuses on it, as Vitest's `it.only`: every other
   * Lua test of the Map project, in this file or another, is reported as
   * skipped and opens no Test game. A forgotten `only` fails the run under
   * `CI`.
   * @param name - The name of the test.
   * @param fn - The body of the test.
   */
  only: (this: void, name: string, fn: () => void) => void;
  /**
   * Registers a test still to write, as Vitest's `it.todo`: a name without
   * a body, which Vitest reports as todo.
   * @param name - The name of the test.
   */
  todo: (this: void, name: string) => void;
} = luaIt;
/* eslint-enable @typescript-eslint/no-invalid-void-type */

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
 * - A function it returns runs after the test's `afterEach` hooks, the last
 *   returned first, as Vitest's cleanup does.
 * - There is no `beforeAll`: each test is a game of its own, so the file's
 *   top level runs once per test already.
 * @example One game started before each test
 * {@includeCode ../../examples/before-each.test.ts}
 * @param fn - The function to run before each test.
 * @throws When called inside a test:
 * `beforeEach: called inside a test; register it in a describe or at the top of the file`.
 */
export const beforeEach: (fn: BeforeEachCallback) => void = luaBeforeEach;

/**
 * Registers a function that runs after each test of the current
 * `describe`, its nested ones included, or of the whole file at the top,
 * even when the test or a `beforeEach` failed.
 * @remarks
 * - The hooks run from the inner `describe` outwards, the last registered
 *   first within one.
 * - One that throws fails a test that had passed, and the remaining
 *   `afterEach` hooks and the cleanups `beforeEach` returned are skipped, as
 *   Vitest's; a test that had failed keeps its first error.
 * - There is no `afterAll`: each test is a game of its own, and nothing of
 *   one reaches the next.
 * @example A check after each test
 * {@includeCode ../../examples/after-each.test.ts}
 * @param fn - The function to run after each test.
 * @throws When called inside a test:
 * `afterEach: called inside a test; register it in a describe or at the top of the file`.
 */
export const afterEach: (fn: () => void) => void = luaAfterEach;

/**
 * The matchers of `expect` on a Map project's test: Vitest's, with `.not`.
 * @remarks
 * - A text a matcher takes (`toMatch`, `toContain` on a string, `toThrow`)
 *   is plain text and means "contains", never a pattern: typescript-to-lua
 *   compiles no regular expression. Truthiness is Lua's: 0 and `""` are
 *   truthy.
 * - Every Native is already a Spy: the five spy matchers
 *   (`toHaveBeenCalled`, `toHaveBeenCalledTimes`, `toHaveBeenCalledWith`,
 *   `toHaveBeenLastCalledWith`, `toHaveBeenNthCalledWith`) take the Native
 *   itself, `expect(TimerStart)`, and read the Recorded calls its Stub keeps,
 *   the arguments typed from the Native's parameters; they take a Spy
 *   {@link fn} made alike. Nothing is replaced on `_G`, so nothing is
 *   restored, and any other function fails the matcher.
 * - A failure shows the values compared, a spy matcher's the calls
 *   received, and Vitest draws the diff of the two.
 * @example Matchers, a negated one and an asymmetric matcher
 * {@includeCode ../../examples/expect.test.ts}
 * @noSelf
 */
export interface GameMatchers<T> extends Omit<
  Matchers<T>,
  "not" | "toContainCall"
> {
  /** The same matchers, each negated: `expect(n).not.toBe(0)`. */
  not: GameMatchers<T>;
}

/**
 * The `expect` of a Map project's test, with its asymmetric matchers.
 * @remarks
 * Called on a value, it gives the {@link GameMatchers} on it. Its members are
 * the asymmetric matchers, which stand on the expected side of `toEqual`,
 * `toMatchObject` and `toContainEqual` for any value they accept:
 * `anything()`, `any(typeName)` with a Lua type name or a class,
 * `objectContaining(part)`, `arrayContaining(items)` and
 * `stringContaining(part)`.
 * @example Matchers, a negated one and an asymmetric matcher
 * {@includeCode ../../examples/expect.test.ts}
 */
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
 * @example Matchers, a negated one and an asymmetric matcher
 * {@includeCode ../../examples/expect.test.ts}
 */
export const expect: GameExpect = luaExpect;

/**
 * Makes a Spy: a real function, to hand the library as a callback, that
 * keeps the arguments of each of its calls apart from every other
 * function's, then calls `impl` with them and returns what it returned.
 * @remarks
 * - The spy matchers of `expect` read its calls, a trailing nil argument
 *   counted, and {@link calls} returns them. It has no `mock` member: there
 *   is nothing to reset, each test being a game of its own.
 * - Without `impl`, it returns nothing.
 * @example A Spy handed to the library as a callback
 * {@includeCode ../../examples/fn.test.ts}
 * @param impl - What the Spy does when called, and what it answers.
 * @returns The Spy, typed as `impl`.
 */
export const fn: typeof luaFn = luaFn;

/**
 * Returns the arguments of each call of a Spy {@link fn} made, or of a
 * Native, whose Recorded calls its Stub keeps, oldest first: how a test
 * takes a value out of a call, such as the handler a Native received.
 * @remarks
 * Each list ends at its last argument that is not nil, as a Lua list does;
 * the spy matchers count a trailing nil argument.
 * @example The handler a Native received, called by the test
 * {@includeCode ../../examples/calls.test.ts}
 * @param spy - The Spy, or the Native itself, as `TimerStart`.
 * @returns One list of arguments per call, each typed as the function's
 * parameters.
 * @throws When `spy` is neither a Spy nor a Native:
 * `calls: expected a Native or a Spy made by fn(), got <value>`.
 */
export const calls: typeof luaCalls = luaCalls;

/**
 * A Firing context: what each event response Native answers while the
 * Triggers of one event run, keyed by the Native's name
 * (`{ GetTriggerUnit: caster.handle }`). A Native the context leaves out
 * answers nil. It is the type `StubContext` of `reforged-test/stubs`.
 * @example A spell no Game action covers, fired with game.fire
 * {@includeCode ../../examples/fire.test.ts}
 */
export type FiringContext = {
  readonly [
    N in keyof typeof globalThis
  ]?: (typeof globalThis)[N] extends () => infer R ? NonNullable<R> : never;
};

/**
 * One message a display Native showed to a player.
 * @example The messages a player was shown
 * {@includeCode ../../examples/displayed.test.ts}
 */
export interface DisplayedText {
  /** The text, as the Native was given it. */
  readonly text: string;
  /** The player it was shown to: the Handle the Native received. */
  readonly player: player;
  /** The seconds it stays on screen; undefined for `DisplayTextToPlayer`. */
  readonly duration?: number;
}

/**
 * The Test game of one test, which `startGame` returns: what the player
 * observed of it.
 * @example What the players see when the game starts
 * {@includeCode ../../examples/welcome.test.ts}
 * @noSelf
 */
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
  /**
   * Fires `event` as the game would: every Trigger registered for it runs,
   * in registration order, with `context` as the Firing context. It is the
   * one way to fire an event no Game action and no Dispatching Native
   * covers, a spell or an order among them.
   * @remarks
   * - The Triggers reached are those whose registration watches the
   *   event's subject, derived from the context by the event's family: the
   *   owner of `GetTriggerUnit` for a `playerunitevent`, `GetTriggerUnit`
   *   for a `unitevent`, `GetTriggerPlayer` for a `playerevent`, none for a
   *   `gameevent`.
   * - A disabled or destroyed Trigger is skipped, a registration's filter
   *   is evaluated, and each Trigger's conditions run before its actions,
   *   both before the next Trigger. No registered Trigger is no error.
   * - It writes no state: the unit of a death is not dead, the order of an
   *   order is not given. Every Native the context names answers its value
   *   during the dispatch, a Native without a Stub included, which answers
   *   nil after it.
   * @example A spell no Game action covers
   * {@includeCode ../../examples/fire.test.ts}
   * @param event - The event, a constant of the game:
   * `EVENT_PLAYER_UNIT_SPELL_EFFECT`.
   * @param context - What the event's response Natives answer, by name.
   * @throws When `event` is not a `playerunitevent`, a `unitevent`, a
   * `playerevent` or a `gameevent`:
   * `game.fire: expected an event of the game, a playerunitevent, a unitevent, a playerevent or a gameevent`.
   * @throws When `context` lacks the response the event's family needs, naming it:
   * `game.fire: EVENT_PLAYER_UNIT_SPELL_EFFECT is a playerunitevent, so its Firing context needs GetTriggerUnit`.
   * @throws When the `GetTriggerUnit` of a `playerunitevent` has no owner,
   * a Handle of `newHandle("unit")` included:
   * `game.fire: the GetTriggerUnit of EVENT_PLAYER_UNIT_SPELL_EFFECT has no owner; give it a unit the Test game created, such as one CreateUnit returns`.
   */
  fire(
    event: playerunitevent | unitevent | playerevent | gameevent,
    context: FiringContext,
  ): void;
  /**
   * Makes `player` the local player from now on: `GetLocalPlayer` answers
   * it, so the code under test runs as that player's client. The local
   * player is `Player(0)` until the first call. It may be called more than
   * once in a test, and it is a Test control, not a Native: it records no
   * call.
   * @example The same code, run as two clients
   * {@includeCode ../../examples/set-local-player.test.ts}
   * @param player - The player whose client the test acts as: its Handle,
   * or anything with `.handle`, as a `MapPlayer` of the library.
   * @throws When `player` is not a player the Test game made, a Handle of
   * `newHandle("player")` included:
   * `game.setLocalPlayer: expected a player of the Test game, its Handle or anything with .handle, such as Player(1)`.
   */
  setLocalPlayer(player: player | { readonly handle: player }): void;
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

const NOT_A_PLAYER =
  "game.setLocalPlayer: expected a player of the Test game, its Handle or anything with .handle, such as Player(1)";

function setLocalPlayer(player: player | { readonly handle: player }): void {
  let handle: unknown = player;
  if (type(handle) === "table") {
    handle = (handle as { handle?: unknown }).handle ?? handle;
  }
  // What the Shipped stubs keep on a player they made: its kind and its
  // slot. A Handle of newHandle("player") has no slot, so it is refused.
  const made = handle as { __kind?: unknown; number?: unknown };
  if (
    type(handle) !== "table" ||
    made.__kind !== "player" ||
    type(made.number) !== "number"
  ) {
    error(NOT_A_PLAYER, 2);
  }
  __stub_set_local_player(made.number as number);
}

// The response each event family derives its subject from.
const SUBJECT_RESPONSE: Record<string, string | undefined> = {
  playerunitevent: "GetTriggerUnit",
  unitevent: "GetTriggerUnit",
  playerevent: "GetTriggerPlayer",
  gameevent: "",
};

const NOT_AN_EVENT =
  "game.fire: expected an event of the game, a playerunitevent, a unitevent, a playerevent or a gameevent";

function fire(
  event: playerunitevent | unitevent | playerevent | gameevent,
  context: FiringContext,
): void {
  // What the Shipped stubs keep on a constant of the game: its kind and
  // its name.
  const constant = event as unknown as { __kind?: unknown; __name?: unknown };
  const family =
    type(event) === "table" && type(constant.__kind) === "string"
      ? (constant.__kind as string)
      : "";
  const response = SUBJECT_RESPONSE[family];
  if (response === undefined) error(NOT_AN_EVENT, 2);
  const answers = context as unknown as Record<string, unknown>;
  let subject: unknown = undefined;
  if (response !== "") {
    subject = answers[response];
    if (subject === undefined) {
      error(
        `game.fire: ${constant.__name as string} is a ${family}, so its Firing context needs ${response}`,
        2,
      );
    }
    // The owner the units stub keeps, read without a Recorded call.
    if (family === "playerunitevent") {
      subject = (subject as { owner?: unknown }).owner;
      if (subject === undefined) {
        error(
          `game.fire: the GetTriggerUnit of ${constant.__name as string} has no owner; give it a unit the Test game created, such as one CreateUnit returns`,
          2,
        );
      }
    }
  }
  // Every Native the context names answers it during the dispatch: it is a
  // response for that time, and the function it had comes back after. One
  // without a Stub stays a response, answering nil outside a firing.
  const globals = _G as unknown as Record<string, unknown>;
  const replaced: [string, unknown][] = [];
  for (const [name] of pairs(answers)) {
    const previous = rawget(globals, name);
    __stub_response(name);
    if (previous !== undefined) table.insert(replaced, [name, previous]);
  }
  const [ok, err] = pcall(() => {
    __stub_dispatch(event, subject as handle | undefined, context);
  });
  for (const [name, previous] of replaced) globals[name] = previous;
  if (!ok) error(err, 0);
}

// printed and displayed are read at each access, so each read is a copy and
// the map's later lines show.
const game = setmetatable({ fire, setLocalPlayer } as Game, {
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
 * @example The Init stages, run by startGame
 * {@includeCode ../../examples/start-game.test.ts}
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

/**
 * The answer `stubNative` takes for the Native `N`: a function of the
 * Native's signature, as the Typings declare it. It may be left out for a
 * Native that returns nothing.
 * @example A unit's name, answered in the test
 * {@includeCode ../../examples/stub-native.test.ts}
 */
export type NativeAnswer<N extends NativeName> = [
  ReturnType<(typeof globalThis)[N]>,
  // void is what the Typings give a Native that returns nothing.
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
] extends [void]
  ? [impl?: (typeof globalThis)[N]]
  : [impl: (typeof globalThis)[N]];

/**
 * Makes the Native `name` answer `impl` in this Test game: every call of it
 * is recorded, as a Shipped stub records its own, then runs `impl` with the
 * call's arguments and returns what it returned. It is how a test answers a
 * Native without a Stub.
 * @remarks
 * - It may be called anywhere, before or after `startGame()`; the last call
 *   for a name wins.
 * - Over a Native a Shipped stub covers, the replacement is whole: the
 *   Shipped stub no longer runs, so the state it kept and its Event
 *   dispatch are gone, and `impl` does not receive the original. Keep it
 *   for the Natives that answer a value.
 * @example A unit's name, answered in the test
 * {@includeCode ../../examples/stub-native.test.ts}
 * @param name - The Native, one of `common.j` in the Typings.
 * @param impl - What the Native does and answers, typed by its signature;
 * optional only for a Native that returns nothing.
 */
export function stubNative<N extends NativeName>(
  name: N,
  ...impl: NativeAnswer<N>
): void {
  const answer = impl[0] as ((...args: unknown[]) => unknown) | undefined;
  // A Stub the spy matchers know: expect(GetUnitName) reads its calls.
  __stub_define(name, (...args: unknown[]): unknown => {
    __stub_record(name, ...args);
    // A bare return: a Native that returns nothing returns no value.
    if (answer === undefined) return;
    return answer(...args);
  });
}

/**
 * Creates a Handle of the Test game: what an answer given to `stubNative`
 * returns for a Native that creates one. It takes the next handle id of the
 * Test game, as a Handle a Shipped stub creates does, and it records no call.
 * @example A Native that creates a Handle
 * {@includeCode ../../examples/new-handle.test.ts}
 * @param kind - The Handle type, by its name in the Typings: `"unit"`,
 * `"timer"`.
 * @returns A new Handle of that type.
 */
export function newHandle<K extends keyof HandleTypes>(
  kind: K,
): HandleTypes[K] {
  return __stub_new_handle(kind) as HandleTypes[K];
}
