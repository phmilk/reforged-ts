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

import { configuration, noteRegistration } from "../reforged/configuration";
import {
  type EntryPoint,
  type InitStage,
  LIBRARY,
  type Origin,
  type Registration,
} from "./state";

/** Where a callback runs, as a failure line names it. */
type Where = InitStage | EntryPoint;

/** The member the Map project registers through for each place. */
const registeringMember: Record<Where, string> = {
  globals: "Init.onGlobals",
  triggers: "Init.onTriggers",
  initTriggers: "Init.onInitTriggers",
  gameStart: "Init.onGameStart",
  "main::before": 'addScriptHook("main::before")',
  "main::after": 'addScriptHook("main::after")',
  "config::before": 'addScriptHook("config::before")',
  "config::after": 'addScriptHook("config::after")',
};

/**
 * Appends `callback` to `queue`, the one for `where`. The first registration
 * by the Map project is remembered (`Init.onGlobals "spawn"`):
 * `Reforged.configure` names it when it warns.
 * @param queue - The queue to append to.
 * @param where - The stage or entry point the queue runs at.
 * @param origin - Who registers: the library or the Map project.
 * @param callback - The function to run.
 * @param label - Its name in failure lines; `#n`, its ordinal in the queue,
 * when left out.
 * @returns The registration appended.
 */
export function enqueue(
  queue: Registration[],
  where: Where,
  origin: Origin,
  callback: () => void,
  label?: string,
): Registration {
  const registration: Registration = {
    callback,
    name: label === undefined ? `#${String(queue.length + 1)}` : `"${label}"`,
  };
  if (origin === "project" && configuration.firstRegistration === undefined) {
    noteRegistration(`${registeringMember[where]} ${registration.name}`);
  }
  queue.push(registration);
  return registration;
}

/**
 * Runs one callback under pcall; a failure prints one line,
 * `reforged-ts: <where> callback <name> failed: <message>`.
 * @param where - The stage or entry point the line names.
 * @param registration - The callback and its name.
 */
export function runProtected(where: Where, registration: Registration): void {
  const [ok, failure] = pcall(registration.callback);
  if (!ok) {
    print(
      `${LIBRARY}: ${where} callback ${registration.name} failed: ${tostring(failure)}`,
    );
  }
}

/**
 * Runs every callback of `queue`, each under pcall, the ones registered
 * during the run too.
 * @param where - The stage or entry point failure lines name.
 * @param queue - The callbacks, in registration order.
 */
export function runQueue(where: Where, queue: readonly Registration[]): void {
  // By index, reading the length each time: a registration made during the
  // run joins it.
  let index = 0;
  while (index < queue.length) {
    runProtected(where, queue[index]);
    index++;
  }
}
