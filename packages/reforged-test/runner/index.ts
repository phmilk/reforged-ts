/** @noSelfInFile */

// The Lua-side runner of reforged-test. A test module calls `describe` and
// `it` at load time to register its blocks; the glue then calls the global
// `__reforged_test_run`, which runs every `it` under `pcall` and returns the
// results as a JSON string. That JSON is the only contract with the glue:
//
//   {"tests":[{"message":"...","name":"...","status":"pass"|"fail"|"error","suite":["..."]}]}
//
// `message` is present on "fail" (an expectation did not hold) and "error"
// (anything else was thrown). Keys are sorted; `suite` lists the enclosing
// `describe` names, outermost first.

type Status = "pass" | "fail" | "error";

/** @noSelf */
interface Block {
  suite: string[];
  name: string;
  fn: () => void;
}

interface Result {
  suite: string[];
  name: string;
  status: Status;
  message?: string;
}

/** The value an unmet expectation throws, told apart from any other error. */
interface Failure {
  reforgedTestFailure: true;
  message: string;
}

const blocks: Block[] = [];
const suites: string[] = [];

function copy<T>(list: T[]): T[] {
  const out: T[] = [];
  for (const value of list) {
    table.insert(out, value);
  }
  return out;
}

/** Groups the `it` blocks registered by `body` under `name`. */
export function describe(name: string, body: () => void): void {
  table.insert(suites, name);
  body();
  table.remove(suites);
}

/**
 * Registers one test. It runs after the test module has loaded, in
 * registration order, sharing the Lua state (and the stub call log) with the
 * other tests of the same file.
 */
export function it(name: string, fn: () => void): void {
  table.insert(blocks, { suite: copy(suites), name, fn });
}

/** The global call log of the stubs, one `Name(arg, arg)` line per call. */
export function stubCalls(): string[] {
  if (__stub_calls === undefined) {
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

function fail(message: string): never {
  const failure: Failure = { reforgedTestFailure: true, message };
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
  if (type(actual) !== "table" || type(expected) !== "table") {
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
  if (type(actual) !== "table" || type(expected) !== "table") {
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

/** A Lua type name, as `type` returns it. */
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
// Matchers

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
   * The value is a call log (see `stubCalls`) holding exactly this line.
   * @param call - The line, as the call log renders it.
   */
  toContainCall(call: string): void;
}

function matchersOf<T>(actual: T, negated: boolean): Matchers<T> {
  const negation = negated ? "not " : "";
  const shown = (): string => show(actual);
  const number = (expected: number): number => {
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
  return {
    not: undefined as unknown as Matchers<T>,
    toEqual: (expected) => {
      if (type(actual) === "table" || isAsymmetric(expected)) {
        const found = difference(actual, expected, "", new LuaMap());
        if ((found === undefined) !== negated) return;
        if (type(actual) !== "table") {
          fail(`Expected ${shown()} ${negation}to equal ${show(expected)}`);
        }
        if (found === undefined) {
          fail(`Expected ${shown()} not to deeply equal ${show(expected)}`);
        }
        fail(
          `Expected ${shown()} to deeply equal ${show(expected)}${where(found)}`,
        );
      }
      if ((actual === expected) !== negated) return;
      fail(`Expected ${shown()} ${negation}to equal ${show(expected)}`);
    },
    toBe: (expected) => {
      if (rawequal(actual, expected) !== negated) return;
      const hint =
        !negated && type(actual) === "table" && type(expected) === "table"
          ? " (not the same table; use toEqual for deep equality)"
          : "";
      fail(`Expected ${shown()} ${negation}to be ${show(expected)}${hint}`);
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
      );
    },
    toBeGreaterThan: (expected) => {
      compare(number(expected) > expected, "greater than", expected);
    },
    toBeGreaterThanOrEqual: (expected) => {
      compare(
        number(expected) >= expected,
        "greater than or equal to",
        expected,
      );
    },
    toBeLessThan: (expected) => {
      compare(number(expected) < expected, "less than", expected);
    },
    toBeLessThanOrEqual: (expected) => {
      compare(number(expected) <= expected, "less than or equal to", expected);
    },
    toBeCloseTo: (expected, digits = 2) => {
      const value = number(expected);
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
            `Expected the function not to throw, but it threw ${show(errorMessage(err))}`,
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
        `Expected the function ${negation}to throw an error containing ${show(message)}, got ${show(text)}`,
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

/**
 * Matches any value but nil. A field holding nil is absent in Lua, so it
 * fails there too.
 * @returns The matcher, to stand on the expected side.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- stands where any value is expected, as Vitest's
expect.anything = (): any => anything();

/**
 * Matches a value of a Lua type (`"number"`, `"string"`, `"boolean"`,
 * `"table"`, `"function"`), or an instance of a class or of one that
 * extends it. `Number`, `String` and the other built-in constructors are
 * nil in Lua, so `expect.any(Number)` raises, naming the type name to write.
 * @param kind - The Lua type name or the class.
 * @returns The matcher, to stand on the expected side.
 * @throws When `kind` is nil or neither a type name nor a class.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- stands where any value is expected, as Vitest's
expect.any = (kind: LuaTypeName | Class): any => anyOf(kind);

/**
 * Matches a table holding every key of `part` with a deeply equal value.
 * @param part - The keys and values the table holds.
 * @returns The matcher, to stand on the expected side.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- stands where any value is expected, as Vitest's
expect.objectContaining = (part: object): any => objectContaining(part);

/**
 * Matches a list holding, in any order, an item deeply equal to each of
 * `items`.
 * @param items - The items the list holds.
 * @returns The matcher, to stand on the expected side.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- stands where any value is expected, as Vitest's
expect.arrayContaining = (items: readonly unknown[]): any =>
  arrayContaining(items);

/**
 * Matches a string holding `part` as plain text, not a pattern.
 * @param part - The part of the string.
 * @returns The matcher, to stand on the expected side.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- stands where any value is expected, as Vitest's
expect.stringContaining = (part: string): any => stringContaining(part);

// ---------------------------------------------------------------------------
// Running and reporting

function runBlock(block: Block): Result {
  const [ok, err] = pcall(block.fn);
  if (ok) return { suite: block.suite, name: block.name, status: "pass" };
  const failure = err as unknown as Failure | undefined;
  if (type(failure) === "table" && failure?.reforgedTestFailure === true) {
    return {
      suite: block.suite,
      name: block.name,
      status: "fail",
      message: failure.message,
    };
  }
  return {
    suite: block.suite,
    name: block.name,
    status: "error",
    message: errorMessage(err),
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

/** Runs every registered `it` once and returns the results as JSON. */
export function run(): string {
  const results: Result[] = [];
  for (const block of blocks) {
    table.insert(results, runBlock(block));
  }
  return toJson({ tests: results });
}

__reforged_test_run = run;
