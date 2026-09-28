/** @noSelfInFile */

// How a runnable example runs on the harness: as the game runs a Map
// project's script. The editor's entry points are defined first (the bundle
// position), the example is required, which loads the library, then
// `config`, `main` and `MarkGameStarted` run, so its Init stage callbacks
// run too. Timers and triggers never fire on the harness, so what an example
// schedules does not run.
//
// Completing without error is the whole assertion: an example is
// documentation, not a test. The library runs an Init stage callback under
// pcall and prints a failure line instead of raising, so a failure line the
// run printed is raised again.
//
// The vitest global setup (../harness/compile.ts) writes one test module per
// example under examples/harness/, which calls `runExample` with its module
// name.

import { it } from "reforged-test/lua";
import { defineEditorScript, globals } from "../support/editor-script";

/**
 * Whether a printed line reports a failed callback, an Init stage's
 * (`reforged-ts: gameStart callback #1 failed: ...`) or a protected one's
 * (`reforged-ts: Timer#1048577 Timer.start failed: ...`).
 */
function isFailure(line: string): boolean {
  return line.startsWith("reforged-ts: ") && line.includes(" failed: ");
}

/** Registers the one test of `example`, a module name: it runs the example. */
export function runExample(example: string): void {
  it("runs without error", () => {
    defineEditorScript([
      "config",
      "main",
      "InitBlizzard",
      "InitGlobals",
      "InitCustomTriggers",
      "RunInitializationTriggers",
      "MarkGameStarted",
    ]);
    const printedBefore = __stub_printed().length;

    // Lua's `require`, by the name the setup passed: the example is loaded
    // here, not imported.
    (globals.require as (module: string) => unknown)(example);
    for (const name of ["config", "main", "MarkGameStarted"]) {
      (globals[name] as () => void)();
    }

    const failures = __stub_printed()
      .slice(printedBefore)
      .filter((line) => isFailure(line));
    if (failures.length > 0) {
      error(failures.join("\n"), 0);
    }
  });
}
