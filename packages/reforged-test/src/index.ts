// The Node side of reforged-test: runs compiled Lua test modules on real Lua
// 5.3 and reports every `it` to vitest.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, test } from "vitest";
import {
  LuaError,
  runTestModule,
  type Chunk,
  type LuaModule,
} from "./lua-state.js";
import { shippedStubs } from "./shipped-stubs.js";

export { compileLuaProject } from "./compile.js";

export interface LuaTestOptions {
  /** The folder typescript-to-lua emitted the tests and their modules to. */
  readonly outDir: string;
  /**
   * Extra stub files, executed in this order after the shipped ones.
   * Relative paths resolve against the current working directory.
   */
  readonly stubs?: readonly string[];
}

/** pass: every expectation held; fail: one did not; error: anything else threw. */
export type LuaTestStatus = "pass" | "fail" | "error";

/** One `it`, as the runner reported it. */
export interface LuaTestResult {
  /** The enclosing `describe` names, outermost first. */
  readonly suite: readonly string[];
  readonly name: string;
  readonly status: LuaTestStatus;
  /** The Lua message, on "fail" and "error". */
  readonly message?: string;
  /**
   * On a "fail" whose matcher compared two values, the value under test,
   * rendered as text: what Vitest's diff shows as received.
   */
  readonly actual?: string;
  /** On a "fail" that carries `actual`, the value it was compared with. */
  readonly expected?: string;
}

/**
 * One compiled test module, run in its own Lua state, or in one Lua state
 * per test when it loads `reforged-test/map`.
 */
export interface LuaTestFile {
  /** The Lua module name (`handles.unit_test`). */
  readonly moduleName: string;
  /** The TypeScript file it was compiled from (`handles/unit.test.ts`). */
  readonly testFile: string;
  readonly tests: readonly LuaTestResult[];
  /** Set when the module failed before its tests ran (load error). */
  readonly error?: string;
}

/**
 * The marker a test that needs 32-bit integer semantics carries in its name
 * (or in an enclosing `describe`). The VM has 64-bit integers, so the glue
 * skips such tests until a 32-bit run exists.
 */
export const MARKER_32_BIT = "[32-bit]";

/** The test that stands for a module that failed before its tests ran. */
export const LOAD_TEST_NAME = "loads the test module";

const TEST_SUFFIX = "_test.lua";

/**
 * Run after the last stub file: every global function the stub files
 * defined becomes the Stub of its Native, which a matcher handed the Native
 * reads the Recorded calls of.
 */
const SEAL: Chunk = { name: "reforged-test/seal", source: "__stub_seal()" };
const DEPENDENCIES_DIR = "lua_modules";

/**
 * Runs every compiled test module under `outDir` (a `*_test.lua` file, as
 * typescript-to-lua emits `*.test.ts`), each in a fresh Lua state, and
 * returns their results. A module that loads `reforged-test/map` runs each
 * test in a fresh Lua state of its own, after one load that lists them.
 * Nothing is registered with vitest.
 */
export function runLuaTestFiles(options: LuaTestOptions): LuaTestFile[] {
  const harness = new Harness(options);
  return harness.testModules().map((module): LuaTestFile => {
    const loaded = harness.load(module);
    const { moduleName, testFile } = module;
    if ("error" in loaded) {
      return { moduleName, testFile, tests: [], error: loaded.error };
    }
    return {
      moduleName,
      testFile,
      tests: loaded.tests.map((planned) => planned.result()),
    };
  });
}

/**
 * Registers the compiled test modules under `outDir` with vitest: one
 * `describe` per module, named after its TypeScript file, one `test` per
 * `it`, nested `describe`s kept. Call it at the top level of a vitest test
 * file. A module runs when vitest collects its `describe`; a module that
 * loads `reforged-test/map` is only listed then, and each of its tests runs
 * in a fresh Lua state inside its vitest `test`. A module that fails to load
 * gets one failing test, named by LOAD_TEST_NAME, carrying the Lua message;
 * the other modules still run.
 */
export function runLuaTests(options: LuaTestOptions): void {
  const harness = new Harness(options);
  for (const module of harness.testModules()) {
    describe(module.testFile, () => {
      const loaded = harness.load(module);
      if ("error" in loaded) {
        const message = loaded.error;
        test(LOAD_TEST_NAME, () => {
          throw luaError("LuaError", message);
        });
      } else {
        register(suiteTree(loaded.tests));
      }
    });
  }
}

interface TestModule {
  readonly moduleName: string;
  readonly testFile: string;
}

/** A test's place in its file: its `describe` names and its name. */
interface TestName {
  readonly suite: readonly string[];
  readonly name: string;
}

/** A test of a loaded module, with what gives its result. */
interface PlannedTest extends TestName {
  /** Runs the test, when its file runs each test in a state of its own. */
  readonly result: () => LuaTestResult;
}

/** A loaded module: its tests, or the message of its failed load. */
type LoadedModule =
  { readonly tests: readonly PlannedTest[] } | { readonly error: string };

class Harness {
  readonly #stubs: Chunk[];
  readonly #modules: LuaModule[];

  constructor(options: LuaTestOptions) {
    const outDir = resolve(options.outDir);
    this.#stubs = [
      ...shippedStubs(),
      ...(options.stubs ?? []).map((path) => readChunk(resolve(path), path)),
      SEAL,
    ];
    this.#modules = luaFiles(outDir).map((path) => {
      const name = relative(outDir, path).split(sep).join("/");
      return { moduleName: moduleNameOf(name), chunk: readChunk(path, name) };
    });
  }

  /** The test modules, sorted by path; their module names are the preloaded ones. */
  testModules(): TestModule[] {
    return this.#modules
      .filter(
        ({ chunk }) =>
          chunk.name.endsWith(TEST_SUFFIX) &&
          !chunk.name.startsWith(`${DEPENDENCIES_DIR}/`),
      )
      .sort((a, b) => compare(a.chunk.name, b.chunk.name))
      .map(({ moduleName, chunk }) => ({
        moduleName,
        testFile: `${chunk.name.slice(0, -TEST_SUFFIX.length)}.test.ts`,
      }));
  }

  /**
   * Loads the module in a fresh state: a module on `reforged-test/lua` runs
   * its tests there, one on `reforged-test/map` lists them, each to run in a
   * state of its own when its result is asked for.
   */
  load(module: TestModule): LoadedModule {
    const parsed = this.#runInFreshState(module.moduleName);
    if ("error" in parsed) return parsed;
    if (parsed.isolated) {
      return {
        tests: parsed.tests.map((listed, position) => ({
          ...listed,
          result: () => this.#runAt(module, position, listed),
        })),
      };
    }
    return {
      tests: parsed.tests.map((result) => ({
        suite: result.suite,
        name: result.name,
        result: () => result,
      })),
    };
  }

  /** Runs the test listed at `position` in a fresh state of its own. */
  #runAt(
    { moduleName, testFile }: TestModule,
    position: number,
    listed: TestName,
  ): LuaTestResult {
    const failed = (message: string): LuaTestResult => ({
      suite: listed.suite,
      name: listed.name,
      status: "error",
      message,
    });
    const parsed = this.#runInFreshState(moduleName, position);
    if ("error" in parsed) return failed(parsed.error);
    const found = parsed.isolated ? undefined : parsed.tests[0];
    if (found === undefined || fullName(found) !== fullName(listed)) {
      return failed(
        `${testFile} registers different tests on each load: test ${String(position + 1)} was "${fullName(listed)}" when the file was listed, ${found === undefined ? "and is missing now" : `and is "${fullName(found)}" now`}`,
      );
    }
    return found;
  }

  /**
   * Runs the module in a fresh state, the test at `position` alone when it
   * is set: what the runner answered, or the Lua message of what raised.
   */
  #runInFreshState(
    moduleName: string,
    position?: number,
  ): RunnerAnswer | { readonly error: string } {
    let json: string;
    try {
      json = runTestModule(this.#stubs, this.#modules, moduleName, position);
    } catch (error) {
      if (!(error instanceof LuaError)) throw error;
      return { error: rewrite(error.message) };
    }
    return parseRun(json, moduleName);
  }
}

/** A test's full name, as vitest shows it: `describe > it`. */
function fullName({ suite, name }: TestName): string {
  return [...suite, name].join(" > ");
}

/** A path relative to outDir, `/`-separated, as `require` names it: `handles/unit.lua` is `handles.unit`. */
function moduleNameOf(path: string): string {
  return path.slice(0, -".lua".length).split("/").join(".");
}

/** The order of Array.prototype.sort without a comparator (UTF-16 code units). */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function readChunk(path: string, name: string): Chunk {
  return { name, source: readFileSync(path, "utf8") };
}

function luaFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".lua"))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
}

const UNSTUBBED = /attempt to call a nil value \(global '([^']+)'\)/g;

/** Turns the VM's message for a missing global function into the fix. */
function rewrite(message: string): string {
  return message.replace(UNSTUBBED, "Native $1 is not stubbed");
}

const STATUSES: readonly string[] = ["pass", "fail", "error"];

/** What one run of the runner answered: the results, or the tests listed. */
type RunnerAnswer =
  | { readonly isolated: false; readonly tests: LuaTestResult[] }
  | { readonly isolated: true; readonly tests: TestName[] };

function parseRun(json: string, moduleName: string): RunnerAnswer {
  const malformed = (why: string) =>
    new Error(`${moduleName}: malformed runner results (${why}): ${json}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw malformed("not JSON");
  }
  const { tests, isolated } = (parsed ?? {}) as Record<string, unknown>;
  if (!Array.isArray(tests)) throw malformed("no tests array");
  if (isolated === true) {
    return {
      isolated: true,
      tests: tests.map((entry: unknown): TestName => {
        const { suite, name } = (entry ?? {}) as Record<string, unknown>;
        if (!isSuite(suite) || typeof name !== "string") {
          throw malformed(`bad test entry ${JSON.stringify(entry)}`);
        }
        return { suite, name };
      }),
    };
  }
  if (isolated !== undefined) throw malformed("isolated is not true");
  return { isolated: false, tests: parseResults(tests, malformed) };
}

function optionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isSuite(suite: unknown): suite is string[] {
  return (
    Array.isArray(suite) && suite.every((part) => typeof part === "string")
  );
}

function parseResults(
  tests: unknown[],
  malformed: (why: string) => Error,
): LuaTestResult[] {
  return tests.map((entry: unknown): LuaTestResult => {
    const { suite, name, status, message, actual, expected } = (entry ??
      {}) as Record<string, unknown>;
    if (
      !isSuite(suite) ||
      typeof name !== "string" ||
      typeof status !== "string" ||
      !STATUSES.includes(status) ||
      !optionalString(message) ||
      !optionalString(actual) ||
      !optionalString(expected)
    ) {
      throw malformed(`bad test entry ${JSON.stringify(entry)}`);
    }
    return {
      suite,
      name,
      status: status as LuaTestStatus,
      ...(message === undefined ? {} : { message: rewrite(message) }),
      ...(actual === undefined || expected === undefined
        ? {}
        : { actual, expected }),
    };
  });
}

// ---------------------------------------------------------------------------
// Mapping onto vitest

interface SuiteNode {
  readonly name: string;
  readonly children: (SuiteNode | PlannedTest)[];
}

/** Nests the flat tests under their `describe` names, in first-seen order. */
function suiteTree(tests: readonly PlannedTest[]): SuiteNode["children"] {
  const root: SuiteNode = { name: "", children: [] };
  for (const result of tests) {
    let node = root;
    for (const name of result.suite) {
      let child = node.children.find(
        (candidate): candidate is SuiteNode =>
          "children" in candidate && candidate.name === name,
      );
      if (child === undefined) {
        child = { name, children: [] };
        node.children.push(child);
      }
      node = child;
    }
    node.children.push(result);
  }
  return root.children;
}

function register(children: SuiteNode["children"], inSuite32 = false): void {
  for (const child of children) {
    const marked = inSuite32 || child.name.includes(MARKER_32_BIT);
    if ("children" in child) {
      describe(child.name, () => {
        register(child.children, marked);
      });
    } else if (marked) {
      test.skip(child.name, () => undefined);
    } else {
      test(child.name, () => {
        const result = child.result();
        if (result.status === "pass") return;
        throw luaError(
          result.status === "fail" ? "AssertionError" : "LuaError",
          result.message ?? "(no message)",
          result,
        );
      });
    }
  }
}

/**
 * An Error whose report is the Lua message alone, without a JS stack, and,
 * when the result carries the two values a matcher compared, the `actual`
 * and `expected` Vitest draws its diff of.
 */
function luaError(
  name: string,
  message: string,
  compared?: Pick<LuaTestResult, "actual" | "expected">,
): Error {
  const error: Error & { actual?: string; expected?: string } = new Error(
    message,
  );
  error.name = name;
  error.stack = `${name}: ${message}`;
  if (compared?.actual !== undefined && compared.expected !== undefined) {
    error.actual = compared.actual;
    error.expected = compared.expected;
  }
  return error;
}
