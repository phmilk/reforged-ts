// The global setup of the package's vitest project. Compiles the Lua-side
// runner to lua/ and map/ before the glue tests run, exactly as the package
// build does, its last step included: the `{@includeCode}` of map/index.d.ts
// expanded by the library's include-code script, so the fixtures load, and
// the tests read, the artefact that ships. Then compiles the examples of
// `reforged-test/map` (../../examples) against it, into an emptied
// dist-examples, for ../examples.test.ts to run.

import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";
import { compileLuaProject } from "../../src/compile.js";

declare module "vitest" {
  export interface ProvidedContext {
    /** The output folder of the examples' compile. */
    examplesOutDir: string;
    /** The typescript-to-lua errors of the examples' compile, or "". */
    examplesCompileErrors: string;
  }
}

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));

/** The outDir of ../../examples/tsconfig.json. */
const examplesOutDir = fileURLToPath(
  new URL("../../dist-examples/", import.meta.url),
);

export default function compileRunner(project: TestProject): void {
  const errors = compileLuaProject(
    fileURLToPath(new URL("../../runner/tsconfig.json", import.meta.url)),
  );
  if (errors !== "") throw new Error(errors);
  // The build's last command, as package.json runs it; it throws, with the
  // script's message, on an include that does not resolve.
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "../reforged-ts/scripts/include-code.mts",
      "map",
      "runner/map",
    ],
    { cwd: packageRoot, stdio: ["ignore", "ignore", "inherit"] },
  );
  rmSync(examplesOutDir, { recursive: true, force: true });
  project.provide("examplesOutDir", examplesOutDir);
  project.provide(
    "examplesCompileErrors",
    compileLuaProject(
      fileURLToPath(new URL("../../examples/tsconfig.json", import.meta.url)),
    ),
  );
}
