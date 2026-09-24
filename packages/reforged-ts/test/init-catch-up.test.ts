/** @noSelfInFile */

// Catch-up: a stage whose Blizzard function never existed (here
// `InitCustomTriggers`, left undefined before the library loads) runs its
// callbacks when `MarkGameStarted` is called, before the `gameStart`
// callbacks. Its own Lua state: the missing function must be missing when
// the library wraps the others.

// Keep this import ahead of the library's: it defines the entry points.
import { editorLog } from "./support/bundle-position-without-triggers";
import { describe, expect, it } from "reforged-test/lua";
import { Init } from "../src/init/index";

declare const config: () => void;
declare const main: () => void;

/** A callback that logs `text` and the stage running when it runs. */
function mark(text: string): () => void {
  return () => {
    editorLog.push(`${text} during ${Init.current ?? "none"}`);
  };
}

describe("Init catch-up at gameStart", () => {
  it("runs the callbacks of a stage that never ran at MarkGameStarted, before the gameStart callbacks", () => {
    Init.onTriggers(mark("triggers 1"));
    Init.onGlobals(mark("globals 1"));
    Init.onGameStart(mark("gameStart 1"));
    Init.onTriggers(mark("triggers 2"));

    config();
    main();
    expect(Init.hasRun("initTriggers")).toBeTruthy();
    expect(Init.hasRun("triggers")).toBeFalsy();
    expect(editorLog).toEqual([
      "config",
      "main",
      "InitGlobals",
      "globals 1 during globals",
      "RunInitializationTriggers",
    ]);

    const since = editorLog.length;
    MarkGameStarted();
    expect(editorLog.slice(since)).toEqual([
      "MarkGameStarted",
      "triggers 1 during triggers",
      "triggers 2 during triggers",
      "gameStart 1 during gameStart",
    ]);
    expect(Init.hasRun("triggers")).toBeTruthy();
    expect(Init.hasRun("gameStart")).toBeTruthy();
    expect(Init.current).toBeUndefined();
  });
});
