// The Node side of reforged-test: runs compiled Lua test modules on real Lua
// 5.3 and reports every `it` to vitest.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "vitest";
import {
  LuaError,
  runTestModule,
  type Chunk,
  type LuaModule,
} from "./lua-state.js";

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
}

/** One compiled test module, run in its own Lua state. */
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

const STUBS_DIR = fileURLToPath(new URL("../stubs/", import.meta.url));
const BASE_STUB = "base.lua";
const TEST_SUFFIX = "_test.lua";
const DEPENDENCIES_DIR = "lua_modules";

/**
 * Runs every compiled test module under `outDir` (a `*_test.lua` file, as
 * typescript-to-lua emits `*.test.ts`), each in a fresh Lua state, and
 * returns their results. Nothing is registered with vitest.
 */
export function runLuaTestFiles(options: LuaTestOptions): LuaTestFile[] {
  const harness = new Harness(options);
  return harness.testModules().map((module) => harness.run(module));
}

/**
 * Registers the compiled test modules under `outDir` with vitest: one
 * `describe` per module, named after its TypeScript file, one `test` per
 * `it`, nested `describe`s kept. Call it at the top level of a vitest test
 * file. A module runs when vitest collects its `describe`. A module that
 * fails to load gets one failing test, named by LOAD_TEST_NAME, carrying the
 * Lua message; the other modules still run.
 */
export function runLuaTests(options: LuaTestOptions): void {
  const harness = new Harness(options);
  for (const module of harness.testModules()) {
    describe(module.testFile, () => {
      const file = harness.run(module);
      if (file.error === undefined) {
        register(suiteTree(file.tests));
      } else {
        const message = file.error;
        test(LOAD_TEST_NAME, () => {
          throw luaError("LuaError", message);
        });
      }
    });
  }
}

interface TestModule {
  readonly moduleName: string;
  readonly testFile: string;
}

class Harness {
  readonly #stubs: Chunk[];
  readonly #modules: LuaModule[];

  constructor(options: LuaTestOptions) {
    const outDir = resolve(options.outDir);
    this.#stubs = [
      ...shippedStubs(),
      ...(options.stubs ?? []).map((path) => readChunk(resolve(path), path)),
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

  run({ moduleName, testFile }: TestModule): LuaTestFile {
    let json: string;
    try {
      json = runTestModule(this.#stubs, this.#modules, moduleName);
    } catch (error) {
      if (!(error instanceof LuaError)) throw error;
      return { moduleName, testFile, tests: [], error: rewrite(error.message) };
    }
    return { moduleName, testFile, tests: parseResults(json, moduleName) };
  }
}

function shippedStubs(): Chunk[] {
  const others = readdirSync(STUBS_DIR)
    .filter((file) => file.endsWith(".lua") && file !== BASE_STUB)
    .sort();
  return [BASE_STUB, ...others].map((file) =>
    readChunk(join(STUBS_DIR, file), `reforged-test/stubs/${file}`),
  );
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

function parseResults(json: string, moduleName: string): LuaTestResult[] {
  const malformed = (why: string) =>
    new Error(`${moduleName}: malformed runner results (${why}): ${json}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw malformed("not JSON");
  }
  const tests = (parsed as { tests?: unknown } | null)?.tests;
  if (!Array.isArray(tests)) throw malformed("no tests array");
  return tests.map((entry: unknown): LuaTestResult => {
    const { suite, name, status, message } = (entry ?? {}) as Record<
      string,
      unknown
    >;
    if (
      !Array.isArray(suite) ||
      !suite.every((part) => typeof part === "string") ||
      typeof name !== "string" ||
      typeof status !== "string" ||
      !STATUSES.includes(status) ||
      (message !== undefined && typeof message !== "string")
    ) {
      throw malformed(`bad test entry ${JSON.stringify(entry)}`);
    }
    return {
      suite,
      name,
      status: status as LuaTestStatus,
      ...(message === undefined ? {} : { message: rewrite(message) }),
    };
  });
}

// ---------------------------------------------------------------------------
// Mapping onto vitest

interface SuiteNode {
  readonly name: string;
  readonly children: (SuiteNode | LuaTestResult)[];
}

/** Nests the flat results under their `describe` names, in first-seen order. */
function suiteTree(tests: readonly LuaTestResult[]): SuiteNode["children"] {
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
        if (child.status === "pass") return;
        throw luaError(
          child.status === "fail" ? "AssertionError" : "LuaError",
          child.message ?? "(no message)",
        );
      });
    }
  }
}

/** An Error whose report is the Lua message alone, without a JS stack. */
function luaError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  error.stack = `${name}: ${message}`;
  return error;
}
