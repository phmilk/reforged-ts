/** @noSelfInFile */

// The map header load position with a `_G` metatable the map installed
// before the library (an undeclared-global warner): while the library waits
// for the editor's script to define its names, the map's metatable keeps
// seeing every other key, and it is `_G`'s metatable again once every name
// was defined. A root that executes twice changes nothing about that. The
// file's tests share one Lua state, in order.

// Keep this import ahead of the library's: it installs the map's metatable
// and defines the entry points that exist in the header.
import {
  editorLog,
  mapMetatable,
  mapMetatableLog,
} from "./support/header-position-with-metatable";
import { describe, expect, it } from "reforged-test/lua";
import { Init } from "../src/init/index";
import { defineEditorScript } from "./support/editor-script";
import { reloadModules } from "./support/reload";

declare const config: () => void;
declare const main: () => void;

const globals = _G as unknown as Record<string, unknown>;

/** A callback that logs `text` when it runs. */
function mark(text: string): () => void {
  return () => {
    editorLog.push(text);
  };
}

describe("Init in the header position with the map's _G metatable", () => {
  it("lets the map's metatable see other keys while the library's names are pending, also after a second load", () => {
    reloadModules("src.init.", "src.init.index");

    const since = mapMetatableLog.length;
    globals.udg_gold = 500;
    expect(globals.udg_missing).toBeUndefined();
    expect(mapMetatableLog.slice(since)).toEqual([
      "write udg_gold",
      "read udg_missing",
    ]);
    // The map's `__newindex` did the write: the global exists now.
    expect(globals.udg_gold).toEqual(500);
  });

  it("runs every stage after its Blizzard function once the editor's script defined the rest", () => {
    Init.onGlobals(mark("globals 1"));
    Init.onTriggers(mark("triggers 1"));
    Init.onInitTriggers(mark("initTriggers 1"));
    Init.onGameStart(mark("gameStart 1"));

    defineEditorScript([
      "InitCustomTriggers",
      "RunInitializationTriggers",
      "config",
      "main",
    ]);

    config();
    main();
    MarkGameStarted();

    expect(editorLog).toEqual([
      "config",
      "main",
      "InitBlizzard",
      "InitGlobals",
      "globals 1",
      "InitCustomTriggers",
      "triggers 1",
      "RunInitializationTriggers",
      "initTriggers 1",
      "MarkGameStarted",
      "gameStart 1",
    ]);
  });

  it("gives _G the map's metatable back once every name was defined, still seeing other keys", () => {
    expect(getmetatable(_G)).toBe(mapMetatable);

    const since = mapMetatableLog.length;
    globals.udg_lumber = 150;
    expect(globals.udg_absent).toBeUndefined();
    expect(mapMetatableLog.slice(since)).toEqual([
      "write udg_lumber",
      "read udg_absent",
    ]);
  });
});
