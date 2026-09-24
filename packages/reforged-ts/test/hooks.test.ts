/** @noSelfInFile */

// The library's Hook code replaces `main` and `config` with functions that
// run the added Hooks around the originals.

// Keep this import ahead of the library's: the Hook code captures `main` and
// `config` when it loads, and this file defines them.
import { entryPointLog } from "./support/entry-points";
import { describe, expect, it } from "reforged-test/lua";
import { addScriptHook, W3TS_HOOK } from "../src/hooks/index";

declare const main: () => void;
declare const config: () => void;

/** What ran in `main` and `config` after the mark. */
function logSince(mark: number): string[] {
  return entryPointLog.slice(mark);
}

describe("addScriptHook", () => {
  it("runs the before and after hooks around main, in order", () => {
    const added = [
      addScriptHook(W3TS_HOOK.MAIN_BEFORE, () => {
        entryPointLog.push("before 1");
      }),
      addScriptHook(W3TS_HOOK.MAIN_AFTER, () => {
        entryPointLog.push("after");
      }),
      addScriptHook(W3TS_HOOK.MAIN_BEFORE, () => {
        entryPointLog.push("before 2");
      }),
    ];
    for (const result of added) {
      expect(result).toBeTruthy();
    }
    const mark = entryPointLog.length;
    main();
    expect(logSince(mark)).toEqual(["before 1", "before 2", "main", "after"]);
  });

  it("refuses a hook name it does not know", () => {
    expect(
      addScriptHook("main::during" as W3TS_HOOK, () => {
        entryPointLog.push("never");
      }),
    ).toBeFalsy();
  });

  it("stops config when a hook throws", () => {
    addScriptHook(W3TS_HOOK.CONFIG_BEFORE, () => {
      throw new Error("config hook failed");
    });
    const mark = entryPointLog.length;
    expect(() => {
      config();
    }).toThrow("config hook failed");
    expect(logSince(mark)).toEqual([]);
  });
});
