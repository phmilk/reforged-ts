/** @noSelfInFile */

// The four entry points of the deprecated alias on the wrapping and the
// queues: `main::before`, `main::after`, `config::before` and `config::after`
// are one queue each, run by the wrappers of `main` and `config` before and
// after the original, every callback under pcall, in registration order. The
// timing is the alias's own and is not remapped onto the stages: `config`
// runs in the lobby, before `main`, and no stage has that moment in this
// release. A callback registered after its entry point ran waits for the
// next run, as it did under the old alias; the entry points wrap in place or
// on first assignment like the stages, so the alias works in both load
// positions.
//
// Package-internal: the library index exports `addScriptHook` (hooks/index.ts)
// on top of this; a System registers through `onEntryPoint` with origin
// "library" (the host System's join-time measurement, on `config::before`),
// so its registration is not one of the Map project's.

import { enqueue, runQueue } from "./queue";
import { type EntryPoint, type Origin, state } from "./state";
import { wrapGlobal } from "./wrapping";

/** Whether `name` is one of the four entry points. */
export function isEntryPoint(name: string): name is EntryPoint {
  return name in state.entryPoints;
}

/**
 * Registers `callback` for `entryPoint`, in the library's name or the Map
 * project's, named `label` in failure lines.
 */
export function onEntryPoint(
  entryPoint: EntryPoint,
  origin: Origin,
  callback: () => void,
  label?: string,
): void {
  enqueue(state.entryPoints[entryPoint], origin, callback, label);
}

/** What a wrapper runs for `entryPoint`: its queue, under pcall. */
function run(entryPoint: EntryPoint): () => void {
  return () => {
    runQueue(entryPoint, state.entryPoints[entryPoint]);
  };
}

// At load, `config` and `main` are wrapped in place when the editor's script
// defined them already (the Template bundle), or on their first assignment
// (the map header).
wrapGlobal("config", {
  before: run("config::before"),
  after: run("config::after"),
});
wrapGlobal("main", {
  before: run("main::before"),
  after: run("main::after"),
});
