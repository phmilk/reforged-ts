/** @noSelfInFile */

// Idempotence: the init module loaded twice in one Lua state (the community
// reports the Lua root executing twice in one game) leaves each Blizzard
// function wrapped once, and a callback registered once, through either
// load's `Init`, runs once. Its own Lua state: the stages must not have run
// when the module loads again.

// Keep this import ahead of the library's: it defines the entry points.
import { editorLog } from "./support/bundle-position";
import { describe, expect, it } from "reforged-test/lua";
import { Init } from "../src/init/index";
import { reloadModules } from "./support/reload";

declare const config: () => void;
declare const main: () => void;
declare const InitGlobals: () => void;

/** A callback that logs `text` when it runs. */
function mark(text: string): () => void {
  return () => {
    editorLog.push(text);
  };
}

describe("Init loaded twice in one state", () => {
  it("wraps each Blizzard function once: a callback registered once runs once", () => {
    const wrappedInitGlobals = InitGlobals;
    const wrappedMarkGameStarted = MarkGameStarted;

    const second = reloadModules(
      "src.init.",
      "src.init.index",
    ) as typeof import("../src/init/index");

    expect(InitGlobals).toBe(wrappedInitGlobals);
    expect(MarkGameStarted).toBe(wrappedMarkGameStarted);

    second.Init.onGlobals(mark("globals, second load"));
    Init.onGlobals(mark("globals, first load"));
    Init.onGameStart(mark("gameStart, first load"));

    config();
    main();
    MarkGameStarted();

    expect(editorLog).toEqual([
      "config",
      "main",
      "InitGlobals",
      "globals, second load",
      "globals, first load",
      "InitCustomTriggers",
      "RunInitializationTriggers",
      "MarkGameStarted",
      "gameStart, first load",
    ]);
    expect(second.Init.hasRun("gameStart")).toBeTruthy();
  });
});
