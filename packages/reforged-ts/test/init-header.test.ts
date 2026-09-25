/** @noSelfInFile */

// The Init stages in the map header load position: the compiled library is
// pasted into the map header, so when it loads only Blizzard.j's functions
// exist and the editor's script defines `InitCustomTriggers`,
// `RunInitializationTriggers`, `config` and `main` afterwards. The library
// wraps the former in place and the latter on their first assignment, and
// the map sees the same order as in the bundle position. The file's tests
// share one Lua state and one run of the stages, in order.

// Keep this import ahead of the library's: the library wraps the entry
// points when it loads, and this file defines the ones that exist then.
import { editorLog } from "./support/header-position";
import { describe, expect, it } from "reforged-test/lua";
import { Init } from "../src/init/index";
import { onStage } from "../src/init/stages";
import { defineEditorScript, mark, stages } from "./support/editor-script";
import { withPrint } from "./support/print-capture";

declare const config: () => void;
declare const main: () => void;

/** What the library printed while the editor's script ran. */
let printed: string[] = [];

describe("Init in the header position", () => {
  it("reports no stage as run and none as current before the editor's script exists", () => {
    for (const stage of stages) {
      expect(Init.hasRun(stage)).toBeFalsy();
    }
    expect(Init.current).toBeUndefined();
  });

  it("runs each stage's callbacks after its Blizzard function, library first, in registration order", () => {
    Init.onGlobals(mark("globals 1"));
    Init.onGlobals(() => {
      editorLog.push(`globals 2 during ${Init.current ?? "none"}`);
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

    // The editor's script, after the header: it defines the rest.
    defineEditorScript([
      "InitCustomTriggers",
      "RunInitializationTriggers",
      "config",
      "main",
    ]);

    printed = withPrint(() => {
      config();
      main();
      MarkGameStarted();
    });

    expect(editorLog).toEqual([
      "config",
      "main",
      "InitBlizzard",
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

  it("leaves _G without a metatable once the editor's script defined every name", () => {
    expect(getmetatable(_G)).toBeUndefined();
  });
});
