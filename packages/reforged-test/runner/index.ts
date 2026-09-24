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

function show(value: unknown, depth = 0): string {
  const kind = type(value);
  if (kind === "nil") return "nil";
  if (kind === "string") return string.format("%q", value);
  if (kind === "function") return "<function>";
  if (kind !== "table") return tostring(value);
  const record = value as Record<string | number, unknown>;
  if (isHandle(record))
    return `${tostring(record.__kind)}#${tostring(record.__handleId)}`;
  if (depth >= 2) return "{...}";
  const parts: string[] = [];
  const keys = sortedKeys(record);
  if (
    keys.length > 0 &&
    keys.length === (record as unknown as unknown[]).length
  ) {
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
  }
  return tostring(err);
}

// ---------------------------------------------------------------------------
// Matchers

function fail(message: string): never {
  const failure: Failure = { reforgedTestFailure: true, message };
  // What `throw failure` compiles to; the table reaches pcall unchanged.
  error(failure, 0);
}

function keyPath(path: string, key: unknown): string {
  if (type(key) === "string") return `${path}.${key as string}`;
  return `${path}[${tostring(key)}]`;
}

/**
 * The path of the first difference between two values, or undefined when
 * they are deeply equal. Tables compare key by key, metatables are ignored,
 * and a pair already under comparison is taken as equal so cycles end.
 */
function difference(
  actual: unknown,
  expected: unknown,
  path: string,
  seen: LuaMap<object, LuaMap<object, boolean>>,
): string | undefined {
  if (actual === expected) return undefined;
  if (type(actual) !== "table" || type(expected) !== "table") {
    return `${path === "" ? "value" : path}: ${show(actual)} vs ${show(expected)}`;
  }
  const a = actual as Record<string, unknown>;
  const b = expected as Record<string, unknown>;
  let pairsOfA = seen.get(a);
  if (pairsOfA === undefined) {
    pairsOfA = new LuaMap();
    seen.set(a, pairsOfA);
  }
  if (pairsOfA.get(b) === true) return undefined;
  pairsOfA.set(b, true);
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
      return `${keyPath(path, key)}: nil vs ${show(b[key as string])}`;
    }
  }
  return undefined;
}

/**
 * The matchers `expect` returns. Interface methods take a `self` in
 * typescript-to-lua unless the interface itself is `@noSelf`, whatever the
 * file directive says.
 * @noSelf
 */
export interface Matchers<T> {
  /** Strict equality on primitives (`==`), deep equality on tables. */
  toEqual(expected: T): void;
  /** Identity: the very same value (`rawequal`), so two equal tables differ. */
  toBe(expected: T): void;
  /** Lua truthiness: anything but nil and false (0 and "" are truthy). */
  toBeTruthy(): void;
  /** Lua falsiness: nil or false. */
  toBeFalsy(): void;
  toBeUndefined(): void;
  /**
   * The value is a function that throws when called; with `message`, the
   * error's message contains it (plain text, not a pattern).
   */
  toThrow(message?: string): void;
  /** The value is a call log (see `stubCalls`) holding exactly this line. */
  toContainCall(call: string): void;
}

export function expect<T>(actual: T): Matchers<T> {
  return {
    toEqual: (expected) => {
      if (type(actual) === "table" && type(expected) === "table") {
        const found = difference(actual, expected, "", new LuaMap());
        if (found !== undefined) {
          fail(
            `Expected ${show(actual)} to deeply equal ${show(expected)} (first difference at ${found})`,
          );
        }
      } else if (actual !== expected) {
        fail(`Expected ${show(actual)} to equal ${show(expected)}`);
      }
    },
    toBe: (expected) => {
      if (!rawequal(actual, expected)) {
        const hint =
          type(actual) === "table" && type(expected) === "table"
            ? " (not the same table; use toEqual for deep equality)"
            : "";
        fail(`Expected ${show(actual)} to be ${show(expected)}${hint}`);
      }
    },
    toBeTruthy: () => {
      if (!actual) fail(`Expected ${show(actual)} to be truthy`);
    },
    toBeFalsy: () => {
      if (actual) fail(`Expected ${show(actual)} to be falsy`);
    },
    toBeUndefined: () => {
      if (actual !== undefined)
        fail(`Expected ${show(actual)} to be undefined (nil)`);
    },
    toThrow: (message) => {
      if (type(actual) !== "function")
        fail(`Expected a function to call, got ${show(actual)}`);
      const [ok, err] = pcall(actual as unknown as () => void);
      if (ok) fail("Expected the function to throw, but it returned");
      if (message !== undefined) {
        const text = errorMessage(err);
        const [start] = string.find(text, message, 1, true);
        if (start === undefined) {
          fail(
            `Expected the function to throw an error containing ${show(message)}, got ${show(text)}`,
          );
        }
      }
    },
    toContainCall: (call) => {
      if (type(actual) !== "table")
        fail(`Expected a call log, got ${show(actual)}`);
      const log = actual as unknown as string[];
      for (const line of log) {
        if (line === call) return;
      }
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
  if (
    keys.length === 0 ||
    (keys.length === (record as unknown as unknown[]).length &&
      type(keys[0]) === "number")
  ) {
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
