import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TestCase, TestModule, TestSuite, Vitest } from "vitest/node";
import { startVitest } from "vitest/node";
import { LOAD_TEST_NAME } from "../src/index.js";
import { outDir, removeOutDirs } from "./support/fixture.js";

// Runs vitest on test/fixtures/vitest-project, whose one spec calls
// runLuaTests on the results and unstubbed fixtures, and reads what vitest
// itself recorded.

const project = fileURLToPath(
  new URL("./fixtures/vitest-project/", import.meta.url),
);

let vitest: Vitest;
let module: TestModule;

beforeAll(async () => {
  const exitCode = process.exitCode;
  vitest = await startVitest(
    "test",
    [],
    { root: project, config: false, watch: false, reporters: [] },
    {
      test: {
        include: ["*.spec.ts"],
        provide: { outDir: outDir("results", "unstubbed") },
      },
    },
  );
  // The inner run has failing tests by design; they are not this run's.
  process.exitCode = exitCode;
  const [only] = vitest.state.getTestModules();
  if (only === undefined)
    throw new Error("the inner vitest run collected no module");
  module = only;
}, 60_000);

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

describe("runLuaTests", () => {
  it("registers one describe per compiled test file, under its TypeScript name", () => {
    expect([...module.children.suites()].map((s) => s.name)).toEqual([
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

  it("never reaches emscripten's uncaught-exception handler", () => {
    expect(vitest.state.getUnhandledErrors()).toEqual([]);
  });
});
