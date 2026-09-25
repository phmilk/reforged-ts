/** @noSelfInFile */

// The four Init stages on the wrapping and the queues: each wraps one of
// Blizzard's initialization functions and runs its two queues after the
// original returned, the library's first, then the Map project's. A failure
// inside the original is not caught: the library wraps around it and must
// not change how the editor's own errors surface.
//
// A stage runs once. Registering for a stage that already ran executes the
// callback at once, under the same pcall; registering during the stage's
// own run appends to that run. At `gameStart`, a stage that never ran (its
// Blizzard function was never defined, or never called) runs first, in stage
// order: `MarkGameStarted` belongs to Blizzard.j and always exists, so
// nothing registered is lost.
//
// Package-internal: the library index exports `Init` (index.ts) on top of
// this; the library's own modules register through `onStage` with origin
// "library".

import { enqueue, runProtected } from "./queue";
import { type InitStage, type Origin, type StageState, state } from "./state";
import { wrapGlobal } from "./wrapping";

/** The stages in the order the editor's script reaches them. */
const order: readonly InitStage[] = [
  "globals",
  "triggers",
  "initTriggers",
  "gameStart",
];

/** The Blizzard function each stage wraps. */
const blizzardFunction: Record<InitStage, string> = {
  globals: "InitGlobals",
  triggers: "InitCustomTriggers",
  initTriggers: "RunInitializationTriggers",
  gameStart: "MarkGameStarted",
};

/**
 * Runs a stage once, its queues the library's first: by index, so a callback
 * registered during the run joins it, and a library callback registered
 * while the project's queue runs still goes before the project callbacks
 * left.
 */
function runStage(stage: InitStage): void {
  const queues: StageState = state.stages[stage];
  if (queues.started) {
    return;
  }
  const outer = state.current;
  queues.started = true;
  state.current = stage;
  // Not two calls of `runQueue` (queue.ts): both queues can grow during the
  // run, and the library's must be drained before the project's each time
  // one is picked, so the two cursors interleave over the same loop.
  let library = 0;
  let project = 0;
  for (;;) {
    if (library < queues.library.length) {
      runProtected(stage, queues.library[library]);
      library++;
    } else if (project < queues.project.length) {
      runProtected(stage, queues.project[project]);
      project++;
    } else {
      break;
    }
  }
  state.current = outer;
}

/** Runs `stage` and, first, every earlier stage that never ran. */
function catchUpTo(stage: InitStage): void {
  for (const earlier of order) {
    runStage(earlier);
    if (earlier === stage) {
      return;
    }
  }
}

/**
 * Registers `callback` for `stage`, in the library's queue or the Map
 * project's, named `label` in failure lines. A stage that already ran runs
 * the callback at once under pcall; a stage running now takes it into the
 * run.
 */
export function onStage(
  stage: InitStage,
  origin: Origin,
  callback: () => void,
  label?: string,
): void {
  const queues = state.stages[stage];
  const registration = enqueue(queues[origin], origin, callback, label);
  if (queues.started && state.current !== stage) {
    runProtected(stage, registration);
  }
}

/**
 * Whether the stage's run started: its Blizzard function returned and its
 * callbacks began, or finished. True inside the stage's own callbacks.
 */
export function hasRun(stage: InitStage): boolean {
  return state.stages[stage].started;
}

/**
 * The stage whose run is in progress, or undefined. The immediate run of a
 * late registration does not set it.
 */
export function currentStage(): InitStage | undefined {
  return state.current;
}

// At load, each Blizzard function that exists is wrapped in place (the
// Template bundle, appended after the editor's script); a name that is nil
// is pending for the interception.
for (const stage of order) {
  wrapGlobal(blizzardFunction[stage], {
    after:
      stage === "gameStart"
        ? () => {
            catchUpTo("gameStart");
          }
        : () => {
            runStage(stage);
          },
  });
}
