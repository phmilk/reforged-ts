/** @noSelfInFile */

// The editor's script, stubbed: the six entry points the game defines in the
// map script and Blizzard.j, as recording functions on one shared log.
// `main` calls the three init functions through the globals, as the editor's
// script does, skipping one a test left undefined (its `InitBlizzard` call
// is left out: nothing wraps it).
//
// The library wraps these when it loads, so a test module that defines them
// (`bundle-position.ts`, `entry-points.ts`) is imported ahead of the
// library. The shipped stubs leave all six nil (see the reforged-test
// README), so only those modules define them.

/** An entry point of the editor's script. */
export type EditorFunction =
  | "config"
  | "main"
  | "InitGlobals"
  | "InitCustomTriggers"
  | "RunInitializationTriggers"
  | "MarkGameStarted";

/** What ran, in order: the entry points log their own names, tests their own marks. */
export const editorLog: string[] = [];

const globals = _G as unknown as Record<string, unknown>;

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
