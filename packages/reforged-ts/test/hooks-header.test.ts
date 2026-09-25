/** @noSelfInFile */

// The deprecated alias in the map header load position: `config` and `main`
// are nil when the library loads and the editor's script assigns them
// afterwards, so both are wrapped on their first assignment. The map sees
// the same order as in the bundle position, a throwing hook the same line,
// and `_G` is without a metatable again once both were captured. The file's
// tests share one Lua state and one run of the entry points, in order.

import { describe, expect, it } from "reforged-test/lua";
import { addScriptHook, W3TS_HOOK } from "../src/hooks/index";
import { defineEditorScript, editorLog, mark } from "./support/editor-script";
import { withPrint } from "./support/print-capture";

declare const config: () => void;
declare const main: () => void;

/** What the library printed while the entry points ran. */
let printed: string[] = [];

describe("addScriptHook in the header position", () => {
  it("runs the hooks of the four entry points around config and main, in order, past a throwing one", () => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
    addScriptHook(W3TS_HOOK.CONFIG_BEFORE, mark("config before"));
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
    addScriptHook(W3TS_HOOK.CONFIG_AFTER, mark("config after 1"));
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
    addScriptHook(W3TS_HOOK.CONFIG_AFTER, mark("config after 2"));
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
    addScriptHook(W3TS_HOOK.MAIN_BEFORE, mark("main before"));
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
    addScriptHook(W3TS_HOOK.MAIN_AFTER, () => {
      error("no such unit", 0);
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
    addScriptHook(W3TS_HOOK.MAIN_AFTER, mark("main after"));

    // The editor's script, after the header: it defines both.
    defineEditorScript(["config", "main"]);

    printed = withPrint(() => {
      config();
      main();
    });

    expect(editorLog).toEqual([
      "config before",
      "config",
      "config after 1",
      "config after 2",
      "main before",
      "main",
      "main after",
    ]);
  });

  it("prints one line for the throwing hook: the library, the entry point, the hook's ordinal and the message", () => {
    expect(printed).toEqual([
      "reforged-ts: main::after callback #1 failed: no such unit",
    ]);
  });

  it("leaves _G without a metatable once the editor's script defined both", () => {
    expect(getmetatable(_G)).toBeUndefined();
  });
});
