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

  it("pass when the expectation holds", () => {
    const passing = tests.filter((test) => test.suite[0] === "pass");
    expect(passing).toHaveLength(7);
    for (const test of passing) expect(test).toMatchObject({ status: "pass" });
  });

  it("fail with a message naming both values", () => {
    const failing = tests.filter((test) => test.suite[0] === "fail");
    expect(
      Object.fromEntries(
        failing.map((test) => [test.name, [test.status, test.message]]),
      ),
    ).toEqual({
      "toEqual on primitives": ["fail", 'Expected "a" to equal "b"'],
      "toEqual on tables": [
        "fail",
        "Expected {a = {1, 2}} to deeply equal {a = {1, 3}} (first difference at .a[2]: 2 vs 3)",
      ],
      "toEqual on a missing key": [
        "fail",
        "Expected {} to deeply equal {x = 1} (first difference at .x: nil vs 1)",
      ],
      "toBe on equal tables": [
        "fail",
        "Expected {} to be {} (not the same table; use toEqual for deep equality)",
      ],
      toBeTruthy: ["fail", "Expected nil to be truthy"],
      toBeFalsy: ["fail", "Expected 0 to be falsy"],
      toBeUndefined: ["fail", "Expected player#1048577 to be undefined (nil)"],
      "toThrow when nothing is thrown": [
        "fail",
        "Expected the function to throw, but it returned",
      ],
      "toThrow with another message": [
        "fail",
        'Expected the function to throw an error containing "good thing", got "bad thing"',
      ],
      "toThrow on a non-function": [
        "fail",
        "Expected a function to call, got 42",
      ],
      toContainCall: [
        "fail",
        "Expected the call log to contain Player(2); it holds:\n  Player(0)\n  Player(0)\n  Player(1)",
      ],
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
