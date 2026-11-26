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
// runLuaTests on the results, unstubbed, per-test and focus fixtures, and
// reads what vitest itself recorded, the console lines with the task that
// wrote them included. Two more runs take the only fixture with the results
// one, with and without allowOnly.

const project = fileURLToPath(
  new URL("./fixtures/vitest-project/", import.meta.url),
);

/** One inner vitest run: its one module and what its tests wrote. */
interface InnerRun {
  readonly vitest: Vitest;
  readonly module: TestModule;
  /** What the inner run's tests wrote to the console, in order. */
  readonly logs: UserConsoleLog[];
}

/** Runs vitest on the project, the spec given an outDir of the fixtures. */
async function runInner(
  fixtures: readonly string[],
  allowOnly: boolean,
): Promise<InnerRun> {
  const exitCode = process.exitCode;
  const logs: UserConsoleLog[] = [];
  const vitest = await startVitest(
    [],
    {
      root: project,
      config: false,
      watch: false,
      allowOnly,
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
        provide: { outDir: outDir(...fixtures) },
      },
    },
  );
  // The inner run has failing tests by design; they are not this run's.
  process.exitCode = exitCode;
  const module = vitest.state.getTestModules().at(0);
  if (module === undefined)
    throw new Error("the inner vitest run collected no module");
  return { vitest, module, logs };
}

const runs: InnerRun[] = [];
/** The first inner run, on every fixture but the only one. */
let main: InnerRun;
let module: TestModule;
let logs: UserConsoleLog[];

// Measured 4.6 s with pnpm test on Linux (WSL 2, 8 threads), 2026-10: the
// windows leg's report carries no hook duration.
beforeAll(async () => {
  const run = await runInner(
    ["results", "unstubbed", "per-test", "focus", "diff"],
    true,
  );
  runs.push(run);
  main = run;
  ({ module, logs } = run);
}, 30_000);

afterAll(async () => {
  for (const run of runs) await run.vitest.close();
  removeOutDirs();
});

function suite(name: string, of = module): TestSuite {
  const found = [...of.children.suites()].find(
    (candidate) => candidate.name === name,
  );
  if (found === undefined) throw new Error(`no describe ${name}`);
  return found;
}

function testCase(fullName: string, of = module): TestCase {
  const found = [...of.children.allTests()].find(
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
      "on-lua/skip.test.ts",
      "on-map/skip.test.ts",
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
    expect(main.vitest.state.getUnhandledErrors()).toEqual([]);
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

describe("runLuaTests on focus and skip", () => {
  /** The state and the mode of each test of a file, by its name. */
  function report(
    file: string,
    of = module,
  ): Record<string, readonly [string, string]> {
    return Object.fromEntries(
      [...suite(file, of).children.allTests()].map((test) => [
        test.fullName.slice(file.length + " > ".length),
        [test.result().state, test.options.mode] as const,
      ]),
    );
  }

  it("registers it.skip, it.todo and describe.skip in Vitest's native forms, on both entry points", () => {
    expect(report("on-lua/skip.test.ts")).toEqual({
      runs: ["passed", "run"],
      "is skipped": ["skipped", "skip"],
      "is still to write": ["skipped", "todo"],
      "a skipped describe > is skipped with its describe": ["skipped", "skip"],
      "ran no skipped body and no hook for one": ["passed", "run"],
      "a skipped describe > runs in a plain describe of the same name": [
        "passed",
        "run",
      ],
    });
    expect(report("on-map/skip.test.ts")).toEqual({
      "runs in the second load": ["passed", "run"],
      "opens no game": ["skipped", "skip"],
      "is still to write": ["skipped", "todo"],
      "a skipped describe > opens no game either": ["skipped", "skip"],
      "a describe > runs in the third load": ["passed", "run"],
    });
    for (const file of ["on-lua/skip.test.ts", "on-map/skip.test.ts"]) {
      const skipped = [...suite(file).children.suites()].find(
        (candidate) => candidate.name === "a skipped describe",
      );
      expect(skipped?.options.mode, file).toBe("skip");
    }
  });

  describe("with an only, allowed", () => {
    let focused: InnerRun;
    // Measured 1.2 s with pnpm test --project reforged-test on Linux (WSL 2,
    // 8 threads), 2026-11: the first inner run's limit, for a run as large.
    beforeAll(async () => {
      focused = await runInner(["only", "results"], true);
      runs.push(focused);
    }, 30_000);

    it("runs the focused tests and reports every other Lua test of the project as skipped", () => {
      // Vitest rewrites a test's mode once it applies the focus: the states
      // are what the only changed.
      const states = (file: string) =>
        Object.fromEntries(
          Object.entries(report(file, focused.module)).map(
            ([name, [state]]) => [name, state],
          ),
        );
      expect(states("on-map/only.test.ts")).toEqual({
        "is out of focus": "skipped",
        "is focused": "passed",
        "a focused describe > is focused with its describe": "passed",
      });
      expect(states("on-lua/only.test.ts")).toEqual({
        "is out of focus": "skipped",
        "is focused": "passed",
      });
      const others = Object.values(states("results.test.ts"));
      expect(others.length).toBeGreaterThan(0);
      for (const state of others) expect(state).toBe("skipped");
    });

    it("opens no Test game for a test out of focus, and hides only the report of one on reforged-test/lua", () => {
      const written = (id: string) =>
        focused.logs
          .filter((log) => log.taskId === id)
          .map((log) => log.content)
          .join("");
      expect(
        written(
          testCase("on-map/only.test.ts > is out of focus", focused.module).id,
        ),
      ).toBe("");
      expect(
        written(
          testCase("on-map/only.test.ts > is focused", focused.module).id,
        ),
      ).toBe("loaded\n");
      expect(written(focused.module.id)).toContain("out of focus ran\n");
    });
  });

  describe("with an only, under CI", () => {
    let ci: InnerRun;
    // Measured 1.2 s with pnpm test --project reforged-test on Linux (WSL 2,
    // 8 threads), 2026-11: the first inner run's limit, for a run as large.
    beforeAll(async () => {
      // allowOnly is false under CI by Vitest's own default.
      ci = await runInner(["only", "results"], false);
      runs.push(ci);
    }, 30_000);

    it("fails the run on the forgotten only, as Vitest does", () => {
      const errors = [...ci.module.children.allSuites()].flatMap((each) =>
        each.errors().map((error) => error.message),
      );
      expect(errors).toContainEqual(
        expect.stringContaining("Unexpected .only modifier"),
      );
      expect(ci.module.state()).toBe("failed");
    });
  });
});
