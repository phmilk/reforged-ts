/** @noSelfInFile */

// The editor's script, stubbed: the seven entry points the game defines in
// the map script and Blizzard.j, as recording functions on one shared log.
// `main` calls the four init functions through the globals, as the editor's
// script does, skipping one a test left undefined. A test's own callbacks
// log on the same shared log (`mark`), so the order is one array.
//
// The library wraps these when it loads, so a test module that defines them
// ahead of it (`bundle-position.ts`, `header-position.ts`, `entry-points.ts`)
// is imported ahead of the library; a header test defines the rest itself
// afterwards. The shipped stubs leave all seven nil (see the reforged-test
// README), so only the test side defines them.

import type { InitStage } from "../../src/init/index";

/** An entry point of the editor's script. */
export type EditorFunction =
  | "config"
  | "main"
  | "InitBlizzard"
  | "InitGlobals"
  | "InitCustomTriggers"
  | "RunInitializationTriggers"
  | "MarkGameStarted";

/** The four Init stages, in the order the editor's script reaches them. */
export const stages: readonly InitStage[] = [
  "globals",
  "triggers",
  "initTriggers",
  "gameStart",
];

/** What ran, in order: the entry points log their own names, tests their own marks. */
export const editorLog: string[] = [];

/** A callback that logs `text` on `editorLog` when it runs. */
export function mark(text: string): () => void {
  return () => {
    editorLog.push(text);
  };
}

/** The globals table, typed for reads and writes by name. */
export const globals = _G as unknown as Record<string, unknown>;

/** Calls the global function `name` when a test defined it. */
function callGlobal(name: string): void {
  const fn = globals[name];
  if (type(fn) === "function") {
    (fn as () => void)();
  }
}

/** A recording entry point: logs its name, and `main` then calls the init functions. */
function editorFunction(name: EditorFunction): () => void {
  if (name === "main") {
    return () => {
      editorLog.push("main");
      callGlobal("InitBlizzard");
      callGlobal("InitGlobals");
      callGlobal("InitCustomTriggers");
      callGlobal("RunInitializationTriggers");
    };
  }
  return () => {
    editorLog.push(name);
  };
}

/** Defines the named entry points as globals, recording on `editorLog`. */
export function defineEditorScript(names: readonly EditorFunction[]): void {
  for (const name of names) {
    globals[name] = editorFunction(name);
  }
}
