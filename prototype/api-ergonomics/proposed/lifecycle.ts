/** @noSelfInFile */
// PROTOTYPE: lifecycle stages (design review P4), replacing main/config hooks.
// Blizzard's generated war3map.lua defines these functions; the library wraps
// them the way hooks/index.ts wraps `main` and `config` today.

declare let InitGlobals: () => void;
declare let InitCustomTriggers: () => void;
declare let RunInitializationTriggers: () => void;
declare let MarkGameStarted: () => void;

type Stage = "globals" | "triggers" | "initTriggers" | "gameStart";

const callbacks: Record<Stage, Array<() => void>> = {
  globals: [],
  triggers: [],
  initTriggers: [],
  gameStart: [],
};

/** Runs every callback of a stage under `pcall`: one failing initializer cannot kill the rest. */
function runStage(stage: Stage): void {
  for (const fn of callbacks[stage]) {
    const [ok, err] = pcall(fn);
    if (!ok) print(`reforged-ts: init stage "${stage}" failed: ${tostring(err)}`);
  }
}

function wrapStage(stage: Stage, original: () => void): () => void {
  return () => {
    original();
    runStage(stage);
  };
}

InitGlobals = wrapStage("globals", InitGlobals);
InitCustomTriggers = wrapStage("triggers", InitCustomTriggers);
RunInitializationTriggers = wrapStage("initTriggers", RunInitializationTriggers);
MarkGameStarted = wrapStage("gameStart", MarkGameStarted);

export const Init = {
  /** After the map's globals exist. Create library-level Handles here, never at Lua root (P5). */
  onGlobals: (fn: () => void): void => {
    callbacks.globals.push(fn);
  },
  /** After the editor's custom triggers are created. */
  onTriggers: (fn: () => void): void => {
    callbacks.triggers.push(fn);
  },
  /** After initialization triggers ran. */
  onInitTriggers: (fn: () => void): void => {
    callbacks.initTriggers.push(fn);
  },
  /** When the game has started (all players loaded). */
  onGameStart: (fn: () => void): void => {
    callbacks.gameStart.push(fn);
  },
};

/** @deprecated kept as an alias for one release: `main::after` maps to `onGameStart`, `config::*` to `onGlobals`. */
export function addScriptHook(
  entryPoint: "main::before" | "main::after" | "config::before" | "config::after",
  hook: () => void
): void {
  if (entryPoint === "main::after") Init.onGameStart(hook);
  else Init.onGlobals(hook);
}
