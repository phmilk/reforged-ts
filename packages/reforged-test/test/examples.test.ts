// The examples of `reforged-test/map`, the files its doc comments include:
// each is a test file, compiled by the global setup
// (support/compile-runner.ts) and handed to the glue here as a Map project's
// tests are, so each runs as its own vitest describe, named after its file
// (`reforged-test/examples/start-game.test.ts`), with one test per `it`, each
// in a Test game of its own.

import { inject } from "vitest";
import { runLuaTests } from "../src/index.js";

const compileErrors = inject("examplesCompileErrors");
if (compileErrors !== "") {
  throw new Error(
    `typescript-to-lua failed to compile the examples:\n${compileErrors}`,
  );
}

runLuaTests({ outDir: inject("examplesOutDir") });
