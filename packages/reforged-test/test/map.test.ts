import { fileURLToPath } from "node:url";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  type TestError,
  type UserConsoleLog,
} from "vitest";
import type { TestCase, TestModule, TestSuite, Vitest } from "vitest/node";
import { startVitest } from "vitest/node";
import { LOAD_TEST_NAME } from "../src/index.js";
import { outDir, removeOutDirs } from "./support/fixture.js";

// Runs vitest on test/fixtures/vitest-project, whose one spec calls
// runLuaTests on the results, unstubbed and per-test fixtures, and reads
// what vitest itself recorded, the console lines with the task that wrote
// them included.

const project = fileURLToPath(
  new URL("./fixtures/vitest-project/", import.meta.url),
);

let vitest: Vitest;
let module: TestModule;
/** What the inner run's tests wrote to the console, in order. */
const logs: UserConsoleLog[] = [];

// Measured 4.6 s with pnpm test on Linux (WSL 2, 8 threads), 2026-10: the
// windows leg's report carries no hook duration.
beforeAll(async () => {
  const exitCode = process.exitCode;
  vitest = await startVitest(
    [],
    {
      root: project,
      config: false,
      watch: false,
      reporters: [
        {
          onUserConsoleLog: (log) => {
            logs.push(log);
          },
        },
      ],
    },
    {
      test: {
        include: ["*.spec.ts"],
        provide: {
          outDir: outDir("results", "unstubbed", "per-test", "diff"),
        },
      },
    },
  );
  // The inner run has failing tests by design; they are not this run's.
  process.exitCode = exitCode;
  const only = vitest.state.getTestModules().at(0);
  if (only === undefined)
    throw new Error("the inner vitest run collected no module");
  module = only;
}, 30_000);

afterAll(async () => {
  await vitest.close();
  removeOutDirs();
});

function suite(name: string): TestSuite {
  const found = [...module.children.suites()].find(
    (candidate) => candidate.name === name,
  );
  if (found === undefined) throw new Error(`no describe ${name}`);
  return found;
}

function testCase(fullName: string): TestCase {
  const found = [...module.children.allTests()].find(
    (candidate) => candidate.fullName === fullName,
  );
  if (found === undefined) throw new Error(`no test ${fullName}`);
  return found;
}

/** The first error the test of `fullName` failed with. */
function firstError(fullName: string): TestError {
  const error = testCase(fullName).result().errors?.at(0);
  if (error === undefined) throw new Error(`${fullName} did not fail`);
  return error;
}

describe("runLuaTests", () => {
  it("registers one describe per compiled test file, under its TypeScript name", () => {
    expect([...module.children.suites()].map((s) => s.name)).toEqual([
      "diff.test.ts",
      "game.test.ts",
      "handles/unit.test.ts",
      "load.test.ts",
      "natives.test.ts",
      "results.test.ts",
    ]);
  });

  it("registers one test per it, nested describes kept", () => {
    expect(
      [...suite("results.test.ts").children.allTests()].map((t) => t.fullName),
    ).toEqual([
      "results.test.ts > runs at the top level",
      "results.test.ts > arithmetic > adds",
      "results.test.ts > arithmetic > fails an expectation",
      "results.test.ts > arithmetic > errors",
      "results.test.ts > arithmetic > nested > passes inside a nested describe",
      "results.test.ts > arithmetic > wraps around at 2^31 [32-bit]",
    ]);
  });

  it("passes a passing it", () => {
    expect(testCase("results.test.ts > arithmetic > adds").result().state).toBe(
      "passed",
    );
    expect(
      testCase(
        "handles/unit.test.ts > unit > requires a sibling module by its dotted name",
      ).result().state,
    ).toBe("passed");
  });

  it("fails a failing expectation with the Lua message", () => {
    const result = testCase(
      "results.test.ts > arithmetic > fails an expectation",
    ).result();
    expect(result.state).toBe("failed");
    expect(result.errors?.map((e) => [e.name, e.message])).toEqual([
      ["AssertionError", "Expected 2 to equal 3"],
    ]);
  });

  it("fails an erroring it with the Lua message", () => {
    const result = testCase("results.test.ts > arithmetic > errors").result();
    expect(result.state).toBe("failed");
    expect(result.errors?.map((e) => [e.name, e.message])).toEqual([
      ["LuaError", "results_test.lua:19: boom"],
    ]);
  });

  it("reports an unstubbed Native by name", () => {
    const result = testCase(
      "natives.test.ts > calls a Native no stub defines",
    ).result();
    expect(result.errors?.map((e) => e.message)).toEqual([
      "natives_test.lua:5: Native PauseGame is not stubbed",
    ]);
  });

  it("reports a file that errors at load as one failing test, and runs the others", () => {
    expect(
      [...suite("load.test.ts").children.allTests()].map((t) => t.name),
    ).toEqual([LOAD_TEST_NAME]);
    const result = testCase(`load.test.ts > ${LOAD_TEST_NAME}`).result();
    expect(result.state).toBe("failed");
    expect(result.errors?.map((e) => [e.name, e.message])).toEqual([
      ["LuaError", "load_test.lua:3: Native BlzGetLocale is not stubbed"],
    ]);
    expect(module.errors()).toEqual([]);
  });

  it("skips a test marked [32-bit]", () => {
    expect(
      testCase(
        "results.test.ts > arithmetic > wraps around at 2^31 [32-bit]",
      ).result().state,
    ).toBe("skipped");
  });

  it("hands Vitest the actual and expected values, for its diff", () => {
    const deep = firstError("diff.test.ts > a deep difference");
    expect(deep).toMatchObject({
      name: "AssertionError",
      actual: '{\n  units = {\n    "hfoo",\n  },\n  wave = 2,\n}',
      expected: '{\n  units = {\n    "hfoo",\n  },\n  wave = 3,\n}',
    });
    expect(deep.diff).toContain("-   wave = 3,");
    expect(deep.diff).toContain("+   wave = 2,");
    const call = firstError("diff.test.ts > a call with other arguments");
    expect(call).toMatchObject({
      actual: '(1, "a")',
      expected: '(1, "b")',
    });
    expect(call.diff).toContain('Expected: "(1, "b")"');
    expect(call.diff).toContain('Received: "(1, "a")"');
  });

  it("never reaches emscripten's uncaught-exception handler", () => {
    expect(vitest.state.getUnhandledErrors()).toEqual([]);
  });
});

describe("runLuaTests on reforged-test/map", () => {
  /** The lines written while the task of `id` ran, a test or the file. */
  function written(id: string): string[] {
    return logs.filter((log) => log.taskId === id).map((log) => log.content);
  }

  it("lists the tests at collection, loading the file once", () => {
    expect(written(module.id)).toEqual(["loaded\n"]);
  });

  it("loads the file again inside each test's vitest test", () => {
    for (const [name, line] of [
      ["first", "first ran\n"],
      ["second", "second ran\n"],
    ] as const) {
      const test = testCase(`game.test.ts > game > ${name}`);
      expect(test.result().state).toBe("passed");
      expect(written(test.id).join("")).toBe(`loaded\n${line}`);
    }
  });
});
