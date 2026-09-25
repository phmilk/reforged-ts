/** @noSelfInFile */

// No root-time Handles: requiring the library index makes no Handle-creating
// Native call. `Players`, the sync Trigger and its events are born at the
// `globals` stage and the game-time Timer at `gameStart`; the host System
// makes its Handles only when a Map project calls `Host.detectHost`
// (host.test.ts). The tests drive the compiled library through the entry
// points as the game does (`main`, then `MarkGameStarted`) and assert on the
// stub call log and on `Players`. The file's tests share one Lua state and
// one run of the editor's script, in order.

// Keep this import ahead of the library's: the library wraps the entry
// points when it loads, and this file defines them.
import "./support/bundle-position";
import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Init, tsGlobals } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";

declare const main: () => void;

/** The Natives that create the library's own Handles. */
const creators = ["Player", "CreateTrigger", "CreateTimer"];

/** The handles `Players` held when the Map project's `globals` callback ran. */
let playersSeenByMap: unknown[] | undefined;

/** The call-log lines of the Natives `names`, in call order. */
function callsTo(names: readonly string[]): string[] {
  return stubCalls().filter((line) =>
    names.some((name) => line.startsWith(`${name}(`)),
  );
}

describe("requiring the library index", () => {
  it("makes no Handle-creating Native call", () => {
    expect(callsTo(creators)).toEqual([]);
    expect(
      callsTo(["BlzTriggerRegisterPlayerSyncEvent", "TimerStart"]),
    ).toEqual([]);
  });

  it("leaves Players empty", () => {
    expect(tsGlobals.Players).toEqual([]);
  });
});

describe("the globals stage", () => {
  it("creates one player per slot, the sync Trigger and its events for the two playing slots, and nothing else", () => {
    // The Map project's callback: registered before the stage, run after
    // the library's, so it observes the library-before-project guarantee.
    Init.onGlobals(() => {
      playersSeenByMap = tsGlobals.Players.map((player) => player.handle);
    }, "the map's globals callback");
    main();
    const calls = callsTo([
      ...creators,
      "BlzTriggerRegisterPlayerSyncEvent",
      "TriggerAddAction",
    ]);
    const players: string[] = [];
    for (let slot = 0; slot < bj_MAX_PLAYER_SLOTS; slot++) {
      players.push(`Player(${String(slot)})`);
    }
    // The Trigger's handle is not exposed: the first event line names it.
    const [trigger] = string.match(
      calls[bj_MAX_PLAYER_SLOTS + 1] ?? "",
      "%((trigger#%d+), ",
    );
    const slot0 = handleRef("player", tsGlobals.Players[0].handle);
    const slot1 = handleRef("player", tsGlobals.Players[1].handle);
    expect(calls).toEqual([
      ...players,
      "CreateTrigger()",
      `BlzTriggerRegisterPlayerSyncEvent(${trigger}, ${slot0}, "rts", false)`,
      `BlzTriggerRegisterPlayerSyncEvent(${trigger}, ${slot1}, "rts", false)`,
      `TriggerAddAction(${trigger}, <function>)`,
    ]);
  });

  it("fills Players with one MapPlayer per slot, wrapping the handle Player returns for it", () => {
    expect(tsGlobals.Players.length).toEqual(bj_MAX_PLAYER_SLOTS);
    for (let slot = 0; slot < bj_MAX_PLAYER_SLOTS; slot++) {
      expect(tsGlobals.Players[slot].handle).toBe(
        defined(Player(slot), "Player(slot)"),
      );
    }
  });

  it("fills Players before the Map project's globals callback runs: it saw every slot", () => {
    const seen = defined(playersSeenByMap, "playersSeenByMap");
    expect(seen.length).toEqual(bj_MAX_PLAYER_SLOTS);
    for (let slot = 0; slot < bj_MAX_PLAYER_SLOTS; slot++) {
      expect(seen[slot]).toBe(defined(Player(slot), "Player(slot)"));
    }
  });
});

describe("the gameStart stage", () => {
  it("creates and starts the game-time Timer, not earlier, and nothing else", () => {
    expect(callsTo(["CreateTimer", "TimerStart"])).toEqual([]);
    const before = stubCalls().length;
    MarkGameStarted();
    const calls = stubCalls()
      .slice(before)
      .filter((line) =>
        [...creators, "TimerStart", "BlzSendSyncData"].some((name) =>
          line.startsWith(`${name}(`),
        ),
      );
    // The Timer's handle is not exposed: the start line names it.
    const [gameTime] = string.match(calls[1] ?? "", "%((timer#%d+), ");
    expect(calls).toEqual([
      "CreateTimer()",
      `TimerStart(${gameTime}, 30, true, <function>)`,
    ]);
  });
});
