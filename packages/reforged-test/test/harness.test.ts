import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { runLuaTestFiles, type LuaTestFile } from "../src/index.js";
import { fixturePath, outDir, removeOutDirs } from "./support/fixture.js";

afterAll(removeOutDirs);

function file(files: LuaTestFile[], testFile: string): LuaTestFile {
  const found = files.find((candidate) => candidate.testFile === testFile);
  if (found === undefined) {
    throw new Error(
      `no ${testFile} in ${files.map((f) => f.testFile).join(", ")}`,
    );
  }
  return found;
}

describe("results", () => {
  const files = runLuaTestFiles({ outDir: outDir("results") });
  const results = file(files, "results.test.ts");

  it("discovers *_test.lua modules only, outside lua_modules, sorted", () => {
    expect(
      files.map(({ moduleName, testFile }) => ({ moduleName, testFile })),
    ).toEqual([
      { moduleName: "handles.unit_test", testFile: "handles/unit.test.ts" },
      { moduleName: "results_test", testFile: "results.test.ts" },
    ]);
  });

  it("reports a passing test", () => {
    expect(results.tests).toContainEqual({
      suite: ["arithmetic"],
      name: "adds",
      status: "pass",
    });
    expect(results.tests[0]).toEqual({
      suite: [],
      name: "runs at the top level",
      status: "pass",
    });
  });

  it("reports a failing expectation with its message", () => {
    expect(results.tests).toContainEqual({
      suite: ["arithmetic"],
      name: "fails an expectation",
      status: "fail",
      message: "Expected 2 to equal 3",
    });
  });

  it("reports an erroring test with its message", () => {
    expect(results.tests).toContainEqual({
      suite: ["arithmetic"],
      name: "errors",
      status: "error",
      message: "results_test.lua:19: boom",
    });
  });

  it("keeps nested describe names, outermost first", () => {
    expect(results.tests).toContainEqual({
      suite: ["arithmetic", "nested"],
      name: "passes inside a nested describe",
      status: "pass",
    });
  });

  it("reports a module under its TypeScript file name and preloads its imports", () => {
    expect(file(files, "handles/unit.test.ts")).toEqual({
      moduleName: "handles.unit_test",
      testFile: "handles/unit.test.ts",
      tests: [
        {
          suite: ["unit"],
          name: "requires a sibling module by its dotted name",
          status: "pass",
        },
      ],
    });
  });
});

describe("unstubbed Natives", () => {
  const files = runLuaTestFiles({ outDir: outDir("unstubbed") });

  it("reports a call inside a test as not stubbed", () => {
    expect(file(files, "natives.test.ts").tests).toEqual([
      {
        suite: [],
        name: "calls a Native no stub defines",
        status: "error",
        message: "natives_test.lua:5: Native PauseGame is not stubbed",
      },
    ]);
  });

  it("reports a call at module load as the file's error", () => {
    expect(file(files, "load.test.ts")).toEqual({
      moduleName: "load_test",
      testFile: "load.test.ts",
      tests: [],
      error: "load_test.lua:3: Native BlzGetLocale is not stubbed",
    });
  });
});

describe("state isolation", () => {
  it("runs every file in a fresh state", () => {
    const files = runLuaTestFiles({ outDir: outDir("isolation") });
    expect(files.map((f) => f.testFile)).toEqual(["a.test.ts", "b.test.ts"]);
    for (const { tests } of files) {
      for (const test of tests) expect(test).toMatchObject({ status: "pass" });
    }
    expect(file(files, "b.test.ts").tests).toHaveLength(2);
  });
});

describe("a Test game per test, on reforged-test/map", () => {
  const files = runLuaTestFiles({ outDir: outDir("game") });

  it("runs each test in a fresh Lua state, also when the file imports reforged-test/lua", () => {
    expect(file(files, "isolation.test.ts").tests).toEqual([
      {
        suite: ["a Test game per test"],
        name: "makes a unit, a call, a global and a line",
        status: "pass",
      },
      {
        suite: ["a Test game per test"],
        name: "sees none of them, and loaded the file once",
        status: "pass",
      },
      {
        suite: ["a Test game per test"],
        name: "runs a test of a repeated name",
        status: "pass",
      },
      {
        suite: ["a Test game per test"],
        name: "runs a test of a repeated name",
        status: "pass",
      },
    ]);
  });

  it("opens one state to list the tests, then one per test", () => {
    const counter = join(
      mkdtempSync(join(tmpdir(), "reforged-test-count-")),
      "counter.lua",
    );
    writeFileSync(
      counter,
      `__fixture_loads_path = "/reforged-test-loads-${String(Date.now())}-${String(Math.random())}"\n`,
    );
    const [count] = runLuaTestFiles({
      outDir: outDir("map-count"),
      stubs: [counter],
    });
    expect(count.tests.map(({ name, status }) => ({ name, status }))).toEqual([
      { name: "runs in the second load", status: "pass" },
      { name: "runs in the third load", status: "pass" },
      { name: "runs in the fourth load", status: "pass" },
    ]);
    rmSync(dirname(counter), { recursive: true, force: true });
  });

  it("starts the game through the Init stages, once per test", () => {
    expect(file(files, "start.test.ts").tests).toEqual([
      {
        suite: [],
        name: "runs the map's initialization through the Init stages",
        status: "pass",
      },
      {
        suite: [],
        name: "throws on a second call in the same test",
        status: "pass",
      },
      {
        suite: [],
        name: "fails a test that starts the game twice",
        status: "error",
        message:
          "start_test.lua:31: startGame: the game already started; a test is one game, so call startGame once per test",
      },
    ]);
  });

  it("starts the game at the top of the file, for each test", () => {
    for (const test of file(files, "top.test.ts").tests) {
      expect(test).toMatchObject({ status: "pass" });
    }
    expect(file(files, "top.test.ts").tests).toHaveLength(2);
  });

  it("holds what the map printed and displayed, a copy at each read", () => {
    const { tests } = file(files, "observed.test.ts");
    expect(tests).toHaveLength(4);
    for (const test of tests) expect(test).toMatchObject({ status: "pass" });
  });

  it("fails a test whose name changed between two loads of its file", () => {
    const [different] = runLuaTestFiles({ outDir: outDir("different") });
    expect(different.tests).toHaveLength(1);
    const [test] = different.tests;
    expect(test.status).toBe("error");
    expect(test.message).toMatch(
      /^different\.test\.ts registers different tests on each load: test 1 was "registered on load \d+" when the file was listed, and is "registered on load \d+" now$/,
    );
  });

  it("reports a file that fails to load as the file's error", () => {
    expect(runLuaTestFiles({ outDir: outDir("map-load") })).toEqual([
      {
        moduleName: "load_test",
        testFile: "load.test.ts",
        tests: [],
        error: "load_test.lua:6: Native BlzGetLocale is not stubbed",
      },
    ]);
  });
});

describe("beforeEach and afterEach, scoped by describe", () => {
  const log = join(
    mkdtempSync(join(tmpdir(), "reforged-test-hooks-")),
    "log.lua",
  );
  writeFileSync(
    log,
    `__fixture_log_path = "/reforged-test-hooks-${String(Date.now())}-${String(Math.random())}"\n`,
  );
  const files = runLuaTestFiles({ outDir: outDir("hooks"), stubs: [log] });
  rmSync(dirname(log), { recursive: true, force: true });

  it("runs beforeEach outer to inner and afterEach inner to outer, a describe's own only", () => {
    expect(file(files, "order.test.ts").tests).toEqual([
      {
        suite: [],
        name: "runs the file's hooks around a test at the top",
        status: "pass",
      },
      {
        suite: ["outer", "inner"],
        name: "runs beforeEach outer to inner and afterEach inner to outer",
        status: "pass",
      },
      {
        suite: ["sibling"],
        name: "runs no hook of another describe",
        status: "pass",
      },
    ]);
  });

  it("fails as in Vitest", () => {
    expect(file(files, "failures.test.ts").tests).toEqual([
      {
        suite: ["a beforeEach that throws"],
        name: "fails the test and skips its body",
        status: "error",
        message: "before broke",
      },
      {
        suite: [],
        name: "notes the afterEach hooks, run after a failing beforeEach",
        status: "pass",
      },
      {
        suite: ["a body that throws", "inner"],
        name: "fails the test",
        status: "error",
        message: "body broke",
      },
      {
        suite: [],
        name: "notes the afterEach hooks, run after a failing body",
        status: "pass",
      },
      {
        suite: ["an afterEach that throws"],
        name: "fails a test that had passed",
        status: "error",
        message: "after broke",
      },
      {
        suite: [],
        name: "notes the afterEach hooks, the ones after the failing one and the cleanup skipped",
        status: "pass",
      },
      {
        suite: ["a beforeEach that returns a function"],
        name: "runs it after the afterEach hooks",
        status: "pass",
      },
      {
        suite: [],
        name: "notes the cleanups after the afterEach hooks, the last returned first",
        status: "pass",
      },
      {
        suite: ["a beforeEach that returns a function, then one that throws"],
        name: "runs the cleanup all the same",
        status: "error",
        message: "before broke",
      },
      {
        suite: [],
        name: "notes the cleanup of the beforeEach that ran",
        status: "pass",
      },
      {
        suite: ["a cleanup that throws"],
        name: "fails a test that had passed",
        status: "error",
        message: "cleanup broke",
      },
      {
        suite: ["an afterEach whose expectation fails"],
        name: "fails the test with the expectation's message",
        status: "fail",
        message: "Expected 1 to equal 2",
      },
      {
        suite: ["two failures", "in a beforeEach and an afterEach"],
        name: "reports the beforeEach's",
        status: "error",
        message: "before broke",
      },
      {
        suite: ["two failures", "in the body and an afterEach"],
        name: "reports the body's",
        status: "fail",
        message: "Expected 1 to equal 3",
      },
      {
        suite: ["a hook registered inside a test"],
        name: "throws",
        status: "pass",
      },
    ]);
  });

  it("starts the game in a beforeEach, a game per test", () => {
    const { tests } = file(files, "game.test.ts");
    expect(tests).toHaveLength(3);
    for (const test of tests) expect(test).toMatchObject({ status: "pass" });
  });

  it("runs the hooks around each test of a file on reforged-test/lua alone", () => {
    const { tests } = file(files, "shared.test.ts");
    expect(tests).toHaveLength(2);
    for (const test of tests) expect(test).toMatchObject({ status: "pass" });
  });
});

describe("extra stub files", () => {
  it("runs the listed files after the shipped ones, in order", () => {
    const [order] = runLuaTestFiles({
      outDir: outDir("map-project-stubs"),
      stubs: [
        fixturePath("stubs", "first.lua"),
        fixturePath("stubs", "second.lua"),
      ],
    });
    expect(order.tests).toEqual([
      {
        suite: [],
        name: "loads the extra stub files after the shipped ones, in the listed order",
        status: "pass",
      },
      {
        suite: [],
        name: "calls a Native an extra stub file defines",
        status: "pass",
      },
    ]);
  });

  it("does not load them unless listed", () => {
    const [order] = runLuaTestFiles({ outDir: outDir("map-project-stubs") });
    expect(order.tests.map((test) => test.status)).toEqual(["fail", "error"]);
    expect(order.tests[1]?.message).toMatch(
      /Native BlzGetLocale is not stubbed$/,
    );
  });
});

describe("matchers", () => {
  const [matchers] = runLuaTestFiles({ outDir: outDir("matchers") });
  const { tests } = matchers;

  function messages(suite: string): Record<string, string | undefined> {
    return Object.fromEntries(
      tests
        .filter((test) => test.suite[0] === suite)
        .map((test) => [test.name, test.message]),
    );
  }

  it("pass when the expectation holds", () => {
    const passing = tests.filter((test) => test.suite[0] === "pass");
    expect(passing.map((test) => test.name)).toEqual([
      "toEqual",
      "toBe",
      "toBeTruthy",
      "toBeFalsy",
      "toBeUndefined",
      "toBeDefined",
      "toThrow",
      "toContainCall",
      "toContain",
      "toContainEqual",
      "toHaveLength",
      "toMatchObject",
      "toBeGreaterThan",
      "toBeGreaterThanOrEqual",
      "toBeLessThan",
      "toBeLessThanOrEqual",
      "toBeCloseTo",
      "toBeInstanceOf",
      "toMatch",
      "expect.anything",
      "expect.any",
      "expect.objectContaining",
      "expect.arrayContaining",
      "expect.stringContaining",
    ]);
    for (const test of passing) expect(test).toMatchObject({ status: "pass" });
  });

  it("fail with a message naming both values", () => {
    const failing = tests.filter((test) => test.suite[0] === "fail");
    for (const test of failing) expect(test).toMatchObject({ status: "fail" });
    expect(messages("fail")).toEqual({
      "toEqual on primitives": 'Expected "a" to equal "b"',
      "toEqual on tables":
        "Expected {a = {1, 2}} to deeply equal {a = {1, 3}} (first difference at .a[2]: 2 vs 3)",
      "toEqual on a missing key":
        "Expected {} to deeply equal {x = 1} (first difference at .x: nil vs 1)",
      "not.toEqual": "Expected 1 not to equal 1",
      "not.toEqual on tables": "Expected {1} not to deeply equal {1}",
      "toBe on equal tables":
        "Expected {} to be {} (not the same table; use toEqual for deep equality)",
      "not.toBe": "Expected 1 not to be 1",
      toBeTruthy: "Expected nil to be truthy",
      "not.toBeTruthy": "Expected 0 not to be truthy",
      toBeFalsy: "Expected 0 to be falsy",
      "not.toBeFalsy": "Expected false not to be falsy",
      toBeUndefined: "Expected player#1048577 to be undefined (nil)",
      "not.toBeUndefined": "Expected nil not to be undefined (nil)",
      toBeDefined: "Expected nil to be defined (not nil)",
      "not.toBeDefined": "Expected 0 not to be defined (not nil)",
      "toThrow when nothing is thrown":
        "Expected the function to throw, but it returned",
      "toThrow with another message":
        'Expected the function to throw an error containing "good thing", got "bad thing"',
      "toThrow on a non-function": "Expected a function to call, got 42",
      "not.toThrow": 'Expected the function not to throw, but it threw "boom"',
      "not.toThrow of a table without a message":
        "Expected the function not to throw, but it threw {code = 7}",
      "not.toThrow with its message":
        'Expected the function not to throw an error containing "bad", got "bad thing"',
      toContainCall:
        "Expected the call log to contain Player(2); it holds:\n  Player(0)\n  Player(0)\n  Player(1)",
      "not.toContainCall": "Expected the call log not to contain Player(1)",
      "toContain on a list": "Expected {{}} to contain {}",
      "toContain on a string": 'Expected "hfoo" to contain "died"',
      "not.toContain": "Expected {1, 2} not to contain 2",
      "toContain on a number":
        "Expected a list or a string to contain an item, got 5",
      toContainEqual: "Expected {{a = 1}} to contain an item equal to {a = 2}",
      "not.toContainEqual":
        "Expected {{a = 1}} not to contain an item equal to {a = 1}",
      toHaveLength: "Expected {1, 2} to have length 3, got 2",
      "not.toHaveLength": 'Expected "ab" not to have length 2, got 2',
      "toHaveLength on a number":
        "Expected a list or a string to have a length, got 5",
      toMatchObject:
        "Expected {a = 1, b = {c = 2}} to match object {b = {c = 3}} (first difference at .b.c: 2 vs 3)",
      "toMatchObject on lists of another length":
        "Expected {{a = 1}, {a = 2}} to match object {{a = 1}}",
      "not.toMatchObject":
        "Expected {a = 1, b = 2} not to match object {a = 1}",
      "toMatchObject on a string":
        'Expected a table to match an object, got "a"',
      toBeGreaterThan: "Expected 1 to be greater than 1",
      "not.toBeGreaterThan": "Expected 2 not to be greater than 1",
      toBeGreaterThanOrEqual: "Expected 0 to be greater than or equal to 1",
      toBeLessThan: "Expected 2 to be less than 2",
      toBeLessThanOrEqual: "Expected 3 to be less than or equal to 2",
      "toBeGreaterThan on a string": 'Expected a number to compare, got "2"',
      "toBeLessThan with a string":
        'Expected a number to compare with, got "3"',
      toBeCloseTo:
        "Expected 0.31 to be close to 0.3 (to 2 digits, a difference below 0.005)",
      "not.toBeCloseTo":
        "Expected 0.3 not to be close to 0.3 (to 1 digit, a difference below 0.05)",
      toBeInstanceOf: "Expected {x = 1} to be an instance of Hero",
      "not.toBeInstanceOf": "Expected {} not to be an instance of Base",
      "toBeInstanceOf another class": "Expected {} to be an instance of Base",
      toMatch: 'Expected "a.b" to match "a%.b"',
      "not.toMatch": 'Expected "Footman died" not to match "died"',
      "toMatch on a number": "Expected a string to match, got 1",
      "expect.anything on nil":
        "Expected {[1] = 1, [3] = 3} to deeply equal {1, expect.anything(), 3} (first difference at [2]: nil vs expect.anything())",
      "expect.anything on a missing key":
        "Expected {} to match object {a = expect.anything()} (first difference at .a: nil vs expect.anything())",
      "expect.any of a type":
        'Expected {1, "x"} to deeply equal {1, expect.any("number")} (first difference at [2]: "x" vs expect.any("number"))',
      "expect.any of a class":
        "Expected {{}} to contain an item equal to expect.any(Base)",
      "expect.objectContaining":
        "Expected {a = 1, b = {c = 2, d = 3}} to deeply equal expect.objectContaining({b = {c = 2}})",
      "expect.arrayContaining":
        "Expected {1, 2} to deeply equal expect.arrayContaining({3})",
      "expect.stringContaining":
        'Expected {msg = "hfoo"} to match object {msg = expect.stringContaining("died")} (first difference at .msg: "hfoo" vs expect.stringContaining("died"))',
      "expect.stringContaining on a number":
        'Expected 5 to equal expect.stringContaining("5")',
    });
  });

  it("raise on an argument no matcher can take, naming what to write", () => {
    const raising = tests.filter((test) => test.suite[0] === "raise");
    for (const test of raising) expect(test).toMatchObject({ status: "error" });
    expect(messages("raise")).toEqual({
      "expect.any of nil":
        'matchers_test.lua:362: expect.any received nil: Number, String, Boolean, Function, Object and Array are nil in Lua, so write the type name instead: "number", "string", "boolean", "function" or "table"',
      "expect.any of an unknown type name":
        'matchers_test.lua:365: expect.any takes a Lua type name ("number", "string", "boolean", "table", "function", "thread" or "userdata") or a class, got "integer"',
      "toBeInstanceOf of nil":
        "matchers_test.lua:368: toBeInstanceOf takes a class, got nil",
    });
  });
});

describe("the JSON contract", () => {
  it("is all the glue needs from a module", () => {
    const [norunner, raw] = runLuaTestFiles({ outDir: outDir("contract") });
    expect(raw).toEqual({
      moduleName: "raw_test",
      testFile: "raw.test.ts",
      tests: [
        { suite: ["raw"], name: "raw pass", status: "pass" },
        {
          suite: [],
          name: "raw fail",
          status: "fail",
          message: 'raw "quoted" failure',
        },
      ],
    });
    expect(norunner.error).toBe(
      "norunner_test did not load the reforged-test runner: the global __reforged_test_run is not a function",
    );
  });

  it("rejects results that break it", () => {
    expect(() => runLuaTestFiles({ outDir: outDir("malformed") })).toThrow(
      /^garbage_test: malformed runner results \(bad test entry/,
    );
  });
});

describe("cost", () => {
  it("keeps a fresh state per file in the tens of milliseconds at most", () => {
    const dir = outDir("baseline", "matchers", "results");
    runLuaTestFiles({ outDir: dir }); // loads lua-wasm-bindings once
    const runs = 10;
    const started = performance.now();
    let files = 0;
    for (let i = 0; i < runs; i += 1)
      files += runLuaTestFiles({ outDir: dir }).length;
    const perState = (performance.now() - started) / files;
    expect(perState).toBeLessThan(50);
  });
});
