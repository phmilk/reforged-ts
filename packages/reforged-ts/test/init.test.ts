/** @noSelfInFile */

// The Init stages in the bundle load position: every entry point of the
// editor's script exists when the library loads, so each Blizzard function
// is wrapped in place. The tests drive the compiled library through the
// entry points as the game does (`config`, `main`, then `MarkGameStarted`)
// and assert on what a map observes: the order in which functions ran, what
// was printed, `hasRun` and `current`. The file's tests share one Lua state
// and one run of the stages, in order.

// Keep this import ahead of the library's: the library wraps the entry
// points when it loads, and this file defines them.
import { editorLog } from "./support/bundle-position";
import { describe, expect, it } from "reforged-test/lua";
import { Init } from "../src/init/index";
import { onStage } from "../src/init/stages";
import { mark, stages } from "./support/editor-script";
import { withPrint } from "./support/print-capture";

declare const config: () => void;
declare const main: () => void;

/** What the library printed while the editor's script ran. */
let printed: string[] = [];

describe("Init in the bundle position", () => {
  it("reports no stage as run and none as current before the editor's script runs", () => {
    for (const stage of stages) {
      expect(Init.hasRun(stage)).toBeFalsy();
    }
    expect(Init.current).toBeUndefined();
  });

  it("runs each stage's callbacks after its Blizzard function, library first, in registration order", () => {
    Init.onGlobals(mark("globals 1"));
    Init.onGlobals(() => {
      editorLog.push(`globals 2 during ${Init.current ?? "none"}`);
      // Registered during the stage's own run: it joins that run.
      Init.onGlobals(mark("globals 3"));
    });
    onStage("globals", "library", mark("library globals"), "Players");
    Init.onTriggers(mark("triggers 1"));
    Init.onTriggers(() => {
      error("no such trigger", 0);
    }, "attach to GUI trigger");
    Init.onTriggers(mark("triggers 2"));
    Init.onInitTriggers(mark("initTriggers 1"));
    Init.onGameStart(mark("gameStart 1"));
    onStage("gameStart", "library", mark("library gameStart"), "Timers");

    printed = withPrint(() => {
      config();
      main();
      MarkGameStarted();
    });

    expect(editorLog).toEqual([
      "config",
      "main",
      "InitGlobals",
      "library globals",
      "globals 1",
      "globals 2 during globals",
      "globals 3",
      "InitCustomTriggers",
      "triggers 1",
      "triggers 2",
      "RunInitializationTriggers",
      "initTriggers 1",
      "MarkGameStarted",
      "library gameStart",
      "gameStart 1",
    ]);
  });

  it("prints one line for the failing callback: the library, the stage, the label and the message", () => {
    expect(printed).toEqual([
      'reforged-ts: triggers callback "attach to GUI trigger" failed: no such trigger',
    ]);
  });

  it("reports every stage as run afterwards, and none as current", () => {
    for (const stage of stages) {
      expect(Init.hasRun(stage)).toBeTruthy();
    }
    expect(Init.current).toBeUndefined();
  });

  it("runs a callback registered after its stage ran at once", () => {
    const since = editorLog.length;
    Init.onGlobals(mark("late globals"));
    expect(editorLog.slice(since)).toEqual(["late globals"]);
  });

  it("runs a late callback under the same pcall, named by its ordinal without a label", () => {
    const lines = withPrint(() => {
      Init.onGameStart(() => {
        error("late failure", 0);
      });
    });
    expect(lines).toEqual([
      "reforged-ts: gameStart callback #2 failed: late failure",
    ]);
  });
});
