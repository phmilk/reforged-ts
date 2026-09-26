import { defineConfig } from "vitest/config";

// One vitest run over the workspace, one project per package (two for the
// library: its Lua tests and its Node tests). `pnpm test` runs them all; a
// package's own `test` script selects its projects.
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
      {
        // The library's Node-side tests, run from source; typescript-to-lua
        // never sees test/node. The fixtures are Map project sources the
        // tests read, not tests.
        test: {
          name: "reforged-ts-node",
          root: "packages/reforged-ts",
          include: ["test/node/**/*.test.ts"],
          exclude: ["test/node/fixtures/**"],
          environment: "node",
        },
      },
      {
        // The lint plugin, in Node: its rules run by typescript-eslint's
        // RuleTester on the fixture project, and its export. The fixture
        // project is Map project sources the rules lint, not tests.
        test: {
          name: "eslint-plugin-reforged",
          root: "packages/eslint-plugin-reforged",
          include: ["test/**/*.test.ts"],
          exclude: ["test/fixture-project/**"],
          environment: "node",
        },
      },
      {
        // The publishable packages as npm receives them: each is packed and
        // its tarball read. Needs the build output (`pnpm check` builds
        // first).
        test: {
          name: "tarballs",
          root: "test",
          include: ["*.test.ts"],
          environment: "node",
        },
      },
      {
        // The release scripts, in Node, through their programmatic entry
        // points, on fixture workspaces and repositories the tests create.
        test: {
          name: "release",
          root: "release",
          include: ["test/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        // The Wrapper coverage report, in Node, through its programmatic
        // entry points, on fixture inputs the tests create and on the real
        // library and manifest (the drift test of the committed report).
        test: {
          name: "wrapper-coverage",
          root: "wrapper-coverage",
          include: ["test/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
    // Neither the library's Lua tests nor the sources, fixtures and rename
    // map the Node tests read are in the vitest module graph: a change to one
    // of them reruns the spec that reads it.
    watchTriggerPatterns: [
      {
        pattern: /\/packages\/reforged-ts\/(?:src|test(?!\/node\/))\/.+\.ts$/,
        testsToRun: () => "packages/reforged-ts/test/harness/lua.spec.ts",
      },
      {
        pattern:
          /\/packages\/reforged-ts\/(?:src|test\/node\/fixtures)\/.+\.ts$/,
        testsToRun: () => "packages/reforged-ts/test/node/declarations.test.ts",
      },
      {
        pattern: /\/packages\/reforged-ts\/(?:src\/.+\.ts|migration\/.+)$/,
        testsToRun: () => "packages/reforged-ts/test/node/renames.test.ts",
      },
      {
        // The plugin reads its data files and the fixture project from disk.
        pattern:
          /\/packages\/eslint-plugin-reforged\/(?:data\/.+\.json|test\/fixture-project\/.+)$/,
        testsToRun: () => "packages/eslint-plugin-reforged/test",
      },
      {
        // The coverage report's drift test reads the library sources, the
        // manifests and its committed configuration and report from disk.
        pattern:
          /\/(?:packages\/reforged-ts\/src\/.+\.ts|packages\/reforged-types\/[\d.]+\/manifest\.json|wrapper-coverage\/[^/]+\.(?:json|md))$/,
        testsToRun: () => "wrapper-coverage/test/real-inputs.test.ts",
      },
    ],
  },
});
