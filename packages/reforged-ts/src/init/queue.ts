/** @noSelfInFile */

// A queue of callbacks and how one runs: under pcall, in registration
// order, by index, so a callback registered during the run joins it. A
// failure prints one line naming the library, where the callback ran (the
// stage, or the alias's entry point), the callback and the message pcall
// returned, and the run goes on with the next callback. Printing is
// unconditional (ADR 0003): a Lua error in a game thread is silent
// otherwise, and the game has no debug library for a traceback.
//
// Package-internal: nothing here is exported from the library index.

import { LIBRARY, type Origin, type Registration, state } from "./state";

/**
 * Appends `callback` to `queue`, named `label` in failure lines, or `#n` for
 * its ordinal in the queue. A registration by the Map project is remembered:
 * `Reforged.configure` warns when it is called after one.
 */
export function enqueue(
  queue: Registration[],
  origin: Origin,
  callback: () => void,
  label?: string,
): Registration {
  if (origin === "project") {
    state.projectRegistered = true;
  }
  const registration: Registration = {
    callback,
    name: label === undefined ? `#${String(queue.length + 1)}` : `"${label}"`,
  };
  queue.push(registration);
  return registration;
}

/** Runs one callback under pcall; a failure prints one line. */
export function runProtected(where: string, registration: Registration): void {
  const [ok, failure] = pcall(registration.callback);
  if (!ok) {
    print(
      `${LIBRARY}: ${where} callback ${registration.name} failed: ${tostring(failure)}`,
    );
  }
}

/** Runs every callback of `queue`, the ones registered during the run too. */
export function runQueue(where: string, queue: readonly Registration[]): void {
  // By index, reading the length each time: a registration made during the
  // run joins it.
  let index = 0;
  while (index < queue.length) {
    runProtected(where, queue[index]);
    index++;
  }
}

/** Whether the Map project registered any callback through the library yet. */
export function hasProjectRegistrations(): boolean {
  return state.projectRegistered;
}
