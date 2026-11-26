/** @noSelfInFile */

// The Lua-side runner of reforged-test. A test module calls `describe` and
// `it` at load time to register its blocks; the glue then calls the global
// `__reforged_test_run`, which runs every `it`, between the `beforeEach` and
// `afterEach` hooks of its `describe`s, each under `pcall`, and returns the
// results as a JSON string. That JSON is the only contract with the glue:
//
//   {"tests":[{"message":"...","name":"...","status":"pass"|"fail"|"error","suite":["..."]}]}
//
// `message` is present on "fail" (an expectation did not hold) and "error"
// (anything else was thrown). A "fail" may carry `actual` and `expected`,
// the two values the matcher compared, rendered as text, which the glue
// hands to Vitest for its diff. Keys are sorted; `suite` lists the enclosing
// `describe` names, outermost first.
//
// A file that loads reforged-test/map runs each test in a Test game of its
// own (ADR 0029): the map entry point sets the global
// `__reforged_test_isolated`, and the run without an argument then lists the
// tests without running them,
//
//   {"isolated":true,"tests":[{"name":"...","suite":["..."]}]}
//
// and the glue loads the file again in a fresh state for each test, calling
// `__reforged_test_run("<position>")`, which runs that one test (the
// position counts from 0) and answers `{"tests":[<its result>]}`, or
// `{"tests":[]}` when the file registered no test there.

type Status = "pass" | "fail" | "error";

/** @noSelf */
interface Block {
  suite: string[];
  name: string;
  fn: () => void;
  /** The `describe` the test was registered in, the file's root at the top. */
  scope: Scope;
}

/**
 * A `describe`, or the file's root, with the hooks registered in it, in
 * registration order.
 * @noSelf
 */
interface Scope {
  parent?: Scope;
  beforeEach: BeforeEachCallback[];
  afterEach: (() => void)[];
}

/**
 * The function `beforeEach` runs before each test, which may return a
 * cleanup.
 * @remarks
 * A function it returns runs after the test's `afterEach` functions, as
 * Vitest's cleanup does.
 * @noSelf
 */
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Vitest's own hook type
export type BeforeEachCallback = () => void | (() => void);

interface Result {
  suite: string[];
  name: string;
  status: Status;
  message?: string;
  actual?: string;
  expected?: string;
}

/**
 * The value an unmet expectation throws, told apart from any other error:
 * its message, and the two values compared, rendered, when a diff of them
 * helps.
 */
interface Failure {
  reforgedTestFailure: true;
  message: string;
  actual?: string;
  expected?: string;
}

const blocks: Block[] = [];
const suites: string[] = [];
const root: Scope = { beforeEach: [], afterEach: [] };
let scope = root;
/** Whether a test, or one of its hooks, is running. */
let running = false;

function copy<T>(list: T[]): T[] {
  const out: T[] = [];
  for (const value of list) {
    table.insert(out, value);
  }
  return out;
}

/** Groups the `it` blocks registered by `body` under `name`. */
export function describe(name: string, body: () => void): void {
  const outer = scope;
  table.insert(suites, name);
  scope = { parent: outer, beforeEach: [], afterEach: [] };
  body();
  scope = outer;
  table.remove(suites);
}

/**
 * Registers one test. It runs after the test module has loaded, in
 * registration order, sharing the Lua state (and the stub call log) with the
 * other tests of the same file; in a file that loads `reforged-test/map`, it
 * runs in a Test game of its own.
 */
export function it(name: string, fn: () => void): void {
  table.insert(blocks, { suite: copy(suites), name, fn, scope });
}

/** Refuses a hook registered while a test runs. */
function refuseInsideTest(kind: "beforeEach" | "afterEach"): void {
  if (running) {
    error(
      `${kind}: called inside a test; register it in a describe or at the top of the file`,
      3,
    );
  }
}

/**
 * Registers a function that runs before each test of the current
 * `describe`, its nested ones included, or of the whole file at the top.
 * @remarks
 * - The hooks run from the outer `describe` inwards, in registration order
 *   within one.
 * - One that throws fails the test with its error, and the remaining
 *   `beforeEach` hooks and the test's body are skipped; the `afterEach`
 *   hooks still run.
 * - A function it returns runs after the test's `afterEach` hooks, the last
 *   returned first, as Vitest's cleanup does.
 * @param fn - The function to run before each test.
 * @throws When called inside a test:
 * `beforeEach: called inside a test; register it in a describe or at the top of the file`.
 */
export function beforeEach(fn: BeforeEachCallback): void {
  refuseInsideTest("beforeEach");
  table.insert(scope.beforeEach, fn);
}

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
 * @param fn - The function to run after each test.
 * @throws When called inside a test:
 * `afterEach: called inside a test; register it in a describe or at the top of the file`.
 */
export function afterEach(fn: () => void): void {
  refuseInsideTest("afterEach");
  table.insert(scope.afterEach, fn);
}

/** The global call log of the stubs, one `Name(arg, arg)` line per call. */
export function stubCalls(): string[] {
  // Declared as always there; nil when a test runs without the baseline.
  if ((__stub_calls as string[] | undefined) === undefined) {
    error(
      "the stub call log __stub_calls is not defined: the baseline stub is not loaded",
      2,
    );
  }
  return __stub_calls;
}

// ---------------------------------------------------------------------------
// Rendering values in failure messages

/**
 * An asymmetric matcher: a value standing on the expected side of `toEqual`,
 * `toMatchObject` or `toContainEqual` that accepts every actual value its
 * `matches` accepts. `text` is how a failure message shows it.
 * @noSelf
 */
interface Asymmetric {
  reforgedTestAsymmetric: true;
  text: string;
  matches: (actual: unknown) => boolean;
}

function isAsymmetric(value: unknown): value is Asymmetric {
  return (
    type(value) === "table" &&
    rawget(
      value as { reforgedTestAsymmetric?: unknown },
      "reforgedTestAsymmetric",
    ) === true
  );
}

function isHandle(value: object): boolean {
  const record = value as { __kind?: unknown; __handleId?: unknown };
  return record.__kind !== undefined && record.__handleId !== undefined;
}

/** A constant of the game a stub defined (`PLAYER_COLOR_RED`): its name, or undefined. */
function constantName(value: object): string | undefined {
  const record = value as { __kind?: unknown; __name?: unknown };
  return record.__kind !== undefined && type(record.__name) === "string"
    ? (record.__name as string)
    : undefined;
}

function sortedKeys(value: object): unknown[] {
  const keys: unknown[] = [];
  for (const [key] of pairs(value)) {
    table.insert(keys, key);
  }
  table.sort(keys, (a, b) => {
    const ta = type(a);
    const tb = type(b);
    if (ta !== tb) return ta < tb;
    if (ta === "number" || ta === "string")
      return (a as string) < (b as string);
    return tostring(a) < tostring(b);
  });
  return keys;
}

/**
 * Whether a table is an array: its keys (sorted, as sortedKeys returns them)
 * are 1..n, or it has none.
 */
function isArray(record: object, keys: unknown[]): boolean {
  return (
    keys.length === 0 ||
    (keys.length === (record as unknown[]).length && type(keys[0]) === "number")
  );
}

function show(value: unknown, depth = 0): string {
  const kind = type(value);
  if (kind === "nil") return "nil";
  if (kind === "string") return string.format("%q", value);
  if (kind === "function") return "<function>";
  if (kind !== "table") return tostring(value);
  if (isAsymmetric(value)) return value.text;
  const record = value as Record<string | number, unknown>;
  if (isHandle(record))
    return `${tostring(record.__kind)}#${tostring(record.__handleId)}`;
  const constant = constantName(record);
  if (constant !== undefined) return constant;
  if (depth >= 2) return "{...}";
  const parts: string[] = [];
  const keys = sortedKeys(record);
  if (keys.length > 0 && isArray(record, keys)) {
    for (const item of record as unknown as unknown[]) {
      table.insert(parts, show(item, depth + 1));
    }
    return `{${table.concat(parts, ", ")}}`;
  }
  for (const key of keys) {
    const shown = show(record[key as string], depth + 1);
    table.insert(
      parts,
      type(key) === "string"
        ? `${key as string} = ${shown}`
        : `[${tostring(key)}] = ${shown}`,
    );
  }
  return `{${table.concat(parts, ", ")}}`;
}

/** The depth below which `pretty` writes a table out. */
const PRETTY_DEPTH = 8;

/**
 * A value as the diff of a failure shows it: as `show` writes it, a table
 * written out one key per line, nested ones indented, so the diff Vitest
 * draws of two of them is line by line.
 */
function pretty(
  value: unknown,
  indent = "",
  seen = new LuaMap<object, boolean>(),
): string {
  if (type(value) !== "table") return show(value);
  const record = value as Record<string | number, unknown>;
  if (
    isAsymmetric(record) ||
    isHandle(record) ||
    constantName(record) !== undefined
  ) {
    return show(record);
  }
  if (seen.get(record) === true) return "<cycle>";
  const keys = sortedKeys(record);
  if (keys.length === 0) return "{}";
  if (indent.length >= 2 * PRETTY_DEPTH) return "{...}";
  seen.set(record, true);
  const inner = `${indent}  `;
  const lines: string[] = [];
  const array = isArray(record, keys);
  for (const key of keys) {
    const shown = pretty(record[key as string], inner, seen);
    if (array) table.insert(lines, `${inner}${shown},`);
    else if (type(key) === "string")
      table.insert(lines, `${inner}${key as string} = ${shown},`);
    else table.insert(lines, `${inner}[${tostring(key)}] = ${shown},`);
  }
  seen.delete(record);
  return `{\n${table.concat(lines, "\n")}\n${indent}}`;
}

/**
 * A thrown value as a failure message shows it: its message quoted, or the
 * value itself when it carries no message.
 */
function showThrown(err: unknown): string {
  const text = errorMessage(err);
  return type(err) === "table" &&
    text !== (err as { message?: unknown }).message
    ? text
    : show(text);
}

function errorMessage(err: unknown): string {
  if (type(err) === "table") {
    const record = err as { message?: unknown };
    if (type(record.message) === "string") return record.message as string;
    // tostring on a thrown table may call the lualib's __tostring, which
    // raises without debug, as in the game: docs/research/test-phrasing.md.
    return show(err);
  }
  return tostring(err);
}

// ---------------------------------------------------------------------------
// Comparing values

/**
 * Fails the expectation with `message`; with `diff`, the two values
 * compared, as `pretty` or the spy matchers render them, for Vitest's diff.
 */
function fail(
  message: string,
  diff?: { actual: string; expected: string },
): never {
  const failure: Failure = {
    reforgedTestFailure: true,
    message,
    actual: diff?.actual,
    expected: diff?.expected,
  };
  // What `throw failure` compiles to; the table reaches pcall unchanged.
  error(failure, 0);
}

function keyPath(path: string, key: unknown): string {
  if (type(key) === "string") return `${path}.${key as string}`;
  return `${path}[${tostring(key)}]`;
}

/** The path a difference of the whole value names. */
const ROOT = "value";

function mismatch(path: string, actual: unknown, expected: unknown): string {
  return `${path === "" ? ROOT : path}: ${show(actual)} vs ${show(expected)}`;
}

/**
 * Whether a value is compared key by key: a table, but a Handle and a
 * constant of the game, which are compared by identity.
 */
function composite(value: unknown): boolean {
  return (
    type(value) === "table" &&
    !isHandle(value as object) &&
    constantName(value as object) === undefined
  );
}

/** Records that `a` is under comparison with `b`; false when it already was. */
function visit(
  seen: LuaMap<object, LuaMap<object, boolean>>,
  a: object,
  b: object,
): boolean {
  let pairsOfA = seen.get(a);
  if (pairsOfA === undefined) {
    pairsOfA = new LuaMap();
    seen.set(a, pairsOfA);
  }
  if (pairsOfA.get(b) === true) return false;
  pairsOfA.set(b, true);
  return true;
}

/**
 * The path of the first difference between two values, or undefined when
 * they are deeply equal. An asymmetric matcher on the expected side decides
 * for its value. Tables compare key by key, metatables are ignored, and a
 * pair already under comparison is taken as equal so cycles end.
 */
function difference(
  actual: unknown,
  expected: unknown,
  path: string,
  seen: LuaMap<object, LuaMap<object, boolean>>,
): string | undefined {
  if (isAsymmetric(expected)) {
    return expected.matches(actual)
      ? undefined
      : mismatch(path, actual, expected);
  }
  if (actual === expected) return undefined;
  if (!composite(actual) || !composite(expected)) {
    return mismatch(path, actual, expected);
  }
  const a = actual as Record<string, unknown>;
  const b = expected as Record<string, unknown>;
  if (!visit(seen, a, b)) return undefined;
  for (const key of sortedKeys(a)) {
    const found = difference(
      a[key as string],
      b[key as string],
      keyPath(path, key),
      seen,
    );
    if (found !== undefined) return found;
  }
  for (const key of sortedKeys(b)) {
    if (a[key as string] === undefined) {
      const found = difference(
        undefined,
        b[key as string],
        keyPath(path, key),
        seen,
      );
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/**
 * The tail of a failure message naming the first difference, or nothing when
 * the difference is the whole value, which the message already shows.
 */
function where(found: string): string {
  return string.sub(found, 1, ROOT.length + 2) === `${ROOT}: `
    ? ""
    : ` (first difference at ${found})`;
}

function equals(actual: unknown, expected: unknown): boolean {
  return difference(actual, expected, "", new LuaMap()) === undefined;
}

/**
 * The path of the first key of `expected` that `actual` does not match, or
 * undefined when `actual` holds every key of `expected`. Nested tables match
 * the same way; an array of `expected` matches an array of the same length
 * only, element by element.
 */
function subsetDifference(
  actual: unknown,
  expected: unknown,
  path: string,
  seen: LuaMap<object, LuaMap<object, boolean>>,
): string | undefined {
  if (isAsymmetric(expected)) {
    return expected.matches(actual)
      ? undefined
      : mismatch(path, actual, expected);
  }
  if (actual === expected) return undefined;
  if (!composite(actual) || !composite(expected)) {
    return mismatch(path, actual, expected);
  }
  const a = actual as Record<string, unknown>;
  const b = expected as Record<string, unknown>;
  if (!visit(seen, a, b)) return undefined;
  const keys = sortedKeys(b);
  if (keys.length > 0 && isArray(b, keys)) {
    const actualKeys = sortedKeys(a);
    if (!isArray(a, actualKeys) || actualKeys.length !== keys.length) {
      return mismatch(path, actual, expected);
    }
  }
  for (const key of keys) {
    const found = subsetDifference(
      a[key as string],
      b[key as string],
      keyPath(path, key),
      seen,
    );
    if (found !== undefined) return found;
  }
  return undefined;
}

/** Whether an item of `list`, up to its first nil, satisfies `test`. */
function some(list: unknown[], test: (item: unknown) => boolean): boolean {
  for (const item of list) {
    if (test(item)) return true;
  }
  return false;
}

function contains(text: string, part: string): boolean {
  const [start] = string.find(text, part, 1, true);
  return start !== undefined;
}

/** Whether `value` is an instance of the typescript-to-lua class `cls`. */
function isInstance(value: unknown, cls: object): boolean {
  if (type(value) !== "table") return false;
  // typescript-to-lua's instanceof: the constructor its prototype names,
  // then each base class up the ____super chain.
  let current = (value as { constructor?: unknown }).constructor;
  while (current !== undefined) {
    if (rawequal(current, cls)) return true;
    current = (current as { ____super?: unknown }).____super;
  }
  return false;
}

function className(cls: object): string {
  const name = (cls as { name?: unknown }).name;
  return type(name) === "string" ? (name as string) : "the class";
}

// ---------------------------------------------------------------------------
// Asymmetric matchers

/** A Lua type name `expect.any` takes, as `type` returns it. */
export type LuaTypeName =
  | "number"
  | "string"
  | "boolean"
  | "table"
  | "function"
  | "thread"
  | "userdata";

/** A class compiled by typescript-to-lua, abstract or not. */
export type Class = abstract new (...args: never) => unknown;

const typeNames = new LuaMap<string, boolean>();
for (const name of [
  "number",
  "string",
  "boolean",
  "table",
  "function",
  "thread",
  "userdata",
]) {
  typeNames.set(name, true);
}

function asymmetric(
  text: string,
  matches: (actual: unknown) => boolean,
): Asymmetric {
  return { reforgedTestAsymmetric: true, text, matches };
}

function anything(): Asymmetric {
  return asymmetric("expect.anything()", (actual) => actual !== undefined);
}

function anyOf(kind: unknown): Asymmetric {
  if (kind === undefined) {
    error(
      'expect.any received nil: Number, String, Boolean, Function, Object and Array are nil in Lua, so write the type name instead: "number", "string", "boolean", "function" or "table"',
      2,
    );
  }
  if (type(kind) === "string") {
    if (typeNames.get(kind as string) !== true) {
      error(
        `expect.any takes a Lua type name ("number", "string", "boolean", "table", "function", "thread" or "userdata") or a class, got ${show(kind)}`,
        2,
      );
    }
    return asymmetric(
      `expect.any(${show(kind)})`,
      (actual) => type(actual) === kind,
    );
  }
  if (type(kind) !== "table") {
    error(`expect.any takes a Lua type name or a class, got ${show(kind)}`, 2);
  }
  const cls = kind as object;
  return asymmetric(`expect.any(${className(cls)})`, (actual) =>
    isInstance(actual, cls),
  );
}

function objectContaining(part: unknown): Asymmetric {
  if (type(part) !== "table") {
    error(`expect.objectContaining takes a table, got ${show(part)}`, 2);
  }
  const sample = part as Record<string, unknown>;
  return asymmetric(`expect.objectContaining(${show(sample)})`, (actual) => {
    if (type(actual) !== "table") return false;
    const record = actual as Record<string, unknown>;
    for (const key of sortedKeys(sample)) {
      if (!equals(record[key as string], sample[key as string])) return false;
    }
    return true;
  });
}

function arrayContaining(items: unknown): Asymmetric {
  if (type(items) !== "table") {
    error(`expect.arrayContaining takes a list, got ${show(items)}`, 2);
  }
  const wanted = items as unknown[];
  return asymmetric(`expect.arrayContaining(${show(wanted)})`, (actual) => {
    // As Vitest's, an empty list of items matches any value.
    if (wanted.length === 0) return true;
    if (type(actual) !== "table") return false;
    const list = actual as unknown[];
    for (const item of wanted) {
      if (!some(list, (candidate) => equals(candidate, item))) return false;
    }
    return true;
  });
}

function stringContaining(part: unknown): Asymmetric {
  if (type(part) !== "string") {
    error(`expect.stringContaining takes a string, got ${show(part)}`, 2);
  }
  return asymmetric(
    `expect.stringContaining(${show(part)})`,
    (actual) =>
      type(actual) === "string" && contains(actual as string, part as string),
  );
}

// ---------------------------------------------------------------------------
// Spies and Recorded calls

/** The arguments of one call, `n` counting the nil ones too. */
type Packed = unknown[] & { n: number };

/** Any function, as `fn` and `calls` take one. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any function, as Vitest's Procedure
type Procedure = (...args: any[]) => any;

/** The calls of every Spy `fn` made, by the Spy. */
const spies = new LuaMap<Procedure, Packed[]>();

/**
 * Makes a Spy: a real function that keeps the arguments of each of its
 * calls, then calls `impl` with them, when given, and returns what it
 * returned.
 * @param impl - What the Spy does when called; it returns nothing without one.
 * @returns The Spy, typed as `impl`.
 */
export function fn<F extends Procedure = Procedure>(impl?: F): F {
  const recordedCalls: Packed[] = [];
  const spy = (...args: unknown[]): unknown => {
    table.insert(recordedCalls, table.pack(...args));
    // A bare return: a Spy without impl returns no value.
    if (impl === undefined) return;
    return impl(...args);
  };
  spies.set(spy, recordedCalls);
  return spy as F;
}

/** What a spy matcher reads: how it names the function, and its calls. */
interface Recorded {
  /** The function in a sentence: the Native's name, or "the spy". */
  label: string;
  /** The function in a line of the calls received: the Native's name, or "spy". */
  callee: string;
  calls: Packed[];
}

/**
 * The calls of a Spy, or the Recorded calls of a Native's Stub; undefined
 * for any other value.
 */
function recordedOf(value: unknown): Recorded | undefined {
  if (type(value) !== "function") return undefined;
  const received = spies.get(value as Procedure);
  if (received !== undefined) {
    return { label: "the spy", callee: "spy", calls: received };
  }
  // Undefined when the runner runs without the baseline stub.
  const nativeName = __stub_native_name as
    typeof __stub_native_name | undefined;
  const name = nativeName?.(value);
  if (name === undefined) return undefined;
  return { label: name, callee: name, calls: __stub_args(name) };
}

/** Why a value is not one a spy matcher or `calls` reads. */
function notRecorded(value: unknown): string {
  return type(value) === "function"
    ? "a function that is neither a Native with a recorded Stub nor a Spy made by fn()"
    : show(value);
}

/**
 * Returns the arguments of each call of `spy`, oldest first: a Spy `fn`
 * made, or a Native, whose Recorded calls its Stub keeps.
 * @param spy - The Spy, or the Native itself (`TimerStart`).
 * @returns One list of arguments per call, each typed as the function's
 * parameters; a list ends at its last argument that is not nil.
 * @throws When `spy` is neither:
 * `calls: expected a Native or a Spy made by fn(), got <value>`.
 */
export function calls<F extends Procedure>(spy: F): Parameters<F>[] {
  const recorded = recordedOf(spy);
  if (recorded === undefined) {
    error(
      `calls: expected a Native or a Spy made by fn(), got ${notRecorded(spy)}`,
      2,
    );
  }
  const lists: Parameters<F>[] = [];
  for (const call of recorded.calls) {
    table.insert(lists, table.move(call, 1, call.n, 1, []) as Parameters<F>);
  }
  return lists;
}

/** The arguments of a call as a failure shows them: `(timer#1048577, 60)`. */
function showArguments(call: Packed): string {
  const parts: string[] = [];
  for (let i = 0; i < call.n; i++) {
    table.insert(parts, show(call[i]));
  }
  return `(${table.concat(parts, ", ")})`;
}

/** The arguments of every call, one line each, as a diff shows them. */
function everyCall(recorded: Recorded): string {
  const lines: string[] = [];
  for (const call of recorded.calls) {
    table.insert(lines, showArguments(call));
  }
  return table.concat(lines, "\n");
}

/** "1 call", "2 calls". */
function count(times: number, noun: string): string {
  return `${tostring(times)} ${noun}${times === 1 ? "" : "s"}`;
}

/** The calls received, as a spy matcher's message ends. */
function received(recorded: Recorded): string {
  if (recorded.calls.length === 0) return "it was never called";
  const lines: string[] = [];
  for (const [index, call] of ipairs(recorded.calls)) {
    table.insert(
      lines,
      `  ${tostring(index)}: ${recorded.callee}${showArguments(call)}`,
    );
  }
  return `it received ${count(recorded.calls.length, "call")}:\n${table.concat(lines, "\n")}`;
}

/**
 * How a matcher that compares arguments names what it expected:
 * `called with`, then the arguments, then the position, ` on call 2`.
 */
interface CallPhrase {
  what: string;
  position?: string;
}

/** Whether a call's arguments match the expected ones, nil arguments counted. */
function sameArguments(call: Packed, expected: Packed): boolean {
  if (call.n !== expected.n) return false;
  for (let i = 0; i < call.n; i++) {
    if (!equals(call[i], expected[i])) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Matchers

/**
 * What a spy matcher compares a call with: the parameters of the function
 * under test.
 */
type ArgumentsOf<T> = T extends (...args: infer A) => unknown ? A : unknown[];

/** What `toContain` and `toContainEqual` take: an item of a list, or a part of a string. */
type ItemOf<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? Item
    : unknown;

/**
 * The matchers `expect` returns, Vitest's where typescript-to-lua compiles
 * them. Interface methods take a `self` in typescript-to-lua unless the
 * interface itself is `@noSelf`, whatever the file directive says.
 *
 * Every text a matcher takes is plain text and means "contains", never a
 * pattern: typescript-to-lua compiles no regular expression. Truthiness is
 * Lua's. See `docs/research/test-phrasing.md`.
 * @noSelf
 */
export interface Matchers<T> {
  /** The same matchers, each negated: `expect(n).not.toBe(0)`. */
  not: Matchers<T>;
  /**
   * Strict equality on primitives (`==`), deep equality on tables; an
   * asymmetric matcher of `expect` stands for any value it accepts.
   * @param expected - The value or the asymmetric matcher to equal.
   */
  toEqual(expected: T): void;
  /**
   * Identity: the very same value (`rawequal`), so two equal tables differ.
   * @param expected - The value to be.
   */
  toBe(expected: T): void;
  /** Lua truthiness: anything but nil and false (0 and "" are truthy). */
  toBeTruthy(): void;
  /** Lua falsiness: nil or false. */
  toBeFalsy(): void;
  /** The value is nil. */
  toBeUndefined(): void;
  /** The value is not nil. */
  toBeDefined(): void;
  /**
   * The value is a list holding this very item (`rawequal`), or a string
   * holding this part as plain text.
   * @param item - The item of the list, or the part of the string.
   */
  toContain(item: ItemOf<T>): void;
  /**
   * The value is a list holding an item deeply equal to this one, as
   * `toEqual` compares.
   * @param item - The value or the asymmetric matcher an item equals.
   */
  toContainEqual(item: ItemOf<T>): void;
  /**
   * The length `#` gives of a string or a list.
   * @param length - The expected length.
   */
  toHaveLength(length: number): void;
  /**
   * The value is a table holding every key of `subset` with a matching
   * value, nested tables matched the same way; a list of `subset` matches a
   * list of the same length only.
   * @param subset - The keys and values the table holds.
   */
  toMatchObject(subset: object): void;
  /**
   * The number is greater than `expected`.
   * @param expected - The number to compare with.
   */
  toBeGreaterThan(expected: number): void;
  /**
   * The number is greater than or equal to `expected`.
   * @param expected - The number to compare with.
   */
  toBeGreaterThanOrEqual(expected: number): void;
  /**
   * The number is less than `expected`.
   * @param expected - The number to compare with.
   */
  toBeLessThan(expected: number): void;
  /**
   * The number is less than or equal to `expected`.
   * @param expected - The number to compare with.
   */
  toBeLessThanOrEqual(expected: number): void;
  /**
   * The number differs from `expected` by less than half of 10 to the
   * power of `-digits`, as Vitest's.
   * @param expected - The number to be close to.
   * @param digits - The digits after the decimal point that count, 2 when omitted.
   */
  toBeCloseTo(expected: number, digits?: number): void;
  /**
   * The value is an instance of the class or of a class that extends it.
   * @param cls - The class, compiled by typescript-to-lua.
   * @throws When `cls` is not a class: `toBeInstanceOf takes a class, got <value>`.
   */
  toBeInstanceOf(cls: Class): void;
  /**
   * The value is a string holding `part` as plain text, not a pattern.
   * @param part - The part of the string.
   */
  toMatch(part: string): void;
  /**
   * The value is a function that throws when called; with `message`, the
   * error's message contains it (plain text, not a pattern).
   * @param message - A part of the error's message.
   */
  toThrow(message?: string): void;
  /**
   * The value, a Native or a Spy made by `fn`, was called at least once.
   * A Native's calls are the Recorded calls its Stub keeps.
   */
  toHaveBeenCalled(): void;
  /**
   * The value, a Native or a Spy made by `fn`, was called exactly `times`
   * times.
   * @param times - The number of calls.
   */
  toHaveBeenCalledTimes(times: number): void;
  /**
   * The value, a Native or a Spy made by `fn`, received these arguments in
   * one of its calls, compared as `toEqual` compares, their number
   * included: a trailing nil argument counts.
   * @param args - The arguments, or asymmetric matchers standing for them.
   */
  toHaveBeenCalledWith(...args: ArgumentsOf<T>): void;
  /**
   * The last call of the value, a Native or a Spy made by `fn`, received
   * these arguments, compared as `toHaveBeenCalledWith` compares.
   * @param args - The arguments, or asymmetric matchers standing for them.
   */
  toHaveBeenLastCalledWith(...args: ArgumentsOf<T>): void;
  /**
   * The call at position `n` of the value, a Native or a Spy made by `fn`,
   * received these arguments, compared as `toHaveBeenCalledWith` compares.
   * @param n - The position of the call, counted from 1.
   * @param args - The arguments, or asymmetric matchers standing for them.
   */
  toHaveBeenNthCalledWith(n: number, ...args: ArgumentsOf<T>): void;
  /**
   * The value is a call log (see `stubCalls`) holding exactly this line.
   * @param call - The line, as the call log renders it.
   */
  toContainCall(call: string): void;
}

function matchersOf<T>(actual: T, negated: boolean): Matchers<T> {
  const negation = negated ? "not " : "";
  const shown = (): string => show(actual);
  /** The diff of `actual` and `expected`, written out for Vitest. */
  const diffWith = (expected: unknown) => ({
    actual: pretty(actual),
    expected: pretty(expected),
  });
  const numbers = (expected: number): number => {
    if (type(actual) !== "number")
      fail(`Expected a number to compare, got ${shown()}`);
    if (type(expected) !== "number")
      fail(`Expected a number to compare with, got ${show(expected)}`);
    return actual as unknown as number;
  };
  const compare = (
    holds: boolean,
    relation: string,
    expected: number,
  ): void => {
    if (holds !== negated) return;
    fail(`Expected ${shown()} ${negation}to be ${relation} ${show(expected)}`);
  };
  const recorded = (): Recorded => {
    const found = recordedOf(actual);
    if (found === undefined) {
      fail(
        `Expected a Native or a Spy made by fn(), got ${notRecorded(actual)}`,
      );
    }
    return found;
  };
  /**
   * Holds or fails a matcher that compares the arguments of the call at
   * `index` (counted from 1; the last call when omitted) with `args`. The
   * diff Vitest draws is of that call and the arguments, and there is none
   * when the call was never made.
   */
  const failUnlessCallMatches = (
    expected: Packed,
    phrase: CallPhrase,
    index?: number,
  ): void => {
    const spy = recorded();
    const call = spy.calls[(index ?? spy.calls.length) - 1] as
      Packed | undefined;
    const matched = call !== undefined && sameArguments(call, expected);
    if (matched !== negated) return;
    failCalledWith(spy, expected, phrase, call);
  };
  /**
   * Fails a matcher that compares arguments: its sentence, the calls
   * received, and, not negated, the diff of the expected arguments with
   * `call`, or with every call for `"every"`; there is none when `call` is
   * undefined, a call never made.
   */
  const failCalledWith = (
    spy: Recorded,
    expected: Packed,
    phrase: CallPhrase,
    call: Packed | "every" | undefined,
  ): never => {
    const diff =
      negated || call === undefined || spy.calls.length === 0
        ? undefined
        : {
            actual: call === "every" ? everyCall(spy) : showArguments(call),
            expected: showArguments(expected),
          };
    fail(
      `Expected ${spy.label} ${negation}to have been ${phrase.what} ${showArguments(expected)}${phrase.position ?? ""}; ${received(spy)}`,
      diff,
    );
  };
  return {
    not: undefined as unknown as Matchers<T>,
    toHaveBeenCalled: () => {
      const spy = recorded();
      const called = spy.calls.length > 0;
      if (called !== negated) return;
      fail(
        `Expected ${spy.label} ${negation}to have been called; ${received(spy)}`,
      );
    },
    toHaveBeenCalledTimes: (times) => {
      const spy = recorded();
      if ((spy.calls.length === times) !== negated) return;
      fail(
        `Expected ${spy.label} ${negation}to have been called ${count(times, "time")}; ${received(spy)}`,
      );
    },
    toHaveBeenCalledWith: (...args) => {
      const expected = table.pack(...args) as unknown as Packed;
      const spy = recorded();
      const matched = some(spy.calls, (call) =>
        sameArguments(call as Packed, expected),
      );
      if (matched !== negated) return;
      failCalledWith(spy, expected, { what: "called with" }, "every");
    },
    // Each packs its arguments itself: a rest parameter spread once keeps
    // a trailing nil, which a list handed on would drop.
    toHaveBeenLastCalledWith: (...args) => {
      failUnlessCallMatches(table.pack(...args) as unknown as Packed, {
        what: "last called with",
      });
    },
    toHaveBeenNthCalledWith: (n, ...args) => {
      failUnlessCallMatches(
        table.pack(...args) as unknown as Packed,
        { what: "called with", position: ` on call ${tostring(n)}` },
        n,
      );
    },
    toEqual: (expected) => {
      if (type(actual) === "table" || isAsymmetric(expected)) {
        const found = difference(actual, expected, "", new LuaMap());
        if ((found === undefined) !== negated) return;
        if (type(actual) !== "table") {
          fail(
            `Expected ${shown()} ${negation}to equal ${show(expected)}`,
            negated ? undefined : diffWith(expected),
          );
        }
        if (found === undefined) {
          fail(`Expected ${shown()} not to deeply equal ${show(expected)}`);
        }
        fail(
          `Expected ${shown()} to deeply equal ${show(expected)}${where(found)}`,
          diffWith(expected),
        );
      }
      if ((actual === expected) !== negated) return;
      fail(
        `Expected ${shown()} ${negation}to equal ${show(expected)}`,
        negated ? undefined : diffWith(expected),
      );
    },
    toBe: (expected) => {
      if (rawequal(actual, expected) !== negated) return;
      const hint =
        !negated && type(actual) === "table" && type(expected) === "table"
          ? " (not the same table; use toEqual for deep equality)"
          : "";
      fail(
        `Expected ${shown()} ${negation}to be ${show(expected)}${hint}`,
        negated ? undefined : diffWith(expected),
      );
    },
    toBeTruthy: () => {
      if (!!actual !== negated) return;
      fail(`Expected ${shown()} ${negation}to be truthy`);
    },
    toBeFalsy: () => {
      if (!actual !== negated) return;
      fail(`Expected ${shown()} ${negation}to be falsy`);
    },
    toBeUndefined: () => {
      if ((actual === undefined) !== negated) return;
      fail(`Expected ${shown()} ${negation}to be undefined (nil)`);
    },
    toBeDefined: () => {
      if ((actual !== undefined) !== negated) return;
      fail(`Expected ${shown()} ${negation}to be defined (not nil)`);
    },
    toContain: (item) => {
      if (type(actual) === "string") {
        if (type(item) !== "string")
          fail(`Expected a string to look for in a string, got ${show(item)}`);
        if (contains(actual as unknown as string, item as string) !== negated)
          return;
        fail(`Expected ${shown()} ${negation}to contain ${show(item)}`);
      }
      if (type(actual) !== "table")
        fail(`Expected a list or a string to contain an item, got ${shown()}`);
      const list = actual as unknown as unknown[];
      if (some(list, (candidate) => rawequal(candidate, item)) !== negated)
        return;
      fail(`Expected ${shown()} ${negation}to contain ${show(item)}`);
    },
    toContainEqual: (item) => {
      if (type(actual) !== "table")
        fail(`Expected a list to contain an item, got ${shown()}`);
      const list = actual as unknown as unknown[];
      if (some(list, (candidate) => equals(candidate, item)) !== negated)
        return;
      fail(
        `Expected ${shown()} ${negation}to contain an item equal to ${show(item)}`,
      );
    },
    toHaveLength: (length) => {
      if (type(actual) !== "string" && type(actual) !== "table")
        fail(`Expected a list or a string to have a length, got ${shown()}`);
      const got = (actual as unknown as string).length;
      if ((got === length) !== negated) return;
      fail(
        `Expected ${shown()} ${negation}to have length ${show(length)}, got ${show(got)}`,
      );
    },
    toMatchObject: (subset) => {
      if (type(actual) !== "table")
        fail(`Expected a table to match an object, got ${shown()}`);
      const found = subsetDifference(actual, subset, "", new LuaMap());
      if ((found === undefined) !== negated) return;
      if (found === undefined) {
        fail(`Expected ${shown()} not to match object ${show(subset)}`);
      }
      fail(
        `Expected ${shown()} to match object ${show(subset)}${where(found)}`,
        diffWith(subset),
      );
    },
    toBeGreaterThan: (expected) => {
      compare(numbers(expected) > expected, "greater than", expected);
    },
    toBeGreaterThanOrEqual: (expected) => {
      compare(
        numbers(expected) >= expected,
        "greater than or equal to",
        expected,
      );
    },
    toBeLessThan: (expected) => {
      compare(numbers(expected) < expected, "less than", expected);
    },
    toBeLessThanOrEqual: (expected) => {
      compare(numbers(expected) <= expected, "less than or equal to", expected);
    },
    toBeCloseTo: (expected, digits = 2) => {
      const value = numbers(expected);
      const bound = 10 ** -digits / 2;
      const close = value === expected || math.abs(value - expected) < bound;
      if (close !== negated) return;
      fail(
        `Expected ${shown()} ${negation}to be close to ${show(expected)} (to ${show(digits)} ${digits === 1 ? "digit" : "digits"}, a difference below ${show(bound)})`,
      );
    },
    toBeInstanceOf: (cls) => {
      if (type(cls) !== "table")
        error(`toBeInstanceOf takes a class, got ${show(cls)}`, 2);
      if (isInstance(actual, cls) !== negated) return;
      fail(
        `Expected ${shown()} ${negation}to be an instance of ${className(cls)}`,
      );
    },
    toMatch: (part) => {
      if (type(actual) !== "string")
        fail(`Expected a string to match, got ${shown()}`);
      if (contains(actual as unknown as string, part) !== negated) return;
      fail(`Expected ${shown()} ${negation}to match ${show(part)}`);
    },
    toThrow: (message) => {
      if (type(actual) !== "function")
        fail(`Expected a function to call, got ${shown()}`);
      const [ok, err] = pcall(actual as unknown as () => void);
      if (message === undefined) {
        if (!ok !== negated) return;
        if (negated)
          fail(
            `Expected the function not to throw, but it threw ${showThrown(err)}`,
          );
        fail("Expected the function to throw, but it returned");
      }
      if (ok) {
        if (negated) return;
        fail("Expected the function to throw, but it returned");
      }
      const text = errorMessage(err);
      if (contains(text, message) !== negated) return;
      fail(
        `Expected the function ${negation}to throw an error containing ${show(message)}, got ${showThrown(err)}`,
      );
    },
    toContainCall: (call) => {
      if (type(actual) !== "table") fail(`Expected a call log, got ${shown()}`);
      const log = actual as unknown as string[];
      if (some(log, (line) => line === call) !== negated) return;
      if (negated) fail(`Expected the call log not to contain ${call}`);
      const lines: string[] = [];
      for (const line of log) {
        table.insert(lines, `  ${line}`);
      }
      const held =
        lines.length === 0
          ? "the log is empty"
          : `it holds:\n${table.concat(lines, "\n")}`;
      fail(`Expected the call log to contain ${call}; ${held}`);
    },
  };
}

/**
 * Starts an expectation on `actual`: each matcher of the result fails the
 * test, with a message naming the values, when it does not hold, and `.not`
 * negates every matcher. Its members are the asymmetric matchers.
 * @param actual - The value under test.
 * @returns The matchers on `actual`.
 */
export function expect<T>(actual: T): Matchers<T> {
  const matchers = matchersOf(actual, false);
  const negated = matchersOf(actual, true);
  matchers.not = negated;
  negated.not = matchers;
  return matchers;
}

// The asymmetric matchers. Each wrapper ends in a tail call, so the error
// level 2 of one that raises names the test's line, not this file's. Each is
// typed `never`, which stands where any value is expected, as Vitest's `any`
// does, without the `no-unsafe-argument` finding of an `any` handed to a
// typed parameter, such as a Native's in `toHaveBeenCalledWith`.

/**
 * Matches any value but nil. A field holding nil is absent in Lua, so it
 * fails there too.
 * @returns The matcher, to stand on the expected side.
 */
expect.anything = (): never => anything() as never;

/**
 * Matches a value of a Lua type (`"number"`, `"string"`, `"boolean"`,
 * `"table"`, `"function"`), or an instance of a class or of one that
 * extends it. `Number`, `String` and the other built-in constructors are
 * nil in Lua, so `expect.any(Number)` raises, naming the type name to write.
 * @param kind - The Lua type name or the class.
 * @returns The matcher, to stand on the expected side.
 * @throws When `kind` is nil or neither a type name nor a class.
 */
expect.any = (kind: LuaTypeName | Class): never => anyOf(kind) as never;

/**
 * Matches a table holding every key of `part` with a deeply equal value.
 * @param part - The keys and values the table holds.
 * @returns The matcher, to stand on the expected side.
 */
expect.objectContaining = (part: object): never =>
  objectContaining(part) as never;

/**
 * Matches a list holding, in any order, an item deeply equal to each of
 * `items`; with no items, any value, as Vitest's.
 * @param items - The items the list holds.
 * @returns The matcher, to stand on the expected side.
 */
expect.arrayContaining = (items: readonly unknown[]): never =>
  arrayContaining(items) as never;

/**
 * Matches a string holding `part` as plain text, not a pattern.
 * @param part - The part of the string.
 * @returns The matcher, to stand on the expected side.
 */
expect.stringContaining = (part: string): never =>
  stringContaining(part) as never;

// ---------------------------------------------------------------------------
// Running and reporting

/** The scopes of a test, from the file's root to its own `describe`. */
function scopesOf(block: Block): Scope[] {
  const chain: Scope[] = [];
  let current: Scope | undefined = block.scope;
  while (current !== undefined) {
    table.insert(chain, 1, current);
    current = current.parent;
  }
  return chain;
}

/** A hook's run: whether it returned without throwing, and what it returned. */
type Attempt = (fn: () => unknown) => LuaMultiReturn<[boolean, unknown]>;

/**
 * Runs the `beforeEach` hooks, outer scope first, each scope's in order,
 * collecting the functions they return; false at the first that throws.
 */
function runBeforeEach(
  chain: Scope[],
  attempt: Attempt,
  cleanups: (() => void)[],
): boolean {
  for (const each of chain) {
    for (const fn of each.beforeEach) {
      const [ok, returned] = attempt(fn);
      if (!ok) return false;
      if (type(returned) === "function") {
        table.insert(cleanups, returned as () => void);
      }
    }
  }
  return true;
}

/**
 * Runs the `afterEach` hooks, inner scope first, each scope's last first,
 * then the cleanups, the last returned first; stops at the first that
 * throws.
 */
function runAfterEach(
  chain: Scope[],
  attempt: Attempt,
  cleanups: (() => void)[],
): void {
  for (let i = chain.length - 1; i >= 0; i--) {
    const hooks = chain[i].afterEach;
    for (let j = hooks.length - 1; j >= 0; j--) {
      const [ok] = attempt(hooks[j]);
      if (!ok) return;
    }
  }
  for (let i = cleanups.length - 1; i >= 0; i--) {
    const [ok] = attempt(cleanups[i]);
    if (!ok) return;
  }
}

/**
 * Runs one test between its hooks, as Vitest does: the `beforeEach` hooks
 * outer to inner, the body unless one of them threw, then the `afterEach`
 * hooks inner to outer and the cleanups whatever happened. The first error
 * is the result.
 */
function runBlock(block: Block): Result {
  // An object, not two locals, so the checker sees the closure's writes.
  const first: { failed: boolean; thrown: unknown } = {
    failed: false,
    thrown: undefined,
  };
  const attempt: Attempt = (fn) => {
    const [ok, value] = pcall(fn);
    if (!ok && !first.failed) {
      first.failed = true;
      first.thrown = value;
    }
    return $multi(ok, ok ? value : undefined);
  };
  const chain = scopesOf(block);
  const cleanups: (() => void)[] = [];
  running = true;
  if (runBeforeEach(chain, attempt, cleanups)) attempt(block.fn);
  runAfterEach(chain, attempt, cleanups);
  running = false;
  if (!first.failed) {
    return { suite: block.suite, name: block.name, status: "pass" };
  }
  const failure = first.thrown as Failure | undefined;
  if (type(failure) === "table" && failure?.reforgedTestFailure === true) {
    return {
      suite: block.suite,
      name: block.name,
      status: "fail",
      message: failure.message,
      actual: failure.actual,
      expected: failure.expected,
    };
  }
  return {
    suite: block.suite,
    name: block.name,
    status: "error",
    message: errorMessage(first.thrown),
  };
}

function escapeChar(char: string): string {
  if (char === '"') return '\\"';
  if (char === "\\") return "\\\\";
  if (char === "\n") return "\\n";
  if (char === "\r") return "\\r";
  if (char === "\t") return "\\t";
  return string.format("\\u%04x", string.byte(char));
}

function jsonString(value: string): string {
  const [escaped] = string.gsub(value, '[%c"\\]', escapeChar);
  return `"${escaped}"`;
}

/**
 * Encodes strings, booleans, numbers and tables. A table whose keys are
 * 1..n, or an empty one, is an array; any other is an object with its keys
 * sorted, because `pairs` order is unspecified.
 */
function toJson(value: unknown): string {
  const kind = type(value);
  if (kind === "string") return jsonString(value as string);
  if (kind === "boolean") return tostring(value);
  if (kind === "number") {
    const n = value as number;
    // NaN and the infinities have no JSON form.
    if (n !== n || n === math.huge || n === -math.huge) return "null";
    return tostring(n);
  }
  if (kind !== "table") return "null";
  const record = value as Record<string | number, unknown>;
  const keys = sortedKeys(record);
  const parts: string[] = [];
  if (isArray(record, keys)) {
    for (const item of record as unknown as unknown[]) {
      table.insert(parts, toJson(item));
    }
    return `[${table.concat(parts, ",")}]`;
  }
  for (const key of keys) {
    table.insert(
      parts,
      `${jsonString(tostring(key))}:${toJson(record[key as string])}`,
    );
  }
  return `{${table.concat(parts, ",")}}`;
}

/**
 * Runs the registered tests and returns the results as JSON: every `it`
 * once, in registration order. In a file that loads `reforged-test/map`, it
 * lists the tests instead and, given a position, runs that one test. The
 * glue calls it through the global `__reforged_test_run`.
 * @param position - The position of the one test to run, counted from 0, as
 * a decimal string; only in a file that loads `reforged-test/map`.
 * @returns The results contract of the package's README, as a JSON string.
 */
export function run(position?: string): string {
  const results: Result[] = [];
  if (position !== undefined) {
    const block = blocks[tonumber(position) ?? -1] as Block | undefined;
    if (block !== undefined) table.insert(results, runBlock(block));
    return toJson({ tests: results });
  }
  if (__reforged_test_isolated === true) {
    const listed: Pick<Result, "suite" | "name">[] = [];
    for (const block of blocks) {
      table.insert(listed, { suite: block.suite, name: block.name });
    }
    return toJson({ isolated: true, tests: listed });
  }
  for (const block of blocks) {
    table.insert(results, runBlock(block));
  }
  return toJson({ tests: results });
}

__reforged_test_run = run;
