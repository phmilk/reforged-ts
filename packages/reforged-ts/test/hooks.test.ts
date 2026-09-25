/** @noSelfInFile */

// The deprecated alias in the bundle load position: `config` and `main`
// exist when the library loads, so both are wrapped in place. Hooks for the
// four entry points run at their old positions around `config` and `main`,
// in registration order, each under pcall: a throwing hook prints one line,
// and neither the other hooks of its entry point nor the entry point itself
// are stopped. A System's registration through the internal registrar is
// not one of the Map project's; a hook is. The file's tests share one Lua
// state and one run of the entry points, in order.

// Keep this import ahead of the library's: the library wraps the entry
// points when it loads, and this file defines them.
import { editorLog } from "./support/entry-points";
import { describe, expect, it } from "reforged-test/lua";
import { addScriptHook, W3TS_HOOK } from "../src/hooks/index";
import { onEntryPoint } from "../src/init/entry-points";
import { Reforged } from "../src/reforged/index";
import { mark } from "./support/editor-script";
import { withPrint } from "./support/print-capture";

declare const config: () => void;
declare const main: () => void;

/** What the library printed while the entry points ran. */
let printed: string[] = [];

describe("addScriptHook in the bundle position", () => {
  it("refuses an entry point it does not know", () => {
    expect(
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
      addScriptHook("main::during" as W3TS_HOOK, mark("never")),
    ).toBeFalsy();
  });

  it("does not count a System's registration through the internal registrar as the Map project's", () => {
    onEntryPoint(
      "config::before",
      "library",
      mark("library config before"),
      "host join time",
    );
    const lines = withPrint(() => {
      Reforged.configure({ devMode: true });
    });
    expect(lines).toEqual([]);
  });

  it("runs the hooks of the four entry points around config and main, in order, past a throwing one", () => {
    expect(
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
      addScriptHook(W3TS_HOOK.CONFIG_BEFORE, mark("config before 1")),
    ).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
    addScriptHook(W3TS_HOOK.CONFIG_BEFORE, () => {
      error("lobby failure", 0);
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
    addScriptHook(W3TS_HOOK.CONFIG_BEFORE, mark("config before 2"));
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
    addScriptHook(W3TS_HOOK.CONFIG_AFTER, mark("config after"));
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
    addScriptHook(W3TS_HOOK.MAIN_BEFORE, mark("main before 1"));
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
    addScriptHook(W3TS_HOOK.MAIN_AFTER, mark("main after"));
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated alias is what this test drives; its removal in 2.0 removes the file
    addScriptHook(W3TS_HOOK.MAIN_BEFORE, mark("main before 2"));

    printed = withPrint(() => {
      config();
      main();
    });

    expect(editorLog).toEqual([
      "library config before",
      "config before 1",
      "config before 2",
      "config",
      "config after",
      "main before 1",
      "main before 2",
      "main",
      "main after",
    ]);
  });

  it("prints one line for the throwing hook: the library, the entry point, the hook's ordinal and the message", () => {
    expect(printed).toEqual([
      "reforged-ts: config::before callback #3 failed: lobby failure",
    ]);
  });

  it("counts a hook as a Map project registration: configure warns afterwards", () => {
    const lines = withPrint(() => {
      Reforged.configure({ devMode: false });
    });
    expect(lines).toEqual([
      'reforged-ts: Reforged.configure({ devMode: false }) called after a callback was registered (the first: addScriptHook("config::before") #2): call it first in the entry point; a callback keeps the mode it was registered under',
    ]);
  });
});
