import { defineConfig } from "vitest/config";

// One vitest run over the workspace, one project per package. `pnpm test`
// runs them all; a package's own `test` script selects its project.
export default defineConfig({
  test: {
    projects: [
      {
        // The Typings generator, in Node.
        test: {
          name: "reforged-types",
          root: "packages/reforged-types",
          include: ["test/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        // The harness glue, in Node, on hand-written Lua fixtures.
        test: {
          name: "reforged-test",
          root: "packages/reforged-test",
          include: ["test/**/*.test.ts"],
          // The vitest project under test/fixtures is run by map.test.ts.
          exclude: ["test/fixtures/**"],
          environment: "node",
          globalSetup: ["test/support/compile-runner.ts"],
        },
      },
      {
        // The library, compiled with its tests by typescript-to-lua and run
        // on the reforged-test harness. The global setup compiles them
        // before every run, the first one and each watch rerun.
        test: {
          name: "reforged-ts",
          root: "packages/reforged-ts",
          include: ["test/harness/*.spec.ts"],
          environment: "node",
          globalSetup: ["test/harness/compile.ts"],
        },
      },
    ],
    // The library's Lua tests are not in the vitest module graph: a change to
    // a library source or a test reruns the spec that runs them.
    watchTriggerPatterns: [
      {
        pattern: /\/packages\/reforged-ts\/(src|test)\/.+\.ts$/,
        testsToRun: () => "packages/reforged-ts/test/harness/lua.spec.ts",
      },
    ],
  },
});
