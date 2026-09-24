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
    ],
  },
});
